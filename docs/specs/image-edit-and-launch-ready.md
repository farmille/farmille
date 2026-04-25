# Farmille v1 画像編集 + ローンチ準備 仕様 (Phase 10)

**作成日**: 2026-04-24
**対象**: レビュー・資材の画像 add/remove 対応（Phase 9 縮退分の回収）+ v1 ローンチ前に必須の負債返済
**作業ブランチ**: `feat/image-edit-and-launch-ready`（派生元: Phase 9 merge 後の `main`。未 merge なら `feat/edit-delete` に stack）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`review-post.md` / `maker-product.md` / `edit-delete.md` と同水準）
**前提 Phase**: Phase 7（レビュー投稿）/ Phase 8（資材登録）/ Phase 9（編集・削除）完了

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール（v1 ローンチ手前の最後のコード整備）

**必達**:
- レビュー編集時に **既存画像の削除** + **新規画像の追加** ができる（差し替え）
- 資材編集時に **既存画像の削除** + **新規画像の追加** + **並び順（order）の変更** ができる
- BFF に `supabase.storage.remove()` を実装し、削除画像を Storage からも消す
- `certifications` master データの seed migration を追加（本番 farmille-prod 構築前に必須）
- ADR-0005「JWT 検証戦略（JWKS/ES256 優先 + HS256 フォールバック）」を起票

**縮退ライン**（落ちても翌 Phase or v1.5 送り可）:
- **画像並び順 UI（drag & drop で sort）**: 現状 `order` 列のみで、input UI が無い。削除 + 追加で暗黙的に先頭に再配置する形式で縮退可
- **Storage orphan の過去分清掃**: 今回の機能で新規 orphan は発生しなくなるが、Phase 7-9 で蓄積した過去 orphan は手動 or v1.5 cron で別途清掃

### 0.2 翌日送り（本 Phase 対象外）

以下は Phase 7/8/9 の累積 reviewer 🟡 / 🟢 指摘だが、**launch blocker ではない**ため v1.5 送り:
- `/v1/crops/flat` 新設 + `/products/new` / `/products/[id]/edit` 移行
- Header / Footer 共通コンポーネント化
- `ProductCard` に `hideMakerName` prop 追加
- BFF 全体の `getSession()` → `getUser()` 置換
- `react-hook-form` + `zod` 導入
- Soft delete / admin モデレーション機能
- Playwright E2E テスト自動化

### 0.3 Ryoga 直接作業（本 Phase の worker 範囲外）

以下はインフラ系で Ryoga 実施前提:
- farmille-prod Supabase プロジェクトへの migration 適用
- Vercel 自動デプロイ設定
- Railway 自動デプロイ設定 + Vercel Cron による keep-alive 運用

worker は **コードレベルのローンチ readiness** のみ担当。

---

## 1. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/products/[id]` | Server + Client | レビュー編集時のフォームに **既存画像表示 + 削除ボタン + 新規追加** | farmer 自身のみ |
| `/products/[id]/edit` | Server + Client | 資材編集時のフォームに **既存画像表示 + 削除ボタン + 新規追加 + 表示順序** | maker 自身のみ |

新規ページなし。既存の `ReviewForm` / `ProductForm` の `mode="edit"` UI を拡張する。

---

## 2. データ書き込み方針（skill §1.3 厳守）

### 2.1 画像 add / remove

- **新規追加画像**: フロントから Supabase Storage に直接 upload（skill §1.3 例外 2）
  - review: `review-images/{uid}/{review_id}/{nonce}_{idx}_{filename}`
    Phase 7 の path 形式（`{uid}/{review_id}/{idx}_{filename}`、nonce 無し）に追加セッション識別 nonce を付与したもの。Phase 7 既存画像は nonce 無しのまま残るが、Storage RLS は第 1 階層 UID しか強制しないため共存可能
  - product: `product-images/{uid}/pending/{nonce}_{idx}_{filename}`（Phase 8 パターン踏襲、元から nonce あり）
