-- Phase 19: farmer_profiles に表示名 / 自己紹介 / アバター URL を追加。
-- DOA 注記:
--   - 1:1 付帯情報なので新テーブル分離はせず、ALTER ADD COLUMN (NULL 許容) で追加。
--   - CHECK 制約で長さを業務ルール化 (Pydantic 側のバリデーションと二重防御)。
--   - public 公開プロフページ用のフィールド (`username` / `*_public` 等) は
--     spec §13 で明示的に対象外。本 phase では追加しない。
-- 参照: docs/specs/farmer-profile.md §4.1

ALTER TABLE farmer_profiles
  ADD COLUMN display_name text
    CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 50),
  ADD COLUMN bio          text
    CHECK (bio IS NULL OR length(bio) <= 500),
  ADD COLUMN avatar_url   text
    CHECK (avatar_url IS NULL OR length(avatar_url) <= 2000),
  ADD COLUMN updated_at   timestamptz NOT NULL DEFAULT now();

-- 既存の update_updated_at() (init.sql §updated_at 自動更新トリガー) を再利用。
-- spec の "set_updated_at" 表記はリポジトリ慣用名 update_updated_at に合わせる。
CREATE TRIGGER trg_farmer_profiles_updated_at
  BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
