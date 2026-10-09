create table public.container_types (
  id smallint primary key check (id between 0 and 10),
  name text not null unique check (btrim(name) <> '')
);
insert into public.container_types(id, name) values
  (0, 'その他'), (1, 'ポリタンク'), (2, '大袋'), (3, '段ボール箱'),
  (4, 'スタンドパウチ'), (5, 'ボトル'), (6, 'スパウトパウチ'),
  (7, 'ポリ袋'), (8, '角型ボトル'), (9, '平袋'), (10, '薄型の箱');

alter table public.materials
  add column official_name text check (char_length(btrim(official_name)) between 1 and 500),
  add column name_reading text check (char_length(btrim(name_reading)) between 1 and 500),
  add column container_type_id smallint references public.container_types(id) on delete restrict;

create table public.material_name_aliases (
  material_id uuid not null references public.materials(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 500),
  primary key(material_id, name)
);

alter table public.container_types enable row level security;
alter table public.material_name_aliases enable row level security;
revoke all on public.container_types, public.material_name_aliases from public, anon, authenticated;
grant select on public.container_types, public.material_name_aliases to anon, authenticated;
grant all on public.container_types, public.material_name_aliases to service_role;
create policy container_types_read on public.container_types for select using (true);
create policy material_name_aliases_read on public.material_name_aliases for select using (
  exists(select 1 from public.materials m where m.id = material_id)
);

create table public.catalog_import_runs (
  id uuid primary key,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  plan_sha256 text not null unique check (plan_sha256 ~ '^[0-9a-f]{64}$'),
  applied_at timestamptz not null default now()
);
create table public.catalog_import_baselines (
  material_id uuid not null references public.materials(id) on delete restrict,
  field_name text not null check (field_name in (
    'name', 'official_name', 'name_reading', 'manufacturer_name', 'container_type_id',
    'publication_status', 'main_components', 'aliases', 'links', 'crops', 'crop_groups',
    'effects', 'ingredient_categories', 'application_methods'
  )),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  run_id uuid not null references public.catalog_import_runs(id) on delete restrict,
  primary key(material_id, field_name)
);
alter table public.catalog_import_runs enable row level security;
alter table public.catalog_import_baselines enable row level security;
revoke all on public.catalog_import_runs, public.catalog_import_baselines from public, anon, authenticated;
grant all on public.catalog_import_runs, public.catalog_import_baselines to service_role;

alter table public.material_page_versions
  add column origin text not null default 'manufacturer' check (origin in ('manufacturer', 'catalog')),
  add column catalog_import_run_id uuid references public.catalog_import_runs(id) on delete restrict,
  alter column seller_id drop not null,
  alter column grant_id drop not null,
  add constraint material_page_versions_author_check check (
    (origin = 'manufacturer' and seller_id is not null and grant_id is not null and catalog_import_run_id is null)
    or (origin = 'catalog' and seller_id is null and grant_id is null
      and catalog_import_run_id is not null and status = 'published')
  );
create unique index material_page_catalog_run_unique
  on public.material_page_versions(material_id, catalog_import_run_id) where origin = 'catalog';

create or replace view public.public_material_page_versions as
  select v.id,v.material_id,v.description,v.main_components,v.mechanism,v.origin
  from public.material_page_versions v join public.materials m on m.published_page_version_id=v.id
  where m.publication_status='published';

create or replace function app.can_read_private_material_version(p_version_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select app.is_admin_writer() or exists(
    select 1 from public.material_page_versions v
    join public.materials m on m.id = v.material_id
    join public.material_editor_grants g on g.material_id = m.id
    join public.seller_accounts s on s.id = g.seller_id
    where v.id = p_version_id and app.is_seller() and g.seller_id = app.seller_id()
      and g.revoked_at is null and s.status = 'approved'
      and ((v.origin = 'manufacturer' and v.seller_id = g.seller_id and v.grant_id = g.id)
        or (v.origin = 'catalog' and m.published_page_version_id = v.id))
  );
$$;

create or replace function app.can_read_material_page_version(p_version_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select app.can_read_private_material_version(p_version_id) or exists(
    select 1 from public.materials m
    where m.published_page_version_id = p_version_id and m.publication_status = 'published'
  );
$$;

create or replace function app.assert_material_page_submission(p_version_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.material_page_versions where id=p_version_id and nullif(btrim(description),'') is null)
    or exists(select 1 from public.material_page_links where version_id=p_version_id and (
      group_name is null or nullif(btrim(title),'') is null or url !~ '^https?://[^[:space:]/?#]+'))
    or exists(select 1 from public.material_page_links where version_id=p_version_id group by btrim(url) having count(*)>1)
    or exists(select 1 from public.material_page_certifications where version_id=p_version_id and nullif(btrim(title),'') is null)
    or exists(select 1 from public.material_page_registrations where version_id=p_version_id and nullif(btrim(company_name),'') is null)
    or exists(select 1 from public.material_page_related_companies where version_id=p_version_id and nullif(btrim(company_name),'') is null)
    or exists(select 1 from public.material_page_related_companies where version_id=p_version_id group by btrim(company_name) having count(*)>1)
  then raise exception '製品説明・資料の分類とURL・登録事業者・関係会社を確認してください' using errcode='23514'; end if;
end;
$$;
