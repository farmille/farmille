-- ============================================================
-- Farmille v1 認証体系マスタの seed
-- 作成日: 2026-04-24
-- 方針:
--   - Phase 6 (2026-04-23) 時点で Ryoga が Supabase Studio SQL Editor
--     から手動投入していた 3 行を migration 化する
--   - 本番 farmille-prod プロジェクトへの migration 適用時に
--     自動投入されることを保証するのが主目的
--   - dev 環境には既に同名 3 行が存在するため ON CONFLICT (name)
--     DO NOTHING により idempotent にする
--   - id は dev と prod で揃える必要はない(外部キーは
--     product_certifications 中間テーブルのみ、環境ごとに独立)
-- 参照: docs/specs/image-edit-and-launch-ready.md §3.1
-- ============================================================

INSERT INTO certifications (id, name) VALUES
  (gen_random_uuid(), '有機JAS'),
  (gen_random_uuid(), 'JGAP'),
  (gen_random_uuid(), 'GLOBALG.A.P.')
ON CONFLICT (name) DO NOTHING;
