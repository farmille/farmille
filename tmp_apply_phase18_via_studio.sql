-- Phase 18: Supabase Studio 手動投入用の合本 SQL
-- supabase db push ではなく Studio の SQL Editor で実行する想定（Ryoga 手動）
-- 元ファイル:
--   supabase/migrations/20260502140000_phase18_home_curation_table.sql
--   supabase/migrations/20260502140001_phase18_home_curation_rls.sql

-- =========================================================
-- 1. featured_products / home_banners テーブル
-- =========================================================
CREATE TABLE featured_products (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order   int         NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  displayed_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

CREATE INDEX featured_products_product_id_idx
  ON featured_products (product_id);

CREATE INDEX featured_products_displayed_at_sort_order_idx
  ON featured_products (displayed_at DESC, sort_order ASC);

CREATE TABLE home_banners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  image_url    text        NOT NULL CHECK (length(image_url) BETWEEN 1 AND 2000),
  link_url     text        NOT NULL CHECK (length(link_url) BETWEEN 1 AND 2000),
  sort_order   int         NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  displayed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX home_banners_displayed_at_sort_order_idx
  ON home_banners (displayed_at DESC NULLS LAST, sort_order ASC)
  WHERE displayed_at IS NOT NULL;

-- =========================================================
-- 2. RLS: 公開 SELECT のみ。書き込みは service_role 経由のみ
-- =========================================================
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_products_select_all" ON featured_products
  FOR SELECT TO anon, authenticated
  USING (displayed_at <= now());

ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_banners_select_all" ON home_banners
  FOR SELECT TO anon, authenticated
  USING (displayed_at IS NOT NULL AND displayed_at <= now());

-- =========================================================
-- 3. Storage バケット
-- =========================================================
-- home-banners バケットは Supabase Studio の Storage 画面で手動作成:
--   - public read: ON
--   - file size limit: 5MB
--   - allowed MIME: image/jpeg, image/png, image/webp
-- 書き込みは service_role 経由のみ（フロント storage 直叩きはしない）
