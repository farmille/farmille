-- 一般会員の退会と登録情報の変更。
-- 退会したプロフィールの行は投稿との結び付きのために残し、公開項目を空けて退会した日時を記録する。
alter table public.profiles add column withdrawn_at timestamptz;
alter table public.profiles alter column handle drop not null;
alter table public.profiles add constraint profiles_withdrawn_public_fields check (
  case
    when withdrawn_at is null then handle is not null
    else handle is null and avatar_url is null and prefecture_code is null
  end
);

-- 退会の記録は withdraw_general_member だけが書く。本人のログインからは付け外しさせない。
create trigger enforce_profile_column_scope
  before update on public.profiles
  for each row execute function app.enforce_protected_columns('{withdrawn_at}');

alter policy profiles_insert_self on public.profiles
  with check (user_id = auth.uid() and app.can_use_general_features() and withdrawn_at is null);

-- 退会済みの行も投稿者の結び付きのために返し、公開項目は返さない。
create or replace view public.public_profiles
with (security_invoker = false, security_barrier = true) as
select
  p.user_id,
  case when p.withdrawn_at is null then p.handle end as handle,
  case when p.withdrawn_at is null then p.avatar_url end as avatar_url,
  case when p.withdrawn_at is null then p.created_at end as created_at,
  case when p.withdrawn_at is null then p.standpoint end as standpoint,
  case when p.withdrawn_at is null then p.prefecture_code end as prefecture_code,
  case when p.withdrawn_at is null then coalesce(d.bio, '') end as bio,
  p.withdrawn_at is not null as withdrawn
from public.profiles p
left join public.profile_details d on d.user_id = p.user_id;

-- 公開プロフィールと非公開の付属情報を消す。投稿・写真・参考になった・閲覧数・通報の記録は残す。
-- Auth のユーザーの論理削除はサーバーが続けて行うので、途中で止まっても同じ引数で呼び直せる。
create function public.withdraw_general_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  withdrawn timestamptz;
begin
  select p.withdrawn_at into withdrawn from public.profiles p where p.user_id = p_user_id for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if withdrawn is null then
    update public.profiles
       set withdrawn_at = now(), handle = null, avatar_url = null, prefecture_code = null
     where user_id = p_user_id;
  end if;
  delete from public.profile_contact_details where user_id = p_user_id;
  delete from public.profile_details where user_id = p_user_id;
  delete from public.profile_affiliations where user_id = p_user_id;
  delete from public.profile_crops where user_id = p_user_id;
  delete from public.profile_links where user_id = p_user_id;
  delete from public.saved_materials where user_id = p_user_id;
  delete from public.saved_posts where user_id = p_user_id;
  delete from public.registration_notifications where user_id = p_user_id;
end;
$$;
revoke all on function public.withdraw_general_member(uuid) from public, anon, authenticated;
grant execute on function public.withdraw_general_member(uuid) to service_role;

-- 本名・連絡先と、公開する都道府県を1つのトランザクションで書き換える。
-- 連絡先の行が無い会員（連絡先の保存より前に登録した会員）は、ここで行を作る。
-- 任意の電話番号と建物名・部屋番号は、空文字を未入力として保存する。
create function public.save_registered_details(
  p_user_id uuid,
  p_family_name text,
  p_given_name text,
  p_phone text,
  p_postal_code text,
  p_prefecture_code smallint,
  p_city_street text,
  p_building_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set prefecture_code = p_prefecture_code
   where user_id = p_user_id and withdrawn_at is null;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  insert into public.profile_contact_details (
    user_id, family_name, given_name, phone, postal_code, city_street, building_name
  ) values (
    p_user_id, p_family_name, p_given_name, nullif(p_phone, ''), p_postal_code, p_city_street,
    nullif(p_building_name, '')
  )
  on conflict (user_id) do update set
    family_name = excluded.family_name,
    given_name = excluded.given_name,
    phone = excluded.phone,
    postal_code = excluded.postal_code,
    city_street = excluded.city_street,
    building_name = excluded.building_name;
end;
$$;
revoke all on function public.save_registered_details(uuid, text, text, text, text, smallint, text, text)
  from public, anon, authenticated;
grant execute on function public.save_registered_details(uuid, text, text, text, text, smallint, text, text)
  to service_role;
