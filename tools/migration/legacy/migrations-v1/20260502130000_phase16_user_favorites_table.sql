-- Phase 16: ユーザのお気に入り / 候補（kind で区別）
-- 同一 (user_id, product_id) は 1 行のみ（kind 切替で表現、お気に入りと
-- 候補に同時保持はしない業務ルール）
-- spec: docs/specs/my-materials.md §4.1
CREATE TABLE user_favorites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind        text        NOT NULL CHECK (kind IN ('favorite','candidate')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- SKILL §3.1: 中間テーブルの 2 番目 FK 逆引き index 必須
CREATE INDEX user_favorites_product_id_idx
  ON user_favorites (product_id);

-- 一覧表示は (user_id, kind, created_at DESC) で叩くため複合 index を追加
CREATE INDEX user_favorites_user_kind_created_at_idx
  ON user_favorites (user_id, kind, created_at DESC);

-- 既存 init.sql の関数 update_updated_at() を再利用（spec §4.1 の
-- set_updated_at は記述ミス。Phase 15 の articles 同様に update_updated_at を採用）
CREATE TRIGGER trg_user_favorites_updated_at
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
