begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
insert into auth.users(id) values('bba93232-0000-4000-8000-000000000001'),('bba93232-0000-4000-8000-000000000002');
insert into public.manufacturers(name) values('承認テスト既存メーカー');
insert into public.materials(id,name,manufacturer_name) values
('bba93232-0000-4000-8000-000000000011','既存メーカーの資材','承認テスト既存メーカー');
insert into public.seller_accounts(id,official_name,login_id,contact_email,contact_name,location,region_scope) values
('bba93232-0000-4000-8000-000000000021','承認テスト既存企業','approval-existing','existing@example.test','担当','東京都','全国'),
('bba93232-0000-4000-8000-000000000022','承認テスト新規企業','approval-new','new@example.test','担当','東京都','全国');
select lives_ok($$select public.approve_seller_with_manufacturer('bba93232-0000-4000-8000-000000000021','bba93232-0000-4000-8000-000000000001','承認テスト既存メーカー',false)$$,'existing manufacturer can be linked');
select lives_ok($$select public.approve_seller_with_manufacturer('bba93232-0000-4000-8000-000000000022','bba93232-0000-4000-8000-000000000002','承認テスト追加メーカー',true)$$,'new manufacturer can be created and linked');
select is((select count(*)::integer from public.manufacturers where name in ('承認テスト既存メーカー','承認テスト追加メーカー')),2,'both manufacturer names exist');
select is((select status from public.seller_accounts where id='bba93232-0000-4000-8000-000000000021'),'approved','existing application is approved');
select is((select manufacturer_name from public.seller_accounts where id='bba93232-0000-4000-8000-000000000022'),'承認テスト追加メーカー','new application keeps the selected manufacturer');
select is((select count(seller_id)::integer from public.materials where id in ('bba93232-0000-4000-8000-000000000011','bba93232-0000-4000-8000-000000000012')),0,'approval does not grant material ownership');
select is((select count(*)::integer from public.material_editor_grants where seller_id in ('bba93232-0000-4000-8000-000000000021','bba93232-0000-4000-8000-000000000022')),0,'approval does not grant editing rights');
select throws_ok($$select public.approve_seller_with_manufacturer('bba93232-0000-4000-8000-000000000022','bba93232-0000-4000-8000-000000000002','承認テスト追加メーカー',true)$$,'23505',null,'approval cannot be repeated');
select * from finish();
rollback;
