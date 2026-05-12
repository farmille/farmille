# Farmille v1 マイ資材（お気に入り + 候補 + 履歴閲覧）仕様 (Phase 16)

**作成日**: 2026-05-01
**対象 Phase**: Phase 16
**作業ブランチ**: `feat/phase-16-my-materials`（仮）
**実装担当**: worker
**位置づけ**: Carview MyCar の「所有 + 候補（欲しいクルマ）」併存パターンを踏襲し、農家が気になる資材を保管 / 候補管理する個人ページ

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` の以下に準拠する。

- **§1.1 DOA 優先**: `user_favorites` を第 3 正規形で設計、`kind` を text + CHECK 制約で表現（JSONB 不使用）。`UNIQUE (user_id, product_id)` で「同一 user × 同一 product は 1 行のみ（kind 切替で表現）」を業務ルール化（§4.1 で詳述）
- **§1.2 ポータビリティ予算**: Supabase Edge Functions / Realtime 不使用。お気に入り通知は v1 で実装しない（§3.5.4 placeholder のみ）
- **§1.3 責務分離**: 全書き込みは FastAPI `/v1/me/favorites` 経由。フロントから `supabase.from()` / `supabase.rpc()` を呼ばない。Storage は本 Phase 不使用
- **§1.4 v1 スコープ厳守**: 「やる」内の §3.5「マイ資材」のみ実装。`sample_requests` テーブル / メーカー通知 / 上限件数 / プッシュ通知 / フォルダ分け / 比較ボタンは**一切先取りしない**（§13 で明示）。問い合わせ履歴タブは「履歴はまだありません」プレースホルダのみ
- **§3.1 / §3.2 レビュー軸**: 中間テーブルの 2 番目 FK `product_id` に逆引き index、RLS 全テーブル有効、JWT 検証 + role 判定、Pydantic バリデーション、統一エラー、PUT/DELETE 冪等
- **§4 アンチパターン**: #2「JSONB 濫用で逃げる」/ #5「フロント直接 Supabase」/ #9「ついで実装」を §10.4 で個別検証

§3 の共通既定値は **Phase 15 §3 と同じ**（参照）。§13 で本 Phase が踏み込まない領域を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達

- reviewer 系ロール（farmer / ja_staff / researcher）が、`/products/[id]` から「お気に入り」 / 「候補」を追加・解除できる
- `/me/materials` で 3 タブ UI（お気に入り / 候補 / 問い合わせ履歴）を表示できる
- お気に入り ⇄ 候補の `kind` 切替（同一 product を 1 操作で再分類）ができる
- 問い合わせ履歴タブは**プレースホルダのみ**（履歴データソースは v1 アウト、§3 共通プリアンブル参照）

### 1.2 縮退ライン（落ちても v1.5 送り可）

- `/products/[id]` の「お気に入り」「候補」ボタンの細かい UX（toast 表示等）— 縮退時は最低限のテキストフィードバック
- マイ資材一覧のソート切替（v1 は `created_at DESC` 固定）

### 1.3 翌日送り（本 Phase 対象外）

- `sample_requests` テーブル設計 / 作成 API / メーカー側 UI 一切（要件 §5.2.3 確定後の Phase 20+）
- メーカー → 個別ユーザーのサイト内通知（要件 §5.2.4 採否確定後）
- お気に入り上限件数（要件 §5.2.5、v1 は無制限）
- DM / フォルダ分け / 比較ボタン / プッシュ通知

---

## 2. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/me/materials` | Server + Client | 新規ページ。3 タブ UI（お気に入り / 候補 / 問い合わせ履歴） | reviewer 系ロール（未ログインは `/login` redirect） |
| `/products/[id]` | Server + Client | 既存ページに「お気に入り / 候補」ボタン追加（reviewer のみ表示） | 全員閲覧、reviewer のみ操作可 |

新規ページは `/me/materials` 1 枚のみ。既存 `/products/[id]` への加筆は最小範囲。

---

## 3. データ書き込み方針

**Phase 15 §3 と同じ**（共通プリアンブル参照）。本 Phase で追加で意識する点:

- 全書き込み（INSERT / UPDATE / DELETE）は `/v1/me/favorites` 経由
- フロントから Supabase 直叩きは禁止（§7 受け入れ条件 grep 0 件で検証）
- BFF で JWT 検証 → `app_metadata.role in ('farmer','ja_staff','researcher')` 判定 → user_id = `auth.uid()` 強制（payload で受け取らない）

---

## 4. DB スキーマ変更

migration 2 本（テーブル本体 + RLS）を新規追加。既存テーブルへの ALTER は無し（SKILL §1.1）。

