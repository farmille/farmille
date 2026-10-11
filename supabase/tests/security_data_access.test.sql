begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into public.materials(id,name,manufacturer_name) values
  ('cf110000-0000-4000-8000-000000000001','権限検証資材','デモ株式会社');
insert into public.material_images(material_id,url) values
  ('cf110000-0000-4000-8000-000000000001','https://example.test/image.jpg');
insert into public.material_evidences(material_id,evidence_type,title,external_url) values
  ('cf110000-0000-4000-8000-000000000001','paper','試験資料','https://example.test/paper');
insert into public.material_sources(material_id,source_url) values
  ('cf110000-0000-4000-8000-000000000001','https://example.test/source');
select public.set_material_editor_grant(
  'cf110000-0000-4000-8000-000000000001','44444444-4444-4444-8444-444444444444',
  'SECURITY-TEST','44444444-4444-4444-8444-444444444444');

select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"account_type":"seller","seller_id":"44444444-4444-4444-8444-444444444444"}}',true);
set local role authenticated;
select ok(app.is_seller(),'approved manufacturer is authorized');
select lives_ok($$insert into public.articles(id,seller_id,title,body,status) values
  ('cf110000-0000-4000-8000-000000000002','44444444-4444-4444-8444-444444444444','下書き','本文','draft')$$,
  'approved manufacturer creates an article');
select throws_ok($$update public.seller_accounts set profile_text='審査を経ない紹介文' where id=app.seller_id()$$,
  '42501',null,'manufacturer cannot replace published introduction directly');
select throws_ok($$update public.seller_accounts set logo_url='https://example.test/logo.png' where id=app.seller_id()$$,
  '42501',null,'manufacturer cannot replace published logo directly');
select throws_ok($$update public.seller_accounts set website_url='https://example.test/new' where id=app.seller_id()$$,
  '42501',null,'manufacturer cannot replace published website directly');
select lives_ok($$select public.save_manufacturer_profile_version('審査する紹介文','','https://example.test',true)$$,
  'manufacturer can submit a profile for review');
reset role;
select lives_ok($$select public.review_manufacturer_profile_version(
  (select id from public.manufacturer_profile_versions where seller_id='44444444-4444-4444-8444-444444444444' and status='pending'),
  '44444444-4444-4444-8444-444444444444',true,'確認済み')$$,'review can publish the profile');
select is((select profile_text from public.seller_accounts where id='44444444-4444-4444-8444-444444444444'),
  '審査する紹介文','reviewed introduction is published');

update public.seller_accounts set status='suspended' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
select is(app.is_seller(),false,'suspension invalidates an existing JWT immediately');
select throws_ok($$insert into public.articles(seller_id,title,body,status,published_at) values
  ('44444444-4444-4444-8444-444444444444','凍結後の記事','本文','published',now())$$,
  '42501',null,'suspended manufacturer cannot publish a new article');
select results_eq($$update public.articles set status='published',published_at=now()
  where id='cf110000-0000-4000-8000-000000000002' returning id$$,
  $$select null::uuid where false$$,'suspended manufacturer cannot publish an existing draft');
select throws_ok($$insert into public.article_materials(article_id,material_id) values
  ('cf110000-0000-4000-8000-000000000002','cf110000-0000-4000-8000-000000000001')$$,
  '42501',null,'suspended manufacturer cannot change article links');
select results_eq($$delete from public.articles where id='cf110000-0000-4000-8000-000000000002' returning id$$,
  $$select null::uuid where false$$,'suspended manufacturer cannot delete an article');
reset role;
update public.seller_accounts set status='approved' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
select lives_ok($$update public.articles set status='published',published_at=now()
  where id='cf110000-0000-4000-8000-000000000002'$$,'restored manufacturer can publish');
select is((select status from public.articles where id='cf110000-0000-4000-8000-000000000002'),
  'published','restored manufacturer update reaches the article');
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"account_type":"seller","seller_id":"44444444-4444-4444-8444-444444444444"}}',true);
select is(app.is_seller(),false,'seller claim must belong to the authenticated user');
reset role;

insert into public.usage_reports(id,material_id,author_user_id,observed_change,summary,pesticide_ack,status,crop_id,published_at,editor_note)
select 'cf110000-0000-4000-8000-000000000003','cf110000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222','会員向け本文','要約',true,'published',id,now(),'編集部だけの内部メモ'
from public.crops order by id limit 1;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select observed_change from public.usage_reports where id='cf110000-0000-4000-8000-000000000003'),
  '会員向け本文','member can still read the published body');
select throws_ok($$select editor_note from public.usage_reports$$,'42501',null,'member cannot select editorial notes');
select throws_ok($$select * from public.usage_reports$$,'42501',null,'wildcard cannot disclose editorial notes');
reset role;
set local role service_role;
select is((select editor_note from public.usage_reports where id='cf110000-0000-4000-8000-000000000003'),
  '編集部だけの内部メモ','editorial server retains access to internal notes');
reset role;

select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*)::integer from public.material_images where material_id='cf110000-0000-4000-8000-000000000001'),1,'published material images are public');
select is((select count(*)::integer from public.material_evidences where material_id='cf110000-0000-4000-8000-000000000001'),1,'published material evidence is public');
select is((select count(*)::integer from public.material_sources where material_id='cf110000-0000-4000-8000-000000000001'),1,'published material sources are public');
reset role;
update public.materials set publication_status='archived',archived_at=now() where id='cf110000-0000-4000-8000-000000000001';
set local role anon;
select is((select count(*)::integer from public.material_images where material_id='cf110000-0000-4000-8000-000000000001'),0,'anonymous cannot read archived material images');
select is((select count(*)::integer from public.material_evidences where material_id='cf110000-0000-4000-8000-000000000001'),0,'anonymous cannot read archived material evidence');
select is((select count(*)::integer from public.material_sources where material_id='cf110000-0000-4000-8000-000000000001'),0,'anonymous cannot read archived material sources');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.material_images where material_id='cf110000-0000-4000-8000-000000000001'),0,'member cannot read archived material images');
select is((select count(*)::integer from public.material_evidences where material_id='cf110000-0000-4000-8000-000000000001'),0,'member cannot read archived material evidence');
select is((select count(*)::integer from public.material_sources where material_id='cf110000-0000-4000-8000-000000000001'),0,'member cannot read archived material sources');
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"account_type":"seller","seller_id":"44444444-4444-4444-8444-444444444444"}}',true);
select is((select count(*)::integer from public.material_images where material_id='cf110000-0000-4000-8000-000000000001'),1,'owner can inspect archived material images');
select is((select count(*)::integer from public.material_evidences where material_id='cf110000-0000-4000-8000-000000000001'),1,'owner can inspect archived material evidence');
select is((select count(*)::integer from public.material_sources where material_id='cf110000-0000-4000-8000-000000000001'),1,'owner can inspect archived material sources');
reset role;
select * from finish();
rollback;
