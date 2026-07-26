-- ============================================================
-- Spec: docs/specs/admin-aglist-alignment-v2.md §4.2 migration A
-- AgList alignment v2: products に Excel 由来の 10 列追加 +
-- (name, maker_id) UNIQUE + (updated_at DESC, id DESC) ソート用 INDEX
-- ============================================================
--
-- DOA 不可逆領域。spec §4.2 通り、追加列は全て nullable text、
-- is_public のみ NOT NULL DEFAULT false（非公開デフォルト、Q3 整合）。
-- confidence は CHECK 制約をつけない（v1 では Excel 値をそのまま保存、
-- 品質バリデーションは v1.5+）。
--
-- 既存 dev データに (name, maker_id) 重複があれば、本 migration 適用前に
-- Supabase Studio で data fix が必要（spec §4.5）。
-- 検査 SQL:
--   SELECT name, maker_id, COUNT(*) FROM products
--   GROUP BY 1, 2 HAVING COUNT(*) > 1;

-- 1. products に Excel 由来 10 列追加
ALTER TABLE products
  ADD COLUMN product_name_jp           text,
  ADD COLUMN technology_action         text,
  ADD COLUMN disease_pest_info         text,
  ADD COLUMN expected_effects_official text,
  ADD COLUMN expected_effects_farmille text,
  ADD COLUMN usage_summary             text,
  ADD COLUMN precautions               text,
  ADD COLUMN storage_shelf_life        text,
  ADD COLUMN notes                     text,
  ADD COLUMN confidence                text,
  ADD COLUMN is_public                 boolean NOT NULL DEFAULT false;

-- 2. (name, maker_id) UNIQUE index（upsert key、spec §4.5）
CREATE UNIQUE INDEX idx_products_name_maker_unique
  ON products (name, maker_id);

-- 3. F1 一覧の安定ソート用 index（spec §3.1 / §4.2）
CREATE INDEX idx_products_updated_at_desc
  ON products (updated_at DESC, id DESC);

-- 注: is_public 用の partial index は v1 規模（181 件）では効果薄のため追加しない。
--     データが増えて F1 一覧の is_public フィルタが遅くなったら v1.5+ で再検討。