- **既存画像の削除**: **BFF 経由で `supabase.storage.remove()` を呼ぶ**
  - フロントから直接 `storage.remove()` は呼ばない（skill §1.3 例外 1/2 のどちらにも remove は該当しないため、責務分離に従い BFF に集約）
  - Storage RLS `review_images_delete_owner` / `product_images_delete_owner` は owner = auth.uid() を要求するが、BFF は service_role で全削除可
  - BFF で owner 検証 + path prefix validation（§4.1 参照）を行ってから remove を実行

### 2.2 DB と Storage の整合性

- **product_images テーブル**の更新は BFF が担当（画像メタデータ）
- 編集時の strategy: §4 で詳述

---

## 3. DB スキーマ変更

### 3.1 新規: `certifications` master seed migration

**新規ファイル**: `supabase/migrations/YYYYMMDDHHMMSS_certifications_seed.sql`

内容:
```sql
-- 認証体系マスタの seed
-- Phase 6 時点で Ryoga が Studio 手動投入した 3 行を migration 化
-- 本番 farmille-prod への migration 適用時に自動投入される

INSERT INTO certifications (id, name) VALUES
  -- id は dev 環境と揃えるため固定 UUID（Phase 6 手動投入時の id を使用）
  (gen_random_uuid(), '有機JAS'),
  (gen_random_uuid(), 'JGAP'),
  (gen_random_uuid(), 'GLOBALG.A.P.')
ON CONFLICT (name) DO NOTHING;
```

**重要**:
- dev 環境には既に同名 3 行が存在するため `ON CONFLICT (name) DO NOTHING` で idempotent に
- 本番環境は空なので新規投入される
- id を dev と prod で揃える必要はない（外部キーは product_certifications 中間テーブルのみ、環境ごとに独立）

### 3.2 RLS 変更

- Phase 9 で owner-check RLS は整備済みの想定
- 本 Phase で追加変更なし

---

## 4. FastAPI エンドポイント

§12 Q1/Q2 は「統合 endpoint 採用」で確定済のため、Phase 9 既存の PUT endpoint を拡張する形で実装する（独立 endpoint 案は採用しない）。

### 4.1 `PUT /v1/reviews/{review_id}` を Phase 9 から拡張

配置: `backend/app/routers/reviews.py`（Phase 9 で実装済）。

```
PUT /v1/reviews/{review_id}
認証: Bearer JWT 必須
権限: 投稿者本人のみ（Phase 9 既存の owner check）
Payload:
  {
    "rating": int (1-5, 必須),
    "body": str (1-2000, 必須),
    "remove_paths": list[str] (任意, デフォルト空, 既存画像の Storage path 配列)
  }
Response 200:
  { "ok": true }
Response 400:
  { "ok": false, "error": "invalid_image_path" }
  // remove_paths に `{user_id}/{review_id}/` 外の path が含まれた場合
Response 403 / 404 / 401 / 422:
  既存パターン（Phase 9 と同じ）
```

処理順序:
1. review owner 確認（Phase 9 既存ロジック）
2. **`remove_paths` の path prefix validation**（§4.3 参照）。不正 path が 1 つでもあれば 400 で全体拒否（skill §3.2 原子性: 部分処理しない）
3. `reviews.update({rating, body})` を実行（`updated_at` はトリガで自動更新、Phase 9 と同じ）
4. `remove_paths` が空でなければ `admin.storage.from_("review-images").remove(remove_paths)` を実行
5. 画像メタデータテーブルは存在しないため DB 更新は不要（ADR-0003）
6. Storage remove の部分失敗時の扱いは §11.2 参照（best-effort、ログ記録のみ）

### 4.2 `PUT /v1/products/{product_id}` を Phase 9 から拡張

配置: `backend/app/routers/products.py`（Phase 9 で実装済）。

Phase 9 の `ProductUpdatePayload` に画像操作 2 フィールドを追加:

```
PUT /v1/products/{product_id}
認証: Bearer JWT 必須
権限: 自社 maker のみ（Phase 9 既存の require_role + maker_id check）
Payload: (Phase 9 既存 + 画像操作 2 フィールド)
  {
    // Phase 9 既存フィールド:
    //   name / product_type_id / general_purpose / primary_compound /
    //   mode_of_action / commercial_status / label_url / sds_url /
    //   benefit_ids / crop_ids / certification_ids

    // NEW (Phase 10)
    "remove_paths": list[str] (任意, デフォルト空, Storage から消す既存画像の path),
    "order": list[{ url: str, existing: bool }] (任意, デフォルト空, 最終表示順序)
      // existing=true  → 既存 product_images の URL を維持
      // existing=false → 新規追加として INSERT する URL（既に Storage に upload 済み前提）
  }
Response 200:
  { "ok": true }
Response 400:
  { "ok": false, "error": "invalid_image_path" }
Response 403 / 404 / 401 / 422:
  既存パターン（Phase 9 と同じ）
```

