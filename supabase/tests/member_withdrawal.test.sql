begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- 退会する会員（…761）と、投稿に参考になったを付けた別の会員（…762）。
insert into auth.users(id) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba761'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba762'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba768');
insert into public.profiles(user_id,handle,standpoint,prefecture_code,avatar_url) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','withdrawal-test-member','farmer',8,'https://example.test/avatars/ba8b2af4-a8b5-4b31-9d13-578f15bba761/a.png'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba762','withdrawal-test-reader','other',13,null);
insert into public.profile_contact_details(user_id,family_name,given_name,phone,postal_code,city_street) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','山田','花子','09012345678','3100011','水戸市三の丸1-2-3');
insert into public.profile_details(user_id,bio) values ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','自己紹介');
insert into public.profile_affiliations(user_id,name,sort_order) values ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','退会テスト農協',1);
insert into public.profile_links(user_id,url,sort_order) values ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','https://example.test',1);
insert into public.profile_crops(user_id,crop_id,sort_order) select 'ba8b2af4-a8b5-4b31-9d13-578f15bba761',id,1 from public.crops order by id limit 1;
insert into public.materials(id,name,manufacturer_name) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba763','退会テスト資材','退会テストメーカー');
insert into public.reviews(id,material_id,author_user_id,rating,body,pesticide_ack,status) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba764','ba8b2af4-a8b5-4b31-9d13-578f15bba763','ba8b2af4-a8b5-4b31-9d13-578f15bba761',4,'退会後も残る感想口コミ',true,'published'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba765','ba8b2af4-a8b5-4b31-9d13-578f15bba763','ba8b2af4-a8b5-4b31-9d13-578f15bba762',5,'保存される感想口コミ',true,'published');
insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,pesticide_ack,status,published_at)
 select 'ba8b2af4-a8b5-4b31-9d13-578f15bba766','ba8b2af4-a8b5-4b31-9d13-578f15bba763','ba8b2af4-a8b5-4b31-9d13-578f15bba761',id,'観察','要約',true,'published',now()
 from public.crops order by id limit 1;
insert into public.saved_materials(user_id,material_id) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','ba8b2af4-a8b5-4b31-9d13-578f15bba763');
insert into public.saved_posts(user_id,review_id) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','ba8b2af4-a8b5-4b31-9d13-578f15bba765');
insert into public.helpful_votes(user_id,target_type,target_id) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','review','ba8b2af4-a8b5-4b31-9d13-578f15bba765'),
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba762','review','ba8b2af4-a8b5-4b31-9d13-578f15bba764');
insert into public.view_events(target_type,target_id,viewer_user_id) values
 ('review','ba8b2af4-a8b5-4b31-9d13-578f15bba765','ba8b2af4-a8b5-4b31-9d13-578f15bba761');
insert into public.content_reports(reporter_user_id,target_type,target_id,reason) values
 ('ba8b2af4-a8b5-4b31-9d13-578f15bba761','review','ba8b2af4-a8b5-4b31-9d13-578f15bba765','退会テストの通報');

-- 権限：サーバー（service_role）だけが呼べる。
select ok(not has_function_privilege('anon','public.withdraw_general_member(uuid)','execute'),'anonymous cannot withdraw a member');
select ok(not has_function_privilege('authenticated','public.withdraw_general_member(uuid)','execute'),'signed in users cannot call the withdrawal directly');
select ok(has_function_privilege('service_role','public.withdraw_general_member(uuid)','execute'),'server can withdraw a member');
select ok(not has_function_privilege('anon','public.save_registered_details(uuid,text,text,text,text,smallint,text,text)','execute'),'anonymous cannot save registered details');
select ok(not has_function_privilege('authenticated','public.save_registered_details(uuid,text,text,text,text,smallint,text,text)','execute'),'signed in users cannot save registered details directly');
select ok(has_function_privilege('service_role','public.save_registered_details(uuid,text,text,text,text,smallint,text,text)','execute'),'server can save registered details');

