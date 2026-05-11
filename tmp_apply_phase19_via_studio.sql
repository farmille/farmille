-- Phase 19 を Supabase Studio で手動適用するための統合 SQL。
-- supabase db push 禁止 (Ryoga が Studio 経由で適用する運用)。
-- 本ファイルは ryoga 適用用の作業ファイルで、本番 migration の正は
-- supabase/migrations/20260502150000_*.sql / 20260502150001_*.sql の 2 本。
--
-- 適用手順 (Ryoga が実行):
--   1. Supabase Studio → Storage → "avatars" バケットを作成
--      - public read = ON
--      - File size limit = 2 MB
--      - Allowed MIME types = image/jpeg, image/png, image/webp
--   2. Supabase Studio → SQL Editor → 本ファイル全体を貼り付けて実行
--   3. 適用後 `pnpm gen:types:dev` で型を再生成
--
-- 参照: docs/specs/farmer-profile.md §4

-- ============================================================
-- 1. farmer_profiles に display_name / bio / avatar_url / updated_at を追加
-- ============================================================

ALTER TABLE farmer_profiles
  ADD COLUMN display_name text
    CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 50),
  ADD COLUMN bio          text
    CHECK (bio IS NULL OR length(bio) <= 500),
  ADD COLUMN avatar_url   text
    CHECK (avatar_url IS NULL OR length(avatar_url) <= 2000),
  ADD COLUMN updated_at   timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER trg_farmer_profiles_updated_at
  BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. avatars バケット RLS (ADR-0003 同パターン)
-- ============================================================

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