**payload 例**（編集前 product_images = `[A, B, C]`、B 削除 + 新規 X 追加、最終順序 `[A, X, C]`）:
```json
{
  "name": "...", "product_type_id": "...", "benefit_ids": ["..."],
  "remove_paths": ["maker-uid/pending/nonce_1_B.jpg"],
  "order": [
    { "url": "https://.../A-public.jpg", "existing": true },
    { "url": "https://.../X-public.jpg", "existing": false },
    { "url": "https://.../C-public.jpg", "existing": true }
  ]
}
```

処理順序:
1. product owner 確認（Phase 9 既存ロジック）
2. **`remove_paths` の path prefix validation**（§4.3 参照）。不正 path が 1 つでもあれば 400 で全体拒否
3. Phase 9 既存の基本フィールド UPDATE + 関連 3 テーブル（benefit/crop/certification）の全削除 → 再 INSERT
4. **画像 strategy = 全削除 → 再 INSERT で確定**（差分更新は採用しない、skill §3.2 原子性の簡素化、Phase 9 関連テーブルと同パターン）:
   - a. `admin.table("product_images").delete().eq("product_id", ...).execute()` で既存画像行を全削除
   - b. `order` 配列の順に `product_images` に INSERT（`url = order[i].url`、`order = i`）
   - c. 既存維持 URL は id が再採番されるが、`product_images.id` は FK 対象外のため影響なし
5. `remove_paths` が空でなければ `admin.storage.from_("product-images").remove(remove_paths)` を実行（§11.1 DB 先削除方針）
6. 失敗時は rollback せず 500 を返し、ユーザー再送信に委ねる（Phase 9 spec §10.1 と同方針）

### 4.3 path prefix validation（§4.1 / §4.2 共通）

skill §3.2「バリデーション」の精神を BFF 層に延長。`str.startswith()` だけでは `"../"` traversal を通す可能性があるため、明示的なセグメント検証を行う。

```python
# backend/app/routers/_image_path.py（新規、共通ユーティリティ）

def validate_review_image_path(path: str, user_id: str, review_id: str) -> bool:
    """review-images バケットの path が {user_id}/{review_id}/... 配下かを検証。

    Storage RLS の第 1 階層 UID 強制だけでは BFF 層の防衛として弱いため、
    第 2 階層の review_id 一致と traversal 文字列の不在を併せて確認する。
    """
    parts = path.split("/")
    return (
        len(parts) >= 3
        and parts[0] == user_id
        and parts[1] == review_id
        and ".." not in parts
    )


def validate_product_image_path(path: str, user_id: str) -> bool:
    """product-images バケットの path が {user_id}/... 配下かを検証。

    Phase 8 は `{uid}/pending/...` 固定だが、将来 `{uid}/{product_id}/...` に移行する
    可能性もあるため第 2 階層は緩く、第 1 階層 UID と traversal 不在のみを確認。
    """
    parts = path.split("/")
    return (
        len(parts) >= 2
        and parts[0] == user_id
        and ".." not in parts
    )
```

各 endpoint は `remove_paths` の全要素をこの関数で検証し、1 つでも False なら 400 `invalid_image_path` で即 return（skill §3.2 原子性: 部分処理の中断）。

---

## 5. 画像アップロード UI 拡張

### 5.1 ReviewImageUpload / ProductImageUpload の mode="edit" 対応

既存 props 拡張:

```typescript
type Props = {
  files: File[];                              // 新規追加分（既存）
  onChange: (files: File[]) => void;
  disabled?: boolean;
  // NEW
  existingImages?: Array<{
    url: string;
    path: string;     // Storage の key。public URL から抽出
    id?: string;      // products の場合のみ (product_images.id)
  }>;
  onRemoveExisting?: (path: string) => void;  // 既存画像削除時の callback
};
```

