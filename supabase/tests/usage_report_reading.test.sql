begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
insert into auth.users(id) values ('bdfea100-0000-4000-8000-000000000001');
insert into public.profiles(user_id,handle,standpoint) values ('bdfea100-0000-4000-8000-000000000001','reading-test','other');
insert into public.materials(id,name,manufacturer_name) values ('bdfea100-0000-4000-8000-000000000002','閲覧テスト資材','閲覧テストメーカー');
insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,pesticide_ack,status,published_at,editor_note,climate_note)
select 'bdfea100-0000-4000-8000-000000000003','bdfea100-0000-4000-8000-000000000002','bdfea100-0000-4000-8000-000000000001',id,repeat('冒',200)||'会員向け本文',repeat('要',120)||'非公開のまとめ',true,'published',now(),'内部メモ','会員向け気候'
from public.crops order by id limit 1;
insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,pesticide_ack,status)
select 'bdfea100-0000-4000-8000-000000000004','bdfea100-0000-4000-8000-000000000002','bdfea100-0000-4000-8000-000000000001',id,'下書き本文','下書き要約',true,'draft' from public.crops order by id limit 1;
insert into public.usage_report_media(id,usage_report_id,media_type,url,placement,sort_order) values
('bdfea100-0000-4000-8000-000000000005','bdfea100-0000-4000-8000-000000000003','photo','https://example.com/cover.jpg','cover',1),
('bdfea100-0000-4000-8000-000000000006','bdfea100-0000-4000-8000-000000000003','photo','https://example.com/comparison.jpg','observation',0);
insert into public.usage_report_applications(usage_report_id,detail) values ('bdfea100-0000-4000-8000-000000000003','会員向け使用条件');
insert into public.usage_report_metrics(usage_report_id,metric_name,treated_value) values ('bdfea100-0000-4000-8000-000000000003','収量',99);
set local role anon;
select is((select count(*)::integer from public.usage_reports where id='bdfea100-0000-4000-8000-000000000003'),0,'anonymous cannot fetch full report');
select is((select length(observed_change) from public.list_usage_report_previews() where id='bdfea100-0000-4000-8000-000000000003'),200,'preview stops at 200 characters');
select is((select length(summary) from public.list_usage_report_previews() where id='bdfea100-0000-4000-8000-000000000003'),120,'summary stops at 120 characters');
select is((select editor_note from public.list_usage_report_previews() where id='bdfea100-0000-4000-8000-000000000003'),null,'preview hides internal notes');
select is((select climate_note from public.list_usage_report_previews() where id='bdfea100-0000-4000-8000-000000000003'),null,'preview hides full conditions');
select is((select count(*)::integer from public.list_usage_report_previews() where id='bdfea100-0000-4000-8000-000000000004'),0,'draft has no preview');
select is((select count(*)::integer from public.usage_report_applications where usage_report_id='bdfea100-0000-4000-8000-000000000003'),0,'anonymous cannot fetch applications');
select is((select count(*)::integer from public.usage_report_metrics where usage_report_id='bdfea100-0000-4000-8000-000000000003'),0,'anonymous cannot fetch metrics');
select is((select id from public.usage_report_media where usage_report_id='bdfea100-0000-4000-8000-000000000003'),'bdfea100-0000-4000-8000-000000000005'::uuid,'anonymous sees only designated cover');
reset role;
select set_config('request.jwt.claims','{"sub":"bdfea100-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select matches((select observed_change from public.usage_reports where id='bdfea100-0000-4000-8000-000000000003'),'会員向け本文','general user reads full text');
select is((select count(*)::integer from public.usage_report_media where usage_report_id='bdfea100-0000-4000-8000-000000000003'),2,'member reads comparison media');
select set_config('request.jwt.claims','{"sub":"bdfea100-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"seller"}}',true);
select matches((select observed_change from public.usage_reports where id='bdfea100-0000-4000-8000-000000000003'),'会員向け本文','manufacturer reads full text');
select set_config('request.jwt.claims','{"sub":"bdfea100-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"admin"}}',true);
select matches((select observed_change from public.usage_reports where id='bdfea100-0000-4000-8000-000000000003'),'会員向け本文','admin reads full text');
reset role;
update public.materials set publication_status='archived', archived_at=now() where id='bdfea100-0000-4000-8000-000000000002';
set local role anon;
select is((select count(*)::integer from public.list_usage_report_previews() where id='bdfea100-0000-4000-8000-000000000003'),0,'archived material has no public report preview');
select * from finish();
rollback;
