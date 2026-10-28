begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

insert into auth.users(id) values('ca932323-0000-4000-8000-000000000001'),('ca932323-0000-4000-8000-000000000009');
insert into public.profiles(user_id,handle,standpoint)
values('ca932323-0000-4000-8000-000000000001','区の品種と資材の検証','farmer'),('ca932323-0000-4000-8000-000000000009','別の会員','farmer');
insert into public.materials(id,name,manufacturer_name,publication_status)
values('ca932323-0000-4000-8000-000000000002','区の品種と資材の検証','検証会社','published');

insert into public.materials(id,name,manufacturer_name,publication_status)
values('ca932323-0000-4000-8000-000000000004','別区の検証','検証会社','published'),
('ca932323-0000-4000-8000-000000000007','画像の検証','検証会社','published');

create function pg_temp.report_input(p_report text default 'ca932323-0000-4000-8000-000000000003') returns jsonb language sql as $$
  select jsonb_build_object(
    'reportId',p_report,
    'expectedUpdatedAt',(select updated_at from public.usage_reports where id=p_report::uuid),
    'materialId',case when p_report in ('ca932323-0000-4000-8000-000000000004','ca932323-0000-4000-8000-000000000007') then p_report else 'ca932323-0000-4000-8000-000000000002' end,
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
create function pg_temp.many(p_count integer,p_variety boolean) returns jsonb language sql as $$
  select jsonb_agg(case when p_variety
    then jsonb_build_object('id',format('ca932323-0000-4000-8000-%s',lpad((2000+i)::text,12,'0')),'name','品種')
    else jsonb_build_object('id',format('ca932323-0000-4000-8000-%s',lpad((1000+i)::text,12,'0')),'name','区','scope','','description','説明','steps','[]'::jsonb,
      'varietyId','ca932323-0000-4000-8000-000000000011','treatment',jsonb_build_object('kind','posted')) end)
  from generate_series(1,p_count) i
$$;

select set_config('request.jwt.claims','{"sub":"ca932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$select public.save_usage_report(pg_temp.report_input(),false)$$,'draft saves varieties, compared materials and treatments');
select is((select string_agg(p.treatment||coalesce(':'||c.name,''),',' order by p.sort_order) from public.usage_report_plots p left join public.usage_report_compared_materials c on c.id=p.compared_material_id where p.report_id='ca932323-0000-4000-8000-000000000003'),'untreated,posted,compared:慣行の液肥','plots keep the material they used');
select is((select count(*)::integer from public.usage_report_plots where report_id='ca932323-0000-4000-8000-000000000003' and variety_id='ca932323-0000-4000-8000-000000000011'),3,'plots point to the report variety');
select is((select variety from public.usage_reports where id='ca932323-0000-4000-8000-000000000003'),null::text,'v2 variety is not written to the parent row');
select lives_ok($$select public.save_usage_report(pg_temp.report_input()||'{"varieties":[{"id":"ca932323-0000-4000-8000-000000000011","name":"新藍"},{"id":"ca932323-0000-4000-8000-000000000013","name":"初恋"}]}'::jsonb,false)$$,'resave replaces varieties referenced by plots');
select is((select string_agg(name,'・' order by sort_order) from public.usage_report_varieties where report_id='ca932323-0000-4000-8000-000000000003'),'新藍・初恋','varieties keep their order');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,2,treatment}','{"kind":"compared"}'),false)$$,'23514',null,'compared plot requires its material');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,1,treatment}','{"kind":"posted","comparedMaterialId":"ca932323-0000-4000-8000-000000000012"}'),false)$$,'23514',null,'posted plot cannot carry a compared material');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,1,treatment}','{"kind":"sprayed"}'),false)$$,'23514',null,'unknown treatment rejected');
select lives_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots}',pg_temp.many(40,false)),false)$$,'40 plots save');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots}',pg_temp.many(41,false)),false)$$,'23514',null,'41 plots rejected');
select lives_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{varieties}',pg_temp.many(40,true)) #- '{plots}' || '{"plots":[]}'::jsonb,false)$$,'40 varieties save');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{varieties}',pg_temp.many(41,true)) #- '{plots}' || '{"plots":[]}'::jsonb,false)$$,'23514',null,'41 varieties rejected');

