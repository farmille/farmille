begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into public.reviews(id, material_id, author_user_id, rating, body, pesticide_ack)
values ('aa933030-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 4, '非公開後も本文を保持する', true);
insert into public.review_photos(review_id,url) values ('aa933030-0000-4000-8000-000000000001','https://example.com/retained.jpg');
create temp table retained_report as select observed_change, (select count(*) from public.usage_report_media where usage_report_id='55555555-5555-4555-8555-555555555555') media_count from public.usage_reports where id='55555555-5555-4555-8555-555555555555';

select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*)::integer from public.reviews where id='aa933030-0000-4000-8000-000000000001'),1,'published review is publicly visible');
reset role;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.usage_reports where id='55555555-5555-4555-8555-555555555555'),1,'published report is visible to a signed-in reader');
reset role;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal2","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
with changed as (update public.reviews set status='hidden' where id='aa933030-0000-4000-8000-000000000001' and status='published' returning id) select is((select count(*)::integer from changed),0,'non-admin cannot hide another member review');
with changed as (update public.usage_reports set status='declined',published_at=null where id='55555555-5555-4555-8555-555555555555' and status='published' returning id) select is((select count(*)::integer from changed),0,'non-admin cannot hide another member report');
reset role;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1","app_metadata":{"account_type":"admin"}}',true);
set local role authenticated;
with changed as (update public.reviews set status='hidden' where id='aa933030-0000-4000-8000-000000000001' and status='published' returning id) select is((select count(*)::integer from changed),0,'AAL1 admin cannot hide review');
with changed as (update public.usage_reports set status='declined',published_at=null where id='55555555-5555-4555-8555-555555555555' and status='published' returning id) select is((select count(*)::integer from changed),0,'AAL1 admin cannot hide report');
reset role;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal2","app_metadata":{"account_type":"admin"}}',true);
set local role authenticated;
with changed as (update public.reviews set status='hidden' where id='aa933030-0000-4000-8000-000000000001' and status='published' returning id) select is((select count(*)::integer from changed),1,'AAL2 admin hides published review');
with changed as (update public.usage_reports set status='declined',published_at=null where id='55555555-5555-4555-8555-555555555555' and status='published' returning id) select is((select count(*)::integer from changed),1,'AAL2 admin hides published report');
reset role;
select is((select body from public.reviews where id='aa933030-0000-4000-8000-000000000001'),'非公開後も本文を保持する','review text remains');
select is((select count(*)::integer from public.review_photos where review_id='aa933030-0000-4000-8000-000000000001'),1,'review attachment remains');
select ok((select observed_change from public.usage_reports where id='55555555-5555-4555-8555-555555555555')=(select observed_change from retained_report) and (select count(*) from public.usage_report_media where usage_report_id='55555555-5555-4555-8555-555555555555')=(select media_count from retained_report),'report text and attachments remain');
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*)::integer from public.reviews where id='aa933030-0000-4000-8000-000000000001'),0,'hidden review is absent from public queries');
reset role;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.usage_reports where id='55555555-5555-4555-8555-555555555555'),0,'hidden report is absent from signed-in reader queries');
reset role;
select * from finish();
rollback;
