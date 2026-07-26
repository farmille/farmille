-- =============================================================================
-- v2 スキーマ 1/8: 共通基盤とアカウント（profiles・seller_accounts）
-- 正: docs/rebuild/01-domain-model.md §3「アカウント」・§4「認証設計」
-- =============================================================================
-- 共通基盤として内部スキーマ app を置く。
--   * JWT の app_metadata を直読みする権限判定関数（01 §5: 判定でテーブルを
--     JOIN しない）
--   * updated_at 自動更新トリガーと、その一括付与関数
-- app スキーマは PostgREST の公開スキーマ（config.toml の api.schemas）に
-- 含めないため REST/GraphQL からは呼べない。RLS ポリシー内部でのみ使う。
-- =============================================================================

create schema if not exists app;

comment on schema app is
  'Farmille v2 内部ヘルパー（JWT 権限判定・共通トリガー）。API 非公開。';

grant usage on schema app to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 権限判定関数（すべて JWT 直読み。stable・security invoker）
-- -----------------------------------------------------------------------------

create or replace function app.account_type()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'account_type', '');
$$;

comment on function app.account_type() is
  'JWT app_metadata.account_type（general / seller / admin）。未ログインは NULL。';

create or replace function app.seller_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'seller_id', '')::uuid;
$$;

comment on function app.seller_id() is
  'JWT app_metadata.seller_id。出品者の権限判定は必ず seller_id 経由で行う（01 §4）。';

create or replace function app.is_general()
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.account_type() = 'general';
$$;

create or replace function app.is_seller()
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.account_type() = 'seller' and app.seller_id() is not null;
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.account_type() = 'admin';
$$;

comment on function app.is_admin() is
  'admin 判定（読み取り用）。書き込み系は app.is_admin_writer() で AAL2 も要求する。';

create or replace function app.is_admin_writer()
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.account_type() = 'admin' and (auth.jwt() ->> 'aal') = 'aal2';
$$;

comment on function app.is_admin_writer() is
  'admin かつ AAL2（MFA 済み）。INSERT/UPDATE/DELETE ポリシーはこちらを使う（01 §4）。';

-- -----------------------------------------------------------------------------
-- updated_at 自動更新
-- -----------------------------------------------------------------------------

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- public スキーマの updated_at 列を持つ全テーブルへトリガーを付与する。
-- 各構造 migration の末尾で呼び、テーブルを手動列挙しない。
create or replace function app.sync_updated_at_triggers()
returns void
language plpgsql
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select c.oid::regclass as tbl
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_attribute a
      on a.attrelid = c.oid
     and a.attname = 'updated_at'
     and a.attnum > 0
     and not a.attisdropped
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not exists (
        select 1
        from pg_catalog.pg_trigger t
        where t.tgrelid = c.oid
          and t.tgname = 'set_updated_at'
          and not t.tgisinternal
      )
  loop
    execute format(
      'create trigger set_updated_at before update on %s'
      ' for each row execute function app.set_updated_at()',
      r.tbl
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles（一般ユーザー。auth.users と 1:1）
-- -----------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique
    constraint profiles_handle_length check (char_length(handle) between 1 and 30),
  prefecture_code smallint not null
    constraint profiles_prefecture_code_range check (prefecture_code between 1 and 47),
  prefecture_public boolean not null default true,
  standpoint text not null
    constraint profiles_standpoint_check
    check (standpoint in ('farmer', 'ja', 'maker_related', 'expert', 'other')),
  avatar_url text,
  bio text,
  cultivation_styles text[],
  affiliation text,
  website_url text,
  sns_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  '一般ユーザー（匿名・ハンドルネーム）。実テーブルの SELECT は本人のみ。公開情報は public_profiles ビュー経由（01 §5）。';
comment on column public.profiles.standpoint is
  '立場。内部専用でどの画面にも表示しない（信頼スコア・ステマ検知用。01 §3・§7）。';
comment on column public.profiles.prefecture_public is
  'false のとき都道府県を公開しない。public_profiles ビューが prefecture_code を NULL にして返す。';
comment on column public.profiles.affiliation is
  '所属団体名。プロフィール画面のみ表示し、投稿カードには出さない（D5）。';

-- -----------------------------------------------------------------------------
-- seller_accounts（出品者組織。申請〜承認〜運用を status で管理）
-- -----------------------------------------------------------------------------

create table public.seller_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  official_name text not null,
  seller_type text not null
    constraint seller_accounts_seller_type_check
    check (seller_type in ('maker', 'ja', 'farm_corp', 'expert', 'other')),
  login_id text not null unique
    constraint seller_accounts_login_id_format
    check (login_id ~ '^[a-z0-9][a-z0-9._-]{2,30}$'),
  contact_email text not null
    constraint seller_accounts_contact_email_format
    check (contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  contact_name text not null,
  location text not null,
  region_scope text not null,
  website_url text,
  logo_url text,
  profile_text text,
  status text not null default 'applied'
    constraint seller_accounts_status_check
    check (status in ('applied', 'approved', 'rejected', 'suspended')),
  approved_at timestamptz,
  invite_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_accounts_approved_at_required
    check (status <> 'approved' or approved_at is not null)
);

comment on table public.seller_accounts is
  '出品者組織。承認時に共有ログイン（合成メール {login_id}@sellers.farmille.internal）を発行して auth_user_id を紐付ける（01 §4）。';
comment on column public.seller_accounts.login_id is
  '合成メールのローカル部になるため小文字英数と . _ - のみ許可する。';
comment on column public.seller_accounts.contact_email is
  '内部専用。公開ビュー public_sellers から除外し、カラム権限でも anon/authenticated から剥奪する。';
comment on column public.seller_accounts.contact_name is
  '内部専用。contact_email と同じ扱い。';

create index seller_accounts_status_idx on public.seller_accounts (status);

select app.sync_updated_at_triggers();
