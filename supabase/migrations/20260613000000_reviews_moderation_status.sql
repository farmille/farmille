-- ════════════════════════════════════════════════════════════════════════
-- レビュー承認フロー (2026-06-13): reviews に承認ステータスを追加。
--
-- 背景 (奥田さん指示 / 6-15 定例):
--   レビュー投稿 → admin の「承認待ち一覧」に入る → admin が承認 → 公開ページに表示。
--   従来は投稿即時公開だった。これを pre-moderation 化する。
--
-- 設計 (DOA):
--   - status の DEFAULT は 'pending' (fail-closed: 新規 insert で status 未指定でも
--     公開されない)。新規レビューは backend(create_product_review)が明示的に
--     'pending' を入れる。admin 運営投稿のみ 'approved' を直接入れる。
--   - 既存レビュー(本番に公開済み多数)は backfill で 'approved' に揃え、可視性を維持する。
--     ※ この backfill を忘れると公開ページの既存レビューが全消失する (最大の地雷)。
--   - 公開フィードからの除外は BFF (service_role で RLS バイパス) の Python ゲートで行う
--     (products.list_product_reviews が status='approved' で絞る)。
--     reviews の RLS SELECT は据え置き — anon/authenticated の直接 read は BFF を
--     介さない別経路で、第二防御のまま変えない (変更は公開リードに無関係 + 事故リスク)。
--   - crops.status / user_reports.status と同じ語彙 (pending/approved/rejected) に揃える。
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE reviews
  ADD COLUMN status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  -- approved_by は user_reports.resolved_by に倣い FK + ON DELETE SET NULL。
  -- ⚠️ これで reviews→users の FK が user_id と 2 本になり、PostgREST の
  --    `users(...)` 埋め込みが曖昧になる。既存/新規の埋め込みは必ず
  --    `users!reviews_user_id_fkey(...)` と制約名でヒントする
  --    (backend: products.list_product_reviews / admin_reviews.list_admin_reviews)。
  ADD COLUMN approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN rejection_reason text;

-- 既存レビューは投稿時点で公開されていたため approved として backfill する。
-- (ADD COLUMN で全行が一旦 'pending' になっているのを全て 'approved' に戻す。
--  本 migration 適用後に入る新規レビューのみ pending = 承認待ちとなる)
UPDATE reviews SET status = 'approved' WHERE status = 'pending';

-- 承認待ちキュー (admin) と公開フィルタ (status='approved') の双方で使う。
CREATE INDEX idx_reviews_status ON reviews (status);
