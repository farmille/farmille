begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into public.materials(id, name, manufacturer_name, publication_status, archived_at) values
  ('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01', '名称確認用資材', '検証会社', 'published', null),
  ('a9e478c7-f471-4a09-a1f0-a6a6b4d80a02', '非公開の名称確認用資材', '検証会社', 'archived', now());
insert into public.material_name_aliases(material_id, name) values
  ('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01', '公開別名'),
  ('a9e478c7-f471-4a09-a1f0-a6a6b4d80a02', '非公開別名');

select is((select count(*)::integer from public.container_types), 11, '容器分類を番号で参照できる');
select throws_ok($$update public.materials set container_type_id=11 where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01'$$,
  '23503', null, '存在しない容器形状を保存できない');
select throws_ok($$update public.materials set official_name='  ' where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01'$$,
  '23514', null, '空白だけの正式名称を保存できない');
select throws_ok($$insert into public.material_name_aliases values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01','公開別名')$$,
  '23505', null, '同じ別名を重複登録できない');

set local role anon;
select is((select count(*)::integer from public.container_types), 11, '匿名でも容器分類を参照できる');
select is((select count(*)::integer from public.material_name_aliases where material_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01'),
  1, '公開資材の別名を検索できる');
select is((select count(*)::integer from public.material_name_aliases where material_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a02'),
  0, '掲載終了した資材の別名を公開しない');
select throws_ok($$select * from public.catalog_import_baselines$$, '42501', null, '取り込み基準値を公開しない');
select throws_ok($$insert into public.material_name_aliases values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01','追加')$$,
  '42501', null, '匿名で別名を追加できない');
reset role;
select ok(not has_table_privilege('authenticated', 'public.catalog_import_runs', 'SELECT'), '取り込み履歴は運営用の接続に限定する');
select ok(not has_table_privilege('authenticated', 'public.container_types', 'INSERT,UPDATE,DELETE'), '会員は容器分類を変更できない');
select ok(not has_table_privilege('authenticated', 'public.material_name_aliases', 'INSERT,UPDATE,DELETE'), '会員は資材別名を直接変更できない');

insert into public.catalog_import_runs(id,source_sha256,plan_sha256)
  values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a03',repeat('a',64),repeat('b',64));
select throws_ok($$insert into public.material_page_versions(material_id,base_revision,status)
  values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01',0,'published')$$,
  '23514',null,'メーカー版はメーカーと編集権を必要とする');
select throws_ok($$insert into public.material_page_versions(material_id,base_revision,status,origin,catalog_import_run_id)
  values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01',0,'pending','catalog','a9e478c7-f471-4a09-a1f0-a6a6b4d80a03')$$,
  '23514',null,'取り込み版をメーカーの確認待ち原稿にしない');
insert into public.material_page_versions(id,material_id,base_revision,status,origin,catalog_import_run_id,description,content_contract)
  values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a04','a9e478c7-f471-4a09-a1f0-a6a6b4d80a01',0,'published','catalog',
    'a9e478c7-f471-4a09-a1f0-a6a6b4d80a03','既存の本文',2);
insert into public.material_page_links(version_id,group_name,title,url,sort_order)
  values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a04','public_trial','取り込み試験資料','https://example.com/trial.pdf',0);
update public.materials set published_page_version_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'
  where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01';
select lives_ok($$select app.assert_material_page_submission('a9e478c7-f471-4a09-a1f0-a6a6b4d80a04')$$,
  '題名とURLだけの取り込み試験資料を公開できる');
select is((select manufacturer_verified_at from public.materials where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01'),
  null::timestamptz,'取り込みでメーカー確認済みにしない');
set local role anon;
select is((select count(*)::integer from public.public_material_page_versions where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'),1,
  '取り込み版を公開ページで読み取れる');
select is((select count(*)::integer from public.material_page_versions where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'),0,
  '公開投影に含まれない原稿メタデータは公開しない');
select is((select count(*)::integer from public.material_page_links where version_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'),1,
  '取り込み版の資料を匿名で読み取れる');
reset role;
insert into auth.users(id) values('a9e478c7-f471-4a09-a1f0-a6a6b4d80a05');
select public.set_material_editor_grant('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01','33333333-3333-4333-8333-333333333333',
  'CATALOG-TEST','a9e478c7-f471-4a09-a1f0-a6a6b4d80a05');
update public.materials set publication_status='archived',archived_at=now() where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01';
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"account_type":"seller","seller_id":"33333333-3333-4333-8333-333333333333"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.material_page_versions where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'),1,
  '編集権があれば掲載終了した資材の取り込み版も編集の初期値に使える');
select is((select count(*)::integer from public.material_page_links where version_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'),1,
  '編集権があれば取り込んだ資料を読み取れる');
select lives_ok($$select public.save_material_page_version('a9e478c7-f471-4a09-a1f0-a6a6b4d80a01',
  '{"description":"既存の本文","mainComponents":"","mechanism":"","links":[],"images":[],"usages":[],"timings":[],"certifications":[],"registrations":[],"relatedCompanies":[]}'::jsonb,true,null)$$,
  'メーカーは取り込んだ資料を削除して表現確認に送れる');
select is((select count(*)::integer from public.material_page_links where version_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'),1,
  'メーカーの送信だけでは取り込み版の資料を変更しない');
reset role;
select lives_ok($$select public.review_material_page_version(
  (select id from public.material_page_versions where material_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01' and status='pending'),
  'a9e478c7-f471-4a09-a1f0-a6a6b4d80a05',true,'')$$,
  '資料を削除したメーカー版を既存の審査手順で公開できる');
select is((select count(*)::integer from public.material_page_links l join public.materials m on m.published_page_version_id=l.version_id
  where m.id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01'),0,'メーカーが削除した資料は公開版に含まれない');
update public.materials set published_page_version_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'
  where id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01';
update public.material_editor_grants set revoked_at=now(),revoked_by='a9e478c7-f471-4a09-a1f0-a6a6b4d80a05'
  where material_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a01';
set local role authenticated;
select is((select count(*)::integer from public.material_page_links where version_id='a9e478c7-f471-4a09-a1f0-a6a6b4d80a04'),0,
  '編集権の取消後は掲載終了した資料を読み取れない');
reset role;

select * from finish();
rollback;
