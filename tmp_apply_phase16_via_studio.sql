-- =====================================================================
-- Phase 16: マイ資材 (お気に入り + 候補) を Supabase Studio で
-- 手動投入するための束ね SQL。Ryoga が Studio の SQL Editor で
-- そのまま貼り付けて実行する想定。
--
-- 内容:
--   1) supabase/migrations/20260502130000_phase16_user_favorites_table.sql
--   2) supabase/migrations/20260502130001_phase16_user_favorites_rls.sql
--
-- 前提:
--   - public.users / public.products テーブルが存在
--   - update_updated_at() 関数が存在 (init.sql で作成済み)
-- =====================================================================

-- ---- 1) table 定義 -----------------------------------------------------

CREATE TABLE user_favorites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind        text        NOT NULL CHECK (kind IN ('favorite','candidate')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX user_favorites_product_id_idx
  ON user_favorites (product_id);

CREATE INDEX user_favorites_user_kind_created_at_idx
  ON user_favorites (user_id, kind, created_at DESC);

CREATE TRIGGER trg_user_favorites_updated_at
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ---- 2) RLS ポリシー ---------------------------------------------------

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_favorites_select_owner" ON user_favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_favorites_insert_reviewer_self" ON user_favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('farmer','ja_staff','researcher')
  );

CREATE POLICY "user_favorites_update_owner" ON user_favorites
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_delete_owner" ON user_favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