select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,0,treatment}','null'),true)$$,'23514',null,'every plot needs the material it used');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,1,treatment}','{"kind":"untreated"}'),true)$$,'23514',null,'a plot with the posted material is required');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,0,varietyId}','null'),true)$$,'23514',null,'every plot needs a variety unless unknown');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{varieties,0,name}','" "'),true)$$,'23514',null,'variety name required');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{comparedMaterials,0,name}','""'),true)$$,'23514',null,'compared material name required');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{varietyUnknown}','true'),true)$$,'23514',null,'unknown variety cannot keep varieties');
select throws_ok($$select public.save_usage_report(jsonb_set(jsonb_set(jsonb_set(pg_temp.report_input(),'{plots,0,description}','""'),'{plots,1,description}','""'),'{plots,2,description}','""'),true)$$,'23514',null,'plot description or common description required');
select throws_ok($$select public.save_usage_report(pg_temp.report_input()||'{"varieties":[{"id":"ca932323-0000-4000-8000-000000000011","name":"新藍"},{"id":"ca932323-0000-4000-8000-000000000013","name":"初恋"}]}'::jsonb,true)$$,
  '23514',null,'a variety that no plot points to cannot be submitted');

select lives_ok($$select public.save_usage_report(jsonb_build_object('reportId','ca932323-0000-4000-8000-000000000004','expectedUpdatedAt',null)||(pg_temp.report_input('ca932323-0000-4000-8000-000000000004')-'reportId'-'expectedUpdatedAt')
  ||'{"varieties":[{"id":"ca932323-0000-4000-8000-000000000041","name":"別の品種"}],"comparedMaterials":[{"id":"ca932323-0000-4000-8000-000000000042","name":"別の資材"}],"plots":[],"measurements":[]}'::jsonb,false)$$,'another report keeps its own varieties');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,0,varietyId}','"ca932323-0000-4000-8000-000000000041"'),false)$$,'23503',null,'plot cannot point to another report variety');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{plots,2,treatment,comparedMaterialId}','"ca932323-0000-4000-8000-000000000042"'),false)$$,'23503',null,'plot cannot point to another report compared material');

select lives_ok($$select public.save_usage_report(jsonb_set(jsonb_set(jsonb_set(pg_temp.report_input(),'{plots,0,description}','""'),'{plots,1,description}','""'),'{plots,2,description}','""')||'{"commonPlotDescription":"各区10株、3反復"}'::jsonb,true)$$,'common description is enough to submit');
select is((select status||'/'||common_plot_description from public.usage_reports where id='ca932323-0000-4000-8000-000000000003'),'pending/各区10株、3反復','submitted with the common description');
reset role;

select set_config('request.jwt.claims','{"sub":"ca932323-0000-4000-8000-000000000009","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.usage_report_varieties where report_id='ca932323-0000-4000-8000-000000000004'),0,'other member cannot read draft varieties');
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select throws_ok($$select * from public.usage_report_compared_materials$$,'42501',null,'anonymous cannot query compared materials');
reset role;

-- 品種と資材を持たない既存の v2 レポート。移す前の状態を作るため、親の列の制約をこのトランザクションの中だけ外す。
alter table public.usage_reports drop constraint usage_reports_v2_variety_in_children;
insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,purpose_tags,cultivation_environment,timing_note,method_details_ack,pesticide_ack,form_version,variety)
values('ca932323-0000-4000-8000-000000000005','ca932323-0000-4000-8000-000000000002','ca932323-0000-4000-8000-000000000001',(select id from public.crops limit 1),'結果を記入','結果の要約',array[(select name from public.effects limit 1)],'露地','9月20日に施用',true,true,2,'桃太郎');
insert into public.usage_report_timings(report_id,stage) values('ca932323-0000-4000-8000-000000000005',3);
insert into public.usage_report_plots(id,report_id,name,survey_scope,description,sort_order)
values('ca932323-0000-4000-8000-000000000051','ca932323-0000-4000-8000-000000000005','処理区','10株','1000倍を3回',0),
  ('ca932323-0000-4000-8000-000000000052','ca932323-0000-4000-8000-000000000005','無処理区','10株','資材なし',1);
insert into public.usage_report_measurements(id,report_id,kind,name,unit,body,sort_order)
values('ca932323-0000-4000-8000-000000000053','ca932323-0000-4000-8000-000000000005','text','観察結果','','差が見られた',0);
insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,pesticide_ack,form_version,variety,variety_unknown)
values('ca932323-0000-4000-8000-000000000006','ca932323-0000-4000-8000-000000000002','ca932323-0000-4000-8000-000000000001',null,'','',false,2,'書きかけ',true);

