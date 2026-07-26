-- =============================================================================
-- v2 スキーマ 4/8: コレクション・リアクション・閲覧ログ・記事・通報
-- 正: docs/rebuild/01-domain-model.md §3「コレクション・リアクション」
--     「記事（Phase 1）」「通報・運営」・§7「信頼スコアのための初期フック」
-- =============================================================================
-- helpful_votes と view_events は個票（生ログ）で持つ。表示用の集計は
-- views_and_aggregates migration のビューで作り、算出式は Phase 2 まで
-- 実装しない（生データから再計算可能な形を保つ。01 §7）。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- saved_materials（検討リスト）
-- -----------------------------------------------------------------------------

create table public.saved_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_materials_unique unique (user_id, material_id)
);

comment on table public.saved_materials is '検討リスト（資材の保存）。本人しか読めない。';

create index saved_materials_material_id_idx on public.saved_materials (material_id);

-- -----------------------------------------------------------------------------
-- helpful_votes（参考になった。個票で保持する）
-- target は複数テーブルを指すため FK は張らない（polymorphic）。
-- 参照整合は第一防御（src/server）と削除時のアプリ処理で担保する。
-- -----------------------------------------------------------------------------

create table public.helpful_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  target_type text not null
    constraint helpful_votes_target_type_check
    check (target_type in ('review', 'usage_report', 'article', 'answer')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint helpful_votes_unique unique (user_id, target_type, target_id)
);

comment on table public.helpful_votes is
  '参考になったの個票（誰が押したか＝信頼スコアの材料）。表示用の件数は helpful_counts ビュー。';

create index helpful_votes_target_idx on public.helpful_votes (target_type, target_id);

-- -----------------------------------------------------------------------------
-- view_events（閲覧ログ。追記専用）
-- -----------------------------------------------------------------------------

create table public.view_events (
  id uuid primary key default gen_random_uuid(),
  target_type text not null
    constraint view_events_target_type_check
    check (target_type in ('material', 'review', 'usage_report', 'article')),
  target_id uuid not null,
  viewer_user_id uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.view_events is
  '閲覧の生ログ。追記専用（UPDATE/DELETE ポリシーを作らない）。表示用の閲覧数は日次集計ビュー経由で、使用レポートと記事のみ表示する（01 §3）。';

create index view_events_target_idx on public.view_events (target_type, target_id, created_at desc);

-- -----------------------------------------------------------------------------
-- articles（出品者の記事。Phase 1）
-- -----------------------------------------------------------------------------

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts (id) on delete cascade,
  title text not null,
  body text not null,
  hero_image_url text,
  status text not null default 'draft'
    constraint articles_status_check check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_published_at_required
    check (status <> 'published' or published_at is not null)
);

comment on table public.articles is '出品者が投稿する記事（body は Markdown）。他社資材にも紐づけできる。';

create index articles_seller_id_idx on public.articles (seller_id, status, published_at desc);

create table public.article_materials (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_materials_unique unique (article_id, material_id)
);

create index article_materials_material_id_idx on public.article_materials (material_id);

-- -----------------------------------------------------------------------------
-- content_reports（通報）
-- reporter は profiles を参照するため実質一般ユーザーのみが通報できる
-- （01 §2 の ER 図どおり）。resolved_by は admin の auth ユーザーで、
-- 業務上の権限判定には使わない監査用カラム。
-- -----------------------------------------------------------------------------

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles (user_id) on delete cascade,
  target_type text not null
    constraint content_reports_target_type_check
    check (target_type in ('review', 'usage_report', 'article', 'profile', 'material')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open'
    constraint content_reports_status_check check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_resolution_consistency
    check ((status = 'open') = (resolved_at is null))
);

comment on table public.content_reports is '通報。admin と通報者本人のみ SELECT できる。';

create index content_reports_status_idx on public.content_reports (status, created_at desc);
create index content_reports_target_idx on public.content_reports (target_type, target_id);
create index content_reports_reporter_idx on public.content_reports (reporter_user_id);

select app.sync_updated_at_triggers();
