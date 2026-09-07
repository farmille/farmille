-- ============================================================
-- 2026-05-27: ユーザー通報 + ソフト削除 (Phase B6/B2 仕上げ)
--
--   1. users.deleted_at   — admin によるソフト削除フラグ
--   2. products.deleted_at — admin による商品ソフト削除フラグ
--   3. user_reports table  — ユーザー対ユーザーの通報キュー
--
-- 設計判断:
--   - 削除は全部 soft (deleted_at timestamptz)。CASCADE による review/profile 喪失を回避
--   - 通報 status: pending → resolved / spam / dismissed
--   - 通報自体の削除はしない (監査ログとして保持、admin は status を進める)
--   - DOA: アンチパターン回避 — boolean ではなく nullable timestamptz / CHECK text
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 1. ソフト削除カラム
-- ─────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 削除済のみを引きたい時用 (運用想定: 件数監視 + 復元 UI)
CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON users(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_deleted_at
  ON products(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────
-- 2. user_reports table
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_reports (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id  uuid        REFERENCES users(id) ON DELETE SET NULL,
  target_user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason            text        NOT NULL
                                CHECK (reason IN ('spam','abuse','impersonation','inappropriate','other')),
  body              text        CHECK (body IS NULL OR length(body) BETWEEN 1 AND 2000),
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','resolved','spam','dismissed')),
  resolved_at       timestamptz,
  resolved_by       uuid        REFERENCES users(id) ON DELETE SET NULL,
  resolution_note   text        CHECK (resolution_note IS NULL OR length(resolution_note) BETWEEN 1 AND 2000),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_user_id IS NULL OR reporter_user_id <> target_user_id)
);

-- queue 表示用: status + 新着順
CREATE INDEX IF NOT EXISTS idx_user_reports_status_created
  ON user_reports(status, created_at DESC);

-- 「このユーザーへの未処理通報件数」用 (admin/users 行バッジ)
CREATE INDEX IF NOT EXISTS idx_user_reports_target_status
  ON user_reports(target_user_id, status);

-- 同じ reporter が同じ target に対して pending 通報を重複作成するのを防止
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_reports_one_pending_per_pair
  ON user_reports(reporter_user_id, target_user_id)
  WHERE status = 'pending' AND reporter_user_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────
--
-- BFF (service_role) が一義的に握る (admin role + AAL2 を pydantic guard で検証) が、
-- RLS を二重防御として有効化。直 supabase 触りでも勝手に通報を読めない。
-- ─────────────────────────────────────────────────────────

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- INSERT: ログイン済ユーザーが自身を reporter として 1 件作れる
CREATE POLICY "user_reports_insert_self" ON user_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reporter_user_id
    AND target_user_id <> auth.uid()
  );

-- SELECT: 自分が出した通報は読める + admin は全件読める
CREATE POLICY "user_reports_select_own_or_admin" ON user_reports
  FOR SELECT TO authenticated
  USING (
    auth.uid() = reporter_user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- UPDATE: admin のみ (status / resolved_at / resolved_by / resolution_note を進める)
CREATE POLICY "user_reports_update_admin" ON user_reports
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- DELETE は明示的に許可しない (監査ログ保持)

COMMENT ON TABLE user_reports IS
  'ユーザー対ユーザーの通報キュー。admin が resolve / spam / dismiss で進める。pending 重複は (reporter, target) で防止。BFF role+AAL2 ガード + RLS の二重防御';
