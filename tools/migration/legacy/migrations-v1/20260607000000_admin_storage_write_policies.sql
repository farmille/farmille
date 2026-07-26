-- ============================================================
-- admin の製品登録・レビュー投稿開放に伴う Storage RLS 追加
-- (2026-06-07 Ryoga 指示: admin はレビュー投稿と「Farmille として」の
--  製品登録の両方を行えるようにする)
--
-- 方針:
--   - 既存の insert policy (maker / reviewer 限定) はそのまま、admin 用を追加
--   - パス強制 "{auth.uid}/..." は既存と同一 (admin も自分の uid 配下へ upload)
--   - delete/update は owner ベースの既存 policy が admin にもそのまま効くため追加不要
--   - DB テーブル (products / reviews) への書き込みは BFF (service_role) 経由
--     のみで、第一防御は FastAPI の require_role("maker", "admin") /
--     require_role("farmer", "admin")。table RLS の変更は不要。
-- ============================================================

CREATE POLICY "product_images_insert_admin" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    ("bucket_id" = 'product-images'::"text")
    AND ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")
    AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")
  );

CREATE POLICY "review_images_insert_admin" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    ("bucket_id" = 'review-images'::"text")
    AND ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")
    AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")
  );