select set_config('request.jwt.claims','{"sub":"ba8b2af4-a8b5-4b31-9d13-578f15bba761","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select throws_ok($$select public.withdraw_general_member('ba8b2af4-a8b5-4b31-9d13-578f15bba761')$$,'42501',null,'the member cannot withdraw through the API');
select throws_ok($$update public.profiles set withdrawn_at = now() where user_id = auth.uid()$$,'42501',null,'the member cannot record a withdrawal on the profile');
reset role;

-- 登録情報の変更：連絡先と公開する都道府県を一度に書き換え、空の任意項目は未入力として保存する。
set local role service_role;
select lives_ok($$select public.save_registered_details('ba8b2af4-a8b5-4b31-9d13-578f15bba761','佐藤','一郎','','1000001',13::smallint,'千代田区千代田1-1','')$$,'server saves the registered details');
reset role;
select is((select family_name||given_name||postal_code||city_street from public.profile_contact_details where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),'佐藤一郎1000001千代田区千代田1-1','private contact details are replaced');
select ok((select phone is null and building_name is null from public.profile_contact_details where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),'empty optional fields are stored as null');
select is((select prefecture_code from public.public_profiles where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),13::smallint,'the public prefecture changes with the details');
set local role service_role;
select lives_ok($$select public.save_registered_details('ba8b2af4-a8b5-4b31-9d13-578f15bba762','鈴木','次郎','0312345678','1000001',13::smallint,'千代田区千代田1-1','')$$,'a member without a contact row gets one');

-- 退会。
select lives_ok($$select public.withdraw_general_member('ba8b2af4-a8b5-4b31-9d13-578f15bba761')$$,'server withdraws the member');
reset role;
select ok((select withdrawn_at is not null and handle is null and avatar_url is null and prefecture_code is null from public.profiles where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),'the profile keeps its row and clears public fields');
select is((select count(*)::integer from public.profile_contact_details where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),0,'private contact details are deleted');
select is((select count(*)::integer from public.profile_details where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761')
  + (select count(*)::integer from public.profile_affiliations where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761')
  + (select count(*)::integer from public.profile_crops where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761')
  + (select count(*)::integer from public.profile_links where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),0,'bio, affiliations, crops and links are deleted');
select is((select count(*)::integer from public.saved_materials where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761')
  + (select count(*)::integer from public.saved_posts where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),0,'favorites and saved posts are deleted');
select is((select count(*)::integer from public.reviews where author_user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761' and status='published'),1,'the published review remains');
select is((select count(*)::integer from public.usage_reports where author_user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761' and status='published'),1,'the published usage report remains');
select is((select count(*)::integer from public.helpful_votes where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761' or target_id='ba8b2af4-a8b5-4b31-9d13-578f15bba764'),2,'helpful votes given and received remain');
select is((select count(*)::integer from public.view_events where viewer_user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),1,'view events remain');
select is((select count(*)::integer from public.content_reports where reporter_user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),1,'the report record remains');
select ok((select withdrawn and handle is null and avatar_url is null and standpoint is null and prefecture_code is null and bio is null and created_at is null from public.public_profiles where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),'the public view marks the member as withdrawn without public fields');
select ok((select not withdrawn from public.public_profiles where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba762'),'other members stay active in the public view');

-- 同じ引数で呼び直しても同じ結果になる。
select set_config('test.withdrawn_at',(select withdrawn_at::text from public.profiles where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),true);
set local role service_role;
select lives_ok($$select public.withdraw_general_member('ba8b2af4-a8b5-4b31-9d13-578f15bba761')$$,'withdrawing again succeeds');
select throws_ok($$select public.save_registered_details('ba8b2af4-a8b5-4b31-9d13-578f15bba761','佐藤','一郎','','1000001',13::smallint,'千代田区千代田1-1','')$$,'P0002',null,'a withdrawn member cannot save registered details');
reset role;
select is((select withdrawn_at::text from public.profiles where user_id='ba8b2af4-a8b5-4b31-9d13-578f15bba761'),current_setting('test.withdrawn_at'),'the first withdrawal time is kept');

-- 退会したプロフィールに公開項目を戻せず、空いたニックネームは別の会員が使える。
select throws_ok($$update public.profiles set handle = 'withdrawal-test-member' where user_id = 'ba8b2af4-a8b5-4b31-9d13-578f15bba761'$$,'23514',null,'a withdrawn profile cannot take a nickname again');
select lives_ok($$update public.profiles set handle = 'withdrawal-test-member' where user_id = 'ba8b2af4-a8b5-4b31-9d13-578f15bba762'$$,'the nickname is free for another member');
select throws_ok($$insert into public.profiles(user_id,standpoint) values ('ba8b2af4-a8b5-4b31-9d13-578f15bba768','other')$$,'23514',null,'an active profile needs a nickname');

select * from finish();
rollback;
