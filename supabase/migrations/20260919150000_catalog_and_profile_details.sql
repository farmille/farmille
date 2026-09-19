-- 作物は大群・中群・個別作目を区別し、資料に明記された分類を直接保持する。
alter table public.crop_groups
  add column parent_id uuid references public.crop_groups(id) on delete restrict,
  add column hierarchy_level text not null default 'middle'
    check (hierarchy_level in ('major','middle'));
alter table public.crop_groups drop constraint crop_groups_name_key;
create unique index crop_groups_parent_name_unique on public.crop_groups(parent_id,name) nulls not distinct;
alter table public.crops drop constraint crops_name_key;
create unique index crops_group_name_unique on public.crops(group_id,name);

create table public.material_crop_groups (
  material_id uuid not null references public.materials(id) on delete cascade,
  crop_group_id uuid not null references public.crop_groups(id) on delete restrict,
  source_name text not null check (btrim(source_name) <> ''),
  sort_order integer not null default 0,
  primary key(material_id,crop_group_id)
);
create index material_crop_groups_group_idx on public.material_crop_groups(crop_group_id);
alter table public.material_crop_groups enable row level security;
grant select on public.material_crop_groups to anon,authenticated;
grant all on public.material_crop_groups to service_role;
create policy material_crop_groups_read on public.material_crop_groups for select using (true);

create table public.material_application_methods (
  material_id uuid not null references public.materials(id) on delete cascade,
  method text not null check(method in ('spray','drench','mix','soak','coat','other')),
  source_text text not null,
  sort_order integer not null default 0,
  primary key(material_id,method)
);
alter table public.material_application_methods enable row level security;
grant select on public.material_application_methods to anon,authenticated;
grant all on public.material_application_methods to service_role;
create policy material_application_methods_read on public.material_application_methods for select using(true);

-- 製品IDと根拠は、表示用の資材と分離して保管する。統合しても出典を失わない。
create table public.catalog_source_products (
  source_product_id text primary key,
  material_id uuid not null references public.materials(id) on delete restrict,
  source_name text not null,
  publication_decision text not null,
  imported_at timestamptz not null default now()
);
create table public.catalog_source_evidence (
  evidence_id text primary key,
  source_product_id text not null references public.catalog_source_products(source_product_id),
  field_code text not null,
  source_text text not null,
  source_url text,
  source_title text
);
alter table public.catalog_source_products enable row level security;
alter table public.catalog_source_evidence enable row level security;
revoke all on public.catalog_source_products,public.catalog_source_evidence from anon,authenticated;
grant all on public.catalog_source_products,public.catalog_source_evidence to service_role;

-- 連絡先は従来どおり非公開とし、公開する自己紹介と市区町村の選択を別に持つ。
create table public.profile_details (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  bio text not null default '' check(char_length(bio)<=2000),
  city_public boolean not null default false
);
create table public.affiliation_options (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check(char_length(btrim(name)) between 1 and 100),
  sort_order integer not null default 0
);
create table public.profile_affiliations (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null check(char_length(btrim(name)) between 1 and 100),
  sort_order integer not null default 0,
  primary key(user_id,name)
);
create table public.profile_crops (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  crop_id uuid not null references public.crops(id) on delete restrict,
  sort_order integer not null default 0,
  primary key(user_id,crop_id)
);
create table public.profile_links (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  url text not null check(url ~ '^https?://' and char_length(url)<=2000),
  sort_order integer not null default 0,
  primary key(user_id,url)
);
alter table public.profile_details enable row level security;
alter table public.affiliation_options enable row level security;
alter table public.profile_affiliations enable row level security;
alter table public.profile_crops enable row level security;
alter table public.profile_links enable row level security;
grant select on public.profile_details,public.affiliation_options,public.profile_affiliations,public.profile_crops,public.profile_links to anon,authenticated;
grant all on public.profile_details,public.affiliation_options,public.profile_affiliations,public.profile_crops,public.profile_links to service_role;
create policy profile_details_read on public.profile_details for select using(true);
create policy affiliation_options_read on public.affiliation_options for select using(true);
create policy profile_affiliations_read on public.profile_affiliations for select using(true);
create policy profile_crops_read on public.profile_crops for select using(true);
create policy profile_links_read on public.profile_links for select using(true);

