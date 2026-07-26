-- Phase 16: user_favorites の RLS（第二防御）
-- spec: docs/specs/my-materials.md §4.2
-- 第一防御は BFF (FastAPI /v1/me/favorites) の require_role()。

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 自分の行のみ閲覧可
CREATE POLICY "user_favorites_select_owner" ON user_favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT は reviewer 系ロールかつ自分の user_id のみ。
-- maker / unassigned は app_metadata.role が一致せず弾かれる。
CREATE POLICY "user_favorites_insert_reviewer_self" ON user_favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('farmer','ja_staff','researcher')
  );

-- UPDATE / DELETE は所有者のみ
CREATE POLICY "user_favorites_update_owner" ON user_favorites
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_delete_owner" ON user_favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
