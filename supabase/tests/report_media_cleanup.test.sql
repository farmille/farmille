begin;
create extension if not exists pgtap with schema extensions;
select plan(11);
insert into auth.users(id) values ('dc932323-0000-4000-8000-000000000001');
insert into public.profiles(user_id,handle,standpoint) values ('dc932323-0000-4000-8000-000000000001','画像回収の検証','farmer');
insert into public.materials(id,name,manufacturer_name) values ('dc932323-0000-4000-8000-000000000002','画像回収の検証','検証会社');
insert into public.usage_reports(id,material_id,author_user_id,observed_change,summary,pesticide_ack,form_version)
values ('dc932323-0000-4000-8000-000000000003','dc932323-0000-4000-8000-000000000002','dc932323-0000-4000-8000-000000000001','','',false,2);
insert into storage.objects(bucket_id,name,created_at,updated_at) values
('report-media','cleanup-test/orphan.jpg',now()-interval '25 hours',now()-interval '25 hours'),
('report-media','cleanup-test/referenced.jpg',now()-interval '25 hours',now()-interval '25 hours'),
('report-media','cleanup-test/recent.jpg',now(),now()),
('avatars','cleanup-test/other.jpg',now()-interval '25 hours',now()-interval '25 hours');
insert into public.usage_report_media(usage_report_id,media_type,url,placement)
values ('dc932323-0000-4000-8000-000000000003','photo','https://storage.example.test/storage/v1/object/public/report-media/cleanup-test/referenced.jpg','observation');
set local role anon;
select throws_ok($$select * from public.claim_expired_report_media()$$,'42501',null,'anonymous cannot claim files');
reset role;
set local role authenticated;
select throws_ok($$select * from public.claim_expired_report_media()$$,'42501',null,'members cannot claim files');
reset role;
set local role service_role;
select results_eq($$select path from public.claim_expired_report_media()$$,$$select 'cleanup-test/orphan.jpg'::text$$,'only old unreferenced report images are claimed');
select results_eq($$select path from public.claim_expired_report_media()$$,$$select 'cleanup-test/orphan.jpg'::text$$,'failed removals remain retryable');
select throws_ok($$select * from public.claim_expired_report_media(0)$$,'22023','invalid_body','invalid batch limit is rejected');
reset role;
select is((select count(*) from public.report_media_cleanup),1::bigint,'claim is idempotent');
select throws_ok($$insert into public.usage_report_media(usage_report_id,media_type,url,placement) values ('dc932323-0000-4000-8000-000000000003','photo','https://storage.example.test/storage/v1/object/public/report-media/cleanup-test/orphan.jpg','observation')$$,'23514','invalid_report_input','claimed image cannot be attached later');
select lives_ok($$update public.usage_report_media set caption='保存済みの画像' where usage_report_id='dc932323-0000-4000-8000-000000000003'$$,'saved image remains editable');
select lives_ok($$insert into public.usage_report_media(usage_report_id,media_type,url,placement) values ('dc932323-0000-4000-8000-000000000003','photo','https://storage.example.test/storage/v1/object/public/report-media/cleanup-test/recent.jpg','observation')$$,'recent upload can be saved');
-- テスト用メタデータだけを消し、Storage APIによる削除後の参照拒否を確認する。
select set_config('storage.allow_delete_query','true',true);
delete from storage.objects where bucket_id='report-media' and name='cleanup-test/orphan.jpg';
select is((select count(*) from public.report_media_cleanup),0::bigint,'object deletion removes the claim');
select throws_ok($$insert into public.usage_report_media(usage_report_id,media_type,url,placement) values ('dc932323-0000-4000-8000-000000000003','photo','https://storage.example.test/storage/v1/object/public/report-media/cleanup-test/orphan.jpg','observation')$$,'23514','invalid_report_input','deleted image cannot be attached');
select * from finish();
rollback;
