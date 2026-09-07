-- ============================================================
-- Admin Articles CMS: articles-hero バケット + Storage RLS
-- 作成日: 2026-06-02
-- ADR: docs/decisions/0014-articles-hero-storage.md
-- 方針 (ADR-0014 §2):
--   - public read バケット (記事 hero は公開コンテンツ)
--   - 書き込み = admin ロール + AAL2 のみ
--   - role 判定は app_metadata.role (Farmille の role 権威。spec の
--     `auth.jwt()->>'role'` は採用しない: ADR-0014 §2.2 参照)
--   - AAL2 判定は auth.jwt()->>'aal' = 'aal2' (ADR-0012 §2.2)
--   - path 規約 articles-hero/{article_id}/{uuid}.{ext} (RLS では階層強制せず
--     role + AAL2 のみで絞る。admin 3 名の共同所有のため owner=uid 強制はしない)
-- 参照: 20260423000000_product_images_storage_rls.sql /
--       20260502150001_phase19_avatars_storage_rls.sql
-- ============================================================

-- バケット作成 (宣言的、再適用安全)。
-- public read / 5MB / image/jpeg, image/png, image/webp。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'articles-hero',
  'articles-hero',
  true,
  5242880, -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 再適用安全のため既存ポリシーを drop してから作る (ADR-0007 §「今後の手順」)。
drop policy if exists "articles_hero_select_all" on "storage"."objects";
drop policy if exists "articles_hero_insert_admin" on "storage"."objects";
drop policy if exists "articles_hero_update_admin" on "storage"."objects";
drop policy if exists "articles_hero_delete_admin" on "storage"."objects";

-- SELECT: anon 含む全員 (public バケット)
create policy "articles_hero_select_all" on "storage"."objects"
  for select to "anon", "authenticated"
  using ("bucket_id" = 'articles-hero');

-- INSERT: admin ロール + AAL2 のみ
create policy "articles_hero_insert_admin" on "storage"."objects"
  for insert to "authenticated"
  with check (
    "bucket_id" = 'articles-hero'
    and ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    and ((auth.jwt() ->> 'aal') = 'aal2')
  );

-- UPDATE: admin ロール + AAL2 のみ
create policy "articles_hero_update_admin" on "storage"."objects"
  for update to "authenticated"
  using (
    "bucket_id" = 'articles-hero'
    and ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    and ((auth.jwt() ->> 'aal') = 'aal2')
  )
  with check (
    "bucket_id" = 'articles-hero'
    and ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    and ((auth.jwt() ->> 'aal') = 'aal2')
  );

-- DELETE: admin ロール + AAL2 のみ
create policy "articles_hero_delete_admin" on "storage"."objects"
  for delete to "authenticated"
  using (
    "bucket_id" = 'articles-hero'
    and ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    and ((auth.jwt() ->> 'aal') = 'aal2')
  );
