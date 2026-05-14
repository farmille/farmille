-- Sprint 3: maker_email_campaigns (DOA + RLS 二層防御)
-- spec: docs/specs/events-v1.md §4.4 / §4.5 / §9 Sprint 3
-- ADR-0010: 講演会機能 v1 採用 / ADR-0011: 実送信は別 SPEC
--
-- Sprint 3 範囲: maker による一斉メールキャンペーンの下書き作成と
-- queue 遷移 (status='queued') まで。実送信は本 SPEC スコープ外。
-- segment_filter は jsonb だが、構造は Pydantic discriminated union で
-- BFF 側で厳格バリデーション (SPEC §10.9 アンチパターン #2 回避)。

BEGIN;

-- ============================================================
-- maker_email_campaigns
-- ============================================================
CREATE TABLE maker_email_campaigns (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_user_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject         text        NOT NULL CHECK (length(subject) BETWEEN 1 AND 200),
  body            text        NOT NULL CHECK (length(body) BETWEEN 1 AND 20000),
  segment_type    text        NOT NULL
                              CHECK (segment_type IN
                                ('favorite_followers','event_past_attendees','specific_users')),
  segment_filter  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','queued','sent','failed')),
  recipient_count int         NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  queued_at       timestamptz,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- maker dashboard 主クエリ: 自社 campaigns を作成日降順
CREATE INDEX maker_email_campaigns_maker_user_id_created_at_idx
  ON maker_email_campaigns (maker_user_id, created_at DESC);

-- 後続 worker (ADR-0011) の queue 走査用: queued / failed のみ部分 index
CREATE INDEX maker_email_campaigns_status_idx
  ON maker_email_campaigns (status)
  WHERE status IN ('queued','failed');

CREATE TRIGGER trg_maker_email_campaigns_updated_at
  BEFORE UPDATE ON maker_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- RLS: maker_email_campaigns
-- ============================================================
ALTER TABLE maker_email_campaigns ENABLE ROW LEVEL SECURITY;

-- 自社 campaign のみ SELECT 可能
CREATE POLICY "maker_email_campaigns_select_owner" ON maker_email_campaigns
  FOR SELECT TO authenticated
  USING (auth.uid() = maker_user_id);

-- maker ロールが自分 maker_user_id で INSERT 可能
CREATE POLICY "maker_email_campaigns_insert_maker_self" ON maker_email_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = maker_user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'maker'
  );

-- 自社 campaign のみ UPDATE 可能 (status 遷移は BFF 側で第一防御)
CREATE POLICY "maker_email_campaigns_update_owner" ON maker_email_campaigns
  FOR UPDATE TO authenticated
  USING (auth.uid() = maker_user_id)
  WITH CHECK (auth.uid() = maker_user_id);

-- 自社 campaign のみ DELETE 可能 (draft のみ削除可は BFF 側で第一防御)
CREATE POLICY "maker_email_campaigns_delete_owner" ON maker_email_campaigns
  FOR DELETE TO authenticated
  USING (auth.uid() = maker_user_id);

COMMIT;
