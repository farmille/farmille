-- Sprint 1 / ADR-0009 §2.1 / spec maker-approval-admin §4.2
-- users.status 列を追加する。
-- DOA 注記:
--   - enum 型ではなく CHECK 制約付き text を採用 (既存 users.role と同パターン)。
--   - 4 値で開始: pending_review / active / frozen / rejected。
--   - 既存ユーザーは DEFAULT 'active' で自動付与 (ADR-0009 §2.3、明示 backfill 不要)。
--   - 新規 maker のみ /v1/onboarding/maker 経由で pending_review に上書きされる。
-- アンチパターン回避: boolean フラグ列で表現せず CHECK 制約付き text を堅持 (spec §16.3)。
-- 部分 index で B1 ペンディング一覧クエリを最適化 (active が圧倒的多数の前提)。

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending_review','active','frozen','rejected'));

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status <> 'active';

COMMIT;
