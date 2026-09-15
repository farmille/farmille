begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- 既存の投稿やユーザーがない環境でも認可を検証する。
insert into auth.users(id) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba751'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba752');
insert into public.profiles(user_id,handle,standpoint) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba751','saved-post-test-one','other'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba752','saved-post-test-two','other');
insert into public.materials(id,name,manufacturer_name) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba753','保存テスト資材','保存テストメーカー');
insert into public.reviews(id,material_id,author_user_id,rating,body,pesticide_ack,status) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba754','ba8b2af4-a8b5-4b31-9d13-578f15bba753','ba8b2af4-a8b5-4b31-9d13-578f15bba751',4,'保存対象',true,'published'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba755','ba8b2af4-a8b5-4b31-9d13-578f15bba753','ba8b2af4-a8b5-4b31-9d13-578f15bba752',4,'非公開対象',true,'hidden');
insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,pesticide_ack,status,published_at)
 select 'ba8b2af4-a8b5-4b31-9d13-578f15bba756','ba8b2af4-a8b5-4b31-9d13-578f15bba753','ba8b2af4-a8b5-4b31-9d13-578f15bba751',id,'観察','要約',true,'published',now()
 from public.crops order by id limit 1;

select set_config('request.jwt.claims','{"sub":"ba8b2af4-a8b5-4b31-9d13-578f15bba751","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$insert into public.saved_posts(user_id,review_id) values(auth.uid(),'ba8b2af4-a8b5-4b31-9d13-578f15bba754')$$,'owner saves published review');
select lives_ok($$insert into public.saved_posts(user_id,usage_report_id) values(auth.uid(),'ba8b2af4-a8b5-4b31-9d13-578f15bba756')$$,'owner saves published report');
select throws_ok($$insert into public.saved_posts(user_id,review_id) values(auth.uid(),'ba8b2af4-a8b5-4b31-9d13-578f15bba754')$$,'23505',null,'duplicate save rejected');
select throws_ok($$insert into public.saved_posts(user_id,review_id) values(auth.uid(),'ba8b2af4-a8b5-4b31-9d13-578f15bba755')$$,'42501',null,'hidden review cannot be saved');
select set_config('request.jwt.claims','{"sub":"ba8b2af4-a8b5-4b31-9d13-578f15bba752","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
select is((select count(*)::integer from public.saved_posts),0,'another user cannot read saves');
select throws_ok($$insert into public.saved_posts(user_id,review_id) values('ba8b2af4-a8b5-4b31-9d13-578f15bba751','ba8b2af4-a8b5-4b31-9d13-578f15bba754')$$,'42501',null,'another user cannot write saves');
delete from public.saved_posts where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba751';
select set_config('request.jwt.claims','{"sub":"ba8b2af4-a8b5-4b31-9d13-578f15bba751","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
select is((select count(*)::integer from public.saved_posts),2,'another user cannot remove saves');
delete from public.saved_posts where user_id=auth.uid();
select is((select count(*)::integer from public.saved_posts),0,'owner removes saves');
select throws_ok($$insert into public.saved_posts(user_id) values(auth.uid())$$,'42501',null,'missing target rejected');
reset role;
select * from finish();
rollback;
