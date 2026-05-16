# Farmille v1 メーカー承認フロー + アドミン画面 仕様

**作成日**: 2026-05-14
**作業ブランチ**: `feat/maker-approval-admin`（仮）
**実装担当**: worker
**位置づけ**: ADR-0009 を実装契約に落とし込む。`maker` 自己選択サインアップの即時公開を取りやめ、運営審査（`pending_review` → `active`）に切り替える。あわせて運営運用の入口となる `/admin/*` を最小骨組み + B1 メーカー承認のみ実装する
**前提 ADR**: `docs/decisions/0009-maker-approval-flow-and-admin-panel.md`（v1 スコープ反転 = アドミン画面が v1 入り）
**関連 ADR**: `docs/decisions/0002-reviews-insert-role-scope.md`（二層ロール構造）

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` の以下に準拠する。

- **§1.1 DOA 優先（不可逆領域）**: `users.role` CHECK 制約と `users.status` 列の最終形は本 spec 着手時の DOA レビューで確定済とみなす。`users.status` は enum 等の中間型を持たず、CHECK 制約付き `text NOT NULL DEFAULT 'active'` で表現する。`maker_approval_logs` のような監査専用テーブルは v1 では持たない（運用ログは Supabase ダッシュボードの監査ログ + Git PR 履歴で代替）
- **§1.2 ポータビリティ予算**: Supabase Edge Functions / `RAILWAY_*` 直参照を採用しない。承認 / 却下は FastAPI `/v1/admin/*` 配下で完結する
- **§1.3 責務分離**: 承認 / 却下 / ロール昇格はすべて FastAPI 経由。フロント `/admin/*` から Supabase 直叩き禁止（`supabase.auth.*` / `supabase.storage.*` のみ許容、既存規約踏襲）。RLS は第二防御
- **§1.4 v1 スコープ反転**: SKILL §1.4「やらない」表の「管理者画面 — SQL 直アクセスで代替」は本 spec 着手時点で**無効化済**（user memory: project_admin_panel_v1_inclusion / ADR-0009）。本 spec は `/admin/*` を v1 入りとして扱う
- **§3 レビュー軸**: 全テーブル RLS 有効、`users.status` への CHECK 制約、`/v1` プレフィックス、Pydantic バリデーション、統一エラーレスポンス、`require_role("admin")` ガード
- **§4 アンチパターン回避**: §10 アンチパターン回避表を参照

§10「触らないファイル」/ §11「触るファイル」で本 spec の境界を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達（v1 ローンチ前にこれが揃わないとリリース不可）

- 既存 `POST /v1/onboarding/maker` が `users.status = 'pending_review'` でメーカーを登録する（即時公開しない）
- 公開系（`/manufacturers` 一覧、`/products` の maker フィルタ、製品詳細のメーカー名表示）で `pending_review` / `rejected` / `frozen` のメーカー所有データは表示されない
- `admin` ロールが新規追加され、`POST /v1/auth/register-role` から自己昇格できないこと（既存 `SIGNUP_ROLES` セットに `admin` を含めない）
- `/admin/*` 配下に `admin` ロール以外がアクセスすると 403 / リダイレクト（Server Component で BFF レスポンスを判定）
- `/admin/makers` で `pending_review` 一覧 + 承認 / 却下ボタンが動作する（B1 必達）
- 承認 / 却下 API（`/v1/admin/makers/{user_id}/approve` / `/reject`）で `users.status` が `active` / `rejected` に遷移する
- ロール昇格 API（`POST /v1/admin/users/{user_id}/role`）が admin のみアクセス可能、引数として `unassigned` → `admin` の昇格を実行できる
- `/admin` ダッシュボード + B2-B7 サブ画面が**骨組みだけ存在**（リンクと「準備中」プレースホルダ、内部実装は次 phase）

### 1.2 縮退ライン（落ちても v1 ローンチに支障なし、v1.5 送り可）

- B2-B7 サブ画面の見栄え（プレースホルダ文言のみで可）
- 承認 / 却下時のメーカー宛通知メール（v1 は運営手動で info@ から送信、自動送信は v1.5+）
- 既存 `/products` / `/manufacturers` キャッシュの即時無効化（`pending_review` 状態のメーカーは ISR / revalidate 待ちで表示遅延が発生してよい）

### 1.3 翌日送り（本 spec 対象外、v1.5+ 確定）

- 二段階認証（2FA / TOTP）— `/admin/login` レイヤで導入予定だが v1 はプレースホルダのみ
- `maker_approval_logs` 監査テーブル（誰がいつ承認 / 却下したかの履歴）— v1 は Supabase ダッシュボード + Git で代替
- 通報キュー画面 / モデレーション UI（B5）
- 「注目の資材」キュレーション編集 UI（B8 相当、A2 ワークショップで SQL 運用確定）
- 記事執筆 / 編集 UI（B9 相当、A3 ワークショップで Git 運用確定）

---

## 2. 画面一覧

| パス | 種別 | データ源 | 認証 | v1 採否 |
|---|---|---|---|---|
| `/admin` | Server Component | BFF `GET /v1/admin/summary`（簡易集計） | `admin` ロール必須 | ✅ 骨組み |
| `/admin/makers` | Server Component | BFF `GET /v1/admin/makers/pending` | `admin` 必須 | ✅ **必達**（B1） |
| `/admin/users` | Server Component | プレースホルダ（API なし）| `admin` 必須 | ✅ 骨組み（B6） |
| `/admin/reports` | Server Component | プレースホルダ（API なし）| `admin` 必須 | ✅ 骨組み（B2） |
| `/admin/articles` | Server Component | プレースホルダ（API なし）| `admin` 必須 | ✅ 骨組み（B3） |
| `/admin/featured-products` | Server Component | プレースホルダ（API なし）| `admin` 必須 | ✅ 骨組み（B4） |
| `/admin/banners` | Server Component | プレースホルダ（API なし）| `admin` 必須 | ✅ 骨組み（B7） |

**スコープ外（本 spec で着手しない）**:
- B5（通報キュー処理 UI、未確定）
- B8（注目の資材編集 UI、A2 確定で SQL 運用）
- B9（記事編集 UI、A3 確定で Git 運用）
- `/admin/login` 専用ログイン（v1 は既存 `/login` を使い、ロールガードのみで境界を保つ。2FA 別 phase）

骨組み画面（B2-B7）は以下を満たせばよい:
- `/admin` ダッシュボードからのリンクが存在する
- ページ自体は `admin` ロール guard を通る
- 本文は「準備中（v1 では SQL 直対応）」プレースホルダ + 関連 ADR / spec へのリンク

---

## 3. データ書き込み方針（共通プリアンブル）

本 spec の書き込みは **すべて FastAPI 経由**。フロント `/admin/*` から Supabase 直叩きは行わない。書き込みエンドポイントは `/v1/admin/*` 配下に集約し、`require_role("admin")` で第一防御する。

### 3.1 BFF 命名規約

- **管理者専用**: `/v1/admin/{resource}`（例: `/v1/admin/makers/pending`、Bearer JWT + `role=admin`）
- **既存メーカー専用**: `/v1/maker/{resource}` は不変、ただし `status='active'` のメーカーのみが書き込めるよう BFF で再確認する（後述 §5.5）
- **既存公開 GET**: `/v1/manufacturers`、`/v1/products` 等の公開 GET は `users.status='active'` の所有データに絞り込む追加フィルタを入れる

### 3.2 認証境界

- `/v1/admin/*`: Bearer JWT 必須かつ `app_metadata.role == 'admin'`、不一致で 403
- `/admin/*` 配下のフロントページ: Server Component で `Authorization: Bearer ...` 付きで `/v1/admin/summary` を叩き、401 / 403 なら `/login?next=/admin/...` へリダイレクト
- 既存 `/v1/onboarding/maker`: `require_role("maker")` は不変。INSERT 時の `users.status` を `pending_review` で書く（§5.5）

### 3.3 統一エラーレスポンス

既存 `docs/specs/articles.md §3.3` と同じ形式 `{ "detail": ..., "code": ... }`。本 spec で使う `code` は以下:

- `not_admin`（403、ロール不一致）
- `maker_not_found`（404、対象ユーザーが存在しないか maker ロールでない）
- `maker_not_pending`（409、すでに `active` / `rejected` 等で承認 / 却下不能）
- `invalid_target_role`（400、ロール昇格 API の引数違反）
- `role_already_assigned`（409、すでに目的のロール）

### 3.4 RLS 命名規約

既存 `{table}_{action}_{scope}` 形式を踏襲。`scope` に `admin` を追加可能とする（例: `users_update_admin`）。ただし本 spec では admin の DB 書き込みはすべて service_role 経由（BFF）なので、admin 向け RLS ポリシーは原則作らない（policy 不在 = 拒否、BFF が唯一の書き込み経路）。

### 3.5 migration ファイル名

`YYYYMMDDHHMMSS_{機能}_{種別}.sql`。本 spec は以下 3 本:

- `20260514000000_admin_users_role_constraint.sql`（CHECK 制約変更 + admin ロール追加）
- `20260514000001_admin_users_status_column.sql`（status 列追加 + backfill）
- `20260514000002_admin_public_filters_rls.sql`（公開 GET 系の `status='active'` フィルタ強化、必要なら）

### 3.6 フロントから Supabase 直叩きの禁止（既存規約踏襲）

`frontend/src` 配下で `supabase.from(` / `supabase.rpc(` の出現を 0 件で維持（受け入れ条件 §12）。例外は `supabase.auth.*` と `supabase.storage.*`（既存規約）。

---

## 4. データモデル（DB スキーマ変更）

migration 3 本。**`users.role` CHECK 制約変更は DROP + RECREATE が必要**（PostgreSQL の CHECK 制約は ALTER で内容変更不可）。

### 4.1 migration 1: `users.role` CHECK 制約に `admin` を追加

`20260514000000_admin_users_role_constraint.sql`

```sql
-- 既存 CHECK 制約の名前は init.sql で省略されているため pg_constraint から特定して DROP する。
-- Supabase は CHECK 制約に自動的に `users_role_check` という名前を付ける（テーブル名_列名_check 規約）。
-- 名前が異なる場合は本 migration 適用前に `SELECT conname FROM pg_constraint WHERE conrelid = 'users'::regclass AND contype = 'c'` で確認すること。

ALTER TABLE users DROP CONSTRAINT users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('farmer','maker','ja_staff','researcher','unassigned','admin'));
```

**ロールバック手順**: `users.role = 'admin'` を持つ行を `unassigned` に UPDATE → CHECK 制約を旧定義（admin なし）で再作成。

### 4.2 migration 2: `users.status` 列追加 + 既存ユーザー backfill

`20260514000001_admin_users_status_column.sql`

```sql
ALTER TABLE users
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending_review','active','frozen','rejected'));

-- 既存 maker ユーザーは v1 ローンチ前データのため active で確定（ADR-0009 §2.3 確定）。
-- 新規 maker のみ /v1/onboarding/maker 経由で pending_review を入れるので backfill は DEFAULT で吸収される。
-- 明示的に上書きしない（DEFAULT 'active' で自動付与）。

CREATE INDEX idx_users_status ON users(status) WHERE status <> 'active';
```

**設計判断（DOA 不可逆領域）**:
- enum 型ではなく CHECK 制約付き `text` を採用（既存 `users.role` と同パターン、enum 値追加時に migration 1 本で済む）
- `pending_review` / `active` / `frozen` / `rejected` の 4 値で開始
  - `pending_review`: 新規メーカー登録直後
  - `active`: 承認済、公開系で表示される唯一の状態
  - `rejected`: 却下済、再申請不可（再申請フローは v1 アウト）
  - `frozen`: 不適切メーカーの一時凍結（v1 で UI は持たない、SQL 直で運用）
- 既存ユーザー（farmer / ja_staff / researcher / unassigned）も同じ列を共有するが、ロール変更 API（§5.4）でのみ意味を持つ。デフォルト `'active'` で自動付与され UI に出ない
- 部分 index（`WHERE status <> 'active'`）で B1 ペンディング一覧クエリを最適化

### 4.3 migration 3: 公開 GET の `status='active'` フィルタ（RLS + BFF）

`20260514000002_admin_public_filters_rls.sql`

```sql
-- products は既存 RLS で「select_all」公開。products.maker_id が指す users.status が 'active' でないものは
-- BFF 側で除外する（§5.6）。RLS を product 側で書くと join が走りパフォーマンスに影響するため、
-- 第一防御は BFF、RLS は既存のまま据え置く（不可逆領域回避）。

-- 念のため確認用ビュー（将来の検算用、本 spec では使わない）:
-- CREATE VIEW v_active_makers AS SELECT id FROM users WHERE role = 'maker' AND status = 'active';
-- ※ ビュー作成は v1 で必須ではない。spec 起草時の DOA レビューで除外可。
```

**設計判断**:
- RLS で products / manufacturers を縛ると、admin の管理画面で `pending_review` メーカーの製品を見るときにもブロックされてしまうため、フィルタは **BFF 側に置く**（第一防御）
- RLS は既存どおり「products 公開」「maker_profiles 自己編集」のまま据え置き
- このため migration 3 は実質ノーオペレーション（コメントのみ）で、コミットしないか、もしくは存在記録として空ファイルで残すかは worker 着手時に判断（Section 8）

---

## 5. FastAPI エンドポイント設計

新規ルーター `backend/app/routers/admin.py` を追加し、`backend/app/main.py` で `/v1/admin` 配下に include。

### 5.1 `GET /v1/admin/summary`

```
GET /v1/admin/summary
認証: Bearer JWT + role=admin
Response 200:
  {
    "pending_makers_count": int,
    "active_makers_count": int,
    "rejected_makers_count": int,
    "total_users_count": int
  }
Response 401: 既存 / 403: not_admin
```

`/admin` ダッシュボード初期表示で使う最小集計。骨組み画面の体裁を成立させるため。

### 5.2 `GET /v1/admin/makers/pending`

```
GET /v1/admin/makers/pending?limit={limit}&offset={offset}
認証: Bearer JWT + role=admin
クエリ:
  limit:  int (1-100, default 50)
  offset: int (default 0)
Response 200:
  {
    "makers": [
      {
        "user_id": uuid,
        "name": str,
        "email": str,                # auth.users.email を service_role で参照
        "company_name": str | None,  # maker_profiles.company_name
        "prefecture": str | None,
        "city": str | None,
        "note": str | None,
        "created_at": datetime
      }
    ],
    "total": int
  }
```

処理:
1. `users` を `role='maker' AND status='pending_review'` で絞り、`created_at ASC`（古い順 = 先入れ先出し）で取得
2. `maker_profiles` を join して company_name / prefecture / city / note を平坦化
3. `auth.users.email` を service_role で取得して email を付与（B1 で運営が確認するのに必須）

### 5.3 `POST /v1/admin/makers/{user_id}/approve`

```
POST /v1/admin/makers/{user_id}/approve
認証: Bearer JWT + role=admin
Body: なし
Response 200: { "ok": true, "user_id": uuid, "status": "active" }
Response 404: maker_not_found
Response 409: maker_not_pending
```

処理:
1. 対象 `users` 行を SELECT。存在しない / `role != 'maker'` → 404
2. `status != 'pending_review'` → 409
3. `UPDATE users SET status = 'active' WHERE id = $1`
4. 成功レスポンス

将来の通知メール送信フックは v1 では入れない（縮退ライン）。

### 5.4 `POST /v1/admin/makers/{user_id}/reject`

```
POST /v1/admin/makers/{user_id}/reject
認証: Bearer JWT + role=admin
Body: { "reason": str | None }  # 自由記入、v1 は DB 保存せず破棄（v1.5 で audit log 化）
Response 200: { "ok": true, "user_id": uuid, "status": "rejected" }
Response 404: maker_not_found
Response 409: maker_not_pending
```

処理:
1. § 5.3 と同じ事前検証
2. `UPDATE users SET status = 'rejected' WHERE id = $1`
3. `reason` は v1 では破棄（監査ログテーブルは v1 アウト、§1.3）。受け取りはするが保存はしない、というのは将来互換のため

### 5.5 `POST /v1/admin/users/{user_id}/role`（B6 ロール昇格）

```
POST /v1/admin/users/{user_id}/role
認証: Bearer JWT + role=admin
Body: { "role": Literal["admin","ja_staff","researcher"] }
Response 200: { "ok": true, "user_id": uuid, "role": str }
Response 400: invalid_target_role
Response 404: user not found
Response 409: role_already_assigned
```

処理:
1. `body.role` が `admin` / `ja_staff` / `researcher` のいずれかに限定
   - `farmer` / `maker` は自己選択フロー（`/v1/auth/register-role`）に任せる
   - `unassigned` への降格は本 API で扱わない（v1 アウト、SQL 直）
2. 対象ユーザーの現在ロールを取得。同一なら 409
3. 既存 `auth.users.app_metadata.role` 更新 → `public.users.role` 更新 の二段書き込み（既存 `register-role` のロールバックパターン踏襲）
4. ADR-0002 二層構造を厳守。直 `UPDATE users SET role = ...` 禁止（SKILL §4 アンチパターン #1）

**重要**: `auth/roles.py:7` の `SIGNUP_ROLES: set[str] = {"farmer", "maker"}` は不変。`admin` は自己選択不可。本 API でのみ昇格可能。

### 5.6 既存 `/v1/onboarding/maker` の修正点（§5 既存修正）

`backend/app/routers/onboarding.py:119-142` の `onboard_maker` を修正:

```
追加処理:
  maker_profiles の upsert 後、同じトランザクション意図で
  admin.table("users").update({"status": "pending_review"}).eq("id", user_id).execute()
  を呼ぶ。
```

**設計判断**:
- すでに `register-role` で `status='active'` が DEFAULT 付与されているため、onboarding 完了タイミングで `pending_review` に**上書き**する
- これにより「ロール選択直後（プロフィール未記入）」と「onboarding 完了済（プロフィール記入済、承認待ち）」を区別する必要がない（どちらも公開系で除外される）
- worker 起草時の判断: より厳密には `register-role` で maker を選んだ瞬間に `pending_review` を入れる方が DOA としてきれい。ただし既存 `register-role` を変更すると farmer フローへの副作用検証が増えるため、本 spec では onboarding 側を触る。Section 8 で再判定

### 5.7 既存 `/v1/manufacturers` / `/v1/products` / `/v1/home/*` の修正点（公開 GET フィルタ）

以下のルーターで「メーカー所有データ」を返している箇所すべてに `users.status = 'active'` フィルタを追加する:

- `backend/app/routers/manufacturers_public.py`（メーカー一覧 / 詳細）
- `backend/app/routers/products.py`（製品一覧 / 詳細でメーカー名表示する場合）
- `backend/app/routers/home.py`（注目の資材で `featured_products` を返す箇所）

実装方針: 各 SELECT クエリの WHERE に `users.status = 'active'` を追加する（service_role 経由なので自由に join 可）。具体 SQL は generator が既存パターンに合わせて記述。

**漏れ防止 grep**:
```
grep -rn 'role.*maker' backend/app/routers/ | grep -i 'select\|table\|from'
```
で出てきた箇所をすべて確認し、`status='active'` 条件を追加したかチェックリスト化（受け入れ条件 §12）。

### 5.8 Pydantic スキーマ追加

`backend/app/models/schemas.py` に追加:

```python
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field
from uuid import UUID

class PendingMakerItem(BaseModel):
    user_id: UUID
    name: str
    email: str
    company_name: str | None
    prefecture: str | None
    city: str | None
    note: str | None
    created_at: datetime

class PendingMakersResponse(BaseModel):
    makers: list[PendingMakerItem]
    total: int

class AdminSummaryResponse(BaseModel):
    pending_makers_count: int
    active_makers_count: int
    rejected_makers_count: int
    total_users_count: int

class RejectMakerPayload(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)

class AdminRoleAssignPayload(BaseModel):
    role: Literal["admin", "ja_staff", "researcher"]
```

---

## 6. フロント実装スコープ

### 6.1 `/admin/layout.tsx`（admin ロール guard）

- Server Component
- BFF `GET /v1/admin/summary` を Authorization 付きで叩き、401 / 403 なら `/login?next={current_path}` へ `redirect()`
- 200 なら children をそのまま返す
- 共通ヘッダー（左に「Farmille Admin」、右にログイン中ユーザー名 + ログアウト）
- 左サイドメニュー（B1-B7 のリンク、現在パスをハイライト）

### 6.2 `/admin/page.tsx`（ダッシュボード）

- Server Component
- `/v1/admin/summary` の集計を表示（保留中メーカー数 / アクティブメーカー数 / 却下数 / 総ユーザー数）
- 各サブ画面（B1-B7）へのカードリンク + 「準備中」状態の表示

### 6.3 `/admin/makers/page.tsx`（B1 メーカー承認）— **必達**

- Server Component で `/v1/admin/makers/pending` を取得 → 一覧 SSR
- 各行: ユーザー名 / 会社名 / 都道府県 / 市区町村 / メール / 自己紹介 / 作成日 / 承認ボタン / 却下ボタン
- 承認 / 却下は Client Component（行ごとの小さい Client Island）で `POST /v1/admin/makers/{id}/approve` or `/reject` を叩き、成功時にページ再フェッチ
- 却下時は理由を入力できる軽量モーダル（v1 では DB 保存しないが UI 上では入力 → 確認）

### 6.4 B2-B7 骨組みページ

各 `/admin/{B2-B7}/page.tsx` は以下のみ実装:

- Server Component
- 中央に「準備中（v1 では SQL 直対応）」プレースホルダ
- 関連 ADR / ワークショップへのリンク（例: B7 banners → ADR-0011 + workshop §A2）
- B3 articles / B4 featured-products / B7 banners → 関連 spec（`docs/specs/articles.md` / `docs/specs/home.md`）へのリンク
- B6 users / B2 reports → 関連 ADR-0010（仮）へのリンク

これらは「画面が存在する」ことだけが受け入れ条件で、機能実装は v1.5+。

### 6.5 2FA プレースホルダ

`/admin/layout.tsx` 内で、将来 2FA 導入時の挿入ポイントをコメントで明示する… ではなく**コメント禁止規約**に従い、`docs/specs/maker-approval-admin.md` 本 § を参照する旨を関連 ADR-0009 §3 に記述しておくのみ（実装段階での目印は spec / ADR 経由で辿る）。コード上に「2FA TODO」のような注釈は残さない。

---

## 7. 認証境界 / RLS 第二防御

### 7.1 第一防御: BFF（FastAPI）

| エンドポイント | ガード | 失敗時 |
|---|---|---|
| `/v1/admin/*` | `require_role("admin")` | 403 `not_admin` |
| `/v1/onboarding/maker` | `require_role("maker")` | 403（既存） |
| 公開 GET 系 | なし（未ログイン可） | – |

### 7.2 第二防御: RLS

| テーブル | ポリシー | 備考 |
|---|---|---|
| `users` | 既存 `users_select_self` / `users_update_self` | admin の users 更新はすべて service_role 経由、authenticated 向けポリシーは追加しない |
| `maker_profiles` | 既存 `maker_profiles_*_self` 不変 | maker が pending_review 状態でも自分の profile は読み書き可（プロフィール記入のため） |
| `products` | 既存 `products_select_all` 不変 | BFF 側で `users.status='active'` フィルタを追加するため RLS は触らない |

**設計判断**: RLS を厳格化（products 等で `status='active'` を強制）すると admin が pending 状態のメーカー製品を確認できなくなる。第一防御は BFF、RLS は最低限の生地で十分。

### 7.3 初期 admin 昇格の運用ルール（Section 11 / DoD 連動）

- 共同創業者 3 名（Ryoga / 奥田 / 根本）を v1 ローンチ前に admin 化する
- 手順:
  1. 3 名がそれぞれ通常サインアップで `farmer` or `unassigned` 状態のユーザーを作る
  2. Ryoga が **Supabase Studio で 1 名目を `auth.users.app_metadata.role = 'admin'` + `public.users.role = 'admin'` に手動 UPDATE**（ブートストラップ）
  3. 1 名目が `/v1/admin/users/{user_id}/role` API で 2 名目 / 3 名目を昇格
- このブートストラップ手順は **`docs/setup-log.md` または運用 Notion** に追記する（本 spec の責務外、運用ドキュメント側）

---

## 8. テスト戦略

### 8.1 backend ユニットテスト

- `tests/test_admin_router.py`（新規）
  - admin ロールで `/v1/admin/summary` 200
  - 非 admin ロールで `/v1/admin/summary` 403
  - 未ログインで 401
  - `/v1/admin/makers/pending` レスポンス形状検証（pending_makers のみ含まれる）
  - `/approve` で `users.status='pending_review' → 'active'` 遷移
  - `/approve` を非 pending 状態に対して呼んで 409
  - `/reject` 同様
  - `/v1/admin/users/{user_id}/role` で admin / ja_staff / researcher 昇格、role_already_assigned 検証
  - `/v1/auth/register-role` から `role='admin'` 投げて 400 `invalid_role`（既存 SIGNUP_ROLES の確認）

- `tests/test_onboarding.py`（既存修正）
  - `POST /v1/onboarding/maker` 成功後に `users.status='pending_review'` になることを検証

### 8.2 frontend ユニット / E2E

- `/admin/page.tsx` を非 admin で開いて `/login?next=/admin` へリダイレクトすること
- `/admin/makers/page.tsx` で承認ボタン押下 → API 200 → 一覧から消える（あるいは「承認済」表示に変わる）
- 本格的な Playwright E2E は v1 範囲外、手動 E2E 手順を §13 に列挙

### 8.3 grep 検証（既存規約踏襲）

```
grep -rn "supabase\.\(from\|rpc\)(" frontend/src        # 0 件維持
grep -rn "SIGNUP_ROLES.*admin" backend/app              # admin が含まれていないことを目視
grep -rn "RAILWAY_" backend/ frontend/src               # 0 件維持
```

---

## 9. Sprint 分解 + 受入基準

generator が 1 sprint ずつ完結できる粒度に分解する。**4 sprint** 想定。

### Sprint 1: DB 不可逆領域確定 + admin ロール解禁

**範囲**:
- migration 3 本（§4.1 / §4.2 / §4.3）作成 + `supabase db push --linked`
- `pnpm gen:types` 実行 + frontend 型再生成 + 差分コミット
- `backend/app/auth/roles.py:7` の `SIGNUP_ROLES` を再確認（admin が含まれないこと）
- `backend/app/routers/onboarding.py` の `onboard_maker` に `status='pending_review'` 上書きを追加（§5.6）

**受入基準（falsifiable）**:
- [ ] `supabase db push --linked` exit 0 で 3 本適用される
- [ ] `psql -c "INSERT INTO users (id, role, name) VALUES (gen_random_uuid(), 'admin', 'test')"` が CHECK 制約違反なしで通る
- [ ] `psql -c "INSERT INTO users (id, role, name, status) VALUES (gen_random_uuid(), 'farmer', 'x', 'invalid')"` が CHECK 制約違反で失敗する
- [ ] dev 環境で新規 maker サインアップ → onboarding 完了後、`SELECT status FROM users WHERE id='...'` が `pending_review`
- [ ] `frontend/src/types/database.ts` に `status: 'pending_review' | 'active' | 'frozen' | 'rejected'` が含まれている

**想定工数**: 2-3 時間

---

### Sprint 2: admin BFF（API 群）+ 公開 GET フィルタ

**範囲**:
- `backend/app/routers/admin.py` 新規作成（§5.1 / §5.2 / §5.3 / §5.4 / §5.5 の 5 エンドポイント）
- `backend/app/main.py` で `/v1/admin` 配下に include
- `backend/app/models/schemas.py` に Pydantic 追加（§5.8）
- 既存 `manufacturers_public.py` / `products.py` / `home.py` に `users.status='active'` フィルタ追加（§5.7）
- `tests/test_admin_router.py` 新規 + `tests/test_onboarding.py` 修正（§8.1）

**受入基準（falsifiable）**:
- [ ] `curl -H "Authorization: Bearer {admin_jwt}" /v1/admin/summary` で 200 + JSON 4 フィールド
- [ ] `curl -H "Authorization: Bearer {farmer_jwt}" /v1/admin/summary` で 403 `{"code":"not_admin",...}` 形式
- [ ] `curl -X POST -H "Authorization: Bearer {admin_jwt}" /v1/admin/makers/{pending_user_id}/approve` で 200、その後 DB の `status='active'` を確認
- [ ] 同 API を `active` 状態のユーザーに呼んで 409 `maker_not_pending`
- [ ] `curl -X POST -H "Authorization: Bearer {admin_jwt}" -d '{"role":"admin"}' /v1/admin/users/{user_id}/role` で 200、`auth.users.app_metadata.role` と `public.users.role` 双方が `admin` に
- [ ] 公開 `/v1/manufacturers` レスポンスに `status='pending_review'` のメーカーが含まれない
- [ ] `pytest backend/tests/test_admin_router.py` 全 pass

**想定工数**: 4-6 時間

---

### Sprint 3: `/admin/makers` 必達 UI + admin guard

**範囲**:
- `frontend/src/app/admin/layout.tsx`（§6.1、guard + サイドメニュー）
- `frontend/src/app/admin/page.tsx`（§6.2、ダッシュボード）
- `frontend/src/app/admin/makers/page.tsx`（§6.3、B1 必達）
- 承認 / 却下用 Client Component（行ごとの小さい Island）
- 既存 design-tokens（`docs/design-tokens.md`）の色 / タイポを使う、新規グローバル CSS 追加なし
- Next.js 16 破壊的変更を踏まないこと（着手前に `node_modules/next/dist/docs/` を確認 — `frontend/AGENTS.md` 厳守）

**受入基準（falsifiable）**:
- [ ] 未ログインで `/admin` を開くと `/login?next=/admin` にリダイレクト
- [ ] farmer ログインで `/admin` を開くと `/login?next=/admin` にリダイレクト（403 → リダイレクト動線）
- [ ] admin ログインで `/admin` を開くと「保留中メーカー数」等が表示される
- [ ] `/admin/makers` で pending メーカー一覧（5 件以上のテストデータで）が表示
- [ ] 承認ボタン押下後、ページが再フェッチされ該当行が一覧から消える
- [ ] 却下ボタン押下 → モーダル → 確定で同様の挙動
- [ ] `pnpm tsc --noEmit` exit 0、`pnpm lint` 警告 0、`pnpm build` 全ルート生成成功

**想定工数**: 4-6 時間

---

### Sprint 4: B2-B7 骨組み + ドキュメント整備 + DoD

**範囲**:
- `/admin/users` / `/admin/reports` / `/admin/articles` / `/admin/featured-products` / `/admin/banners`（§6.4）
- 各画面で「準備中（v1 では SQL 直対応）」プレースホルダ + 関連 ADR / spec / ワークショップへのリンク
- `docs/setup-log.md` に「初期 admin 昇格手順（ブートストラップ）」を追記
- 受け入れ条件 §12 の全項目を Ryoga と 1 件ずつチェック

**受入基準（falsifiable）**:
- [ ] `/admin/users` `/admin/reports` `/admin/articles` `/admin/featured-products` `/admin/banners` の 5 ルートで admin ログイン時に 200、非 admin で `/login` リダイレクト
- [ ] 各骨組みページが design-tokens 準拠で「準備中」プレースホルダ + 関連 ADR リンクを表示
- [ ] `docs/setup-log.md` にブートストラップ手順が追記され、Ryoga が手元で 1 回手順通りに admin 昇格成功
- [ ] §12 受け入れ条件すべてチェック済

**想定工数**: 2-3 時間

---

**合計想定工数**: 12-18 時間（dev 実機検証 + 軽い手戻り含む）

---

## 10. リスク / 既知の制約

### 10.1 2FA は別 phase

`/admin/login` での 2FA / TOTP は v1 では実装しない。admin アカウントは

- パスワードの強度（運営内ルール）
- メールアドレスを共同創業者 3 名の個人 / 法人ドメインに限定（運用で担保）

で当面耐える。実装は v1.5 で別 ADR + spec 起票。

### 10.2 既存 maker の backfill 戦略

`users.status` 列追加時、既存全ユーザーは DEFAULT `'active'` で自動付与される。これは ADR-0009 §2.3 で「既存 maker は v1 ローンチ前データのため active 確定」と決定済み。明示的な backfill（既存 maker を pending に戻して承認やり直す）は **実施しない**。

**残るリスク**: 開発環境で既に登録された「テスト用偽メーカー」がいる場合、ローンチ前に運営が手動 SQL で削除 or `frozen` 化する。Sprint 4 の DoD に「dev DB の pending 移行が必要なメーカー有無を確認」を含める。

### 10.3 RLS 緩和の踏み外しリスク

§7.2 で「RLS は触らず BFF で第一防御」と決めたため、もし将来「BFF を経由しない経路（service_role 経由でない authenticated SDK）」が増えると、pending_review メーカーの製品が表示されてしまう。

**対策**: SKILL `farmille-architecture-principles` §1.3 / §4 アンチパターン #5「フロント直叩き」を generator session に常時想起させる。受け入れ条件 §12 で `grep -rn "supabase\.from\|supabase\.rpc" frontend/src` の 0 件維持を入れる。

### 10.4 admin の `app_metadata.role` 二重書き込みの整合性

`/v1/admin/users/{user_id}/role` で `auth.users.app_metadata.role` を `admin` にしたあとに `public.users.role` の UPDATE が失敗するケース。

**対策**: 既存 `register-role` のロールバックパターン（auth → public、失敗時に auth を `unassigned` に戻す）を踏襲。ただし `admin` 昇格の場合、ロールバック先は「元のロール」になる（`unassigned` ではない）ため、UPDATE 前に元のロールを SELECT で保持しておく。

### 10.5 Next.js 16 破壊的変更

`frontend/AGENTS.md`「This is NOT the Next.js you know」に従い、frontend 着手前（Sprint 3）に generator は `node_modules/next/dist/docs/` を参照する。特に Server Component / Client Component の境界、`redirect()` の挙動、`cookies()` / `headers()` の同期 / 非同期 API がトレーニングデータと異なる可能性を疑う。

---

## 11. 完了の定義（DoD）

本 spec を **「完了」とみなせる条件**:

- [ ] 4 Sprint すべてで受入基準が全 pass
- [ ] `supabase/migrations/20260514*` の 3 本が dev 環境で適用済 + Git にコミット済
- [ ] `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` exit 0
- [ ] `pytest backend/tests/` 全 pass（既存 + 新規 test_admin_router.py）
- [ ] 初期 admin 昇格手順を Ryoga 手元で 1 回成功 + `docs/setup-log.md` に追記
- [ ] 共同創業者 3 名が admin ロールで `/admin/makers` を開けることを確認
- [ ] 新規 maker をテスト登録 → `pending_review` で公開系（`/manufacturers`）に**出ない**ことを目視確認 → admin が承認 → `active` になり**出る**ことを目視確認
- [ ] `frontend/src/types/database.ts` に `status` / `'admin'` ロールが反映済
- [ ] §10 受け入れ条件すべて満たし、§5.7 公開 GET フィルタ漏れ grep が clean

---

## 12. 受け入れ条件（フラット展開）

Sprint 単位の受入基準を一覧化（evaluator チェック用）。

### 12.1 DB / migration
- [ ] `users.role` CHECK 制約に `admin` が含まれる
- [ ] `users.status` 列が `NOT NULL DEFAULT 'active' CHECK (status IN ('pending_review','active','frozen','rejected'))` で存在
- [ ] `idx_users_status` 部分 index が `WHERE status <> 'active'` で存在
- [ ] `pnpm gen:types` 後の `database.ts` に上記が反映

### 12.2 backend
- [ ] `/v1/admin/summary` admin で 200 / 非 admin で 403 / 未ログインで 401
- [ ] `/v1/admin/makers/pending` admin で 200 + pending のみ
- [ ] `/v1/admin/makers/{id}/approve` で `status` が `active` に
- [ ] `/v1/admin/makers/{id}/reject` で `status` が `rejected` に
- [ ] `/v1/admin/users/{id}/role` で admin / ja_staff / researcher 昇格、それ以外で 400
- [ ] `/v1/auth/register-role` で `role='admin'` を投げて 400 `invalid_role`
- [ ] `/v1/onboarding/maker` 成功時 `users.status='pending_review'`
- [ ] 公開 `/v1/manufacturers` / `/v1/products`（メーカー名表示部分）/ `/v1/home/*` で `pending_review` / `rejected` / `frozen` メーカーのデータが出ない

### 12.3 frontend
- [ ] `/admin/*` 全 7 ルート（`/admin` + 6 サブ）で admin ログイン 200、非 admin で `/login` リダイレクト
- [ ] `/admin/makers` で承認 / 却下が UI から実行可能
- [ ] B2-B7 が骨組み（プレースホルダ）として存在
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` 0 件

### 12.4 ビルド / 検証
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告 0
- [ ] `pnpm build` 全ルート生成成功
- [ ] `pytest backend/tests/` 全 pass

### 12.5 運用
- [ ] `docs/setup-log.md` に初期 admin ブートストラップ手順が追記済
- [ ] 共同創業者 3 名のうち最低 1 名が手元で admin 昇格成功

---

## 13. 触らないファイル

- 既存 migration `20260415000000_farmille_init.sql` 〜 `20260502150001_phase19_avatars_storage_rls.sql`（**ALTER は禁止、新規 migration ファイルで追加のみ**）
- `backend/app/routers/auth.py:17` の `register_role`（`SIGNUP_ROLES` 不変、admin を自己選択させない）
- `backend/app/routers/reviews.py` / `me.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py`（無関係）
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*`（オンボーディング UI 不変）
- `frontend/src/app/maker/*`（既存メーカー UI、自社プロフ編集は `pending_review` 中もできる前提）
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec 全て

---

## 14. 触るファイル（予想）

### 新規
- `supabase/migrations/20260514000000_admin_users_role_constraint.sql`
- `supabase/migrations/20260514000001_admin_users_status_column.sql`
- `supabase/migrations/20260514000002_admin_public_filters_rls.sql`（実質コメントのみ、必要なら破棄）
- `backend/app/routers/admin.py`
- `backend/tests/test_admin_router.py`
- `frontend/src/app/admin/layout.tsx`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/admin/makers/page.tsx`
- `frontend/src/app/admin/makers/_components/approve-reject-row.tsx`（Client Island）
- `frontend/src/app/admin/users/page.tsx`（骨組み）
- `frontend/src/app/admin/reports/page.tsx`（骨組み）
- `frontend/src/app/admin/articles/page.tsx`（骨組み）
- `frontend/src/app/admin/featured-products/page.tsx`（骨組み）
- `frontend/src/app/admin/banners/page.tsx`（骨組み）

### 既存修正
- `backend/app/main.py`（`admin.router` の include、L75 以降）
- `backend/app/models/schemas.py`（§5.8 のモデル追加）
- `backend/app/routers/onboarding.py`（`onboard_maker` で `status='pending_review'` を書く、§5.6）
- `backend/app/routers/manufacturers_public.py`（公開 GET の `status='active'` フィルタ、§5.7）
- `backend/app/routers/products.py`（メーカー名表示部分のフィルタ、§5.7）
- `backend/app/routers/home.py`（注目の資材表示でメーカー所有データを返す箇所、§5.7）
- `backend/tests/test_onboarding.py`（`status='pending_review'` の追加検証）
- `frontend/src/types/database.ts`（`pnpm gen:types` で自動再生成、コミット必須）
- `docs/setup-log.md`（運用ドキュメント、初期 admin ブートストラップ手順追加）

---

## 15. アンチパターン回避（SKILL §4 対応表）

| # | アンチパターン | 本 spec での回避 |
|---|---|---|
| 1 | 役割の二重管理 | `auth.users.app_metadata.role` と `public.users.role` を `/v1/admin/users/{id}/role` API でのみ同時更新。直 UPDATE 禁止。既存 `register-role` のロールバックパターン踏襲 |
| 2 | JSONB 濫用 | `users.status` は CHECK 制約付き text、enum 風文字列。JSONB / メタデータ列追加なし |
| 3 | UI 都合で DB 捻じ曲げ | `maker_approval_logs` 監査テーブルは UI 上「却下理由」を表示するためだけに作らない（v1.5+） |
| 4 | user_metadata に role | admin ロールも `app_metadata.role` 経由のみ（`user_metadata` 不使用）。ADR-0002 / SKILL §3.2 と整合 |
| 5 | フロント直叩き | `/admin/*` から Supabase 直叩き禁止。BFF `/v1/admin/*` のみ |
| 6 | RLS を第一防御 | 第一防御は `require_role("admin")` BFF ガード。RLS は service_role 経由運用で第二防御に徹する |
| 7 | 変更履歴を本文に | 本 spec に「旧版では」「以前は SQL 直で…」等の時系列記述なし |
| 8 | 注釈メモ | TODO / FIXME を本 spec / 実装コードに残さない（2FA は §10.1 と関連 ADR で辿る） |
| 9 | ついで実装 | B5 通報処理 / B8 注目の資材編集 / B9 記事編集は §1.3 で明示除外 |
| 10 | 未採用技術前提 | 2FA / メール通知自動化 / 監査テーブル等を前提とした実装なし |

---

## 16. Generator への申し送り

### 16.1 着手前に必ず読むもの

- 本 spec 全文
- `docs/decisions/0009-maker-approval-flow-and-admin-panel.md`
- `docs/decisions/0002-reviews-insert-role-scope.md`（二層ロール）
- `frontend/AGENTS.md`（Next.js 16 破壊的変更警告）
- `node_modules/next/dist/docs/`（Sprint 3 着手前、frontend 触る回）
- `backend/app/routers/auth.py`（既存 `register-role` のロールバックパターン参考）
- `backend/app/routers/onboarding.py`（既存 maker サインアップフロー）

### 16.2 既存パターンに合わせるべき箇所

- BFF エラーレスポンス: `JSONResponse(status_code=..., content={"ok": False, "error": code})` 形式（既存 `auth.py:14` 踏襲）。本 spec の `{"detail":..., "code":...}` は新形式ではなく既存形式に合わせる（generator が既存コードを見て整合判断）
- maker_id / user_id を扱う SQL: `backend/app/routers/products.py` の既存 join パターン
- frontend Client Island: 既存 `frontend/src/app/products/[id]/_components/*` パターン

### 16.3 想定アンチパターン（generator が陥りやすい）

- ❌ `users.status` を boolean 列 `is_approved` で表現する → CHECK 制約付き text を堅持
- ❌ admin ロールを `app_metadata.role` ではなく `app_metadata.is_admin: true` で表現する → role 1 本に統一
- ❌ `/admin/makers/page.tsx` を Client Component で書く → Server Component + Client Island
- ❌ B1 承認ボタンで Supabase SDK を直接叩く → BFF 経由
- ❌ `/v1/admin/*` のガードを「ユーザー ID が共同創業者 3 名のどれか」で判定する → `app_metadata.role == 'admin'` で判定
- ❌ migration を 1 本に圧縮する → CHECK 制約変更 / 列追加 / RLS は別 migration に分けてロールバック容易性を保つ

---

## 17. Ryoga への確認事項（着手前 / Sprint 1 着手後の早期確認推奨）

generator 着手前に Ryoga が判断すべき論点を集約。

- [ ] **§4.3 migration 3 の要否**: 実質コメントのみのファイルを作るか、それとも作らず 2 本構成で済ますか
- [ ] **§5.6 `pending_review` への上書きを onboarding 側 vs `register-role` 側**: 本 spec は onboarding 側で書く方針。`register-role` 側で書く方が DOA としてきれいだが既存フロー副作用検証が増える
- [ ] **§5.5 ロール昇格 API のスコープ**: `unassigned` への降格 / `maker` `farmer` への変更を v1 でサポートするか（本 spec では admin / ja_staff / researcher のみ）
- [ ] **§10.2 dev 環境の既存 maker 処遇**: ローンチ前に「テスト用偽メーカー」を運営手動で削除 or `frozen` 化、で問題ないか
- [ ] **§7.3 初期 admin ブートストラップ**: Supabase Studio で 1 名目を手動 UPDATE、で運用上問題ないか（または 1 回限りの bootstrap migration を切るか）

---

## 18. v1 外として明示除外した提案（参考）

ADR-0009 / ワークショップ §A1〜A5 / §M5 で議論されたが、本 spec の射程外と判断した項目:

| 項目 | 除外理由 | 代替（v1 範囲） |
|---|---|---|
| 通報キュー画面（B5、Reddit Mod Queue 風） | A1 ワークショップで未確定、SKILL §1.4 確定 v1 アウト | 通報ボタン UI の有無は別 spec / ADR で議論 |
| 注目の資材編集 UI（B8） | A2 ワークショップで「SQL 運用で十分」確定 | `featured_products` への SQL 直挿入 |
| 記事編集 UI（B9） | A3 ワークショップで「Git PR + markdown」確定 | `articles` への migration 投入 |
| `/admin/login` 専用ログイン + 2FA | v1.5+ 別 ADR 起票予定 | 既存 `/login` + admin ロール guard |
| `maker_approval_logs` 監査テーブル | DOA 「事実のみ」原則、v1 規模で過剰 | Supabase ダッシュボード + Git PR |
| 承認 / 却下時メーカー宛自動通知メール | 縮退ライン、v1.5+ | 運営手動 info@ メール送信 |
| メーカー再申請フロー（rejected → pending_review） | v1 で運用ニーズ低い | SQL 直で `rejected → pending_review` に戻す手動運用 |

---

## 19. Sprint 完了時の Ryoga 確定回答（参考）

Sprint 1 着手前に確定:
- §4.3 migration 3: **作らない**。BFF フィルタで第一防御
- §5.6 pending_review 書き込み: **onboarding 側**
- §7.3 初期 admin bootstrap: **Supabase Studio 手動 UPDATE**
- §10.2 dev DB 既存 maker: **DEFAULT 'active' で backfill、削除しない**
- §5.5 ロール昇格 API: **admin/ja_staff/researcher のみ**

Sprint 2 内 hotfix:
- pagination: `.range(offset, offset+limit-1)` + `count="exact"` に修正
- articles.py: related_products に post-filter 追加

Sprint 4 引継ぎ:
- gen:types は user 手動（dev DB push 後）
- admin.ts は gen:types 後に DB 由来部分を Pick で組み立て直す（v1.5+）
- onboard_maker 二段書き込みロールバック不在は known issue として受入、公開フィルタで二重防御

---

**以上**