UI:
- 既存画像セクション（thumbnail + [削除] ボタン）
- 新規追加セクション（drag & drop、Phase 7/8 の既存 UI）
- 最大枚数判定は **既存 + 新規 ≤ 5** で計算

### 5.2 並び順 UI（product only、縮退可能）

**必達**: 配列の順序を保持（初期状態は order ASC、追加は末尾）
**縮退**: drag & drop 不要、必要なら各 thumbnail に [↑] [↓] ボタン程度で v1

縮退を取る場合は **§12 Q3** で確認。

### 5.3 public URL から Storage path の抽出

Supabase の public URL は `https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>` 形式。

ユーティリティ追加:
- `frontend/src/lib/supabase/paths.ts`: `publicUrlToPath(url: string): string | null`
- public URL を受け取り、bucket 名以降の path を返す
- URL が想定外形式なら null 返す防衛実装

---

## 6. UI 仕様

### 6.1 レビュー編集時（`/products/[id]` 下）

**前提**: Phase 9 で「自レビューの [編集] ボタン → フォームに切替」が実装されている。

編集モードの ReviewForm に以下を追加:
- `existingImages` prop で既存画像を表示（Phase 7 で登録済のもの）
- 各 thumbnail の右上に [×] ボタン → `onRemoveExisting(path)` で削除マーク
- 削除マークされた画像は UI 上で「削除予定」表示（opacity 下げ + バッジ）
- 送信時に `remove_paths` として削除対象 path 配列を BFF に送信

**削除済フィールドの扱い**:
- 削除 → 即 Storage から消す のは **NG**（UI 操作だけで副作用を起こさない原則）
- 削除マーク → フォーム送信で確定 → BFF が Storage remove する

### 6.2 資材編集時（`/products/[id]/edit`）

**前提**: Phase 9 で ProductForm に mode="edit" + initialValues 対応済。

拡張:
- 既存画像リスト（product_images 全件）を表示、各 thumbnail に削除ボタン
- 新規追加は従来の drag & drop
- 並び順は §5.2 の縮退 UI（↑↓ ボタン）
- 送信時 payload:
  ```typescript
  {
    ...ProductFormData,
    keep_ids: [残す product_images.id],
    remove_paths: [削除対象 path],
    new_urls: [新規 upload 済 public URL],
    order: [url1, url2, ...],  // 最終順序
  }
  ```

### 6.3 削除確認 UI

- 画像削除マーク: `window.confirm` は不要（フォーム送信前に元に戻せる UI にする）
- フォーム送信時: 既存の確認文言に「削除した画像は元に戻せません」を追記

---

## 7. ADR-0005: JWT 検証戦略 + skill §5 解消反映

### 7.1 新規ドキュメント

`docs/decisions/0005-jwt-verification-strategy.md`

内容骨子:
- **背景**: Phase 1-4 で Supabase JWT 署名方式の変更（HS256 → ES256/JWKS）に対応した実装経緯
- **決定**: 第一は JWKS 経由 ES256 検証、第二は HS256 共有シークレット検証（後方互換）
- **理由**: Supabase が 2024 年末以降デフォルト ES256 / JWKS に移行、新規プロジェクトは自動適用
- **実装**: `backend/app/auth/jwt.py` で `header.alg` から分岐、JWKS はプロセス内 cache、kid 未発見時は 1 回 force refresh
- **影響**: JWKS ネットワーク障害時に起動時 1 回失敗すると全リクエスト 401 になる既知リスク（v1.5 で非同期化）
- **代替案**:
  - HS256 のみ維持 → 新 Supabase プロジェクトで動かない
  - JWT を経由せず Supabase JS SDK を BFF でも使う → skill §1.1 のサーバ側 service_role との棲み分けが崩れる

### 7.2 skill §5 判断保留リストの解消反映

Phase 8 / Phase 9 で以下の保留項目が解消済だが、skill `.claude/skills/farmille-architecture-principles/SKILL.md` §5.1 の表が未更新。ADR-0005 起票と同じ commit（または直前 commit）で skill も更新する:

- §5.1 #1 レビューの編集・削除可否 → **（2026-04-24 解消: Phase 9 で実装、`docs/specs/edit-delete.md` §4.1 / §4.2）**
- §5.1 #4 資材画像アップロードは v1 で必要か → **（2026-04-24 解消: Phase 8 で実装済、`docs/specs/maker-product.md` §4.1、本 Phase 10 で edit 対応）**

skill 付録 B「解消項目は 1-2 レビューサイクル残す」に従い、行削除ではなく注記付きで残す。

---

## 8. 触らないファイル

- `supabase/migrations/20260415*` / `20260420*` / `20260423*`（既存）
- `supabase/migrations/YYYYMMDDHHMMSS_edit_delete_rls.sql`（Phase 9 で作成された場合）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py`（他 Phase 範囲）
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- `docs/specs/auth-flow.md` / `products.md` / `review-post.md` / `maker-product.md` / `edit-delete.md`

---

## 9. 触るファイル（予想）

### 新規

- `supabase/migrations/YYYYMMDDHHMMSS_certifications_seed.sql`（§3.1）
- `docs/decisions/0005-jwt-verification-strategy.md`（§7.1）
- `backend/app/routers/_image_path.py`（§4.3 共通 path validation ユーティリティ）
- `frontend/src/lib/supabase/paths.ts`（§5.3 `publicUrlToPath` ユーティリティ）

### 既存修正

- `backend/app/routers/reviews.py`（Phase 9 の PUT に `remove_paths` 対応追加、§4.1）
- `backend/app/routers/products.py`（Phase 9 の PUT に `remove_paths` / `order` 対応追加、§4.2）
- `backend/app/models/schemas.py`（Phase 9 の `ReviewUpdatePayload` に `remove_paths` 追加 / `ProductUpdatePayload` に `remove_paths` + `order` 追加）
- `frontend/src/app/api/reviews/[id]/route.ts`（Phase 9 作成分の payload スキーマ拡張）
- `frontend/src/app/api/products/[id]/route.ts`（同上）
- `frontend/src/app/products/[id]/_components/review-form.tsx`（`existingImages` + `onRemoveExisting` 対応）
- `frontend/src/app/products/[id]/_components/review-image-upload.tsx`（Props 拡張: §5.1）
- `frontend/src/app/products/new/_components/product-form.tsx`（`existingImages` + `order` 対応）
- `frontend/src/app/products/new/_components/product-image-upload.tsx`（Props 拡張: §5.1）
- `.claude/skills/farmille-architecture-principles/SKILL.md`（§7.2 判断保留リスト #1/#4 の解消反映）

---

## 10. 受け入れ条件

### 10.1 API 動作

- [ ] farmer が自レビューの既存画像を削除できる（BFF → Storage で消える）
- [ ] farmer が自レビューに画像を追加できる
- [ ] 他人のレビュー画像を削除しようとして 403
- [ ] maker が自社資材の既存画像を削除できる
- [ ] maker が自社資材に画像を追加できる
- [ ] maker が自社資材の画像順序を変更できる（§5.2 縮退版 OK）
- [ ] 他社資材の画像操作で 403
- [ ] 画像 5 枚超過で 422 or クライアント側弾き
- [ ] review の remove_paths に `{user_id}/{review_id}/` 外の path が 1 つでも含まれたら 400 `invalid_image_path`（§4.3 `validate_review_image_path`）
- [ ] product の remove_paths に `{user_id}/` 外の path が 1 つでも含まれたら 400 `invalid_image_path`（§4.3 `validate_product_image_path`）
- [ ] いずれのバケットでも `".."` を含む path は 400（traversal 防止）

### 10.2 UI 動作

- [ ] レビュー編集モードで既存画像 + 削除マーク + 新規追加 が表示
- [ ] 削除マーク後、フォームをキャンセルすると削除が取り消される
- [ ] 送信成功後、削除した画像は Storage / Dashboard からも消えている
- [ ] 資材編集モードで既存画像 + 並び順 UI（縮退版）+ 新規追加 が表示

### 10.3 Migration / ドキュメント

- [ ] `certifications` seed migration が idempotent（ON CONFLICT）
- [ ] `supabase db push --linked` で dev 環境に適用できる（既存行と衝突しない）
- [ ] ADR-0005 が `docs/decisions/` 配下に存在、既存 ADR フォーマット踏襲

### 10.4 BFF 原則

- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` 0 件維持
- [ ] `supabase.storage.remove` の呼び出しは BFF のみ（フロントから呼ばない）
- [ ] `supabase.storage.upload` / `.getPublicUrl` は引き続きフロントのみ（skill §1.3 例外 2）

