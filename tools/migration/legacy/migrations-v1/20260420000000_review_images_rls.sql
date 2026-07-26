-- ============================================================
-- Farmille v1 Storage RLS: review-images バケット
-- 作成日: 2026-04-20
-- 方針:
--   - ロール判定は auth.jwt() -> 'app_metadata' ->> 'role' を信頼（DB RLS と同一）
--   - 書き込み可ロール = reviewer (farmer / ja_staff / researcher)
--   - パスは "{auth.uid}/{review_id}/{filename}" を強制
--   - MIME / サイズ上限はバケット設定側で制限（Dashboard手動設定済）
-- 出典: supabase db dump --linked --schema storage の出力を逐語採用
--       (リモート実態を Single Source of Truth とする方針のため)
-- 参照: docs/decisions/0003-storage-rls-path-enforcement.md
-- ============================================================

CREATE POLICY "review_images_delete_owner" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'review-images'::"text") AND ("owner" = "auth"."uid"())));

CREATE POLICY "review_images_insert_reviewer" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'review-images'::"text") AND ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['farmer'::"text", 'ja_staff'::"text", 'researcher'::"text"])) AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));

CREATE POLICY "review_images_select_all" ON "storage"."objects" FOR SELECT TO "authenticated", "anon" USING (("bucket_id" = 'review-images'::"text"));

CREATE POLICY "review_images_update_owner" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'review-images'::"text") AND ("owner" = "auth"."uid"()))) WITH CHECK ((("bucket_id" = 'review-images'::"text") AND ("owner" = "auth"."uid"()) AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));