select lives_ok($$select app.copy_usage_report_varieties()$$,'v2 varieties are copied to the child table');
select is((select string_agg(v.name||':'||(select count(*) from public.usage_report_plots p where p.variety_id=v.id),',') from public.usage_report_varieties v where v.report_id='ca932323-0000-4000-8000-000000000005'),'桃太郎:2','copied variety is linked to every plot');
select is((select count(*)::integer from public.usage_report_varieties where report_id='ca932323-0000-4000-8000-000000000006'),0,'unknown variety is not copied');
select is((select count(variety)::integer from public.usage_reports where id in ('ca932323-0000-4000-8000-000000000005','ca932323-0000-4000-8000-000000000006')),0,'moved and unknown v2 varieties leave the parent column empty');
do $$ begin perform app.copy_usage_report_varieties(); end $$;
alter table public.usage_reports add constraint usage_reports_v2_variety_in_children check (form_version<>2 or variety is null);
select throws_ok($$update public.usage_reports set variety='桃太郎' where id='ca932323-0000-4000-8000-000000000005'$$,'23514',null,'v2 report cannot keep a variety in the parent column');
select is((select count(*)::integer from public.usage_report_varieties where report_id='ca932323-0000-4000-8000-000000000005'),1,'copying twice keeps one variety');
select throws_ok($$update public.usage_reports set status='pending' where id='ca932323-0000-4000-8000-000000000005'$$,'23514',null,'legacy draft needs the material of each plot before submit');
set local session_replication_role=replica;
update public.usage_reports set status='pending' where id='ca932323-0000-4000-8000-000000000005';
set local session_replication_role=origin;
select lives_ok($$update public.usage_reports set status='published',published_at=now() where id='ca932323-0000-4000-8000-000000000005'$$,'submitted legacy report can be published without the new rules');
select is((select variety from public.list_usage_report_previews() where id='ca932323-0000-4000-8000-000000000005'),'桃太郎','preview reads the v2 variety from the child table');

-- 調査項目に差し込んだ画像があれば、関連資料と同じく、提出に秘密保持の確認が要る。下書きの保存では要らない。
insert into storage.objects(bucket_id,name)
values('report-media','ca932323-0000-4000-8000-000000000001/ca932323-0000-4000-8000-000000000007/graph.png');
create function pg_temp.image_input(p_ack boolean) returns jsonb language sql as $$
  select pg_temp.report_input('ca932323-0000-4000-8000-000000000007')||jsonb_build_object(
    'varieties','[{"id":"ca932323-0000-4000-8000-000000000711","name":"新藍"}]'::jsonb,
    'comparedMaterials','[]'::jsonb,
    'plots','[
      {"id":"ca932323-0000-4000-8000-000000000721","name":"無処理区","scope":"","description":"資材なし","steps":[],"varietyId":"ca932323-0000-4000-8000-000000000711","treatment":{"kind":"untreated"}},
      {"id":"ca932323-0000-4000-8000-000000000722","name":"処理区","scope":"","description":"1000倍を3回","steps":[],"varietyId":"ca932323-0000-4000-8000-000000000711","treatment":{"kind":"posted"}}
    ]'::jsonb,
    'measurements','[{"id":"ca932323-0000-4000-8000-000000000731","kind":"image","name":"収量","unit":"","body":"","graphs":[]}]'::jsonb,
    'media',jsonb_build_array(jsonb_build_object('id','ca932323-0000-4000-8000-000000000741',
      'url','https://example.test/storage/v1/object/public/report-media/ca932323-0000-4000-8000-000000000001/ca932323-0000-4000-8000-000000000007/graph.png',
      'mediaType','photo','section','measurements','caption','','measurementId','ca932323-0000-4000-8000-000000000731')),
    'documentsAck',p_ack)
$$;
select set_config('request.jwt.claims','{"sub":"ca932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$select public.save_usage_report(pg_temp.image_input(false),false)$$,'a draft with an inserted image saves without the confidentiality check');
select throws_ok($$select public.save_usage_report(pg_temp.image_input(false),true)$$,'23514',null,'an inserted image needs the confidentiality check to submit');
select lives_ok($$select public.save_usage_report(pg_temp.image_input(true),true)$$,'a checked report with an inserted image submits');
reset role;

select * from finish();
rollback;
