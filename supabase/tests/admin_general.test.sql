begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id) values ('ba8b2af4-a8b5-4b31-9d13-578f15bba731');
select set_config('request.jwt.claims', '{"sub":"ba8b2af4-a8b5-4b31-9d13-578f15bba731","role":"authenticated","aal":"aal1","app_metadata":{"account_type":"admin"}}', true);
set local role authenticated;
select ok(app.can_use_general_features(), 'admin can use personal features at AAL1');
select ok(not app.is_admin_writer(), 'admin management still requires AAL2');
select lives_ok($$insert into public.profiles(user_id, handle, standpoint) values ('ba8b2af4-a8b5-4b31-9d13-578f15bba731', 'admin-rls-test', 'other')$$, 'admin can create own profile');
select throws_ok($$insert into public.profiles(user_id, handle, standpoint) values ('ba8b2af4-a8b5-4b31-9d13-578f15bba732', 'other-rls-test', 'other')$$, '42501', null, 'admin cannot create another profile');

select set_config('request.jwt.claims', '{"sub":"ba8b2af4-a8b5-4b31-9d13-578f15bba731","role":"authenticated","aal":"aal1","app_metadata":{"account_type":"seller"}}', true);
select ok(not app.can_use_general_features(), 'seller cannot use personal features');
select set_config('request.jwt.claims', '{"sub":"ba8b2af4-a8b5-4b31-9d13-578f15bba731","role":"authenticated","aal":"aal1","app_metadata":{"account_type":"general"}}', true);
select ok(app.can_use_general_features(), 'general retains personal features');
select ok(not app.is_admin_writer(), 'general has no management rights');
select * from finish();
rollback;
