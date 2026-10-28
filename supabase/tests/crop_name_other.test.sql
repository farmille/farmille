begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users(id,raw_app_meta_data) values('c0c0a000-0000-4000-8000-000000000001','{"account_type":"general"}');
insert into public.profiles(user_id,handle,standpoint) values('c0c0a000-0000-4000-8000-000000000001','作目その他の検証','farmer');
insert into public.materials(id,name,manufacturer_name,publication_status)
values('c0c0a000-0000-4000-8000-000000000002','作目その他の検証資材','検証会社','published');

create function pg_temp.report_input(p_crop jsonb) returns jsonb language sql as $$
  select jsonb_build_object(
    'reportId','c0c0a000-0000-4000-8000-000000000003',
    'expectedUpdatedAt',(select updated_at from public.usage_reports where id='c0c0a000-0000-4000-8000-000000000003'),
    'materialId','c0c0a000-0000-4000-8000-000000000002',
    'varietyUnknown',true,'varieties','[]'::jsonb,'comparedMaterials','[]'::jsonb,'commonPlotDescription','',
    'observedChange','','purposeTags','[]'::jsonb,'prefectureCode',null,'city','','showCity',false,
    'cultivationEnvironment','','timingStages','[]'::jsonb,'timingNote','','plots','[]'::jsonb,
    'measurements','[]'::jsonb,'media','[]'::jsonb,'documents','[]'::jsonb,'headings','[]'::jsonb,
    'methodDetailsAck',false,'documentsAck',false,'guidelineAck',false,'pdfValuesChecked',false) || p_crop
$$;

select ok(has_column_privilege('anon','public.usage_reports','crop_name_other','select'),'未ログインでもレポートの作目名を読める');
select ok(has_column_privilege('authenticated','public.usage_reports','crop_name_other','select'),'ログイン会員もレポートの作目名を読める');

select set_config('request.jwt.claims','{"sub":"c0c0a000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;

-- 口コミ
select lives_ok($$select public.create_review_with_crops(
  p_material_id => 'c0c0a000-0000-4000-8000-000000000002',
  p_author_user_id => 'c0c0a000-0000-4000-8000-000000000001',
  p_rating => 4::smallint, p_body => '作目名だけの口コミ', p_crop_ids => array[]::uuid[],
  p_pesticide_ack => true, p_crop_name_other => '  ﾏﾝｺﾞｰ  '
)$$,'作物IDなしで作目名だけの口コミを投稿できる');
select is((select coalesce(c.crop_id::text,'')||'/'||c.crop_name_other from public.review_crops c
  join public.reviews r on r.id=c.review_id where r.author_user_id='c0c0a000-0000-4000-8000-000000000001'),
  '/ﾏﾝｺﾞｰ','作目名は前後の空白を除いて保存し、作物IDは空');
select throws_ok($$select public.create_review_with_crops(
  p_material_id => 'c0c0a000-0000-4000-8000-000000000002',
  p_author_user_id => 'c0c0a000-0000-4000-8000-000000000001',
  p_rating => 4::smallint, p_body => '両方', p_crop_ids => array[(select id from public.crops order by id limit 1)],
  p_pesticide_ack => true, p_crop_name_other => 'マンゴー'
)$$,'22023',null,'作物IDと作目名の両方は受け付けない');
select throws_ok($$select public.create_review_with_crops(
  p_material_id => 'c0c0a000-0000-4000-8000-000000000002',
  p_author_user_id => 'c0c0a000-0000-4000-8000-000000000001',
  p_rating => 4::smallint, p_body => '空', p_crop_ids => array[]::uuid[],
  p_pesticide_ack => true, p_crop_name_other => '   '
)$$,'22023',null,'空白だけの作目名は作目なしとして受け付けない');

-- プロフィール
select lives_ok($$select public.save_profile_details('作目その他の検証','',array[]::text[],
  array[(select id from public.crops order by id limit 1)],array[]::text[],array['マンゴー','パパイヤ'])$$,
  '作物IDと作目名を混ぜて保存できる');
select is((select string_agg(coalesce(crop_name_other,'ID'),',' order by sort_order) from public.profile_crops
  where user_id='c0c0a000-0000-4000-8000-000000000001'),'ID,マンゴー,パパイヤ','作目名は作物IDの後ろに並ぶ');
select public.save_profile_details('作目その他の検証','',array[]::text[],array[]::uuid[],array[]::text[]);
select is((select string_agg(crop_name_other,',' order by sort_order) from public.profile_crops
  where user_id='c0c0a000-0000-4000-8000-000000000001'),'マンゴー,パパイヤ','作目名を送らない保存では保存済みの作目名を残す');
select lives_ok($$select public.save_profile_details('作目その他の検証','',array[]::text[],null,array[]::text[],array['マンゴー'])$$,
  '作物IDの配列がnullでも作目名を保存できる');

-- 実証詳細レポート
select lives_ok($$select public.save_usage_report(pg_temp.report_input('{"cropId":null,"cropNameOther":" マンゴー "}'),false)$$,
  '作目名だけのレポートを下書き保存できる');
select is((select crop_name_other from public.usage_reports where id='c0c0a000-0000-4000-8000-000000000003'),
  'マンゴー','ログイン会員が保存した作目名を読み戻せる');
select throws_ok($$select public.save_usage_report(pg_temp.report_input(jsonb_build_object('cropId',(select id from public.crops order by id limit 1),'cropNameOther','マンゴー')),false)$$,
  '23514',null,'作物IDと作目名の両方は受け付けない');
select lives_ok($$select public.save_usage_report(pg_temp.report_input('{"cropId":null}'),false)$$,
  'cropNameOther を持たない入力も受け付ける');

select * from finish();
rollback;
