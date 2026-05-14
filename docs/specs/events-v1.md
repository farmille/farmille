# Farmille v1 講演会機能（events）仕様

**作成日**: 2026-05-14
**対象 Phase**: events-v1（maker 主導講演会 + メーカー一斉メール + admin 主催 events 骨組み）
**作業ブランチ**: `feat/events-v1`（仮）
**実装担当**: worker
**位置づけ**: メーカーがオフライン/オンライン講演会を Farmille 上で告知し、reviewer（farmer / ja_staff / researcher）が申込できる機能。併せてメーカーから「暗黙フォロワー（自社製品を `user_favorites` に保存しているユーザー）」「過去 events 申込者」「指定ユーザー」へ一斉メール送信のキャンペーン管理機能（DB レコード遷移まで、実送信はスコープ外）を提供する。admin 主催 events（運営告知 / 全体イベント）は ADR-0009 で導入予定の admin ロールに依存する領域で、本 SPEC では「データモデルが host_type='admin' を許容する」「`/admin/events/new` の骨組みを置く」までを含む

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` および ADR-0010 / ADR-0009 / ADR-0011 の以下に準拠する。

- **§1.1 DOA 優先**: `events` / `event_registrations` / `maker_email_campaigns` を第 3 正規形で設計。enum は CHECK 制約で固定（`host_type`, `events.status`, `maker_email_campaigns.status`, `maker_email_campaigns.segment_type`）。配信先 segment の動的条件は `segment_filter jsonb` に閉じ、配信時の確定リストは別途行展開し直す方針で UI 都合の DB 捻じ曲げを行わない（§4 #2 / #3 回避）。中間性のあるテーブル（`event_registrations`）の 2 番目 FK `user_id` に逆引き index を付ける（§3.1）。`events.host_user_id` が NULL になり得る運営主催枠は ADR-0009 admin 統合 phase で扱うため、本 SPEC では **`host_user_id` は NOT NULL** で開始し、host_type に応じて admin の system user を host にする（§10.2 参照）
- **§1.2 ポータビリティ予算**: Supabase Edge Functions 不使用。一斉メールの実送信は本 SPEC 範囲外（DB の `status='queued'` 遷移のみ）。`process.env.API_URL` で BFF 接続、`RAILWAY_*` 直参照なし。Next.js 16 破壊的変更（async Route Params 等）に対応するため Server Component 内 `params` は `await` し、`searchParams` も同様（frontend/CLAUDE.md 準拠）
- **§1.3 責務分離**: events / registrations / email campaigns / followed-makers すべての書き込みは FastAPI `/v1/events*` `/v1/maker/events*` `/v1/maker/emails*` `/v1/me/*` 経由。フロントから `supabase.from()` / `supabase.rpc()` を呼ばない。Storage / auth.* 直叩きは本 SPEC ではアバター・写真用途と異なるため不使用
- **§1.4 v1 スコープ厳守**: 「やる」: 公開 events 一覧 / 詳細 / 申込（reviewer 限定）, maker による CRUD と申込者一覧, メーカー一斉メールキャンペーンの **DB レコード作成と `status='queued'` 遷移まで**, `/me/followed-makers` の暗黙フォロワー集合返却。「やらない」: 実メール送信、CSV エクスポート、当日リマインダー、決済、カレンダー連携、ICS 配信、外部 SNS 共有、参加 QR、参加証 PDF、AI 自動推薦、満席時の繰り上げ待ち
- **§3.1 / §3.2 レビュー軸**: 全テーブル RLS 有効、NOT NULL / UNIQUE / FK / CHECK 制約、`/v1` プレフィックス、Pydantic バリデーション、統一エラー形式、GET 冪等

§10 で本 SPEC の境界（ADR-0009 admin 統合 phase との接続点、ADR-0011 実メール送信との接続点）を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達

- 未ログイン含む全ユーザーが `/events`（一覧）と `/events/[id]`（詳細）を閲覧できる（published のみ）
- reviewer（farmer / ja_staff / researcher）が `/events/[id]` から申込できる（POST）と取消できる（DELETE）
- maker が `/maker/events` で自社 events の CRUD（作成 / 編集 / 公開 / キャンセル）ができる
- maker が `/maker/events/[id]/registrations` で自社 events への申込者一覧を見られる
- maker が `/maker/emails` で一斉メールキャンペーンを下書き作成 → segment_type を指定 → `status='queued'` 送信予約までできる（**実送信 = メーラー API 連携は範囲外**）
- 暗黙フォロワー集合 `/v1/me/followed-makers` がリーディング可能、segment_type='favorite_followers' の配信先決定根拠として参照される
- admin 主催 events のデータ表現は `events.host_type = 'admin'` で許容、`/admin/events/new` フロント骨組みは置くが admin guard は ADR-0009 完了後に有効化

### 1.2 縮退ライン（落ちても v1.5 送り可）

- segment_type='specific_users' のユーザー指定 UI（ユーザー検索 + 複数選択）— 縮退時は `segment_filter` の jsonb を手書き貼り付けで耐える
- maker 申込者一覧の検索 / フィルタ — 縮退時は単純な作成日降順一覧のみ
- 一斉メールキャンペーンの配信予定件数プレビュー — 縮退時は送信予約後にバックエンドで確定

### 1.3 翌日送り（本 SPEC 対象外、ADR-0011 / 別 SPEC）

- 実メール送信実装（Resend / Supabase Auth Email / SendGrid 等の選定および統合）
- メール送信失敗時のリトライ / バウンス処理
- 一斉メールの配信完了率レポート
- 開封 / クリック計測
- DKIM / SPF / DMARC 等の送信ドメイン認証
- 法規制（特商法・電気通信事業法）対応の利用規約条項追記、未配信オプトアウト同意取得（biz / 規約 SPEC 側、A5）
- 実送信時のレート制限 / キュー基盤
- カレンダー連携 / ICS 配信 / リマインダー

---

## 2. 画面一覧

| パス | 種別 | データ源 | 認証 |
|---|---|---|---|
| `/events` | Server Component | BFF `GET /v1/events` | 不要 |
| `/events/[id]` | Server Component + 申込 Client | BFF `GET /v1/events/{id}` + `POST/DELETE /v1/events/{id}/register` | 閲覧不要 / 申込は reviewer 限定 |
| `/maker/events` | Server Component | BFF `GET /v1/maker/events` | maker 限定 |
| `/maker/events/new` | Server Component + 作成 Form Client | BFF `POST /v1/maker/events` | maker 限定 |
| `/maker/events/[id]/edit` | Server Component + 編集 Form Client | BFF `GET/PUT /v1/maker/events/{id}` | maker 限定（自社のみ） |
| `/maker/events/[id]/registrations` | Server Component | BFF `GET /v1/maker/events/{id}/registrations` | maker 限定（自社のみ） |
| `/maker/emails` | Server Component + 作成 Form Client | BFF `GET /v1/maker/emails/campaigns` + `POST /v1/maker/emails/campaigns` | maker 限定 |
| `/admin/events/new` | Server Component（骨組み） | TODO（ADR-0009 admin role 完了後） | admin 限定（本 SPEC では `notFound()` フォールバック） |

`/admin/events/new` は本 SPEC では「ファイルだけ置いて Server Component 内で常に `notFound()` を返す」骨組みとし、admin role が ADR-0009 で導入された後に別 SPEC（または ADR-0009 完了 SPEC）で実装本体を入れる。

---

## 3. データ書き込み方針（共通プリアンブル）

本 SPEC は `docs/specs/articles.md` §3 を踏襲する。差分のみここに記す。

### 3.1 BFF 命名規約（差分なし）

- **公開 GET**: `/v1/events`, `/v1/events/{id}`
- **本人スコープ**: `/v1/me/followed-makers`, `/v1/events/{id}/register`（POST / DELETE）
- **メーカー専用**: `/v1/maker/events*`, `/v1/maker/emails/*`
- **運営専用**: `/v1/admin/events*`（本 SPEC では未実装、URL 予約のみ）

### 3.2 認証境界

- `GET /v1/events` `GET /v1/events/{id}`: 未ログイン可
- `POST /v1/events/{id}/register` `DELETE /v1/events/{id}/register`: Bearer JWT 必須 + `role IN ('farmer','ja_staff','researcher')`、不一致 403
- `/v1/maker/*`: Bearer JWT 必須 + `role == 'maker'`、不一致 403
- `/v1/me/followed-makers`: Bearer JWT 必須（ロール非依存、maker 自身も自社製品の favorite が来る場合があるので role 不問で許可）
- `/v1/admin/*`: Bearer JWT 必須 + `role == 'admin'`（admin ロールは ADR-0009 で導入予定）。本 SPEC では route 自体を `main.py` で include しない or include してもハンドラ内で 503 を返す（§10.2）

### 3.3 統一エラー（差分なし、articles §3.3 と同じ JSON 形式）

主な `code`:
- `event_not_found` / `event_not_published` / `event_not_owner`
- `event_full`（capacity 到達）
- `already_registered` / `not_registered`
- `register_role_forbidden`
- `campaign_not_found` / `campaign_not_owner` / `campaign_already_queued`
- `invalid_segment_type` / `invalid_segment_filter`

### 3.4 RLS 命名規約（差分なし、articles §3.4 と同じ）

`{table}_{action}_{scope}` 形式。本 SPEC で追加する policy:
- `events_select_published_all` / `events_insert_host` / `events_update_host` / `events_delete_host`
- `event_registrations_select_self_or_host` / `event_registrations_insert_reviewer_self` / `event_registrations_update_self` / `event_registrations_delete_self`
- `maker_email_campaigns_select_owner` / `maker_email_campaigns_insert_maker_self` / `maker_email_campaigns_update_owner` / `maker_email_campaigns_delete_owner`

### 3.5 migration ファイル名

`YYYYMMDDHHMMSS_{機能}_{種別}.sql`。最新 prefix `20260502150001` の次として、本 SPEC で追加する migration は `20260514xxxxxx_*` 系。連番 4 本想定（events テーブル / events RLS / campaigns テーブル / campaigns RLS）。

### 3.6 フロントから Supabase 直叩きの禁止（差分なし）

`frontend/src` 配下で `supabase.from(` / `supabase.rpc(` の出現を 0 件で維持。auth.* / storage.* は本 SPEC で新たに使う箇所なし。

---

## 4. DB スキーマ変更

migration 4 本（events 本体 + events RLS + maker_email_campaigns 本体 + campaigns RLS）。既存テーブルへの ALTER は無し（DOA: 新テーブル追加で完結）。

### 4.1 events テーブル（migration: `20260514120000_events_table.sql`）

```sql
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

-- 公開一覧の主クエリ: status='published' AND starts_at >= now() を新しい順
CREATE INDEX events_published_starts_at_idx
  ON events (starts_at)
  WHERE status = 'published';

-- maker dashboard の主クエリ: 自社 events を作成日降順
CREATE INDEX events_host_user_id_created_at_idx
  ON events (host_user_id, created_at DESC);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

`host_user_id` の整合性ルール（DB CHECK では表現せず BFF 層で強制、§10.5 アンチパターン回避）:
- `host_type = 'maker'` のとき `host_user_id` は `users.role = 'maker'` を満たすユーザーであること
- `host_type = 'admin'` のとき `host_user_id` は `users.role = 'admin'` を満たすユーザーであること（admin ロール導入後）

DB trigger による自動検証は v1 では入れず、BFF の create / update 時に拒否する（§4 アンチパターン #6: RLS / DB を第一防御にしない）。

### 4.2 event_registrations テーブル（同 migration 末尾）

```sql
CREATE TABLE event_registrations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at  timestamptz NOT NULL DEFAULT now(),
  cancelled_at   timestamptz,
  UNIQUE (event_id, user_id)
);

-- SKILL §3.1: 2 番目 FK の逆引き index
CREATE INDEX event_registrations_user_id_idx
  ON event_registrations (user_id);

-- maker 側「自社 event の申込者一覧」用
CREATE INDEX event_registrations_event_id_registered_at_idx
  ON event_registrations (event_id, registered_at DESC);
```

cancel は **物理削除しない** で `cancelled_at` を立てる（履歴保持）。`active` な申込数のカウントは `WHERE cancelled_at IS NULL` で表現する。

### 4.3 events RLS（migration: `20260514120001_events_rls.sql`）

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 公開一覧: status='published' のみ anon + authenticated に見せる
CREATE POLICY "events_select_published_all" ON events
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- host 自身は自分の events を全 status で SELECT 可能（draft / cancelled 含む）
CREATE POLICY "events_select_host" ON events
  FOR SELECT TO authenticated
  USING (auth.uid() = host_user_id);

-- maker のみ自分 host で INSERT 可能（admin は ADR-0009 完了後に拡張）
CREATE POLICY "events_insert_host" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = host_user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'maker'
    AND host_type = 'maker'
  );

-- 自分 host の events のみ UPDATE / DELETE 可能
CREATE POLICY "events_update_host" ON events
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "events_delete_host" ON events
  FOR DELETE TO authenticated
  USING (auth.uid() = host_user_id);
```

```sql
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 自分の申込 OR 自社 event の host は申込全件を見られる
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

-- reviewer のみが自分の user_id で INSERT 可能、かつ event が published
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

-- 自分の申込のみ UPDATE 可能（cancelled_at 立てる用途）
CREATE POLICY "event_registrations_update_self" ON event_registrations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分の申込のみ DELETE 可能（v1 は cancel = UPDATE で運用、DELETE は使わない）
CREATE POLICY "event_registrations_delete_self" ON event_registrations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### 4.4 maker_email_campaigns テーブル（migration: `20260514120002_maker_email_campaigns_table.sql`）

```sql
CREATE TABLE maker_email_campaigns (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_user_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject         text        NOT NULL CHECK (length(subject) BETWEEN 1 AND 200),
  body            text        NOT NULL CHECK (length(body) BETWEEN 1 AND 50000),
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

CREATE INDEX maker_email_campaigns_maker_user_id_created_at_idx
  ON maker_email_campaigns (maker_user_id, created_at DESC);

CREATE INDEX maker_email_campaigns_status_idx
  ON maker_email_campaigns (status)
  WHERE status IN ('queued','failed');

CREATE TRIGGER trg_maker_email_campaigns_updated_at
  BEFORE UPDATE ON maker_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

`segment_filter` の jsonb スキーマ（バリデーションは Pydantic で BFF 層、DB CHECK では検査しない）:
- `segment_type='favorite_followers'`: `{}` 固定（自社製品を `user_favorites` に持つユーザー全員。追加の絞り込み列を持たない）
- `segment_type='event_past_attendees'`: `{"event_id": "uuid"}` 必須（特定 event の `cancelled_at IS NULL` 申込者）
- `segment_type='specific_users'`: `{"user_ids": ["uuid", ...]}` 必須、最大 1000 件

`recipient_count` は BFF 側 `queue` 操作時に確定して書く（v1 では送信時実体ではなく「予定件数」として扱う）。

### 4.5 maker_email_campaigns RLS（migration: `20260514120003_maker_email_campaigns_rls.sql`）

```sql
ALTER TABLE maker_email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maker_email_campaigns_select_owner" ON maker_email_campaigns
  FOR SELECT TO authenticated
  USING (auth.uid() = maker_user_id);

CREATE POLICY "maker_email_campaigns_insert_maker_self" ON maker_email_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = maker_user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'maker'
  );

CREATE POLICY "maker_email_campaigns_update_owner" ON maker_email_campaigns
  FOR UPDATE TO authenticated
  USING (auth.uid() = maker_user_id)
  WITH CHECK (auth.uid() = maker_user_id);

CREATE POLICY "maker_email_campaigns_delete_owner" ON maker_email_campaigns
  FOR DELETE TO authenticated
  USING (auth.uid() = maker_user_id);
```

### 4.6 暗黙フォローの集計クエリ（DDL なし、参照 SQL の確定）

新規テーブル不要。`user_favorites` → `products` → `users(role='maker')` を join して導出する。**メーカー側 user_id を `products.maker_id` で取る**（既存 init.sql §3 製品定義どおり）。

```sql
-- /v1/maker/emails/campaigns/{id}/send で segment_type='favorite_followers' のとき:
-- 「自分の製品を user_favorites に保存している reviewer ユーザー」の集合
-- kind は 'favorite' / 'candidate' どちらも対象とする（暗黙フォロー = 興味表明）。
-- v1.5+ で 'favorite' のみに絞る変更が要件化されたら BFF 側で WHERE kind = 'favorite' を追加。
SELECT DISTINCT uf.user_id
  FROM user_favorites uf
  JOIN products p ON p.id = uf.product_id
  JOIN users   u ON u.id = uf.user_id
 WHERE p.maker_id = :current_maker_user_id
   AND u.role IN ('farmer','ja_staff','researcher');

-- /v1/me/followed-makers
-- 自分が user_favorites で保存している製品の maker_id 集合 + 表示名
SELECT DISTINCT
       u.id          AS maker_user_id,
       COALESCE(mp.company_name, u.name) AS display_name
  FROM user_favorites uf
  JOIN products       p  ON p.id = uf.product_id
  JOIN users          u  ON u.id = p.maker_id
  LEFT JOIN maker_profiles mp ON mp.user_id = u.id
 WHERE uf.user_id = :current_user_id;

-- segment_type='event_past_attendees' のとき:
-- 自分が host の指定 event の非キャンセル申込者の user_id
SELECT er.user_id
  FROM event_registrations er
  JOIN events e ON e.id = er.event_id
 WHERE e.host_user_id = :current_maker_user_id
   AND e.id           = :segment_event_id
   AND er.cancelled_at IS NULL;
```

これらは BFF (Python supabase-py の RPC ではなく `admin.table(...).select(...)` の chain) で実装する想定。複雑 join は SQL ビューを切らず、supabase-py の埋め込み select 文字列で対応する（既存 `me_favorites.py` パターン踏襲）。

---

## 5. FastAPI エンドポイント

新規ルーター 3 本を追加する想定:
- `backend/app/routers/events.py`（公開 + reviewer 申込）
- `backend/app/routers/maker_events.py`（maker CRUD + registrations）
- `backend/app/routers/maker_emails.py`（campaigns CRUD + queue 遷移）
- `backend/app/routers/me_followed_makers.py`（暗黙フォロワー集合の本人取得 = `/v1/me/followed-makers`）

`backend/app/main.py` で `/v1` 配下に include。

### 5.1 公開 / 申込系

#### `GET /v1/events`

```
クエリ: status は固定で 'published' のみ（公開）。BFF 側で強制。
  limit:  int (1-50, default 20)
  offset: int (>= 0, default 0)
  upcoming_only: bool (default true → starts_at >= now() で絞る)
認証: 不要
Response 200:
  { "events": [{ id, title, host: {user_id, display_name, host_type},
                 starts_at, ends_at, venue, online_url, capacity, status,
                 active_registration_count }, ...] }
```

`active_registration_count` は `event_registrations` を `cancelled_at IS NULL` で集約。N+1 を避けるため supabase-py の埋め込み select で取得する（PostgREST の `event_registrations(count)` 形式は cancelled_at フィルタが組めない場合があるため、§10.4 のリスクとして明記）。

#### `GET /v1/events/{id}`

```
パス: id (uuid)
認証: 不要（だが status='published' のみ返す。draft / cancelled は host 自身でも本 endpoint 経由では 404）
Response 200:
  { id, title, body, host: {user_id, display_name, host_type, prefecture, city},
    venue, online_url, starts_at, ends_at, capacity, status,
    active_registration_count, is_full (capacity 到達かつ active_registration_count >= capacity) }
Response 404: { detail, code: event_not_found } または { code: event_not_published }
```

draft / cancelled な event を host 自身が編集前に見たい用途は `/v1/maker/events/{id}` を使う（§5.2.2）。

#### `POST /v1/events/{id}/register`

```
認証: Bearer JWT 必須 + role IN ('farmer','ja_staff','researcher')
Body: なし
Response 201: { ok: true, registration_id }
Response 403: register_role_forbidden
Response 404: event_not_found / event_not_published
Response 409: already_registered (UNIQUE 違反、UPDATE で cancelled_at=NULL の復活も同じく 409 ではなく 200 で扱うかは §10.6 で議論)
Response 409: event_full
```

`event_full` 判定は INSERT 前に SELECT で件数を取り、`capacity` と比較する。レース条件で over-book は v1 では許容（実害が出るほど application は来ないと想定、§10.6 リスクとして明示）。

#### `DELETE /v1/events/{id}/register`

```
認証: Bearer JWT 必須 + role IN ('farmer','ja_staff','researcher')
処理: 自分の event_registrations 行を UPDATE SET cancelled_at = now() (物理削除ではない)
Response 204: なし
Response 404: not_registered （元から行なし or 既に cancelled_at IS NOT NULL）
```

物理削除しない理由: 過去申込者向け一斉メール（`segment_type='event_past_attendees'`）の段で「キャンセル前の申込履歴」を残したい運用ニーズに備える。v1 では `WHERE cancelled_at IS NULL` で「active」扱いに統一。

### 5.2 maker 専用

#### 5.2.1 `GET /v1/maker/events`

```
認証: maker
クエリ: status (draft/published/cancelled/all, default all), limit, offset
Response: { events: [{ id, title, starts_at, ends_at, status, capacity,
                       active_registration_count, created_at }, ...] }
```

#### 5.2.2 `GET /v1/maker/events/{id}` / `POST /v1/maker/events` / `PUT /v1/maker/events/{id}` / `DELETE /v1/maker/events/{id}`

CRUD 一式。BFF 側で `host_user_id = JWT.sub` を強制（payload に host_user_id を含めても無視）。`host_type` は固定で 'maker'。

```
POST/PUT Body:
  { title (1-200), body (1-20000), venue?, online_url?,
    starts_at, ends_at, capacity? (>0), status: 'draft'|'published'|'cancelled' }
バリデーション:
  - ends_at > starts_at
  - venue / online_url の少なくとも一方は必須（両方 NULL を拒否）
  - 公開（status='published'）に遷移する PUT では starts_at >= now() を強制
Response 403: event_not_owner（他社 event への操作）
Response 404: event_not_found
```

#### 5.2.3 `GET /v1/maker/events/{id}/registrations`

```
認証: maker（自社 event のみ）
クエリ: include_cancelled (bool, default false), limit, offset
Response: { registrations: [
  { id, user_id, display_name, role, registered_at, cancelled_at }, ...
] }
```

display_name は `farmer_profiles` / `ja_profiles` / `researcher_profiles` / `users.name` のいずれかをフォールバック順に取る（既存 `me_favorites.py` の `_maker_display_name` と同方針）。

### 5.3 一斉メール（maker）

#### 5.3.1 `GET /v1/maker/emails/campaigns`

```
認証: maker
クエリ: status (draft/queued/sent/failed/all), limit, offset
Response: { campaigns: [{ id, subject, segment_type, status, recipient_count,
                          created_at, queued_at, sent_at }, ...] }
```

#### 5.3.2 `POST /v1/maker/emails/campaigns`

```
認証: maker
Body: { subject, body, segment_type, segment_filter (jsonb 形は §4.4 参照) }
処理:
  - status は強制 'draft' で INSERT
  - maker_user_id = JWT.sub 強制
  - segment_filter の構造を segment_type に応じて Pydantic で検証
Response 201: { ok: true, id }
Response 422: invalid_segment_type / invalid_segment_filter
```

#### 5.3.3 `PUT /v1/maker/emails/campaigns/{id}` / `DELETE /v1/maker/emails/campaigns/{id}`

status='draft' のみ編集 / 削除可。queued / sent / failed は immutable（編集不可、Response 409 `campaign_already_queued`）。

#### 5.3.4 `POST /v1/maker/emails/campaigns/{id}/send`

```
認証: maker（自社 campaign のみ）
処理:
  1. status='draft' を要求（他状態は 409 campaign_already_queued）
  2. segment_type に応じて配信予定 user_id 集合を §4.6 SQL で算出
  3. recipient_count を集合サイズで確定
  4. status='queued', queued_at=now() に UPDATE
  5. **実送信は本 SPEC 範囲外**（ADR-0011 / 別 SPEC）
Response 200: { ok: true, status: 'queued', recipient_count }
Response 409: campaign_already_queued
Response 422: 配信予定が 0 件（送信予約を拒否）
```

「送信予定 0 件で 422」は biz 観点で「誰もいない送信予約」を防ぐ。Ryoga 判断（§9）。

### 5.4 `/v1/me/followed-makers`

```
認証: Bearer JWT 必須（ロール不問、§3.2）
Response: { makers: [{ user_id, display_name }, ...] }
```

§4.6 の SQL を実行。レスポンス上限は 200 件（自分が favorite している製品の maker 数なので実用上問題なし）。

### 5.5 Pydantic スキーマ（`backend/app/models/schemas.py` に追加）

主要モデル名（フィールド詳細は §4 と §5 を参照、generator が組む）:
- `EventListItem` / `EventListResponse` / `EventDetailResponse`
- `EventCreatePayload` / `EventUpdatePayload`
- `EventRegistrationListItem` / `EventRegistrationListResponse`
- `MakerEmailCampaignCreatePayload`（segment_type ごとに discriminated union 風に検証）
- `MakerEmailCampaignListItem` / `MakerEmailCampaignDetailResponse`
- `FollowedMaker` / `FollowedMakersResponse`

---

## 6. UI 仕様（フロント最小骨組み）

既存 design-tokens（`--primary` 等）を再利用、新規グローバル CSS 追加なし。コンポーネントは既存パターン踏襲（`/articles` / `/me/favorites` 等）。

### 6.1 `/events`

- Server Component
- 上部: 「講演会・イベント」見出し + upcoming / past 切替タブ（クエリ `?upcoming_only=true|false`）
- カード: タイトル / host display_name / 開催日（starts_at - ends_at）/ 会場 or オンライン表示 / 残席（capacity - active_registration_count、capacity NULL なら「定員なし」）
- 空状態: 「公開予定の講演会はありません」

### 6.2 `/events/[id]`

- Server Component（詳細本体）+ 申込ボタンのみ Client Component
- 本文: title / starts_at-ends_at / venue / online_url（外部リンクは `rel="noopener noreferrer"`）/ host card / body
- 本文 body はプレーンテキストとして `<pre className="whitespace-pre-wrap">` で描画する v1 方針（markdown レンダリングは articles 系のみ、events では入れない）。記述ミスマッチ防止のため §10.7 で明示
- 申込ボタン:
  - 未ログイン: `/login?next=/events/{id}` への Server Component 内 `redirect()` 用ではなく、リンク誘導
  - reviewer: 「申し込む」ボタン → POST 成功で「申込済み（取消）」表示
  - maker / unassigned: ボタン非表示 or grey out（reason テキスト表示）
  - 満席: 「定員に達しました」表示
- Next.js 16 破壊的変更対応: Server Component で `const { id } = await params;` の async params 形式（frontend/CLAUDE.md / frontend/AGENTS.md 準拠）

### 6.3 `/maker/events`

- Server Component
- 一覧: ステータスタブ（all / draft / published / cancelled）+ 作成ボタン
- 各行: title / status バッジ / starts_at / active_registration_count / 編集 / 申込者一覧リンク

### 6.4 `/maker/events/new` / `/maker/events/[id]/edit`

- Server Component（初期データロード）+ Form Client Component
- 入力欄: title / body (textarea) / venue / online_url / starts_at (datetime-local) / ends_at / capacity / status
- バリデーション: ends_at > starts_at をクライアント側でも確認、エラー時はインライン表示
- 送信成功 → `/maker/events/{id}/edit` または `/maker/events` に router.push

### 6.5 `/maker/events/[id]/registrations`

- Server Component
- フィルタ: include_cancelled チェックボックス
- 一覧: display_name / role バッジ / registered_at / cancelled_at（あれば）
- v1 で連絡手段は提供しない（§10.3 リスク参照）

### 6.6 `/maker/emails`

- Server Component（一覧）+ Form Client Component（新規作成 modal or 別 page、UI 詳細は generator 判断）
- 一覧: subject / segment_type / status / recipient_count / created_at
- 新規作成フォーム:
  - subject / body (textarea)
  - segment_type ラジオ（favorite_followers / event_past_attendees / specific_users）
  - segment_filter UI:
    - favorite_followers: 追加入力なし、暗黙フォロワー総数のプレビュー表示
    - event_past_attendees: 自社 events からセレクト（`/v1/maker/events?status=all`）
    - specific_users: v1 縮退ライン許容、jsonb 直接入力 textarea
  - 送信予約ボタン: `POST /v1/maker/emails/campaigns/{id}/send` 呼び出し、確認モーダル必須（「v1 では実送信されず queue に入るだけです」と明文）

### 6.7 `/admin/events/new`（骨組みのみ）

- Server Component
- 中身: `import { notFound } from 'next/navigation'; export default async function Page() { notFound(); }` の最小実装
- TODO コメントは置かない（§10.5 アンチパターン #8 回避）
- 後続 SPEC で本実装する

### 6.8 エラー / 空状態 / 404

- 一覧 0 件: 各画面に応じた中立的なプレースホルダ
- 詳細で 404: Next.js `notFound()` で既存 `not-found.tsx` UI

### 6.9 next/image remotePatterns

本 SPEC では新規画像配信なし（events 詳細画像は v1 未対応、§10.3 翌日送り）。`*.supabase.co` 既存 allowlist 追加なし。

---

## 7. 触らないファイル

- `supabase/migrations/20260415*` 〜 `20260502150001*`（既存全 migration）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py` / `maker_profile.py` / `products.py` / `reviews.py` / `me.py` / `me_favorites.py` / `articles.py`
- `backend/app/auth/jwt.py` / `roles.py`（SIGNUP_ROLES 不変）
- `backend/app/dependencies.py`
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/products/*` / `frontend/src/app/maker/products/*` / `frontend/src/app/me/*` / `frontend/src/app/articles/*` / `frontend/src/app/manufacturers/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec 全て

---

## 8. 触るファイル（予想）

### 新規 migration（4 本）
- `supabase/migrations/20260514120000_events_table.sql`
- `supabase/migrations/20260514120001_events_rls.sql`
- `supabase/migrations/20260514120002_maker_email_campaigns_table.sql`
- `supabase/migrations/20260514120003_maker_email_campaigns_rls.sql`

### 新規 backend
- `backend/app/routers/events.py`
- `backend/app/routers/maker_events.py`
- `backend/app/routers/maker_emails.py`
- `backend/app/routers/me_followed_makers.py`

### 新規 frontend
- `frontend/src/app/events/page.tsx`
- `frontend/src/app/events/[id]/page.tsx`
- `frontend/src/app/events/[id]/_components/register-button.tsx`（Client）
- `frontend/src/app/maker/events/page.tsx`
- `frontend/src/app/maker/events/new/page.tsx`
- `frontend/src/app/maker/events/new/_components/event-form.tsx`（Client）
- `frontend/src/app/maker/events/[id]/edit/page.tsx`
- `frontend/src/app/maker/events/[id]/registrations/page.tsx`
- `frontend/src/app/maker/emails/page.tsx`
- `frontend/src/app/maker/emails/_components/campaign-form.tsx`（Client）
- `frontend/src/app/admin/events/new/page.tsx`（骨組み = notFound）

### 既存修正
- `backend/app/main.py`（4 ルーター include）
- `backend/app/models/schemas.py`（§5.5 のモデル追加）
- `frontend/src/types/database.ts`（`pnpm gen:types` で自動再生成、手書きしない）

---

## 9. Sprint 分解 + 受入基準

### Sprint 1: events DB + 公開閲覧 + reviewer 申込（基盤）

**含む機能**: F-1 events テーブル定義 / F-2 events RLS / F-3 `GET /v1/events` / F-4 `GET /v1/events/{id}` / F-5 申込 POST / DELETE / F-6 `/events` `/events/[id]` フロント / F-7 申込ボタン Client Component

**完了ゴール**: maker が SQL 直で events 行を INSERT すれば、未ログインユーザーが `/events` で一覧 → `/events/[id]` で詳細を見られる。reviewer がログイン状態で申込 → 取消ができる。

**受入基準**:
- [ ] `supabase db push --linked` で 2 本（events table / events RLS）が適用される
- [ ] `GET /v1/events` が status='published' かつ starts_at >= now() の event のみ返す
- [ ] `GET /v1/events?upcoming_only=false` で past events も含まれる
- [ ] `GET /v1/events/{id}` で draft / cancelled は 404、published は 200
- [ ] `POST /v1/events/{id}/register` を maker JWT で叩くと 403 `register_role_forbidden`
- [ ] reviewer で 2 回 POST すると 2 回目 409 `already_registered`
- [ ] capacity=3 の event に 3 人申込済の状態で 4 人目が 409 `event_full`
- [ ] `DELETE /v1/events/{id}/register` で `cancelled_at` が立ち、再度 POST すると新規 201 にならず 409（v1 ではこれを許容、§10.6 で記載）
- [ ] `/events` で公開 events が新しい順に表示される
- [ ] `/events/[id]` で未ログイン時の申込ボタンが reviewer ログイン誘導 UI に置き換わる
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1
- [ ] `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` exit 0

### Sprint 2: maker CRUD + 申込者一覧

**含む機能**: F-8 `/v1/maker/events*` CRUD / F-9 `/v1/maker/events/{id}/registrations` / F-10 `/maker/events` 一覧 / F-11 `/maker/events/new` / F-12 `/maker/events/[id]/edit` / F-13 `/maker/events/[id]/registrations`

**完了ゴール**: maker が UI 上で events を作成 → 公開 → 編集 → キャンセル → 申込者一覧を確認、まで一連の運用ができる。

**受入基準**:
- [ ] maker ログインで `/maker/events/new` から event 作成 → DB に status='draft' で INSERT される
- [ ] status='draft' のまま `/events` には表示されない
- [ ] status='published' に編集すると `/events` に表示される
- [ ] ends_at <= starts_at の payload で 422
- [ ] venue と online_url 両方 NULL の payload で 422
- [ ] 他社 event の id を `PUT /v1/maker/events/{id}` で叩くと 403 `event_not_owner`
- [ ] `/maker/events/[id]/registrations` で自社 event の申込者が表示される
- [ ] include_cancelled=true でキャンセル済も含まれる
- [ ] maker が `/events` 公開ページから自分の event を見ても申込ボタンは出ない（maker ロール）

### Sprint 3: 一斉メール campaigns（DB + queue 遷移まで）

**含む機能**: F-14 maker_email_campaigns テーブル / F-15 campaigns RLS / F-16 `/v1/maker/emails/campaigns*` CRUD / F-17 send（queue 遷移）/ F-18 `/v1/me/followed-makers` / F-19 `/maker/emails` 一覧 + 新規作成 UI

**完了ゴール**: maker が `/maker/emails` で新規 campaign を作成 → segment_type を選択 → 送信予約 → DB 上で `status='queued'` になり、`recipient_count` が確定するまで。実メール送信はしない。

**受入基準**:
- [ ] `supabase db push --linked` で 2 本（campaigns table / campaigns RLS）が適用される
- [ ] `POST /v1/maker/emails/campaigns` で status='draft' の行が作成される
- [ ] segment_type='favorite_followers' の send で、§4.6 SQL が想定どおりの user_id 集合を返す（手動テスト: maker A の製品 P を user X が favorite → maker A の send で X が 1 件カウントされる）
- [ ] segment_type='event_past_attendees' の send で、cancelled_at IS NULL の申込者のみが対象
- [ ] segment_type='specific_users' で `user_ids` が空配列なら 422
- [ ] 送信予定 0 件で 422
- [ ] queued な campaign を PUT / DELETE すると 409 `campaign_already_queued`
- [ ] `/v1/me/followed-makers` で自分の favorite 製品の maker 集合が重複なく返る
- [ ] `/maker/emails` で新規作成 UI が動作、確認モーダルに「v1 では実送信されません」と表示される

### Sprint 4: admin 主催骨組み + 仕上げ

**含む機能**: F-20 `/admin/events/new` 骨組み（notFound）/ F-21 空状態 / エラー UI / i18n 統一 / F-22 受入テスト全項目通過 / F-23 §11 完了の定義 充足

**完了ゴール**: 本 SPEC §9 の全受入項目が緑、`/admin/events/new` は notFound だが route 自体は登録されており、後続 SPEC で実装本体を入れる準備が整う。

**受入基準**:
- [ ] `/admin/events/new` にアクセスして 404 表示（既存 `not-found.tsx`）
- [ ] 各画面の空状態が中立的なプレースホルダで表示される
- [ ] エラー時の `code` 値が §3.3 一覧と一致する
- [ ] `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` 全 exit 0
- [ ] backend `from app.main import app` exit 0
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）
- [ ] `grep -rn "RAILWAY_" backend/ frontend/src` exit 1（0 件）

工数目安（generator 着手前の参考、実装担当 1 名想定）:
- Sprint 1: 10-12 時間
- Sprint 2: 8-10 時間
- Sprint 3: 10-12 時間
- Sprint 4: 4-6 時間
- 合計: **32-40 時間**

---

## 10. リスク / 既知の制約 / 設計上の注意

### 10.1 admin 主催の統合は ADR-0009 完了後

`host_type='admin'` の events を実際に INSERT できるのは ADR-0009 で admin ロールが導入されてから。本 SPEC では:
- データモデルが `host_type IN ('maker','admin')` を許容する
- `/admin/events/new` ルートをファイルとして置く（中身は `notFound()`）
- events RLS の INSERT policy は `host_type = 'maker'` 限定で開始
- ADR-0009 完了後の SPEC で `events_insert_admin_host` policy 追加 + `/admin/events/new` UI 実装を別 SPEC として切り出す

### 10.2 host_user_id NOT NULL の運用

`host_type='admin'` 時に「どの admin ユーザーが host か」は曖昧（運営チーム単位の system user を持つか、個人 admin か）。本 SPEC では **NOT NULL 開始 + ADR-0009 admin SPEC で system user 設計を確定**、として開ける。NULL 許容に変えると後で「host が誰でもない event」が発生して DOA 上は雑になる、変更不可逆領域（DB スキーマ）への影響を避ける。

### 10.3 実メール送信は本 SPEC スコープ外（ADR-0011）

`POST /v1/maker/emails/campaigns/{id}/send` は `status='queued'` 遷移までで止まる。実送信 = Resend / SendGrid / Supabase Auth Email 等の選定と統合は別 SPEC（ADR-0011 を出発点）。`status='queued' → 'sent' / 'failed'` の遷移は別 SPEC で実装する worker / cron / Edge Function のいずれかで担う。本 SPEC では `status='queued'` 行を CLI / SQL で参照できるところまでで運用。

連絡手段ニーズ（申込者一覧画面で「申込者にメール送りたい」）も本 SPEC では `mailto:` リンクも提供しない（個別連絡は M4 sample_requests と同様にメーカー自社メーラーで対応、UI 統合は v1.5+）。

### 10.4 一斉メールの法規制

特定電子メール法 / 特商法に基づくオプトアウト同意取得と表示義務は規約 SPEC（A5）側で対応する。本 SPEC では「DB に queued レコードを残すまで」なので法規制発動は実送信時。実送信実装の前に **必ず規約条項追加 + ユーザー同意フローの SPEC 完了** が前提（ADR-0011 の前提条件）。

### 10.5 capacity 判定のレース条件

`POST /v1/events/{id}/register` で 「SELECT COUNT → capacity 比較 → INSERT」の間に他リクエストが INSERT すると over-book が起きる。v1 では:
- リクエスト同時並行が低い前提で許容
- v1.5+ で `event_registrations` への INSERT 時に CTE / advisory lock / trigger チェックを入れる方針

### 10.6 cancel 後の再申込

`DELETE /v1/events/{id}/register` 後（行は UPDATE で cancelled_at が立つ）、同じユーザーが再度 `POST /v1/events/{id}/register` すると UNIQUE 違反で 409。**v1 では再申込を許容しない**（cancelled_at をクリアする UPDATE API は提供しない）。要件が出たら v1.5+ で `PATCH /v1/events/{id}/register/restore` を追加検討。本制約は申込者画面 UI でも明示する（「キャンセルすると再申込できません」）。

### 10.7 events 本文の markdown 不採用

articles の本文は markdown レンダリングだが、events は **プレーンテキスト** で開始する。理由:
- 講演会告知は短文中心で markdown の利得が薄い
- maker 側に markdown 入力 UI を提供すると学習コストが追加で発生
- サニタイズ依存を増やさない（articles で `rehype-sanitize` は導入済だが events 専用 path で別レンダラを噛ませると保守ポイントが増える）

v1.5+ で要望が出たら articles の markdown レンダラを共有する形で導入する。

### 10.8 暗黙フォローの kind 扱い

§4.6 SQL では `user_favorites` を `kind` で絞らずに採用している（'favorite' / 'candidate' どちらも暗黙フォローと見なす）。biz 観点で「'candidate'（マイ資材候補）は単なる比較検討で、メーカー側に暗黙フォローとは見なせない」という議論が出る可能性あり、Ryoga 判断（§9 別途）。

### 10.9 アンチパターン回避（SKILL §4 / §10.5 articles 同等）

| # | 回避内容 |
|---|---|
| 1 役割の二重管理 | `app_metadata.role` を JWT 経由で読むのみ、`public.users.role` への直 UPDATE はしない |
| 2 JSONB 濫用 | events / event_registrations は素朴な型、campaigns の segment_filter のみ jsonb（segment_type ごとに固定形を Pydantic で検証） |
| 3 UI 都合で DB 捻じ曲げ | active_registration_count は集計、列追加せず |
| 4 user_metadata に role | 該当なし |
| 5 フロント直叩き | BFF 経由のみ |
| 6 RLS を第一防御 | BFF `require_role` + ownership 検証が第一防御、RLS は第二防御 |
| 7 変更履歴を本文に | 本 SPEC に「旧版では」等の時系列記述なし |
| 8 注釈メモ | TODO / FIXME を生成コードに残さない（admin/events/new も notFound のみ） |
| 9 ついで実装 | 実メール送信 / カレンダー連携 / CSV は §1.3 / §10.3 で明示除外 |
| 10 未採用技術前提 | Edge Functions / GitHub Actions CI / メーラー SDK 等の前提コードなし |

---

## 11. Ryoga 判断（確定済 / 未確定の論点）

### 11.1 確定（本 SPEC 採用）

- ファイル名 `events-v1.md`（articles と異なり phase 番号ではなく機能名 + v1 サフィックス）
- migration prefix `20260514120000` 〜 `20260514120003` の 4 本
- 一斉メールは v1 では `status='queued'` 遷移まで、実送信は別 SPEC
- admin 主催骨組みは `/admin/events/new` を notFound で置く
- events 本文はプレーンテキスト（markdown 不採用）
- cancel 後再申込は v1 で許容しない
- 暗黙フォローは `user_favorites` の kind 両方を含める

### 11.2 未確定（generator 着手前に Ryoga が判断、§9 で worker から確認依頼推奨）

- **暗黙フォローの kind 絞り込み**: `kind='favorite'` のみにするか両方含めるか（§10.8）
- **送信予定 0 件の扱い**: 422 で拒否 vs status='queued' のまま recipient_count=0 で許可
- **event 詳細の online_url オープン方針**: `target="_blank" rel="noopener noreferrer"` で外部リンクか、いったん `/events/[id]/join` 中間ページで規約同意を取るか
- **`event_past_attendees` の event_id 制限**: 自社 event のみ vs 全 published event（実用上は前者で十分、後者は誤送信リスク）
- **specific_users の最大 1000 件**: 上限値の決め（v1 はメーカー側ユーザー母数が少なく 1000 で実害なし、要 biz 確認）
- **maker / unassigned が `/events/[id]` を見たときの申込ボタン文言**: 「ロール変更が必要」 vs ボタン完全非表示

---

## 12. §5 未確定領域との境界（やらないことの明示、§1.3 補強）

本 SPEC で **実装しない** もの:

- 実メール送信 / 送信ステータス遷移（'queued' → 'sent' / 'failed'）
- 開封 / クリック計測
- メール送信ドメイン認証（DKIM / SPF / DMARC）
- メーラー API 選定（Resend / SendGrid / Supabase Auth Email）
- 規約条項追加 / オプトアウト UI（A5 連動）
- events のリマインダーメール（前日 / 当日通知）
- ICS 配信 / Google カレンダー連携
- 参加 QR / 参加証 PDF / チェックイン UI
- 満席時の繰り上げ待ち（waitlist）
- decimal 価格 / 決済（オフライン無料イベントを前提）
- events 詳細画像 / ヒーロー画像
- 外部 SNS 共有 OG タグ最適化
- 検索 / フィルタ（カテゴリ / 地域 / オンライン-オフライン切替）
- maker 側「申込者にメール送る」UI（M4 mailto と同様の運用代替も v1 範囲外）
- admin 主催 events の実装本体（ADR-0009 完了後）

---

## 13. 完了の定義（DoD）

- [ ] §9 Sprint 1-4 の全受入基準が緑
- [ ] §10.9 アンチパターン 10 項目に該当する実装が存在しない
- [ ] `supabase db push --linked` が冪等で適用される（再実行で no-op）
- [ ] `pnpm gen:types` で `frontend/src/types/database.ts` に events / event_registrations / maker_email_campaigns が反映される
- [ ] BFF / RLS の二層防御テストが手動でも通る（reviewer / maker / unassigned / anon の 4 主体 × 主要 endpoint）
- [ ] CLAUDE.md §「依存セキュリティ監査」の grep 監査が exit 1 維持（フロント直叩き 0 件 / Railway 直参照 0 件）

---

**以上**

---

## 20. Sprint 4 closure: 確定事項と申し送り

### 20.1 Sprint 3 hotfix での仕様確定
- PATCH `/v1/maker/emails/campaigns/{id}`: `segment_type` 単独更新は 422 `invalid_segment_filter` で拒否（filter 同送必須）
- `/v1/me/followed-makers`: ロール不問（SPEC §3.2 / §5.4 通り、reviewer 限定にしない）

### 20.2 統一エラーコード追加
本 ADR で新規追加した code:
- `no_recipients` (422) — campaigns send の pre-flight でセグメント実体が空
- `event_not_owner` (403) — 他社主催 event への操作試行

### 20.3 状態遷移
- events: `draft → published → cancelled`、`cancelled → published` 復活可（PATCH 経由）
- event_registrations: 申込 → cancelled_at 設定、再申込不可（v1）
- maker_email_campaigns: `draft (編集/削除可) → queued → (sent | failed)`、queued 以降は PATCH/DELETE/send が 409

### 20.4 datetime TZ
- v1 は JST 表示 / UTC 保存。frontend `datetime-local` はブラウザ TZ 依存、運営は日本国内環境前提。海外運用は v1.5+ で検討

### 20.5 display_name フォールバック
- `/v1/maker/events/{id}/registrations` は v1 では `users.name` のみで縮退（SPEC §1.2 縮退ライン許容）
- 拡張先候補（farmer_profiles / ja_profiles / researcher_profiles）に display_name 相当カラムが存在しないため、v1.5+ で導入時に拡張

### 20.6 v1.5+ 送り
- `/admin/events/new` 本実装（admin role マージ後）
- 実メール送信（Resend / SendGrid 等の選定、ADR-0011 範囲）
- 講演会本文の markdown 化
- カレンダー連携 / 録画ホスティング
- 申込キャンセル待ち / 自動リマインダー