### 4.1 新規テーブル定義（migration 1: `20260502130000_phase16_user_favorites_table.sql`）

```sql
-- ユーザーのお気に入り / 候補（kind で区別）
-- 同一 (user_id, product_id) は 1 行のみ（kind 切替で表現、お気に入りと候補に同時保持はしない業務ルール）
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

CREATE TRIGGER trg_user_favorites_updated_at
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**業務ルールの確定**: 同一 user が同一 product を「お気に入り」と「候補」に同時保持はしない。`UNIQUE (user_id, product_id)` で DB 制約として強制。kind 切替は UPDATE で実施（§5.3 PATCH endpoint）。

### 4.2 RLS（migration 2: `20260502130001_phase16_user_favorites_rls.sql`）

```sql
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 自分の行のみ閲覧可
CREATE POLICY "user_favorites_select_owner" ON user_favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT は reviewer 系ロールかつ自分の user_id のみ
CREATE POLICY "user_favorites_insert_reviewer_self" ON user_favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('farmer','ja_staff','researcher')
  );

-- UPDATE / DELETE は所有者のみ
CREATE POLICY "user_favorites_update_owner" ON user_favorites
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_delete_owner" ON user_favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

`maker` / `unassigned` は INSERT 不可（RLS 第二防御）。第一防御は BFF の `require_role()`。

---

## 5. FastAPI エンドポイント

新規ルーター `backend/app/routers/me_favorites.py`（or 既存 `me.py` に追記、worker 判断）。`backend/app/main.py` で `/v1/me` 配下に include。

### 5.1 `GET /v1/me/favorites`

```
GET /v1/me/favorites?kind={kind}&limit={limit}
認証: Bearer JWT 必須
権限: reviewer 系ロール（farmer / ja_staff / researcher）。maker / unassigned は 403
クエリ:
  kind:  Literal["favorite","candidate"] | None  (None なら両方返す)
  limit: int (1-200, default 100)
Response 200:
  {
    "favorites": [
      {
        "id": uuid,
        "kind": "favorite" | "candidate",
        "created_at": datetime,
        "product": {
          "id": uuid,
          "name": str,
          "maker_name": str | None,
          "image_url": str | None,
          "type_name": str | None
        }
      }, ...
    ]
  }
Response 401: 未ログイン
Response 403: maker / unassigned
Response 422: クエリ不正
```

処理:
1. JWT 検証 → role が reviewer 系であることを確認（403 判定）
2. `user_favorites` を `user_id = auth.uid()` で絞り、`kind` 指定時は追加絞り、`created_at DESC` で取得
3. join: `products` + `users.maker_profiles.company_name`（既存 `_flatten_product` 再利用）+ 先頭 `product_images.url`（`order=0`）

### 5.2 `POST /v1/me/favorites`

```
POST /v1/me/favorites
認証: Bearer JWT 必須
権限: reviewer 系ロール
Payload:
  {
    "product_id": uuid (必須),
    "kind": Literal["favorite","candidate"] (必須)
  }
Response 201:
  { "ok": true, "id": uuid, "kind": str }
Response 409: { "detail": "already_exists", "code": "already_exists" }
  // UNIQUE(user_id, product_id) 違反。kind 切替したいときは PATCH を使う旨を error message に記載
Response 404: { "detail": "product_not_found", "code": "product_not_found" }
Response 401 / 403 / 422: 共通形式
```

処理:
1. JWT 検証 + role 判定（403）
2. `products` 存在確認（404）
3. `user_favorites` に INSERT（user_id = auth.uid() を強制、payload では受け取らない → §10.1）
4. UNIQUE 違反 → 409

### 5.3 `PATCH /v1/me/favorites/{id}/kind`

```
PATCH /v1/me/favorites/{id}/kind
認証: Bearer JWT 必須
権限: reviewer 系ロール、かつ当該行の owner
Payload:
  { "kind": Literal["favorite","candidate"] (必須) }
Response 200:
  { "ok": true, "id": uuid, "kind": str }
Response 403: { "detail": "not_owner", "code": "not_owner" }
Response 404: { "detail": "favorite_not_found", "code": "favorite_not_found" }
Response 401 / 422: 共通形式
```

処理:
1. JWT 検証 + role 判定
2. `user_favorites.select("user_id")` で owner 判定（404 → 403 の順）
3. `user_favorites.update({kind})` 実行（updated_at はトリガで自動更新）

### 5.4 `DELETE /v1/me/favorites/{id}`

```
DELETE /v1/me/favorites/{id}
認証: Bearer JWT 必須
権限: reviewer 系ロール、かつ当該行の owner
Response 204: body なし
Response 403 / 404 / 401: 共通形式
```

