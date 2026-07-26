-- =============================================================================
-- v2 スキーマ 2/8: 分類マスタ（作物・タグ）と資材2層構造
-- 正: docs/rebuild/01-domain-model.md §3「資材（2層構造）」「分類（Farmille 所有）」
-- =============================================================================
-- profile_crops（profiles × crops）は crops より後に作る必要があるため、
-- アカウント系ではなく本ファイルに置く。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 作物マスタ
-- -----------------------------------------------------------------------------

create table public.crop_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.crop_groups is '作物群（かんきつ類・なす科果菜類 等）。Farmille 所有のマスタ。';

create table public.crops (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.crop_groups (id) on delete restrict,
  name text not null unique,
  aliases text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.crops is '作物マスタ。aliases は表記ゆれ辞書（検索の正規化に使う）。';

create index crops_group_id_idx on public.crops (group_id);

create table public.profile_crops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  crop_id uuid not null references public.crops (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_crops_unique unique (user_id, crop_id)
);

comment on table public.profile_crops is '一般ユーザーの主な作目（m2m）。';

create index profile_crops_crop_id_idx on public.profile_crops (crop_id);

-- -----------------------------------------------------------------------------
-- タグ（Farmille 所有）
-- メーカー名・製品名の検索候補はタグではなく materials/seller_accounts から
-- 動的生成するため、category に maker/name は持たない（01 §3）。
-- -----------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null
    constraint tags_category_check
    check (category in ('crop', 'concern', 'effect', 'condition', 'type')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_category_name_unique unique (category, name)
);

comment on table public.tags is
  'タグ（Farmille 所有の分類・検索層）。メーカー名・製品名はタグにしない（01 §3）。';

-- -----------------------------------------------------------------------------
-- materials（2層構造）
--   分類・検索層: name / manufacturer_name / product_type / jbsa_class /
--                 sales_status / material_tags → Farmille のみ編集可
--   一次情報層  : description / general_use / ingredients / mechanism /
--                 usage_text / price_range / official_url / catalog_url
--                 → claim 済み出品者が編集可
-- カラム単位の権限は rls_policies migration のトリガーで強制する。
-- -----------------------------------------------------------------------------

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  -- 分類・検索層
  name text not null,
  manufacturer_name text not null,
  product_type text,
  jbsa_class text,
  sales_status text,
  -- 一次情報層
  description text,
  general_use text,
  ingredients text,
  mechanism text,
  usage_text text,
  price_range text,
  official_url text,
  catalog_url text,
  -- 状態
  seller_id uuid references public.seller_accounts (id) on delete set null,
  -- 集計（reviews トリガーで更新）
  review_count integer not null default 0
    constraint materials_review_count_non_negative check (review_count >= 0),
  avg_rating numeric(3, 2)
    constraint materials_avg_rating_range check (avg_rating between 1 and 5),
  control_plot_ratio numeric(4, 3)
    constraint materials_control_plot_ratio_range check (control_plot_ratio between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_name_manufacturer_unique unique (name, manufacturer_name)
);

comment on table public.materials is
  '資材（情報の倉庫）。分類・検索層は Farmille 所有、一次情報層は claim 済み出品者が編集する（01 §3）。';
comment on column public.materials.manufacturer_name is
  'マスタ由来の表示名。未 claim でも表示する（分類・検索層）。';
comment on column public.materials.seller_id is
  'NULL＝未 claim。値あり＝claim 済み（「メーカー確認済み」バッジの条件）。';
comment on column public.materials.review_count is
  'published レビュー件数。reviews のトリガーで更新する非正規化カラム。';
comment on column public.materials.avg_rating is
  'published レビューの平均評価。レビュー 0 件のときは NULL。';
comment on column public.materials.control_plot_ratio is
  '対照区ありレビュー率（確からしさ指標）。published レビュー 0 件のときは NULL。';

create index materials_seller_id_idx on public.materials (seller_id);
create index materials_manufacturer_name_idx on public.materials (manufacturer_name);

create table public.material_tags (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_tags_unique unique (material_id, tag_id)
);

create index material_tags_tag_id_idx on public.material_tags (tag_id);

create table public.material_images (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  url text not null,
  image_type text
    constraint material_images_image_type_check
    check (image_type in ('package', 'logo', 'usage_scene', 'other')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index material_images_material_id_idx on public.material_images (material_id, sort_order);

create table public.material_evidences (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  evidence_type text not null
    constraint material_evidences_evidence_type_check
    check (evidence_type in ('sds', 'paper', 'trial', 'leaflet')),
  title text not null,
  file_url text,
  external_url text,
  meta jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_evidences_url_required
    check (file_url is not null or external_url is not null)
);

comment on table public.material_evidences is
  'SDS・論文・試験・チラシ。一次情報層のため claim 済み出品者と admin が編集できる。';

create index material_evidences_material_id_idx on public.material_evidences (material_id, sort_order);

create table public.material_sources (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  source_url text not null,
  source_type text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.material_sources is
  '出典（公式製品ページ・公式 PDF・SDS 等）。現行 product_sources の思想を引き継ぐ。';

create index material_sources_material_id_idx on public.material_sources (material_id);

create table public.material_edit_requests (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  seller_id uuid not null references public.seller_accounts (id) on delete cascade,
  request_text text not null,
  status text not null default 'open'
    constraint material_edit_requests_status_check
    check (status in ('open', 'done', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.material_edit_requests is
  '分類変更申請。出品者が起票し admin が処理する（分類・検索層は Farmille 所有のため）。';

create index material_edit_requests_material_id_idx on public.material_edit_requests (material_id);
create index material_edit_requests_seller_id_idx on public.material_edit_requests (seller_id);
create index material_edit_requests_status_idx on public.material_edit_requests (status);

select app.sync_updated_at_triggers();