### 10.5 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] E2E 手動確認（画像 add/remove の Round-trip）

---

## 11. 設計上の注意

### 11.1 画像削除と DB の順序

- DB → Storage: DB を先に削除して Storage 削除失敗 → orphan + DB 不整合なし
- Storage → DB: Storage を先に削除して DB 削除失敗 → 404 画像を含む DB 行残存（ユーザーには壊れた画像が見える）
- **推奨: DB 先削除**（エラー時の挙動がマシ）
- 実装: products の場合は「全削除 → 再 INSERT」なので実質 DB 先。Storage remove はその後。

### 11.2 Storage remove の失敗時挙動

- supabase-py の `storage.from_().remove(paths)` は部分失敗時に成功 path のみ返す場合がある
- BFF は remove 結果をログに残し、失敗 path は再試行 API に回す（v1 は best-effort、UI に「削除に失敗した画像があります」を表示する必要は低い）
- **代替**: remove を非同期化して BFF レスポンスを先に返す（v1.5）

### 11.3 画像 URL から path 抽出の fragility

- Supabase の URL 形式が変わると `publicUrlToPath` が壊れる
- 将来のバージョンアップで変わる可能性: 低い（公開仕様）
- 代替: product_images テーブルに `storage_path` 列を追加して URL と分離（schema 変更、v1.5+）

### 11.4 orphan 清掃の過去分

- Phase 7/8 で upload 失敗時に残った画像、Phase 9 で削除時に残った画像が蓄積
- 本 Phase の BFF remove で新規発生は防げる
- **過去分は v1.5 で cron 清掃 or Ryoga 手動**（本 Phase 対象外）

### 11.5 ADR-0005 が動作に影響するか

- 既に Phase 1-4 で実装済み（`backend/app/auth/jwt.py`）
- ADR 起票はドキュメント化のみ、コード変更なし
- Reviewer 指摘の累積負債返済

---

## 12. Ryoga 判断（確定済）

- **Q1**: レビュー画像 endpoint → **PUT /v1/reviews/{id} に `remove_paths` 統合確定**（§4.1）
- **Q2**: 資材画像 endpoint → **PUT /v1/products/{id} に `remove_paths` + `order` 統合確定**（§4.2、`keep_ids` / `new_urls` は payload 簡素化のため `order` の `{ url, existing }` オブジェクト配列に統合）
- **Q3**: 画像並び順 UI → **縮退版 ↑↓ ボタン確定**（drag-drop は v1.5 送り）
- **Q4**: `certifications` seed の id 戦略 → **`gen_random_uuid()` 新規採番確定**。`ON CONFLICT (name) DO NOTHING` で idempotent（事前確認: `certifications.name` に UNIQUE 制約あり）
- **Q5**: ADR-0005 起票タイミング → **本 Phase で commit 確定**（§7.1）
- **Q6**: Storage remove 失敗時 UI → **v1 は警告なし確定**（BFF ログのみ、§11.2）
- **Q7**: ブランチ基点 → **`feat/edit-delete` に stack 確定**（Phase 7/8/9 が同系列 stack、Phase 9 `main` 未 merge）
- **Q8**: Phase 11 起票 → 本 Phase 完了時点で §14 チェックリストを worker が提示し、Ryoga が判断

---

## 13. 作業スケジュール + commit 方針

### 13.1 作業スケジュール（目安）

| Step | 内容 | 見込み |
|---|---|---|
| 1 | 事前確認（Phase 9 成果物、Q1-Q8 は spec §12 で確定済） | 20 分 |
| 2 | chore commit: `certifications` seed migration + ADR-0005 起票 + skill §5 反映 | 1 時間 |
| 3 | backend: `_image_path.py` ユーティリティ + Phase 9 PUT endpoint 拡張（§4.1 / §4.2） | 2 時間 |
| 4 | frontend: `publicUrlToPath` + ReviewImageUpload/ProductImageUpload 拡張 | 2 時間 |
| 5 | frontend: ReviewForm / ProductForm の existingImages 対応 | 1.5 時間 |
| 6 | 検証（`pnpm tsc/lint/build`、`from app.main import app`）+ Ryoga 手動 E2E | 1 時間 |
| 合計 | | **約 8 時間** |