処理:
1. owner 判定
2. DELETE 実行（冪等: 既に削除済なら 404）

### 5.5 Pydantic スキーマ

```python
from typing import Literal
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

FavoriteKind = Literal["favorite", "candidate"]

class FavoriteCreatePayload(BaseModel):
    product_id: UUID
    kind: FavoriteKind

class FavoriteKindUpdatePayload(BaseModel):
    kind: FavoriteKind

class FavoriteProduct(BaseModel):
    id: UUID
    name: str
    maker_name: str | None
    image_url: str | None
    type_name: str | None

class FavoriteListItem(BaseModel):
    id: UUID
    kind: FavoriteKind
    created_at: datetime
    product: FavoriteProduct

class FavoriteListResponse(BaseModel):
    favorites: list[FavoriteListItem]
```

---

## 6. UI 仕様

### 6.1 `/me/materials`（マイ資材トップ）

**アクセス制御** (Server Component):
- 未ログイン → `/login?next=/me/materials`
- maker / unassigned → `/maker/products` または `/onboarding`（`landingPathForRole(role)` を再利用、ADR-0006）

**レイアウト**:
- 上部: ページタイトル「マイ資材」
- 3 タブ:
  1. **お気に入り**（`?tab=favorite`、default）— `kind=favorite` 一覧
  2. **候補**（`?tab=candidate`）— `kind=candidate` 一覧
  3. **問い合わせ履歴**（`?tab=requests`）— **プレースホルダのみ**: 「履歴はまだありません（メーカーからの『使用版』案内機能は準備中です）」と表示。テーブル / API は本 Phase で**作らない**（§13）
- 各タブ下部にカードリスト: 製品カード（製品名 / メーカー名 / type バッジ / 画像 / 削除ボタン / kind 切替ボタン）

**操作**:
- 削除ボタン: `window.confirm("マイ資材から外しますか？")` → `DELETE /api/me/favorites/{id}` → `router.refresh()`
- kind 切替ボタン: 「候補に移動」 / 「お気に入りに移動」 → `PATCH /api/me/favorites/{id}/kind` → `router.refresh()`
- 0 件時: 「まだ追加していません。製品ページから追加できます」プレースホルダ + `/products` への CTA

### 6.2 `/products/[id]` への加筆

reviewer 系ロールがログインしているとき、ページ上部または右側に**お気に入り / 候補ボタン**を追加。

表示パターン:
- 未ログイン: 「ログインして保存する」リンク（`/login?next=/products/{id}`）
- maker / unassigned: ボタン非表示（または disabled + ツールチップ「この機能は農家・JA・研究者向けです」）
- reviewer かつ未追加: 「お気に入りに追加」「候補に追加」の 2 ボタン
- reviewer かつ追加済: 現在の kind を示す表示 + 「外す」ボタン + kind 切替ボタン

実装:
- Server Component で `GET /v1/me/favorites?kind=...` を呼んで現在の状態を取得（または専用の `GET /v1/me/favorites/by-product/{product_id}` を新設するか worker 判断、シンプルさ優先で前者）
- ボタン操作は Client Component で `POST/PATCH/DELETE /api/me/favorites/*` を呼び、成功後 `router.refresh()`

### 6.3 BFF proxy（Next.js Route Handler）

既存パターン踏襲:
- `frontend/src/app/api/me/favorites/route.ts` (GET / POST)
- `frontend/src/app/api/me/favorites/[id]/route.ts` (DELETE)
- `frontend/src/app/api/me/favorites/[id]/kind/route.ts` (PATCH)

各 route で Cookie から JWT を取り出し、Authorization Header で FastAPI に転送。

### 6.4 デザイン

- 既存 `globals.css` 継続使用（design-tokens の `--primary`、tabs / Card / Button shadcn）
- 角丸は `rounded` / `rounded-md`（design-tokens 準拠）
- 削除ボタン: `variant="destructive"`

---

## 7. 触らないファイル

