# Farmille v1 企業ページ基本（一覧 / 詳細 / 編集）仕様 (Phase 17)

**作成日**: 2026-05-01
**対象 Phase**: Phase 17
**作業ブランチ**: `feat/phase-17-manufacturers-public`（仮）
**実装担当**: worker
**位置づけ**: 既存 `users (role='maker')` + `maker_profiles` を公開ページ化。AgList 風企業ページの「企業情報 + 自社製品一覧」までを v1 で確定し、お悩み相談室・「使用版」CTA は §13 で明示除外

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` の以下に準拠する。

- **§1.1 DOA 優先**: 既存 `maker_profiles` を**そのまま公開**。新規カラム追加は v1 では行わない（要件 §5.2.10「公開項目最終確定」が biz 未確定のため）。新テーブルも作らない（SKILL §1.1: ALTER 前に新テーブル + 移行検討、ただし本 Phase は読み出し中心で ALTER も新テーブルも不要）
- **§1.2 ポータビリティ予算**: Supabase Edge Functions / Realtime 不使用。BFF 経由
- **§1.3 責務分離**: 全 API は FastAPI `/v1/*` 経由。フロント直叩き禁止。Storage は本 Phase 不使用
- **§1.4 v1 スコープ厳守**: 「やる」内の §3.3「企業（メーカー公開）ページ」のうち **§5.2.1 / §5.2.2 / §5.2.3 / §5.2.10 / §5.2.19 で未確定の部分（お悩み相談室テーブル / 「使用版」CTA / 追加公開項目）は一切実装しない**。プレースホルダ div / disable ボタン / 将来用カラム追加すらしない（§13 で明示）
- **§3.1 / §3.2 レビュー軸**: 全 endpoint `/v1` プレフィックス、JWT 検証 + role 判定、Pydantic バリデーション、統一エラー、PUT 冪等
- **§4 アンチパターン**: #9「ついで実装」を §10 で詳述。お悩み相談室の placeholder すら作らない理由を明記

§3 の共通既定値は **Phase 15 §3 と同じ**（参照）。§13 で本 Phase が踏み込まない領域を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達

- 未ログイン含む全ユーザーが `/manufacturers`（メーカー一覧）と `/manufacturers/[id]`（メーカー詳細 + 自社製品一覧）を閲覧できる
- メーカー本人が `/maker/profile` で自社プロフィール（既存 `maker_profiles` カラムのみ）を編集できる
- URL は `id`（uuid）ベースで実装。`slug` は要件 §5.2.9 確定後の後続 phase で追加

### 1.2 縮退ライン（落ちても v1.5 送り可）

- メーカー一覧のソート / フィルタ（v1 は `created_at DESC` 固定）
- メーカー一覧のページネーション（v1 は `limit=100` で固定）

### 1.3 翌日送り（本 Phase 対象外、§13 と一体）

- お悩み相談室（要件 §5.2.1 / §5.2.2 / §5.2.19）— **テーブルもプレースホルダ div も一切作らない**
- 「使用版に興味がありますか？」CTA（要件 §5.2.3）— **ボタンも作らない**
- 追加公開項目（要件 §5.2.10）— 既存カラム以外は追加しない
- メーカー側拡張ダッシュボード（要件 §5.3.3）
- メーカー検索 / フィルタ（v1.5+）
- slug ベース URL（要件 §5.2.9 確定後）

---

## 2. 画面一覧

| パス | 種別 | データ源 | 認証 |
|---|---|---|---|
| `/manufacturers` | Server Component | BFF `GET /v1/manufacturers` | 不要 |
| `/manufacturers/[id]` | Server Component | BFF `GET /v1/manufacturers/{id}` | 不要 |
| `/maker/profile` | Server + Client | BFF `GET /v1/maker/profile` / `PUT /v1/maker/profile` | maker のみ |

新規ページ 3 枚。既存 `/maker/products` には触らない（Phase 8 で完成済）。

> **用語の整合**: 要件 docs では「メーカー公開ページ」「manufacturers」と表記されているが、実 DB は `users (role='maker')` + `maker_profiles` の組合せでメーカーを表現する。本 spec では URL 上は `/manufacturers/*`（公開向けの自然な名詞）、BFF endpoint も `/v1/manufacturers`（公開）/ `/v1/maker/profile`（本人）と分離。`manufacturers` テーブルを新規作成することは**しない**（既存スキーマで完結）。

---

## 3. データ書き込み方針

**Phase 15 §3 と同じ**（共通プリアンブル参照）。本 Phase で追加で意識する点:

- 公開 GET `/v1/manufacturers` / `/v1/manufacturers/{id}` は未認証可
- `/v1/maker/profile` PUT は Bearer JWT 必須かつ `app_metadata.role == 'maker'`
- BFF で `user_id = auth.uid()` を強制、payload で受け取らない（書き換え攻撃防止、SKILL §3.2）

---

## 4. DB スキーマ変更

**migration 追加なし**。既存 `maker_profiles` をそのまま使用する。

### 4.1 既存 `maker_profiles` の現行カラム（init.sql:128-134）

```sql
CREATE TABLE maker_profiles (
  user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  prefecture   text,
  city         text,
  note         text            -- 事業概要 nullable
);
```

本 Phase で公開する項目は上記 4 列 + `users.name`（担当者名 / 表示名としては内部用とし、公開ページには出さない）。**追加カラムは導入しない**（要件 §5.2.10「公開項目最終確定」が未確定のため、SKILL §4.4 #9「ついで実装」回避）。

### 4.2 既存 RLS（変更なし）

`maker_profiles_select_self` / `maker_profiles_insert_self` / `maker_profiles_update_self` / `maker_profiles_delete_self` の 4 ポリシーが既に `20260415000003_farmille_rls.sql` に存在。

**重要な制約**: 既存 RLS は `auth.uid() = user_id` で **本人のみ SELECT 可**。公開ページは BFF 側で `service_role` クライアント経由で取得することで RLS を bypass する（既存 `/v1/products` で同パターン採用済、`backend/app/services/supabase.py` の admin client）。RLS は第二防御として本人以外の直接 SELECT を防ぐ役割を維持（SKILL §3.1 / §4.2）。

### 4.3 RLS 変更の有無

**なし**。`maker_profiles` を `anon` に SELECT 開放することはしない（業務上の追加項目が将来増えた時、本人のみ閲覧したい列が出る可能性がある。BFF で公開項目を絞って返す方針が DOA に整合）。

---

## 5. FastAPI エンドポイント

新規ルーター `backend/app/routers/manufacturers.py`（公開）と `backend/app/routers/maker_profile.py`（本人編集）を追加。`backend/app/main.py` で `/v1/manufacturers` と `/v1/maker` 配下に include（後者は既存 `/v1/maker/products` と同じ namespace）。

### 5.1 `GET /v1/manufacturers`

```
GET /v1/manufacturers?limit={limit}
認証: 不要
クエリ:
  limit: int (1-200, default 100)
Response 200:
  {
    "manufacturers": [
      {
        "id": uuid,                 # users.id
        "company_name": str,
        "prefecture": str | None,
        "city": str | None,
        "product_count": int        # 公開製品数（products.maker_id = id でカウント）
      }, ...
    ]
  }
```

処理:
1. service_role で `users` を `role='maker'` で絞る
2. `maker_profiles` を join（`company_name` が NULL のメーカーは表示しない = INNER JOIN）
3. `products` を `maker_id` で aggregate して `product_count` 算出
4. `created_at DESC` で `limit` 件返却

### 5.2 `GET /v1/manufacturers/{id}`

```
GET /v1/manufacturers/{id}
認証: 不要
パスパラメータ:
  id: uuid (users.id を指す)
Response 200:
  {
    "id": uuid,
    "company_name": str,
    "prefecture": str | None,
    "city": str | None,
    "note": str | None,
    "products": [
      {
        "id": uuid,
        "name": str,
        "type_name": str | None,
        "image_url": str | None,
        "created_at": datetime
      }, ...
    ]
  }
Response 404: { "detail": "manufacturer_not_found", "code": "manufacturer_not_found" }
```

処理:
1. `users.role='maker'` かつ `users.id={id}` で 1 行取得（404 判定）
2. `maker_profiles` を inner join（profile 不存在は 404 と同等扱い）
3. `products` を `maker_id={id}` で取得（既存 `_flatten_product` 再利用、`product_images.url` の order=0 を image_url に）

### 5.3 `GET /v1/maker/profile`

```
GET /v1/maker/profile
認証: Bearer JWT 必須
権限: maker のみ
Response 200:
  {
    "user_id": uuid,
    "company_name": str,
    "prefecture": str | None,
    "city": str | None,
    "note": str | None
  }
Response 404: { "detail": "profile_not_found", "code": "profile_not_found" }
  // maker でロールは付いているが maker_profiles 行が無い（onboarding 未完了等）
Response 403: maker 以外
Response 401: 未ログイン
```

処理:
1. JWT 検証 + role 判定
2. service_role で `maker_profiles.select().eq('user_id', auth.uid())` で取得（404 判定）

### 5.4 `PUT /v1/maker/profile`

```
PUT /v1/maker/profile
認証: Bearer JWT 必須
権限: maker のみ
Payload:
  {
    "company_name": str (1-100, 必須),
    "prefecture": str | None (max 20),
    "city": str | None (max 50),
    "note": str | None (max 1000)
  }
Response 200:
  { "ok": true }
Response 404: profile_not_found（onboarding 未完了で行が存在しない場合）
Response 403 / 401 / 422: 共通形式
```

処理:
1. JWT 検証 + role 判定
2. service_role で `maker_profiles.update({...}).eq('user_id', auth.uid())` 実行
3. 行が存在しない場合 404（onboarding 完了前提のため、本 endpoint で INSERT はしない。新規作成は既存 `/v1/onboarding/maker` 経由）

### 5.5 Pydantic スキーマ

```python
from typing import Annotated
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class ManufacturerListItem(BaseModel):
    id: UUID
    company_name: str
    prefecture: str | None
    city: str | None
    product_count: int = Field(ge=0)

class ManufacturerListResponse(BaseModel):
    manufacturers: list[ManufacturerListItem]

class ManufacturerProduct(BaseModel):
    id: UUID
    name: str
    type_name: str | None
    image_url: str | None
    created_at: datetime

class ManufacturerDetailResponse(BaseModel):
    id: UUID
    company_name: str
    prefecture: str | None
    city: str | None
    note: str | None
    products: list[ManufacturerProduct]

class MakerProfileResponse(BaseModel):
    user_id: UUID
    company_name: str
    prefecture: str | None
    city: str | None
    note: str | None

class MakerProfileUpdatePayload(BaseModel):
    company_name: Annotated[str, Field(min_length=1, max_length=100)]
    prefecture: Annotated[str | None, Field(default=None, max_length=20)]
    city: Annotated[str | None, Field(default=None, max_length=50)]
    note: Annotated[str | None, Field(default=None, max_length=1000)]
```

---

## 6. UI 仕様

### 6.1 `/manufacturers`（一覧）

- Server Component
- 上部: ページタイトル「メーカー一覧」
- カード: company_name / prefecture + city / product_count（「資材 N 件」表示）
- カードクリックで `/manufacturers/[id]` に遷移
- 0 件時: 「メーカーがまだ登録されていません」プレースホルダ

### 6.2 `/manufacturers/[id]`（詳細）

- Server Component
- ヘッダー: company_name（h1）/ prefecture + city / note（事業概要）
- 「自社製品一覧」セクション: 既存 `<ProductCard>` で横並び（Phase 6 既存コンポーネント再利用、メーカー名表示は冗長なので可能なら `hideMakerName` prop を使うか、クライアント側で省略表示）
- 「お悩み相談室」セクション: **作らない**（§13）
- 「使用版に興味がありますか？」CTA: **作らない**（§13）

### 6.3 `/maker/profile`（メーカー本人編集）

**アクセス制御** (Server Component):
- 未ログイン → `/login?next=/maker/profile`
- maker 以外 → `landingPathForRole(role)` redirect（ADR-0006）
- maker かつ `GET /v1/maker/profile` が **404 `profile_not_found`** を返した場合（onboarding 未完了）→ `/onboarding/maker` redirect（既存 onboarding フローへ誘導、新規プレースホルダ画面は作らない）

**フォーム要素**:

| 項目 | 型 | 必須 | UI |
|---|---|---|---|
| company_name | text | ✅ | `<Input>` max 100 |
| prefecture | text | | `<Input>` max 20（v1.5+ で都道府県プルダウン化検討） |
| city | text | | `<Input>` max 50 |
| note | text | | `<Textarea>` rows=6, max 1000（事業概要） |

**送信**:
- ローディング中は全 input disabled
- 成功後 `/maker/profile` に留まり「保存しました」のフィードバック
- 失敗時はフォーム上部にエラー表示
- BFF proxy 経由（`frontend/src/app/api/maker/profile/route.ts`、PUT のみ。GET は Server Component で直 fetch）

### 6.4 BFF proxy

- `frontend/src/app/api/maker/profile/route.ts` (PUT)

GET は Server Component から `${API_URL}/v1/maker/profile` を Bearer JWT 付きで直 fetch（既存パターン）。

### 6.5 デザイン

- 既存 `globals.css` 継続使用
- shadcn `Card` / `Button` / `Input` / `Textarea` 再利用
- 角丸 `rounded` / `rounded-md`、デザイントークン準拠

---

## 7. 触らないファイル

- `supabase/migrations/*` 全て（migration 追加なし、§4 参照）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py`（既存自社資材 router）/ `products.py` / `reviews.py` / `me.py` / `articles.py` / `me_favorites.py`
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/products/*` / `frontend/src/app/maker/products/*` / `frontend/src/app/me/*` / `frontend/src/app/articles/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec 全て

---

## 8. 触るファイル（予想）

### 新規
- `backend/app/routers/manufacturers.py`（公開 GET 2 本）
- `backend/app/routers/maker_profile.py`（本人 GET / PUT）
- `frontend/src/app/manufacturers/page.tsx`
- `frontend/src/app/manufacturers/[id]/page.tsx`
- `frontend/src/app/manufacturers/_components/manufacturer-card.tsx`
- `frontend/src/app/maker/profile/page.tsx`
- `frontend/src/app/maker/profile/_components/profile-form.tsx`
- `frontend/src/app/api/maker/profile/route.ts`（PUT proxy）

### 既存修正
- `backend/app/main.py`（`manufacturers.router` / `maker_profile.router` の include）
- `backend/app/models/schemas.py`（§5.5 のモデル追加）

---

## 9. 受け入れ条件

### 9.1 API 動作
- [ ] 未認証で `GET /v1/manufacturers` 200、`role='maker'` かつ `maker_profiles` 行ありのみ返る
- [ ] `GET /v1/manufacturers/{id}` で 200、`products` 配列に当該メーカーの資材のみ
- [ ] 存在しない id で 404 `manufacturer_not_found`
- [ ] `role='farmer'` の id で 404
- [ ] `GET /v1/maker/profile` を maker で 200、自分のプロフィール返る
- [ ] farmer / unassigned で `GET /v1/maker/profile` → 403
- [ ] 未ログインで → 401
- [ ] `PUT /v1/maker/profile` を maker で成功 → DB 更新
- [ ] `company_name` を空文字で 422
- [ ] 他人の `user_id` を payload に入れても無視される（BFF が `auth.uid()` で強制）
- [ ] onboarding 未完了 maker で PUT → 404 `profile_not_found`

### 9.2 UI 動作
- [ ] `/manufacturers` でカード一覧表示
- [ ] カードクリックで `/manufacturers/[id]` 遷移、自社製品一覧が表示
- [ ] お悩み相談室 / 「使用版」CTA / 追加項目が**画面に存在しない**（§13 検証）
- [ ] `/maker/profile` で maker のみアクセス可、フォーム編集 → 保存
- [ ] 未ログインで `/maker/profile` → `/login?next=/maker/profile` redirect
- [ ] farmer で `/maker/profile` → `landingPathForRole` redirect
- [ ] onboarding 未完了 maker で `/maker/profile` 直アクセス → `/onboarding/maker` redirect

### 9.3 BFF 原則
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）
- [ ] フロントから storage 直叩きなし（本 Phase で画像取扱なし）

### 9.4 ビルド / 検証
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] migration 追加なしのため `supabase db push` 不要

---

## 10. 設計上の注意

### 10.1 `manufacturers` テーブルを新規作成しない理由（DOA）

要件 docs では「メーカー」「manufacturers」と表記されているが、既存 DB は `users (role='maker')` + `maker_profiles` の構造で確定済。本 Phase で `manufacturers` 単独テーブルを作ると:
- 既存 `products.maker_id REFERENCES users(id)` との整合維持コストが発生
- 「メーカーは特殊な user である」という DOA 上の事実が崩れる
- 移行 migration を増やすことになり、技術負債（SKILL §1.1）

URL 上 `/manufacturers/*` を使うのは「公開ページの自然な名詞」としての選択であり、DB 構造は変えない。BFF 層が「URL 用の公開向け名前」と「DB 内部の実態名」のマッピングを担当する。

### 10.2 公開ページが service_role 経由で SELECT する理由

既存 `maker_profiles` の RLS は本人のみ SELECT 可（init RLS と整合）。公開ページのために RLS を `anon` に開放すると、将来「公開列」と「本人のみ列」を分けたい場合に再度制限する migration が必要になる。BFF が公開項目を選択して返す方針なら、DB は不変のまま列追加が可能（DOA 整合）。

### 10.3 アンチパターン回避（SKILL §4）— 特に #9「ついで実装」

| # | 回避内容 |
|---|---|
| 1 役割の二重管理 | role 書き込みなし（GET / PUT のみ） |
| 2 JSONB 濫用 | 既存スキーマ流用、JSONB 追加なし |
| 3 UI 都合で DB 捻じ曲げ | 既存カラムのみ使用、UI 都合の追加カラムなし |
| 4 user_metadata に role | 該当なし、`app_metadata.role` のみ参照 |
| 5 フロント直叩き | 全 API BFF 経由 |
| 6 RLS を第一防御 | BFF で role 判定、RLS は第二防御 |
| 7 変更履歴を本文に | 「旧版では」等の時系列記述なし |
| 8 注釈メモ | TODO / FIXME 残置なし |
| 9 ついで実装 | **お悩み相談室テーブル / プレースホルダ div / 「使用版」CTA / 追加カラムを一切作らない**（§13 で個別列挙） |
| 10 未採用技術前提 | Sentry / Realtime 等の前提コードなし |

#### #9 の特別な遵守条件

要件 §3.3 の画面要素には「お悩み相談室セクション」「『使用版に興味がありますか？』CTA」が含まれているが、要件本文で「画面に存在することのみ確定。中身 / 業務フローは §5.2.1 / §5.2.2 / §5.2.3 確定後」と明記されている。SKILL §4.4 #9 と §1.4「未確定を勝手に『やる』へ昇格させない」に従い:

- **テーブル設計しない**（`manufacturer_threads` 等の名称も書かない）
- **HTML 上のプレースホルダ div も作らない**（「準備中」と書いた空セクションも禁止）
- **disable された CTA ボタンも作らない**
- **将来用カラム追加もしない**

これは「先取り実装ゼロ」の徹底。要件 §5.2.1〜§5.2.3 / §5.2.10 / §5.2.19 が biz 議論で確定後、別 Phase で一括投入する。

### 10.4 URL 形式は `id` で実装、slug は §5.2.9 確定後

要件 §5.2.9 で「メーカー公開ページ URL 形式（slug か id か、ADR-0006 整合）」が未確定。本 Phase では `id`（uuid）ベースで実装し、slug 列の追加 / カラム予約 / migration はしない。slug 採用が決まったら、別 Phase で:
1. `users` or `maker_profiles` に slug 列追加（unique index 付き、ALTER ADD COLUMN）
2. 既存メーカーに slug 自動採番（migration で）
3. URL を `/manufacturers/[slug]` に変更（`[id]` から redirect）

を一括実施。本 Phase で先取り設計しない（SKILL §1.1）。

### 10.5 product_count の算出コスト

`/v1/manufacturers` は全メーカー × 製品数集計。v1 規模（数百メーカー以下）では問題ないが、1,000 超になったら:
- マテビュー化（DOA 整合）
- BFF 内 cache（Railway dyno のメモリ）

を検討。v1.5+ で再評価、本 Phase では素朴な COUNT クエリで実装。

---

## 11. Ryoga 判断

### 11.1 確定済
- ファイル名 `manufacturers-public.md`
- URL は `id` ベース（slug は要件 §5.2.9 確定後）
- 既存 `manufacturers` テーブルを新規作成しない（既存 `maker_profiles` 流用）
- お悩み相談室 / 「使用版」CTA / 追加公開項目は本 Phase でゼロ実装（§13）
- 公開ページは BFF が service_role で SELECT、RLS は本人 SELECT のみ維持

### 11.2 worker 判断可（Ryoga 確認不要）
- メーカーカードの細かいデザイン（design-tokens 準拠で worker 判断）
- 「自社製品一覧」セクションの表示形式（grid / list、Phase 8 既存パターン踏襲推奨）
- `/maker/profile` のフォームレイアウト（既存 onboarding/maker のフォーム部品再利用検討、worker 判断）

### 11.3 v1 ローンチまでに biz 確定する論点（本 Phase では実装しない）
- 要件 §5.2.1 / §5.2.2 / §5.2.19 お悩み相談室業務フロー + テーブル設計
- 要件 §5.2.3 「使用版」CTA 業務フロー
- 要件 §5.2.9 メーカー公開ページ URL 形式（slug or id）
- 要件 §5.2.10 公開項目最終確定 + 編集権限粒度
- 要件 §5.3.3 メーカー側ダッシュボード拡張

---

## 12. 作業スケジュール（目安）

| Step | 内容 | 見込み |
|---|---|---|
| 1 | backend: manufacturers.py（公開 GET 2 本）+ schemas | 2 時間 |
| 2 | backend: maker_profile.py（本人 GET / PUT）+ schemas | 1.5 時間 |
| 3 | frontend: `/manufacturers` 一覧 + カード | 1.5 時間 |
| 4 | frontend: `/manufacturers/[id]` 詳細 + 自社製品一覧 | 2 時間 |
| 5 | frontend: `/maker/profile` 編集ページ + BFF proxy | 1.5 時間 |
| 6 | 検証（pnpm tsc/lint/build, 手動 E2E） | 1 時間 |
| 合計 | | **約 9.5 時間** |

---

## 13. §5 未確定領域との境界（やらないことの明示）

本 Phase で**実装しない**もの（要件 §3.3 / §5.2 / SKILL §1.4 と整合）:

- **お悩み相談室テーブル `manufacturer_threads` / `manufacturer_thread_replies` の設計・カラム案・migration**（要件 §5.2.1 / §5.2.2 / §5.2.19、Phase 17 で一切しない）
- **お悩み相談室の HTML プレースホルダ div / 「準備中」セクション**（先取り UI ゼロ）
- **「使用版に興味がありますか？」CTA ボタン**（要件 §5.2.3、disable 状態でも作らない）
- **`sample_requests` テーブル / API**（Phase 16 と本 Phase の両方で先取り禁止、Phase 20+）
- **メーカー公開ページの追加カラム**（要件 §5.2.10、`logo_url` / `website_url` / `industry` / `founded_year` / `contact_email` 等、本 Phase ではゼロ追加）
- **slug 列 / slug ベース URL**（要件 §5.2.9 確定後）
- **メーカー検索 / フィルタ**（v1.5+）
- **メーカー側拡張ダッシュボード**（要件 §5.3.3、`/maker/insights` `/maker/dashboard` 等）
- **メーカー有料化（広告 / プレミアム枠）**（要件 §3.3.7、課金モデル未確定）
- **DM 機能**（要件 §3.3.7、法規制で当面不可）
- **メーカー → 個別ユーザー通知**（Phase 16 §13 と整合）
- **メーカーアカウント承認フロー**（要件 §5.3.5）
- **いいね / リアクション / フォロー**

---

**以上**
