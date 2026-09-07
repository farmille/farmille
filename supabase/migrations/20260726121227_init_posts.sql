-- =============================================================================
-- v2 スキーマ 3/8: 投稿（reviews・usage_reports とその子テーブル）
-- 正: docs/rebuild/01-domain-model.md §3「投稿」・§6「状態遷移」
-- =============================================================================
-- レビューと使用レポートは別テーブル（作成フォーム・表示・状態管理が異なる）。
-- レビューは即時公開（published / hidden のみ）、使用レポートは編集局
-- ワークフロー（draft → pending → published / declined）を持つ。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- reviews（軽量・星＋短文。即時公開）
-- -----------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  author_user_id uuid not null references public.profiles (user_id) on delete cascade,
  rating smallint not null
    constraint reviews_rating_range check (rating between 1 and 5),
  body text not null,
  crop_id uuid not null references public.crops (id) on delete restrict,
  has_control_plot boolean,
  purchase_channel text
    constraint reviews_purchase_channel_check
    check (purchase_channel in ('ja', 'home_center', 'ec', 'direct', 'other')),
  pesticide_ack boolean not null
    constraint reviews_pesticide_ack_required check (pesticide_ack),
  is_provided_sample boolean not null default false,
  status text not null default 'published'
    constraint reviews_status_check check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reviews is
  'レビュー（星＋短文）。即時公開が原則で、通報対応時に status を hidden にする（01 §3）。';
comment on column public.reviews.has_control_plot is
  '対照区の有無（任意）。materials.control_plot_ratio の分子になる確からしさ指標。';
comment on column public.reviews.purchase_channel is
  '購入場所。内部専用でカードには表示しない（D7・01 §7）。';
comment on column public.reviews.pesticide_ack is
  '農薬的効果を断定しない旨の同意。false では投稿できない（CHECK で強制）。';
comment on column public.reviews.is_provided_sample is
  '提供品フラグ（景表法対応の先行実装）。v1 の UI では常に false。';

create index reviews_material_id_idx on public.reviews (material_id, status, created_at desc);
create index reviews_author_user_id_idx on public.reviews (author_user_id, created_at desc);
create index reviews_crop_id_idx on public.reviews (crop_id);

create table public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index review_photos_review_id_idx on public.review_photos (review_id, sort_order);

-- -----------------------------------------------------------------------------
-- usage_reports（構造化長文・収穫調査・編集局ワークフロー）
-- observed_change / summary は 01 §3 のとおり NOT NULL。draft 保存でも値を
-- 入れる（空文字は許容）ため、フォーム側は未入力を空文字で送る。
-- -----------------------------------------------------------------------------

create table public.usage_reports (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  author_user_id uuid not null references public.profiles (user_id) on delete cascade,
  title text,
  status text not null default 'draft'
    constraint usage_reports_status_check
    check (status in ('draft', 'pending', 'published', 'declined')),
  crop_id uuid not null references public.crops (id) on delete restrict,
  purpose_tags text[] not null default '{}',
  purpose_note text,
  -- 環境
  prefecture_code smallint
    constraint usage_reports_prefecture_code_range check (prefecture_code between 1 and 47),
  field_name text,
  variety text,
  planting_date date,
  cultivation_type text,
  cultivation_tags text[] not null default '{}',
  growth_stage text,
  climate_note text,
  -- 内容
  observed_change text not null,
  negative_note text,
  summary text not null,
  pesticide_ack boolean not null
    constraint usage_reports_pesticide_ack_required check (pesticide_ack),
  is_provided_sample boolean not null default false,
  -- 編集局
  editor_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usage_reports_published_at_required
    check (status <> 'published' or published_at is not null)
);

comment on table public.usage_reports is
  '使用レポート。draft（本人編集）→ pending（編集局）→ published / declined（01 §6）。';
comment on column public.usage_reports.title is '編集局が整える見出し。投稿時は NULL でよい。';
comment on column public.usage_reports.editor_note is '編集局用の内部メモ。公開しない。';
comment on column public.usage_reports.pesticide_ack is
  '農薬的効果を断定しない旨の同意。false では投稿できない（CHECK で強制）。';

create index usage_reports_material_id_idx on public.usage_reports (material_id, status, published_at desc);
create index usage_reports_author_user_id_idx on public.usage_reports (author_user_id, created_at desc);
create index usage_reports_status_idx on public.usage_reports (status);
create index usage_reports_crop_id_idx on public.usage_reports (crop_id);

create table public.usage_report_applications (
  id uuid primary key default gen_random_uuid(),
  usage_report_id uuid not null references public.usage_reports (id) on delete cascade,
  applied_on date,
  method text,
  detail text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.usage_report_applications is '処理日・使用方法（複数回の施用を行で持つ）。';

create index usage_report_applications_report_idx
  on public.usage_report_applications (usage_report_id, sort_order);

create table public.usage_report_media (
  id uuid primary key default gen_random_uuid(),
  usage_report_id uuid not null references public.usage_reports (id) on delete cascade,
  media_type text not null
    constraint usage_report_media_media_type_check check (media_type in ('photo', 'video')),
  url text not null,
  caption text,
  placement text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.usage_report_media.placement is
  '記事内の配置（どのセクションに挿すか）。編集局が画像化したグラフもここに置く。';

create index usage_report_media_report_idx
  on public.usage_report_media (usage_report_id, sort_order);

create table public.usage_report_metrics (
  id uuid primary key default gen_random_uuid(),
  usage_report_id uuid not null references public.usage_reports (id) on delete cascade,
  metric_name text not null,
  treated_value numeric,
  untreated_value numeric,
  unit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.usage_report_metrics is
  '収穫調査の生数値。treated＝処理区、untreated＝対照区。グラフは表示時に生成する（01 §3）。';

create index usage_report_metrics_report_idx
  on public.usage_report_metrics (usage_report_id, sort_order);

select app.sync_updated_at_triggers();