### 13.2 commit 分割方針（skill §4.4 #9 ついで実装回避）

本 Phase は画像編集・seed・ADR の 3 系統を同時進行するが、以下の 4-5 commits に明示的に分離:

```
1. chore(phase10): add certifications seed, ADR-0005, and skill §5 resolution notes
2. feat(backend): add image remove path validation and extend PUT endpoints with remove_paths
3. feat(frontend): publicUrlToPath utility and BFF proxy payload extensions
4. feat(frontend): existingImages + remove UI in ReviewForm and ProductForm
5. feat(frontend): image upload components Props extension + order UI for products (↑↓)
```

- 1 commit = 1 論理変更。ADR と seed は同じ chore commit に束ねるが、画像編集機能と混ぜない
- 各 commit 前に `git diff --cached` で差分確認、untracked ファイル混入を防ぐ（Phase 6 `4ddbb91` 教訓）
- `placehold.co` allowlist 削除（§14.2）は **本 Phase では実施しない**（demo データ差し替えが Ryoga 作業のため、demo 差し替え後に別 PR で対応）

---

## 14. Phase 10 完了後の v1 ローンチ準備チェック

**worker 担当（コード）は本 Phase で概ね完了**。残るのは Ryoga 直作業（インフラ）と、demo データの整理:

### 14.1 インフラ設定（Ryoga 直作業）

- [ ] farmille-prod Supabase プロジェクト作成
- [ ] migration 全本を farmille-prod に適用（`supabase link` 切替 + `supabase db push`）
- [ ] farmille-prod に `certifications` master が自動投入されているか確認
- [ ] `product-images` / `review-images` バケットを farmille-prod Studio で作成
- [ ] Vercel デプロイ設定 + 環境変数（production 用 SUPABASE_URL / ANON_KEY / API_URL）
- [ ] Railway デプロイ設定 + 環境変数（production 用 SUPABASE_URL / SERVICE_ROLE / JWT_SECRET / CORS_ORIGINS）
- [ ] Vercel Cron による `/health` keep-alive 設定（setup-log §8）
- [ ] ドメイン設定（Vercel / Railway）
- [ ] OAuth redirect URL を farmille-prod の URL に更新

### 14.2 demo データと next/image allowlist の整理（Ryoga + worker 協働）

Phase 6 demo データ投入時、`products.product_images.url` に `https://placehold.co/600x400?text=...` 形式のプレースホルダ URL を入れていた。Phase 9 の `<img>` → `<Image>` 移行に伴い、Next.js の `remotePatterns` allowlist に `placehold.co` を追加して動作させている（`frontend/next.config.ts`、Phase 9 の fix commit `53f61d2`）。

本番ローンチ前に以下を実施:

- [ ] **Ryoga**: Supabase Studio の `products` / `product_images` から demo データを削除 or 本番想定データに差し替え
- [ ] **Ryoga or maker**: 実際のメーカーが `/products/new` で画像付きで資材を登録 → `product-images` バケットの実画像 URL に置き換わる
- [ ] **worker**: `placehold.co` を `frontend/next.config.ts` の `remotePatterns` から削除（Phase 9 fix commit の追い剥ぎ）
- [ ] **worker (任意、強化案)**: `*.supabase.co` wildcard を farmille-prod の project ref 1 個に絞る（例 `{ref}.supabase.co`）。dev / prod で `NEXT_PUBLIC_SUPABASE_URL` から動的に決める必要あり、build time 定数化が難しいので v1.5 送りでも可

この整理を Phase 11 or v1 launch 直前 commit で束ねて 1 PR として出すのが素直。

### 14.3 v1 launch 判定

§14.1 と §14.2 が完了すれば v1 ローンチ可。追加 Phase (11+) を起票するか、ここで launch するかは Ryoga 判断。

---

**以上**
