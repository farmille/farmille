-- =============================================================================
-- メーカー資材情報の承認フローと、資材単位のメーカー確認状態
-- 正: docs/rebuild/08-material-governance-ooui.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 公開資材の状態・競合検知・メーカー確認状態
-- -----------------------------------------------------------------------------

alter table public.materials
  add column publication_status text not null default 'published'
    constraint materials_publication_status_check
    check (publication_status in ('published', 'archived')),
  add column archived_at timestamptz,
  add column content_revision integer not null default 1
    constraint materials_content_revision_positive check (content_revision > 0),
  add column manufacturer_verified_at timestamptz,
  add column manufacturer_verified_by_seller_id uuid
    references public.seller_accounts (id) on delete restrict,
  add column manufacturer_verification_method text
    constraint materials_manufacturer_verification_method_check
    check (
      manufacturer_verification_method in (
        'confirmed_existing',
        'submitted_create',
        'submitted_update'
      )
    ),
  add constraint materials_archive_state_consistent check (
    (publication_status = 'published' and archived_at is null)
    or (publication_status = 'archived' and archived_at is not null)
  ),
  add constraint materials_manufacturer_verification_consistent check (
    (
      manufacturer_verified_at is null
      and manufacturer_verified_by_seller_id is null
      and manufacturer_verification_method is null
    )
    or (
      manufacturer_verified_at is not null
      and manufacturer_verified_by_seller_id is not null
      and manufacturer_verification_method is not null
      and seller_id = manufacturer_verified_by_seller_id
    )
  );

create index materials_publication_status_idx
  on public.materials (publication_status, created_at desc);

comment on column public.materials.seller_id is
  '運用主体となる出品者との claim。メーカー確認済み表示の条件には使わない。';
comment on column public.materials.publication_status is
  'published＝一覧・検索・新規投稿の対象、archived＝掲載終了。履歴保全のため行は削除しない。';
comment on column public.materials.content_revision is
  '公開内容の競合検知用リビジョン。運営の直接編集または申請承認で増加する。';
comment on column public.materials.manufacturer_verified_at is
  'メーカーが公開中の資材情報との関係を明示した日時。内容承認日時とは分離する。';

-- 以後、メーカーは公開行を直接 UPDATE しない。すべて申請スナップショット経由にする。
drop policy materials_update_seller on public.materials;

drop policy material_images_insert_owner on public.material_images;
drop policy material_images_update_owner on public.material_images;
drop policy material_images_delete_owner on public.material_images;
create policy material_images_insert_admin on public.material_images
  for insert to authenticated with check (app.is_admin_writer());
create policy material_images_update_admin on public.material_images
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy material_images_delete_admin on public.material_images
  for delete to authenticated using (app.is_admin_writer());

drop policy material_evidences_insert_owner on public.material_evidences;
drop policy material_evidences_update_owner on public.material_evidences;
drop policy material_evidences_delete_owner on public.material_evidences;
create policy material_evidences_insert_admin on public.material_evidences
  for insert to authenticated with check (app.is_admin_writer());
create policy material_evidences_update_admin on public.material_evidences
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy material_evidences_delete_admin on public.material_evidences
  for delete to authenticated using (app.is_admin_writer());

drop policy material_sources_insert_owner on public.material_sources;
drop policy material_sources_update_owner on public.material_sources;
drop policy material_sources_delete_owner on public.material_sources;
create policy material_sources_insert_admin on public.material_sources
  for insert to authenticated with check (app.is_admin_writer());
create policy material_sources_update_admin on public.material_sources
  for update to authenticated
  using (app.is_admin_writer()) with check (app.is_admin_writer());
create policy material_sources_delete_admin on public.material_sources
  for delete to authenticated using (app.is_admin_writer());

drop trigger enforce_material_column_scope on public.materials;
create trigger enforce_material_column_scope
  before update on public.materials
  for each row
  execute function app.enforce_protected_columns(
    '{id,name,manufacturer_name,sales_status,composition_type_id,seller_id,publication_status,archived_at,content_revision,manufacturer_verified_at,manufacturer_verified_by_seller_id,manufacturer_verification_method,review_count,avg_rating,control_plot_ratio,created_at}'
  );

-- -----------------------------------------------------------------------------
-- 2. 変更申請（公開行から独立した正規化スナップショット）
-- -----------------------------------------------------------------------------

