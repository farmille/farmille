-- Phase 19: avatars バケット用 Storage RLS。
--
-- 前提:
--   - `avatars` バケットは Supabase Studio で事前作成 (public read / 2MB /
--     image/jpeg, image/png, image/webp)。本 SQL では bucket は触らない。
--   - パス命名規約: {auth.uid}/avatar/{filename}
--     第 1 階層 = UID, 第 2 階層 = 'avatar' を RLS で強制し、
--     他人領域 / 別 path への混入を root で防ぐ (ADR-0003 同パターン)。
--   - INSERT は farmer ロール限定 (spec §1.4 / §13、ja_staff / researcher /
--     maker は本機能対象外で 403)。
--   - DELETE は owner 一致のみ (path 強制不要、UPDATE / INSERT 側で防御済)。
--
-- 参照:
--   - docs/specs/farmer-profile.md §4.3
--   - docs/decisions/0003-storage-rls-path-enforcement.md
--   - docs/decisions/0007-storage-rls-audit.md (本 phase で §1 監査表に追記)

CREATE POLICY "avatars_select_all" ON "storage"."objects"
  FOR SELECT TO "anon", "authenticated"
  USING ("bucket_id" = 'avatars');

CREATE POLICY "avatars_insert_farmer" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "bucket_id" = 'avatars'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'farmer'
    AND (storage.foldername("name"))[1] = (auth.uid())::text
    AND (storage.foldername("name"))[2] = 'avatar'
  );

CREATE POLICY "avatars_update_owner" ON "storage"."objects"
  FOR UPDATE TO "authenticated"
  USING ("bucket_id" = 'avatars' AND "owner" = auth.uid())
  WITH CHECK (
    "bucket_id" = 'avatars'
    AND "owner" = auth.uid()
    AND (storage.foldername("name"))[1] = (auth.uid())::text
    AND (storage.foldername("name"))[2] = 'avatar'
  );

CREATE POLICY "avatars_delete_owner" ON "storage"."objects"
  FOR DELETE TO "authenticated"
  USING ("bucket_id" = 'avatars' AND "owner" = auth.uid());
