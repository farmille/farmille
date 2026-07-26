-- ============================================================
-- Farmille v1 bugfix: reviews.product_id に ON DELETE CASCADE を付与
-- 作成日: 2026-04-24
-- 背景:
--   init.sql:250 で reviews.product_id REFERENCES products(id) の FK が
--   ON DELETE CASCADE なしで作成されていた。他の products 参照
--   中間テーブル (product_images / product_benefit_relations /
--   product_crops / product_certifications 等 9 テーブル) は全て
--   CASCADE 付きだが reviews のみ抜けていた。
--
--   結果、レビューが存在する資材を DELETE /v1/products/{id} で削除すると
--   FK 違反で 500 になる。Phase 9 spec §10.3 + Phase 10 UI 文言
--   「関連するレビュー・画像も削除されます」と整合する CASCADE に統一する。
--
-- 方針:
--   既存 constraint を DROP → CASCADE 付きで再作成。既存行データは影響なし。
-- ============================================================

ALTER TABLE reviews DROP CONSTRAINT reviews_product_id_fkey;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
