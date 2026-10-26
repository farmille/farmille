begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users(id) values('ca932323-0000-4000-8000-000000000001'),('ca932323-0000-4000-8000-000000000009');
insert into public.profiles(user_id,handle,standpoint)
values('ca932323-0000-4000-8000-000000000001','区の品種と資材の検証','farmer'),('ca932323-0000-4000-8000-000000000009','別の会員','farmer');
insert into public.materials(id,name,manufacturer_name,publication_status)
values('ca932323-0000-4000-8000-000000000002','区の品種と資材の検証','検証会社','published');

create function pg_temp.report_input(p_report text default 'ca932323-0000-4000-8000-000000000003') returns jsonb language sql as $$
  select jsonb_build_object(
    'reportId',p_report,
    'expectedUpdatedAt',(select updated_at from public.usage_reports where id=p_report::uuid),
    'materialId','ca932323-0000-4000-8000-000000000002',
    'cropId',(select id from public.crops limit 1),
    'varietyUnknown',false,
    'varieties','[{"id":"ca932323-0000-4000-8000-000000000011","name":"新藍"}]'::jsonb,
    'comparedMaterials','[{"id":"ca932323-0000-4000-8000-000000000012","name":"慣行の液肥"}]'::jsonb,
    'commonPlotDescription','',
    'observedChange','結果を記入',
    'purposeTags',jsonb_build_array((select name from public.effects limit 1)),
    'prefectureCode',null,'city','','showCity',false,
    'cultivationEnvironment','露地','timingStages','[3]'::jsonb,'timingNote','9月20日に施用',
    'plots','[
      {"id":"ca932323-0000-4000-8000-000000000021","name":"無処理区","scope":"","description":"資材なし","steps":[],"varietyId":"ca932323-0000-4000-8000-000000000011","treatment":{"kind":"untreated"}},
      {"id":"ca932323-0000-4000-8000-000000000022","name":"処理区","scope":"","description":"1000倍を3回","steps":[],"varietyId":"ca932323-0000-4000-8000-000000000011","treatment":{"kind":"posted"}},
      {"id":"ca932323-0000-4000-8000-000000000023","name":"慣行区","scope":"","description":"慣行の液肥","steps":[],"varietyId":"ca932323-0000-4000-8000-000000000011","treatment":{"kind":"compared","comparedMaterialId":"ca932323-0000-4000-8000-000000000012"}}
    ]'::jsonb,
    'measurements','[{"id":"ca932323-0000-4000-8000-000000000031","kind":"text","name":"観察","unit":"","body":"差が見られた","graphs":[]}]'::jsonb,
    'media','[]'::jsonb,'documents','[]'::jsonb,'headings','[]'::jsonb,
    'methodDetailsAck',true,'documentsAck',false,'guidelineAck',true,'pdfValuesChecked',false)
$$;

insert into public.materials(id,name,manufacturer_name,publication_status)
values('ca932323-0000-4000-8000-000000000007','別の資材','検証会社','published');
create function pg_temp.blank(p_id text,p_material text default 'ca932323-0000-4000-8000-000000000002') returns jsonb language sql as $$
select pg_temp.report_input(p_id)||jsonb_build_object('materialId',p_material,'varietyUnknown',true,'varieties','[]'::jsonb,'comparedMaterials','[]'::jsonb,'plots','[]'::jsonb,'measurements','[]'::jsonb)
$$;
select set_config('request.jwt.claims','{"sub":"ca932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$select public.save_usage_report(pg_temp.report_input(),false)$$,'first draft saves');
select throws_ok($$select public.save_usage_report(pg_temp.blank('ca932323-0000-4000-8000-000000000004'),false)$$,'23505','active_report_exists','second draft for same author and material is rejected');
select lives_ok($$select public.save_usage_report(pg_temp.report_input(),false)$$,'own draft remains editable');
select lives_ok($$select public.save_usage_report(pg_temp.blank('ca932323-0000-4000-8000-000000000004','ca932323-0000-4000-8000-000000000007'),false)$$,'different material is allowed');
select throws_ok($$select public.save_usage_report(pg_temp.blank('ca932323-0000-4000-8000-000000000004'),false)$$,'23505','active_report_exists','moving another draft into occupied material is rejected');
select lives_ok($$select public.save_usage_report(pg_temp.report_input(),true)$$,'own draft can be submitted');
select throws_ok($$select public.save_usage_report(pg_temp.blank('ca932323-0000-4000-8000-000000000008'),false)$$,'23505','active_report_exists','pending report also blocks duplicate');
reset role;
select set_config('request.jwt.claims','{"sub":"ca932323-0000-4000-8000-000000000009","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$select public.save_usage_report(pg_temp.blank('ca932323-0000-4000-8000-000000000008'),false)$$,'different author can use same material');
select is((select count(*) from public.usage_reports where author_user_id=auth.uid()),1::bigint,'only own report is visible');
reset role;
select * from finish();
rollback;
