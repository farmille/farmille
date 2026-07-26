-- ============================================================
-- Spec: docs/specs/admin-aglist-alignment-v2.md §4.2 migration C
-- AgList alignment v2: product_images に Excel 由来の 6 列追加
-- ============================================================
--
-- image_type は CHECK 制約付き text 4 値（既存 users.status / users.role と
-- 同パターン）。is_primary は 1 product につき複数 true を v1 では DB 制約せず、
-- F4 投入 helper が「product あたり最大 1 件 primary」を保証する。
-- EXCLUDE / partial UNIQUE 化は v1.5+ で再検討。

ALTER TABLE product_images
  ADD COLUMN source_page_url text,
  ADD COLUMN alt_text        text,
  ADD COLUMN image_type      text CHECK (
    image_type IN ('product_packaging', 'product_logo', 'application_scene', 'other')
  ),
  ADD COLUMN is_primary      boolean NOT NULL DEFAULT false,
  ADD COLUMN rights_note     text,
  ADD COLUMN confidence      text;

-- F1 一覧のサムネ取得（is_primary=true）用 partial index
CREATE INDEX idx_product_images_primary
  ON product_images (product_id) WHERE is_primary = true;