create or replace view public.public_profiles
with(security_invoker=false,security_barrier=true) as
select p.user_id,p.handle,p.avatar_url,p.created_at,p.standpoint,p.prefecture_code,
  coalesce(d.bio,'') as bio,
  case when d.city_public then c.city else null end as city
from public.profiles p
left join public.profile_details d on d.user_id=p.user_id
left join public.profile_contact_details c on c.user_id=p.user_id;

-- 本人のプロフィールだけを一括更新する。配列を別々に保存して半端な状態を残さない。
create function public.save_profile_details(
  p_handle text,p_bio text,p_city_public boolean,p_affiliations text[],p_crop_ids uuid[],p_links text[]
) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or not app.can_use_general_features() then raise exception 'forbidden' using errcode='42501'; end if;
  if char_length(btrim(p_handle)) not between 1 and 30 or char_length(p_bio)>2000
    or cardinality(p_affiliations)>20 or cardinality(p_crop_ids)>50 or cardinality(p_links)>10
  then raise exception 'invalid profile' using errcode='22023'; end if;
  update public.profiles set handle=btrim(p_handle) where user_id=uid;
  if not found then raise exception 'profile not found'; end if;
  insert into public.profile_details(user_id,bio,city_public) values(uid,p_bio,p_city_public)
    on conflict(user_id) do update set bio=excluded.bio,city_public=excluded.city_public;
  delete from public.profile_affiliations where user_id=uid;
  insert into public.profile_affiliations(user_id,name,sort_order)
    select uid,btrim(value),min(ord)::int from unnest(p_affiliations) with ordinality t(value,ord) group by btrim(value);
  delete from public.profile_crops where user_id=uid;
  insert into public.profile_crops(user_id,crop_id,sort_order)
    select uid,value,min(ord)::int from unnest(p_crop_ids) with ordinality t(value,ord) group by value;
  delete from public.profile_links where user_id=uid;
  insert into public.profile_links(user_id,url,sort_order)
    select uid,btrim(value),min(ord)::int from unnest(p_links) with ordinality t(value,ord) group by btrim(value);
end;
$$;
revoke all on function public.save_profile_details(text,text,boolean,text[],uuid[],text[]) from public,anon;
grant execute on function public.save_profile_details(text,text,boolean,text[],uuid[],text[]) to authenticated;

-- 登録完了メールは確認済みの本人へ1回だけ送る。未送信は再試行できる。
create table public.registration_notifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sent_at timestamptz,
  claimed_at timestamptz
);
alter table public.registration_notifications enable row level security;
revoke all on public.registration_notifications from anon,authenticated;
grant all on public.registration_notifications to service_role;

-- この機能の導入後に登録した会員だけを送信対象にする。
create function app.queue_registration_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.registration_notifications(user_id) values(new.user_id);
  return new;
end;
$$;
create trigger queue_registration_notification after insert on public.profiles
for each row execute function app.queue_registration_notification();

-- 旧マスタを参照する投稿を保ったまま、現行の選択肢を限定する。
alter table public.crops add column is_active boolean not null default true;
alter table public.crop_groups add column is_active boolean not null default true;

-- 保存者・投稿者の識別情報を返さず、公開資材の件数だけを返す。
create function public.catalog_material_counts()
returns table(material_id uuid,report_count bigint,saved_count bigint)
language sql stable security definer set search_path='' as $$
  select m.id,
    (select count(*) from public.usage_reports r where r.material_id=m.id and r.status='published'),
    (select count(*) from public.saved_materials s where s.material_id=m.id)
  from public.materials m where m.publication_status='published';
$$;
revoke all on function public.catalog_material_counts() from public;
grant execute on function public.catalog_material_counts() to anon,authenticated,service_role;