create table public.material_change_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts (id) on delete restrict,
  material_id uuid references public.materials (id) on delete restrict,
  result_material_id uuid references public.materials (id) on delete restrict,
  change_type text not null
    constraint material_change_requests_change_type_check
    check (change_type in ('create', 'update', 'archive')),
  status text not null default 'pending'
    constraint material_change_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reason text,
  base_content_revision integer,
  submitted_at timestamptz not null default now(),
  reviewed_by_user_id uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_requests_target_consistent check (
    (change_type = 'create' and material_id is null and base_content_revision is null)
    or (
      change_type in ('update', 'archive')
      and material_id is not null
      and base_content_revision is not null
    )
  ),
  constraint material_change_requests_review_consistent check (
    (status in ('pending', 'cancelled') and reviewed_at is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null)
  )
);

create unique index material_change_requests_one_pending_per_material_idx
  on public.material_change_requests (material_id)
  where status = 'pending' and material_id is not null;
create index material_change_requests_seller_idx
  on public.material_change_requests (seller_id, created_at desc);
create index material_change_requests_status_idx
  on public.material_change_requests (status, created_at desc);

comment on table public.material_change_requests is
  'メーカーによる資材の登録・変更・掲載終了申請。公開中の materials とは承認まで分離する。';

create table public.material_change_request_details (
  request_id uuid primary key
    references public.material_change_requests (id) on delete cascade,
  name text not null constraint material_change_request_details_name_not_blank
    check (btrim(name) <> ''),
  manufacturer_name text not null
    constraint material_change_request_details_manufacturer_not_blank
    check (btrim(manufacturer_name) <> ''),
  composition_type_id uuid references public.composition_types (id) on delete restrict,
  sales_status text,
  description text,
  general_use text,
  main_components text,
  mechanism text,
  usage_text text,
  price_range text,
  official_url text,
  catalog_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.material_change_request_crops (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_change_requests (id) on delete cascade,
  crop_id uuid not null references public.crops (id) on delete restrict,
  source_name text not null constraint material_change_request_crops_source_not_blank
    check (btrim(source_name) <> ''),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_request_crops_unique unique (request_id, crop_id)
);

create table public.material_change_request_effects (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_change_requests (id) on delete cascade,
  effect_id uuid not null references public.effects (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_request_effects_unique unique (request_id, effect_id)
);

create table public.material_change_request_ingredient_categories (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_change_requests (id) on delete cascade,
  ingredient_category_id uuid not null
    references public.ingredient_categories (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_request_ingredient_categories_unique
    unique (request_id, ingredient_category_id)
);

create table public.material_change_request_ingredients (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_change_requests (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_request_ingredients_unique unique (request_id, ingredient_id)
);

create table public.material_change_request_product_types (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_change_requests (id) on delete cascade,
  product_type_id uuid not null references public.product_types (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_request_product_types_unique unique (request_id, product_type_id)
);

create table public.material_change_request_search_tags (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_change_requests (id) on delete cascade,
  search_tag_id uuid not null references public.search_tags (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_request_search_tags_unique unique (request_id, search_tag_id)
);

create table public.material_change_request_evidences (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_change_requests (id) on delete cascade,
  source_evidence_id uuid references public.material_evidences (id) on delete set null,
  evidence_type text not null
    constraint material_change_request_evidences_type_check
    check (evidence_type in ('sds', 'paper', 'trial', 'leaflet')),
  title text not null constraint material_change_request_evidences_title_not_blank
    check (btrim(title) <> ''),
  file_url text,
  external_url text,
  meta jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_change_request_evidences_url_required
    check (file_url is not null or external_url is not null),
  constraint material_change_request_evidences_source_unique
    unique nulls not distinct (request_id, source_evidence_id)
);

-- -----------------------------------------------------------------------------
-- 3. 旧分類変更申請を新しいスナップショットへ移行
-- -----------------------------------------------------------------------------

insert into public.material_change_requests (
  id,
  seller_id,
  material_id,
  result_material_id,
  change_type,
  status,
  reason,
  base_content_revision,
  submitted_at,
  reviewed_at,
  review_note,
  created_at,
  updated_at
)
select
  requests.id,
  requests.seller_id,
  requests.material_id,
  case when requests.status = 'done' then requests.material_id else null end,
  'update',
  case requests.status
    when 'open' then 'pending'
    when 'done' then 'approved'
    else 'rejected'
  end,
  requests.request_text,
  materials.content_revision,
  requests.created_at,
  case when requests.status = 'open' then null else requests.updated_at end,
  '旧分類変更申請から移行',
  requests.created_at,
  requests.updated_at
from public.material_edit_requests requests
join public.materials materials on materials.id = requests.material_id;

insert into public.material_change_request_details (
  request_id,
  name,
  manufacturer_name,
  composition_type_id,
  sales_status,
  description,
  general_use,
  main_components,
  mechanism,
  usage_text,
  price_range,
  official_url,
  catalog_url,
  created_at,
  updated_at
)
select
  requests.id,
  materials.name,
  materials.manufacturer_name,
  materials.composition_type_id,
  materials.sales_status,
  materials.description,
  materials.general_use,
  materials.main_components,
  materials.mechanism,
  materials.usage_text,
  materials.price_range,
  materials.official_url,
  materials.catalog_url,
  requests.created_at,
  requests.updated_at
from public.material_edit_requests requests
join public.materials materials on materials.id = requests.material_id;

insert into public.material_change_request_crops
  (request_id, crop_id, source_name, sort_order)
select requests.id, relations.crop_id, relations.source_name, relations.sort_order
from public.material_edit_requests requests
join public.material_crops relations on relations.material_id = requests.material_id;

insert into public.material_change_request_effects (request_id, effect_id)
select requests.id, relations.effect_id
from public.material_edit_requests requests
join public.material_effects relations on relations.material_id = requests.material_id;

insert into public.material_change_request_ingredient_categories
  (request_id, ingredient_category_id)
select requests.id, relations.ingredient_category_id
from public.material_edit_requests requests
join public.material_ingredient_categories relations
  on relations.material_id = requests.material_id;

insert into public.material_change_request_ingredients (request_id, ingredient_id)
select requests.id, relations.ingredient_id
from public.material_edit_requests requests
join public.material_ingredients relations on relations.material_id = requests.material_id;

insert into public.material_change_request_product_types (request_id, product_type_id)
select requests.id, relations.product_type_id
from public.material_edit_requests requests
join public.material_product_types relations on relations.material_id = requests.material_id;

insert into public.material_change_request_search_tags (request_id, search_tag_id)
select requests.id, relations.search_tag_id
from public.material_edit_requests requests
join public.material_search_tags relations on relations.material_id = requests.material_id;

insert into public.material_change_request_evidences (
  request_id,
  source_evidence_id,
  evidence_type,
  title,
  file_url,
  external_url,
  meta,
  sort_order
)
select
  requests.id,
  evidences.id,
  evidences.evidence_type,
  evidences.title,
  evidences.file_url,
  evidences.external_url,
  evidences.meta,
  evidences.sort_order
from public.material_edit_requests requests
join public.material_evidences evidences on evidences.material_id = requests.material_id;

with first_contact as (
  select distinct on (requests.material_id)
    requests.material_id,
    requests.seller_id,
    requests.created_at
  from public.material_edit_requests requests
  join public.materials materials
    on materials.id = requests.material_id
   and materials.seller_id = requests.seller_id
  order by requests.material_id, requests.created_at
)
update public.materials materials
set manufacturer_verified_at = first_contact.created_at,
    manufacturer_verified_by_seller_id = first_contact.seller_id,
    manufacturer_verification_method = 'submitted_update'
from first_contact
where materials.id = first_contact.material_id;

drop table public.material_edit_requests;

-- -----------------------------------------------------------------------------
-- 4. 申請スナップショットの内部ヘルパー
-- -----------------------------------------------------------------------------

create or replace function app.snapshot_material_change_request(
  p_request_id uuid,
  p_material_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.material_change_request_details (
    request_id,
    name,
    manufacturer_name,
    composition_type_id,
    sales_status,
    description,
    general_use,
    main_components,
    mechanism,
    usage_text,
    price_range,
    official_url,
    catalog_url
  )
  select
    p_request_id,
    name,
    manufacturer_name,
    composition_type_id,
    sales_status,
    description,
    general_use,
    main_components,
    mechanism,
    usage_text,
    price_range,
    official_url,
    catalog_url
  from public.materials
  where id = p_material_id;

  insert into public.material_change_request_crops
    (request_id, crop_id, source_name, sort_order)
  select p_request_id, crop_id, source_name, sort_order
  from public.material_crops
  where material_id = p_material_id;

  insert into public.material_change_request_effects (request_id, effect_id)
  select p_request_id, effect_id
  from public.material_effects
  where material_id = p_material_id;

  insert into public.material_change_request_ingredient_categories
    (request_id, ingredient_category_id)
  select p_request_id, ingredient_category_id
  from public.material_ingredient_categories
  where material_id = p_material_id;

  insert into public.material_change_request_ingredients (request_id, ingredient_id)
  select p_request_id, ingredient_id
  from public.material_ingredients
  where material_id = p_material_id;

  insert into public.material_change_request_product_types (request_id, product_type_id)
  select p_request_id, product_type_id
  from public.material_product_types
  where material_id = p_material_id;

  insert into public.material_change_request_search_tags (request_id, search_tag_id)
  select p_request_id, search_tag_id
  from public.material_search_tags
  where material_id = p_material_id;

  insert into public.material_change_request_evidences (
    request_id,
    source_evidence_id,
    evidence_type,
    title,
    file_url,
    external_url,
    meta,
    sort_order
  )
  select
    p_request_id,
    id,
    evidence_type,
    title,
    file_url,
    external_url,
    meta,
    sort_order
  from public.material_evidences
  where material_id = p_material_id;
end;
$$;

create or replace function app.start_owned_material_change_request(
  p_material_id uuid,
  p_change_type text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_revision integer;
  v_seller_id uuid := app.seller_id();
begin
  if not app.is_seller() then
    raise exception '出品者ログインが必要です' using errcode = '42501';
  end if;

  if p_change_type not in ('update', 'archive') then
    raise exception '変更種別が正しくありません' using errcode = '22023';
  end if;

  select content_revision
  into v_revision
  from public.materials
  where id = p_material_id
    and seller_id = v_seller_id
  for update;

  if not found then
    raise exception '自社資材が見つかりません' using errcode = 'P0002';
  end if;

  insert into public.material_change_requests (
    seller_id,
    material_id,
    change_type,
    reason,
    base_content_revision
  ) values (
    v_seller_id,
    p_material_id,
    p_change_type,
    nullif(btrim(p_reason), ''),
    v_revision
  )
  returning id into v_request_id;

  perform app.snapshot_material_change_request(v_request_id, p_material_id);

  update public.materials
  set manufacturer_verified_at = coalesce(manufacturer_verified_at, now()),
      manufacturer_verified_by_seller_id = v_seller_id,
      manufacturer_verification_method = case
        when manufacturer_verified_at is null then 'submitted_update'
        else manufacturer_verification_method
      end
  where id = p_material_id;

  return v_request_id;
end;
$$;

create or replace function app.replace_material_change_request_classifications(
  p_request_id uuid,
  p_crop_ids uuid[],
  p_effect_ids uuid[],
  p_ingredient_category_ids uuid[],
  p_ingredient_ids uuid[],
  p_product_type_ids uuid[],
  p_search_tag_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.material_change_request_crops where request_id = p_request_id;
  delete from public.material_change_request_effects where request_id = p_request_id;
  delete from public.material_change_request_ingredient_categories
    where request_id = p_request_id;
  delete from public.material_change_request_ingredients where request_id = p_request_id;
  delete from public.material_change_request_product_types where request_id = p_request_id;
  delete from public.material_change_request_search_tags where request_id = p_request_id;

  insert into public.material_change_request_crops
    (request_id, crop_id, source_name, sort_order)
  select
    p_request_id,
    ids.id,
    (select crops.name from public.crops where crops.id = ids.id),
    ids.first_order - 1
  from (
    select id, min(ordinality)::integer as first_order
    from unnest(coalesce(p_crop_ids, '{}'::uuid[])) with ordinality as input (id, ordinality)
    group by id
  ) ids;

  insert into public.material_change_request_effects (request_id, effect_id)
  select p_request_id, id
  from unnest(coalesce(p_effect_ids, '{}'::uuid[])) as ids (id)
  on conflict (request_id, effect_id) do nothing;

  insert into public.material_change_request_ingredient_categories
    (request_id, ingredient_category_id)
  select p_request_id, id
  from unnest(coalesce(p_ingredient_category_ids, '{}'::uuid[])) as ids (id)
  on conflict (request_id, ingredient_category_id) do nothing;

  insert into public.material_change_request_ingredients (request_id, ingredient_id)
  select p_request_id, id
  from unnest(coalesce(p_ingredient_ids, '{}'::uuid[])) as ids (id)
  on conflict (request_id, ingredient_id) do nothing;

  insert into public.material_change_request_product_types (request_id, product_type_id)
  select p_request_id, id
  from unnest(coalesce(p_product_type_ids, '{}'::uuid[])) as ids (id)
  on conflict (request_id, product_type_id) do nothing;

  insert into public.material_change_request_search_tags (request_id, search_tag_id)
  select p_request_id, id
  from unnest(coalesce(p_search_tag_ids, '{}'::uuid[])) as ids (id)
  on conflict (request_id, search_tag_id) do nothing;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. メーカー向け RPC
-- -----------------------------------------------------------------------------

create or replace function public.submit_material_create_request(
  p_name text,
  p_composition_type_id uuid,
  p_sales_status text,
  p_description text,
  p_general_use text,
  p_main_components text,
  p_mechanism text,
  p_usage_text text,
  p_price_range text,
  p_official_url text,
  p_catalog_url text,
  p_crop_ids uuid[],
  p_effect_ids uuid[],
  p_ingredient_category_ids uuid[],
  p_ingredient_ids uuid[],
  p_product_type_ids uuid[],
  p_search_tag_ids uuid[],
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_seller_id uuid := app.seller_id();
  v_manufacturer_name text;
begin
  if not app.is_seller() then
    raise exception '出品者ログインが必要です' using errcode = '42501';
  end if;

  select official_name
  into v_manufacturer_name
  from public.seller_accounts
  where id = v_seller_id and status = 'approved';

  if not found then
    raise exception '承認済み出品者ではありません' using errcode = '42501';
  end if;

  insert into public.material_change_requests (
    seller_id,
    change_type,
    reason
  ) values (
    v_seller_id,
    'create',
    nullif(btrim(p_reason), '')
  )
  returning id into v_request_id;

  insert into public.material_change_request_details (
    request_id,
    name,
    manufacturer_name,
    composition_type_id,
    sales_status,
    description,
    general_use,
    main_components,
    mechanism,
    usage_text,
    price_range,
    official_url,
    catalog_url
  ) values (
    v_request_id,
    btrim(p_name),
    v_manufacturer_name,
    p_composition_type_id,
    nullif(btrim(p_sales_status), ''),
    nullif(btrim(p_description), ''),
    nullif(btrim(p_general_use), ''),
    nullif(btrim(p_main_components), ''),
    nullif(btrim(p_mechanism), ''),
    nullif(btrim(p_usage_text), ''),
    nullif(btrim(p_price_range), ''),
    nullif(btrim(p_official_url), ''),
    nullif(btrim(p_catalog_url), '')
  );

  perform app.replace_material_change_request_classifications(
    v_request_id,
    p_crop_ids,
    p_effect_ids,
    p_ingredient_category_ids,
    p_ingredient_ids,
    p_product_type_ids,
    p_search_tag_ids
  );

  return v_request_id;
end;
$$;

create or replace function public.submit_material_update_request(
  p_material_id uuid,
  p_name text,
  p_composition_type_id uuid,
  p_sales_status text,
  p_description text,
  p_general_use text,
  p_main_components text,
  p_mechanism text,
  p_usage_text text,
  p_price_range text,
  p_official_url text,
  p_catalog_url text,
  p_crop_ids uuid[],
  p_effect_ids uuid[],
  p_ingredient_category_ids uuid[],
  p_ingredient_ids uuid[],
  p_product_type_ids uuid[],
  p_search_tag_ids uuid[],
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  v_request_id := app.start_owned_material_change_request(
    p_material_id,
    'update',
    p_reason
  );

  update public.material_change_request_details
  set name = btrim(p_name),
      composition_type_id = p_composition_type_id,
      sales_status = nullif(btrim(p_sales_status), ''),
      description = nullif(btrim(p_description), ''),
      general_use = nullif(btrim(p_general_use), ''),
      main_components = nullif(btrim(p_main_components), ''),
      mechanism = nullif(btrim(p_mechanism), ''),
      usage_text = nullif(btrim(p_usage_text), ''),
      price_range = nullif(btrim(p_price_range), ''),
      official_url = nullif(btrim(p_official_url), ''),
      catalog_url = nullif(btrim(p_catalog_url), '')
  where request_id = v_request_id;

  perform app.replace_material_change_request_classifications(
    v_request_id,
    p_crop_ids,
    p_effect_ids,
    p_ingredient_category_ids,
    p_ingredient_ids,
    p_product_type_ids,
    p_search_tag_ids
  );

  return v_request_id;
end;
$$;

create or replace function public.submit_material_archive_request(
  p_material_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(btrim(p_reason), '') is null then
    raise exception '掲載終了理由を入力してください' using errcode = '23514';
  end if;

  return app.start_owned_material_change_request(p_material_id, 'archive', p_reason);
end;
$$;

create or replace function public.submit_material_evidence_add_request(
  p_material_id uuid,
  p_evidence_type text,
  p_title text,
  p_file_url text,
  p_external_url text,
  p_meta jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_sort_order integer;
begin
  v_request_id := app.start_owned_material_change_request(
    p_material_id,
    'update',
    'エビデンスの追加'
  );

  select coalesce(max(sort_order), -1) + 1
  into v_sort_order
  from public.material_change_request_evidences
  where request_id = v_request_id;

  insert into public.material_change_request_evidences (
    request_id,
    evidence_type,
    title,
    file_url,
    external_url,
    meta,
    sort_order
  ) values (
    v_request_id,
    p_evidence_type,
    btrim(p_title),
    nullif(btrim(p_file_url), ''),
    nullif(btrim(p_external_url), ''),
    p_meta,
    v_sort_order
  );

  return v_request_id;
end;
$$;

create or replace function public.submit_material_evidence_remove_request(
  p_material_id uuid,
  p_evidence_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  v_request_id := app.start_owned_material_change_request(
    p_material_id,
    'update',
    'エビデンスの削除'
  );

  delete from public.material_change_request_evidences
  where request_id = v_request_id
    and source_evidence_id = p_evidence_id;

  if not found then
    raise exception '削除対象のエビデンスが見つかりません' using errcode = 'P0002';
  end if;

  return v_request_id;
end;
$$;

create or replace function public.confirm_material_information(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller_id uuid := app.seller_id();
begin
  if not app.is_seller() then
    raise exception '出品者ログインが必要です' using errcode = '42501';
  end if;

  update public.materials
  set manufacturer_verified_at = now(),
      manufacturer_verified_by_seller_id = v_seller_id,
      manufacturer_verification_method = 'confirmed_existing'
  where id = p_material_id
    and seller_id = v_seller_id;

  if not found then
    raise exception '自社資材が見つかりません' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.cancel_material_change_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_seller() then
    raise exception '出品者ログインが必要です' using errcode = '42501';
  end if;

  update public.material_change_requests
  set status = 'cancelled'
  where id = p_request_id
    and seller_id = app.seller_id()
    and status = 'pending';

  if not found then
    raise exception '取消可能な申請が見つかりません' using errcode = 'P0002';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. 運営向け承認・却下 RPC（service_role からのみ実行）
-- -----------------------------------------------------------------------------

create or replace function public.approve_material_change_request(
  p_request_id uuid,
  p_reviewed_by_user_id uuid,
  p_review_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.material_change_requests%rowtype;
  v_detail public.material_change_request_details%rowtype;
  v_material_id uuid;
  v_current_revision integer;
begin
  select * into v_request
  from public.material_change_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception '申請が見つかりません' using errcode = 'P0002';
  end if;
  if v_request.status <> 'pending' then
    raise exception '申請は処理済みです' using errcode = '23505';
  end if;

  select * into strict v_detail
  from public.material_change_request_details
  where request_id = p_request_id;

  if v_request.change_type = 'create' then
    insert into public.materials (
      name,
      manufacturer_name,
      composition_type_id,
      sales_status,
      description,
      general_use,
      main_components,
      mechanism,
      usage_text,
      price_range,
      official_url,
      catalog_url,
      seller_id,
      manufacturer_verified_at,
      manufacturer_verified_by_seller_id,
      manufacturer_verification_method
    ) values (
      v_detail.name,
      v_detail.manufacturer_name,
      v_detail.composition_type_id,
      v_detail.sales_status,
      v_detail.description,
      v_detail.general_use,
      v_detail.main_components,
      v_detail.mechanism,
      v_detail.usage_text,
      v_detail.price_range,
      v_detail.official_url,
      v_detail.catalog_url,
      v_request.seller_id,
      v_request.submitted_at,
      v_request.seller_id,
      'submitted_create'
    )
    returning id into v_material_id;
  else
    select content_revision into v_current_revision
    from public.materials
    where id = v_request.material_id
    for update;

    if not found then
      raise exception '対象資材が見つかりません' using errcode = 'P0002';
    end if;
    if v_current_revision <> v_request.base_content_revision then
      raise exception '申請後に公開内容が更新されています' using errcode = '40001';
    end if;

    v_material_id := v_request.material_id;

    if v_request.change_type = 'archive' then
      update public.materials
      set publication_status = 'archived',
          archived_at = now(),
          content_revision = content_revision + 1
      where id = v_material_id;
    else
      update public.materials
      set name = v_detail.name,
          manufacturer_name = v_detail.manufacturer_name,
          composition_type_id = v_detail.composition_type_id,
          sales_status = v_detail.sales_status,
          description = v_detail.description,
          general_use = v_detail.general_use,
          main_components = v_detail.main_components,
          mechanism = v_detail.mechanism,
          usage_text = v_detail.usage_text,
          price_range = v_detail.price_range,
          official_url = v_detail.official_url,
          catalog_url = v_detail.catalog_url,
          content_revision = content_revision + 1
      where id = v_material_id;
    end if;
  end if;

  if v_request.change_type in ('create', 'update') then
    delete from public.material_crops where material_id = v_material_id;
    delete from public.material_effects where material_id = v_material_id;
    delete from public.material_ingredient_categories where material_id = v_material_id;
    delete from public.material_ingredients where material_id = v_material_id;
    delete from public.material_product_types where material_id = v_material_id;
    delete from public.material_search_tags where material_id = v_material_id;
    delete from public.material_evidences where material_id = v_material_id;

    insert into public.material_crops
      (material_id, crop_id, source_name, sort_order)
    select v_material_id, crop_id, source_name, sort_order
    from public.material_change_request_crops
    where request_id = p_request_id;

    insert into public.material_effects (material_id, effect_id)
    select v_material_id, effect_id
    from public.material_change_request_effects
    where request_id = p_request_id;

    insert into public.material_ingredient_categories
      (material_id, ingredient_category_id)
    select v_material_id, ingredient_category_id
    from public.material_change_request_ingredient_categories
    where request_id = p_request_id;

    insert into public.material_ingredients (material_id, ingredient_id)
    select v_material_id, ingredient_id
    from public.material_change_request_ingredients
    where request_id = p_request_id;

    insert into public.material_product_types (material_id, product_type_id)
    select v_material_id, product_type_id
    from public.material_change_request_product_types
    where request_id = p_request_id;

    insert into public.material_search_tags (material_id, search_tag_id)
    select v_material_id, search_tag_id
    from public.material_change_request_search_tags
    where request_id = p_request_id;

    insert into public.material_evidences (
      material_id,
      evidence_type,
      title,
      file_url,
      external_url,
      meta,
      sort_order
    )
    select
      v_material_id,
      evidence_type,
      title,
      file_url,
      external_url,
      meta,
      sort_order
    from public.material_change_request_evidences
    where request_id = p_request_id;
  end if;

  update public.material_change_requests
  set status = 'approved',
      result_material_id = v_material_id,
      reviewed_by_user_id = p_reviewed_by_user_id,
      reviewed_at = now(),
      review_note = nullif(btrim(p_review_note), '')
  where id = p_request_id;

  return v_material_id;
end;
$$;

create or replace function public.reject_material_change_request(
  p_request_id uuid,
  p_reviewed_by_user_id uuid,
  p_review_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(btrim(p_review_note), '') is null then
    raise exception '却下理由を入力してください' using errcode = '23514';
  end if;

  update public.material_change_requests
  set status = 'rejected',
      reviewed_by_user_id = p_reviewed_by_user_id,
      reviewed_at = now(),
      review_note = btrim(p_review_note)
  where id = p_request_id
    and status = 'pending';

  if not found then
    raise exception '未処理の申請が見つかりません' using errcode = 'P0002';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. 掲載終了資材への新規投稿をDBでも拒否
-- -----------------------------------------------------------------------------

create or replace function app.require_published_material_for_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.materials
    where id = new.material_id and publication_status = 'published'
  ) then
    raise exception '掲載終了した資材には新規投稿できません' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger reviews_require_published_material
  before insert on public.reviews
  for each row execute function app.require_published_material_for_post();

create trigger usage_reports_require_published_material
  before insert on public.usage_reports
  for each row execute function app.require_published_material_for_post();

-- -----------------------------------------------------------------------------
-- 8. RLS・GRANT
-- -----------------------------------------------------------------------------

alter table public.material_change_requests enable row level security;
alter table public.material_change_request_details enable row level security;
alter table public.material_change_request_crops enable row level security;
alter table public.material_change_request_effects enable row level security;
alter table public.material_change_request_ingredient_categories enable row level security;
alter table public.material_change_request_ingredients enable row level security;
alter table public.material_change_request_product_types enable row level security;
alter table public.material_change_request_search_tags enable row level security;
alter table public.material_change_request_evidences enable row level security;

create policy material_change_requests_select_own on public.material_change_requests
  for select to authenticated
  using (app.is_admin() or (app.is_seller() and seller_id = app.seller_id()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'material_change_request_details',
    'material_change_request_crops',
    'material_change_request_effects',
    'material_change_request_ingredient_categories',
    'material_change_request_ingredients',
    'material_change_request_product_types',
    'material_change_request_search_tags',
    'material_change_request_evidences'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ('
      'exists (select 1 from public.material_change_requests requests '
      'where requests.id = request_id and ('
      'app.is_admin() or (app.is_seller() and requests.seller_id = app.seller_id())'
      ')))',
      table_name || '_select_own',
      table_name
    );
  end loop;
end;
$$;

grant select on
  public.material_change_requests,
  public.material_change_request_details,
  public.material_change_request_crops,
  public.material_change_request_effects,
  public.material_change_request_ingredient_categories,
  public.material_change_request_ingredients,
  public.material_change_request_product_types,
  public.material_change_request_search_tags,
  public.material_change_request_evidences
to authenticated;

grant select, insert, update, delete on
  public.material_change_requests,
  public.material_change_request_details,
  public.material_change_request_crops,
  public.material_change_request_effects,
  public.material_change_request_ingredient_categories,
  public.material_change_request_ingredients,
  public.material_change_request_product_types,
  public.material_change_request_search_tags,
  public.material_change_request_evidences
to service_role;

revoke all on function app.snapshot_material_change_request(uuid, uuid) from public;
revoke all on function app.start_owned_material_change_request(uuid, text, text) from public;
revoke all on function app.replace_material_change_request_classifications(
  uuid, uuid[], uuid[], uuid[], uuid[], uuid[], uuid[]
) from public;

revoke all on function public.submit_material_create_request(
  text, uuid, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) from public;
revoke all on function public.submit_material_update_request(
  uuid, text, uuid, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) from public;
revoke all on function public.submit_material_archive_request(uuid, text) from public;
revoke all on function public.submit_material_evidence_add_request(
  uuid, text, text, text, text, jsonb
) from public;
revoke all on function public.submit_material_evidence_remove_request(uuid, uuid) from public;
revoke all on function public.confirm_material_information(uuid) from public;
revoke all on function public.cancel_material_change_request(uuid) from public;
revoke all on function public.approve_material_change_request(uuid, uuid, text) from public;
revoke all on function public.reject_material_change_request(uuid, uuid, text) from public;

grant execute on function public.submit_material_create_request(
  text, uuid, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) to authenticated;
grant execute on function public.submit_material_update_request(
  uuid, text, uuid, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) to authenticated;
grant execute on function public.submit_material_archive_request(uuid, text) to authenticated;
grant execute on function public.submit_material_evidence_add_request(
  uuid, text, text, text, text, jsonb
) to authenticated;
grant execute on function public.submit_material_evidence_remove_request(uuid, uuid)
  to authenticated;
grant execute on function public.confirm_material_information(uuid) to authenticated;
grant execute on function public.cancel_material_change_request(uuid) to authenticated;
grant execute on function public.approve_material_change_request(uuid, uuid, text) to service_role;
grant execute on function public.reject_material_change_request(uuid, uuid, text) to service_role;

select app.sync_updated_at_triggers();
