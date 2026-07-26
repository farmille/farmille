-- ============================================================
-- Farmille v1 Storage RLS: product-images バケット
-- 作成日: 2026-04-23
-- 方針:
--   - 書き込み可ロール = maker のみ
--   - パスは "{auth.uid}/{何か}/{filename}" 2階層以上を強制
--   - 所有判定は owner = auth.uid() で行う
--   - MIME / サイズ上限はバケット設定側(Dashboard 手動)で制限
-- 参照: docs/specs/maker-product.md §3.1
-- ============================================================

CREATE POLICY "product_images_delete_owner" ON "storage"."objects"
  FOR DELETE TO "authenticated"
  USING ((("bucket_id" = 'product-images'::"text") AND ("owner" = "auth"."uid"())));

CREATE POLICY "product_images_insert_maker" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    ("bucket_id" = 'product-images'::"text")
    AND ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'maker'::"text")
    AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")
  );

CREATE POLICY "product_images_select_all" ON "storage"."objects"
  FOR SELECT TO "authenticated", "anon"
  USING (("bucket_id" = 'product-images'::"text"));

CREATE POLICY "product_images_update_owner" ON "storage"."objects"
  FOR UPDATE TO "authenticated"
  USING ((("bucket_id" = 'product-images'::"text") AND ("owner" = "auth"."uid"())))
  WITH CHECK (
    ("bucket_id" = 'product-images'::"text")
    AND ("owner" = "auth"."uid"())
    AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")
  );
