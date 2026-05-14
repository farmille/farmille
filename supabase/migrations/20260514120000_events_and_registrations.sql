-- Sprint 1: events + event_registrations (DOA + RLS 二層防御)
-- spec: docs/specs/events-v1.md §4.1 / §4.2 / §4.3 / §9 Sprint 1
-- ADR-0010: 講演会機能 v1 採用
--
-- Sprint 1 範囲: events / event_registrations の table + index + RLS。
-- maker_email_campaigns は Sprint 3 (別 migration)。
-- admin host_user_id の system user 設計は ADR-0009 完了後の別 SPEC。
-- 現時点では host_type CHECK で 'admin' を許容するのみ (INSERT policy は
-- 'maker' 限定で開始、admin INSERT は admin SPEC で追加)。

BEGIN;

-- ============================================================
-- events
-- ============================================================
CREATE TABLE events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id  uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  host_type     text        NOT NULL CHECK (host_type IN ('maker','admin')),
  title         text        NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body          text        NOT NULL CHECK (length(body) BETWEEN 1 AND 20000),
  venue         text        CHECK (venue IS NULL OR length(venue) BETWEEN 1 AND 200),
  online_url    text        CHECK (online_url IS NULL OR online_url ~ '^https?://'),
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  capacity      int         CHECK (capacity IS NULL OR capacity > 0),
  status        text        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','published','cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- 公開一覧の主クエリ: status='published' 行の starts_at 昇順
CREATE INDEX events_published_starts_at_idx
  ON events (starts_at)
  WHERE status = 'published';

-- maker dashboard 用: 自社 events を作成日降順 (Sprint 2 で利用)
CREATE INDEX events_host_user_id_created_at_idx
  ON events (host_user_id, created_at DESC);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- event_registrations
-- ============================================================
CREATE TABLE event_registrations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at  timestamptz NOT NULL DEFAULT now(),
  cancelled_at   timestamptz,
  UNIQUE (event_id, user_id)
);

-- SKILL §3.1: 中間テーブル 2 番目 FK の逆引き index 必須
CREATE INDEX event_registrations_user_id_idx
  ON event_registrations (user_id);

-- maker 「自社 event 申込者一覧」用 (Sprint 2)
CREATE INDEX event_registrations_event_id_registered_at_idx
  ON event_registrations (event_id, registered_at DESC);


-- ============================================================
-- RLS: events
-- ============================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 公開: status='published' は anon + authenticated に SELECT 可能
CREATE POLICY "events_select_published_all" ON events
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- host 本人は draft / cancelled も含めて自分 host 行を SELECT 可能
CREATE POLICY "events_select_host" ON events
  FOR SELECT TO authenticated
  USING (auth.uid() = host_user_id);

-- INSERT は maker のみ自分 host で。admin host_type の INSERT policy は
-- admin SPEC (ADR-0009 完了後) で追加する。
CREATE POLICY "events_insert_host" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = host_user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'maker'
    AND host_type = 'maker'
  );

-- 自分 host の events のみ UPDATE / DELETE
CREATE POLICY "events_update_host" ON events
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "events_delete_host" ON events
  FOR DELETE TO authenticated
  USING (auth.uid() = host_user_id);


-- ============================================================
-- RLS: event_registrations
-- ============================================================
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 自分の申込 OR 自社 event の host は SELECT 可能
CREATE POLICY "event_registrations_select_self_or_host" ON event_registrations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
        AND e.host_user_id = auth.uid()
    )
  );

-- reviewer 系ロールが自分の user_id で、かつ event が published のときのみ INSERT 可能
CREATE POLICY "event_registrations_insert_reviewer_self" ON event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('farmer','ja_staff','researcher')
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
        AND e.status = 'published'
    )
  );

-- 自分の申込のみ UPDATE 可能 (cancelled_at を立てる用途)
CREATE POLICY "event_registrations_update_self" ON event_registrations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分の申込のみ DELETE 可能 (v1 では cancel = UPDATE 運用、DELETE は予備)
CREATE POLICY "event_registrations_delete_self" ON event_registrations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