- `supabase/migrations/20260415*` / `20260420*` / `20260423*` / `20260424*` / `20260502120*`（Phase 15 で先行追加されている場合を含む）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py` / `reviews.py` / `articles.py`
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/maker/*` / `frontend/src/app/articles/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec 全て

---

## 8. 触るファイル（予想）

### 新規
- `supabase/migrations/20260502130000_phase16_user_favorites_table.sql`
- `supabase/migrations/20260502130001_phase16_user_favorites_rls.sql`
- `backend/app/routers/me_favorites.py`（or `me.py` に追記）
- `frontend/src/app/me/materials/page.tsx`
- `frontend/src/app/me/materials/_components/favorites-tab.tsx`
- `frontend/src/app/me/materials/_components/requests-placeholder.tsx`
- `frontend/src/app/me/materials/_components/favorite-card.tsx`
- `frontend/src/app/products/[id]/_components/favorite-button.tsx`
- `frontend/src/app/api/me/favorites/route.ts`
- `frontend/src/app/api/me/favorites/[id]/route.ts`
- `frontend/src/app/api/me/favorites/[id]/kind/route.ts`

### 既存修正
- `backend/app/main.py`（router include）
- `backend/app/models/schemas.py`（§5.5 のモデル追加）
- `frontend/src/app/products/[id]/page.tsx`（`<FavoriteButton>` 配置）

---

## 9. 受け入れ条件

### 9.1 API 動作
- [ ] farmer で `POST /v1/me/favorites` 成功 → 1 行 INSERT、`user_id` は JWT sub
- [ ] 同一 farmer + product を 2 回 POST → 409 `already_exists`
- [ ] maker で POST → 403、unassigned で POST → 403
- [ ] 未ログインで POST → 401
- [ ] 存在しない product_id で 404 `product_not_found`
- [ ] kind が `favorite` / `candidate` 以外で 422
- [ ] `GET /v1/me/favorites?kind=candidate` で自分の候補のみ返る
- [ ] 他人の id で `PATCH .../kind` / `DELETE` → 403 `not_owner`
- [ ] 存在しない id で 404 `favorite_not_found`
- [ ] PATCH で kind を切替 → DB の kind が更新、updated_at 更新

### 9.2 UI 動作
- [ ] reviewer で `/me/materials` にアクセスすると 3 タブ表示
- [ ] お気に入り / 候補タブ切替で URL クエリ `?tab=...` 反映
- [ ] 問い合わせ履歴タブはプレースホルダ文言のみ（API 呼び出しなし）
- [ ] `/products/[id]` の reviewer ログイン時にお気に入り / 候補ボタン表示
- [ ] お気に入り追加後、`/me/materials?tab=favorite` で表示
- [ ] kind 切替・削除が UI 上で即反映
- [ ] 未ログインで `/me/materials` → `/login?next=/me/materials` redirect
- [ ] maker で `/me/materials` → `/maker/products` redirect

### 9.3 BFF 原則
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）
- [ ] フロントから `supabase.storage.*` 新規呼び出しなし（本 Phase で画像新規 upload なし）

### 9.4 ビルド / 検証
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] `supabase db push --linked` で dev 適用成功

---

## 10. 設計上の注意

### 10.1 user_id の書き換え攻撃防止

POST payload で `user_id` を受け取らない。BFF で `user_id = current_user.id` を強制。RLS が第二防御として `auth.uid() = user_id` を強制（SKILL §3.2 / §4.2）。

### 10.2 kind 切替を PATCH /kind に分離する理由（**spec で確定**）

`PATCH /v1/me/favorites/{id}/kind` を**サブパス分離**で確定する（統合形 `PATCH /v1/me/favorites/{id}` は採用しない）。理由（SKILL §3.2 API 設計レビュー軸）:

- 将来 `note` 列等を追加した時に「kind 切替」と「note 編集」を別 endpoint で扱える（拡張余地）
- API 仕様が「何を変えるか」明示的になり、フロント側のミスを防ぐ
- 冪等性が明確（同じ kind を PATCH しても結果は同じ）
- Pydantic schema が `FavoriteKindUpdatePayload` 単一目的で読みやすい（統合形は optional フィールド集合で「全部 None なら 422 か」等の非明示なロジックが必要）

### 10.3 アンチパターン回避（SKILL §4）

| # | 回避内容 |
|---|---|
| 1 役割の二重管理 | 該当なし |
| 2 JSONB 濫用 | `kind` は text + CHECK、構造を確定してから実装 |
| 3 UI 都合で DB 捻じ曲げ | `created_at` の他に `updated_at` のみ追加、UI 都合の冗長列なし |
| 4 user_metadata に role | 該当なし。BFF は `app_metadata.role` のみ参照 |
| 5 フロント直叩き | お気に入り CRUD は全 BFF 経由、grep 0 件で検証 |
| 6 RLS を第一防御 | BFF で role + owner 判定、RLS は第二防御 |
| 7 変更履歴を本文に | 「旧版では」等の時系列記述なし |
| 8 注釈メモ | TODO / FIXME を本文に残さない |
| 9 ついで実装 | `sample_requests` / 上限 / 通知 / 比較 / DM は §13 で明示除外 |
| 10 未採用技術前提 | Sentry / Realtime 等の前提コードなし |

### 10.4 「問い合わせ履歴」プレースホルダの設計理由（§9 ついで実装回避）

要件 §3.5.4 に「問い合わせ履歴」タブは記載されているが、データソース `sample_requests` は v1 アウト（§5.2.3 業務フロー未確定）。SKILL §4.4 アンチパターン #9「ついで実装」回避のため:
- テーブルを先行作成しない
- カラム案を「将来検討」として書かない
- placeholder div は配置するが、API 呼び出しゼロ
- placeholder 文言で「準備中」を明示し、ユーザー期待管理

§5.2.3 確定後の Phase 20+ で `sample_requests` テーブル / API / UI を一括投入する。本 Phase ではタブの存在のみ確保。

### 10.5 上限件数（要件 §5.2.5）

v1 は無制限（DB 制約として上限なし）。要件 §5.2.5 確定後、`CHECK` 制約 or BFF 層での件数チェックを後続 Phase で追加。本 Phase では実装しない。

### 10.6 整合性: products 削除時の挙動

`user_favorites.product_id` は `ON DELETE CASCADE`。メーカーが資材を削除すると、その製品を保持していた reviewer の favorite 行も自動消去される。UX 観点で reviewer に通知しないが、要件 §3.3.7 と整合（v1 は通知不採用）。

---

## 11. Ryoga 判断

### 11.1 確定済
- ファイル名 `my-materials.md`
- `sample_requests` テーブルは Phase 16 で**作成しない**（SKILL §4.4 #9 回避、§5.2.3 確定後の Phase 20+）
- 問い合わせ履歴タブはプレースホルダのみ
- 「お気に入り」と「候補」は同一 product で同時保持しない（`UNIQUE (user_id, product_id)`）
- お気に入り上限件数は v1 無制限
- BFF endpoint 命名は `/v1/me/favorites` で確定
- PATCH endpoint は **`/kind` サブパス分離**で確定（§10.2、統合形は採用しない）

### 11.2 worker 判断可（Ryoga 確認不要）
- お気に入りボタンの細かい UX（toast / inline text / spinner）
- `/me/materials` のタブ実装方式（URL クエリ vs Tabs コンポーネント、shadcn `<Tabs>` 推奨）

### 11.3 v1 ローンチまでに biz 確定する論点（本 Phase では実装しない）
- 要件 §5.2.4 メーカー通知の v1 採否
- 要件 §5.2.5 上限件数
- 要件 §5.2.20 「お気に入り」と「候補」の UI 切替具体形（v1 はタブで暫定確定、最終形は biz 議論）

---

## 12. 作業スケジュール（目安）

| Step | 内容 | 見込み |
|---|---|---|
| 1 | migration 2 本（テーブル + RLS） | 1 時間 |
| 2 | backend: me_favorites.py + schemas（4 endpoint） | 2.5 時間 |
| 3 | frontend: BFF proxy 3 本 | 1 時間 |
| 4 | frontend: `/me/materials` ページ + 3 タブ | 2 時間 |
| 5 | frontend: `/products/[id]` のお気に入りボタン埋め込み | 1.5 時間 |
| 6 | 検証（pnpm tsc/lint/build, supabase db push, 手動 E2E） | 1.5 時間 |
| 合計 | | **約 9.5 時間** |

---

## 13. §5 未確定領域との境界（やらないことの明示）

本 Phase で**実装しない**もの（要件 §3.5 / §5.2 / SKILL §1.4 と整合）:

- **`sample_requests` テーブルの設計・作成・カラム案記述・migration の追加**（一切しない、Phase 20+）
- **「使用版」案内 CTA の業務フロー**（要件 §5.2.3、Phase 17 と本 Phase の両方で先取り禁止）
- **メーカー → 個別ユーザーのサイト内通知**（要件 §5.2.4）
- **お気に入り上限件数**（要件 §5.2.5、v1 は無制限）
- **DM 機能**（要件 §3.5.7、法規制で当面不可）
- **お気に入りのフォルダ分け / タグ付け**（要件 §3.5.7、恒久的に不採用）
- **「比較する」ボタン**（要件 §3.5.7、恒久的に不採用）
- **プッシュ通知 / リアルタイム更新**（SKILL §1.4 やらない）
- **時間管理項目**（車検満了日相当のもの、要件 §3.5.7、資材には業務的に該当せず恒久不採用）
- **公開プロフィールページ `/u/{username}`** からの他者お気に入り閲覧（要件 §3.6.7、v1.5+）
- **メーカー側でのお気に入り集計 / 「使用版」希望者リスト UI**（要件 §5.3.3）

---

**以上**
