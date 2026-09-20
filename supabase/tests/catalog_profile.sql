begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
insert into auth.users(id,email,raw_app_meta_data) values
('eeeeeeee-0000-4000-8000-000000000001','profile-one@example.test','{"account_type":"general"}'),
('eeeeeeee-0000-4000-8000-000000000002','profile-two@example.test','{"account_type":"general"}');
insert into public.profiles(user_id,handle,standpoint,prefecture_code) values
('eeeeeeee-0000-4000-8000-000000000001','検証用会員1','farmer',13),
('eeeeeeee-0000-4000-8000-000000000002','検証用会員2','farmer',8);
insert into public.profile_contact_details(user_id,family_name,given_name,postal_code,city,street_address,building_name) values
('eeeeeeee-0000-4000-8000-000000000001','検証','会員','1000001','千代田区','千代田1-1','試験ビル101');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"eeeeeeee-0000-4000-8000-000000000001","app_metadata":{"account_type":"general"}}',true);
select public.save_profile_details('検証用更新','自己紹介',false,array['JA青年部','JA青年部','生産者の会'],array[]::uuid[],array['https://example.com']);
do $$ begin
  if (select count(*) from public.profile_affiliations where user_id=auth.uid())<>2 then raise exception '所属の重複除去に失敗'; end if;
  if (select city from public.public_profiles where user_id=auth.uid()) is not null then raise exception '非公開の市区町村が漏洩'; end if;
  if (select handle from public.public_profiles where user_id='eeeeeeee-0000-4000-8000-000000000002')<>'検証用会員2' then raise exception '他会員を更新'; end if;
  begin
    perform public.save_profile_details('検証用更新','破棄される自己紹介',true,array[''],array[]::uuid[],array[]::text[]);
    raise exception '不正な所属を保存できてしまった';
  exception when check_violation then null; end;
  if (select bio from public.public_profiles where user_id=auth.uid())<>'自己紹介' then raise exception '一括保存が部分的に反映された'; end if;
end $$;
select public.save_profile_details('検証用更新','自己紹介',true,array[]::text[],array[]::uuid[],array[]::text[]);
set local role anon;
do $$ begin
  if (select city from public.public_profiles where user_id='eeeeeeee-0000-4000-8000-000000000001')<>'千代田区' then raise exception '明示公開した市区町村が表示されない'; end if;
  if exists(select 1 from public.public_profiles p where p.user_id='eeeeeeee-0000-4000-8000-000000000001' and (to_jsonb(p) ? 'street_address' or to_jsonb(p) ? 'building_name')) then raise exception '市区町村の公開で詳細住所が漏洩'; end if;
  begin
    perform * from public.profile_contact_details;
    raise exception '非公開連絡先に匿名アクセス可能';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_profile_details('匿名更新','',false,array[]::text[],array[]::uuid[],array[]::text[]);
    raise exception '匿名更新可能';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.catalog_source_evidence;
    raise exception '原文に匿名アクセス可能';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  begin
    update public.profile_contact_details set street_address=E'　 \t' where user_id='eeeeeeee-0000-4000-8000-000000000001';
    raise exception '空白だけの番地を保存できてしまった';
  exception when check_violation then null; end;
  begin
    update public.profile_contact_details set building_name=repeat('あ',201) where user_id='eeeeeeee-0000-4000-8000-000000000001';
    raise exception '長すぎる建物名を保存できてしまった';
  exception when check_violation then null; end;
  if (select array_agg(name order by sort_order) from public.affiliation_options where sort_order between 1 and 9) is distinct from array['JA全青協','4Hクラブ','日本農業法人協会','JA営農指導員','都道府県 農業普及指導員','都道府県 農業研究員','農研機構 研究員','大学 研究員','その他'] then raise exception '所属候補が一致しない'; end if;
end $$;
do $$ begin
  if (select count(*) from public.registration_notifications where user_id in('eeeeeeee-0000-4000-8000-000000000001','eeeeeeee-0000-4000-8000-000000000002'))<>2 then raise exception '登録通知が作成されない'; end if;
end $$;
select pass('プロフィールの一括更新・公開設定・匿名権限・登録通知を検証');
select * from finish();
rollback;
