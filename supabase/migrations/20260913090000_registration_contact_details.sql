-- 公開プロフィールと非公開の登録連絡先を分離する。
alter table public.profiles add column prefecture_code smallint
  check (prefecture_code between 1 and 47);
alter table public.profiles drop constraint profiles_standpoint_check;
update public.profiles set standpoint = 'other' where standpoint = 'expert';
alter table public.profiles add constraint profiles_standpoint_check
  check (standpoint in ('farmer', 'ja', 'government', 'other'));

create table public.profile_contact_details (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  family_name text not null check (char_length(family_name) between 1 and 80),
  given_name text not null check (char_length(given_name) between 1 and 80),
  phone text check (phone ~ '^\+?[0-9 -]{10,20}$'),
  postal_code text not null check (postal_code ~ '^[0-9]{7}$'),
  city text not null check (char_length(city) between 1 and 100),
  terms_accepted_at timestamptz not null default now()
);
alter table public.profile_contact_details enable row level security;
revoke all on public.profile_contact_details from anon, authenticated;
grant select, insert, update, delete on public.profile_contact_details to service_role;
comment on table public.profile_contact_details is '登録時の非公開連絡先。サーバーのみが取り扱い、公開ビューには含めない。';

create or replace view public.public_profiles
with (security_invoker = false, security_barrier = true) as
select p.user_id, p.handle, p.avatar_url, p.created_at, p.standpoint, p.prefecture_code
from public.profiles p;
comment on column public.profiles.standpoint is '公開する立場。生産者、JA関係者、行政関係者、その他。';
comment on column public.profiles.prefecture_code is '公開する都道府県。未登録の既存アカウントはNULL。';

-- 申請時の連絡先は公開用のカラム権限・ビューに追加しない。
alter table public.seller_accounts
  add column corporate_number text check (corporate_number ~ '^[0-9]{13}$'),
  add column contact_phone text check (contact_phone ~ '^\+?[0-9 -]{10,20}$'),
  add column material_request_notes text check (char_length(material_request_notes) <= 2000),
  alter column location drop not null,
  alter column region_scope drop not null;
