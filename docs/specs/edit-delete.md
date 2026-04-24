# Farmille v1 レビュー・資材 編集/削除 機能 仕様 (Phase 9)

**作成日**: 2026-04-24
**対象**: レビュー投稿者による自レビューの編集・削除 + メーカーによる自社資材の編集・削除
**作業ブランチ**: `feat/edit-delete`（派生元: **`feat/posts-and-products` に stack 確定**。Phase 7/8 が同ブランチに統合済・`main` 未 merge のため）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`review-post.md` / `maker-product.md` と同水準）
**前提 Phase**: Phase 7（レビュー投稿）/ Phase 8（資材登録）完了

---

## 0. ゴール / 縮退ライン

**必達**:
- farmer が自身の投稿済レビューを編集できる（rating + body）
- farmer が自身の投稿済レビューを削除できる
- maker が自社の登録済資材を編集できる（基本情報 + 効果タグ / 作目 / 認証）
- maker が自社の登録済資材を削除できる
- 他人 / 他社のリソースは 403（BFF + RLS の二重防御）
- フロントから Supabase 直叩きゼロ維持（Storage 以外）

**縮退ライン**（落ちても翌 Phase 送り可）:
- **画像の編集**（追加 / 削除 / 差し替え）: v1.5 送り OK。テキストフィールドだけ編集できれば縮退ライン達成
- `reviews.py` skeleton の再構成（今までスケルトンだった `/v1/reviews/` 下の実装）: 削除/PUT を新設するだけで、他の skeleton ルートは残して可

**翌日送り**（本 Phase 対象外）:
- 管理者（admin ロール）による他人レビュー削除（モデレーション機能）
- 削除ログ・監査ログ
- Soft delete（現状は hard delete で進める）

---

## 1. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/products/[id]` | Server + Client | 投稿済レビュー欄に [編集] [削除] ボタン追加（自分のレビューのみ） | 全員閲覧、farmer 自身のみ操作可 |
| `/products/[id]/edit` | Server + Client（新規） | 資材編集フォーム（`/products/new` のフォームを mode=edit で再利用）+ 資材削除ボタン | maker 自身のみ |
| `/maker/products` | Server Component | 各カードに [編集] リンク追加（`/products/[id]/edit` 遷移）。**資材削除は §6.3 方針 A により edit ページ内に配置するためこのページには置かない** | maker |

**新規ページは `/products/[id]/edit` 1 枚のみ**。レビューは既存 `/products/[id]` 下のインライン編集で対応。

---

## 2. データ書き込み方針（skill §1.3 厳守）

- **reviews / products / 関連テーブルへの UPDATE / DELETE は BFF 経由**
- **Storage の画像操作は縮退ラインに含まれないため v1 では `supabase.storage.remove()` を呼ばない**
  - 編集時: テキストフィールド更新のみ、既存画像はそのまま残す
  - 削除時: DB 行は削除するが、Storage のオブジェクトは **orphan として残存許容**（v1.5 で cron 清掃）
- BFF は JWT の sub と対象リソースの owner (user_id / maker_id) が一致するかを第一防御で検証
- Supabase RLS が第二防御として重ねて検証（reviews / products 既存 RLS で owner check 済の想定、§3.1 で現状確認）

---

## 3. DB スキーマ変更

### 3.1 既存 RLS（事前確認済み、変更なし）

reviewer による `20260415000003_farmille_rls.sql` の grep 結果、以下 4 本が既に存在することを確認済み:

| テーブル | ポリシー | 位置 | 状態 |
|---|---|---|---|
| `products` | `products_update_owner` | migrations:227 | ✅ 既存 |
| `products` | `products_delete_owner` | migrations:232 | ✅ 既存 |
| `reviews` | `reviews_update_owner` | migrations:405 | ✅ 既存 |
| `reviews` | `reviews_delete_owner` | migrations:410 | ✅ 既存 |
| `product_images` / `product_benefit_relations` / `product_crops` / `product_certifications` | — | — | FK `ON DELETE CASCADE` で十分、独自 RLS 不要 |

### 3.2 migration 追加の有無

**なし**。事前確認で RLS が完備していることを確認済みのため、本 Phase は migration ゼロ。

---

## 4. FastAPI エンドポイント

### 4.1 新規: レビュー編集・削除

配置: **`backend/app/routers/reviews.py`** に実装（現在 skeleton のため本 Phase で実体化）。

```
PUT /v1/reviews/{review_id}
認証: Bearer JWT 必須、owner check は BFF で実施
権限: 投稿者本人のみ (payload の user_id 受け取らず、JWT sub と review.user_id を比較)
Payload:
  {
    "rating": int (1-5, 必須),
    "body": str (1-2000, 必須)
  }
Response 200:
  { "ok": true }
Response 403:
  { "ok": false, "error": "not_owner" }     // 他人レビュー編集試行
Response 404:
  { "ok": false, "error": "review_not_found" }
Response 401 / 422: 既存パターン
```

```
DELETE /v1/reviews/{review_id}
認証: Bearer JWT 必須
権限: 投稿者本人のみ
Response 204: body なし
Response 403 / 404 / 401: 上記と同様
```

処理順序（PUT）:
1. `reviews.select("user_id")` で対象行取得（404 判定）
2. `user_id == JWT.sub` でなければ 403
3. `reviews.update({rating, body})` — **`updated_at` は `BEFORE UPDATE` トリガ `trg_reviews_updated_at`（init.sql:360-362）で自動更新。UPDATE payload で明示指定しない**

処理順序（DELETE）:
1. 同上の owner 確認
2. `reviews.delete()` で行削除（review_crops 等の FK 依存は `ON DELETE CASCADE` に任せる、init.sql §5 確認済）
3. **画像 Storage は削除しない**（v1 許容、§2 の方針）

### 4.2 新規: 資材編集・削除

配置: **`backend/app/routers/products.py`** に追加（Phase 8 の POST と同居）。

```
PUT /v1/products/{product_id}
認証: Bearer JWT 必須
権限: maker かつ 自社 (maker_id = JWT.sub)
Payload: Phase 8 の ProductCreatePayload と同形（name / product_type_id / 任意フィールド + 4 種の ID 配列）
Response 200:
  { "ok": true }
Response 403:
  { "ok": false, "error": "not_owner" }
Response 404:
  { "ok": false, "error": "product_not_found" }
Response 401 / 422: 既存パターン
```

処理順序:
1. `products.select("maker_id")` で owner 判定（404/403）
2. `products.update(基本フィールド)` 実行（`updated_at` はトリガ `trg_products_updated_at` 任せ）
3. 関連テーブルは **全削除 → 再 INSERT** の strategy（差分検出は複雑、size も小さいので全置換）
   - `product_benefit_relations.delete().eq("product_id", ...)` → `insert(benefit_ids)`
   - `product_crops` / `product_certifications` も同様
   - **画像は差し替えない**（§2 方針により `product_images` は触らない、v1.5）
4. **失敗時の扱い（v1 方針、§10.1 参照）**: いずれかのステップが失敗したら 500 を返しユーザーに再送信を促すのみ。`products.update` の巻き戻しや旧関連 ID の復元は**実装しない**（Phase 8 POST と同方針の簡易 rollback）。データ不整合は「次回 PUT 成功時に収束」で v1 は割り切る

```
DELETE /v1/products/{product_id}
認証: Bearer JWT 必須
権限: maker かつ 自社
Response 204: body なし
Response 403 / 404 / 401: 同上
```

処理順序:
1. owner 判定
2. `products.delete()` で CASCADE により関連（product_images / product_benefit_relations / product_crops / product_certifications / reviews）も一括削除
3. **画像 Storage は削除しない**（v1 許容）

### 4.3 既存ルーターのクリーンアップ

`reviews.py` 内の skeleton `@router.get("/")` は **削除**する（Phase 7 reviewer / Phase 8 reviewer が累積で指摘）。

---

## 5. 画像アップロードの実装

**v1 スコープ外**。画像の追加 / 削除 / 差し替えは Phase 10 以降 or v1.5 に送る。

現在登録済の画像は 編集時に表示のみ（修正 UI なし）。削除時は Storage に orphan が残る（許容）。

---

## 6. UI 仕様

### 6.1 `/products/[id]` レビュー欄の編集・削除ボタン

表示条件:
- farmer ログイン済 **かつ** 当該 product に自身のレビューが存在する場合のみ
- 自分のレビュー行に [編集] [削除] ボタン併記

動作:
- **[編集]**: 当該レビュー行が `ReviewForm` に差し替わる（rating / body pre-populated）。mode=edit で送信先は `PUT /api/reviews/{review_id}`。完了後 `router.refresh()`
- **[削除]**: `window.confirm("このレビューを削除しますか？")` → OK なら `DELETE /api/reviews/{review_id}` → `router.refresh()`

**実装パターン（重要）**:
現状 `/products/[id]/page.tsx` は Server Component でレビュー一覧を `reviews.map` で描画している。編集・削除ボタンとインライン編集状態を管理するため、**レビュー 1 件を表示する `<li>` を新規 Client Component `review-list-item.tsx` に切り出す**。Server Component 側は `currentUserId` / `currentRole` を prop として渡すのみ。Client 側で `isOwner = currentUserId === review.user_id` を判定し、mode state でフォーム切替を制御する。

**Phase 7 分岐の撤回**:
Phase 7 の reviewer §6.1 対応で追加した「投稿済み farmer には投稿フォームを出さず『投稿済み』文言に切替える」分岐（`/products/[id]/page.tsx:237` の `reviews.some((r) => r.user_id === user.id)` 判定）は、**本 Phase で撤回する**。投稿済みでもレビュー一覧内でインライン編集できるようになるため、フォーム非表示分岐は不要。投稿済み farmer は「レビュー投稿」セクションで新規投稿をブロック（409 で失敗 or 空フォーム扱い）ではなく、下のレビュー一覧で自身のレビューを [編集] / [削除] する導線に統一する。

ReviewForm の `props`:
```typescript
type Props = {
  productId: string;
  mode?: "create" | "edit";
  initialValues?: { reviewId: string; rating: number; body: string };
};
```

### 6.2 `/products/[id]/edit` 資材編集ページ

アクセス制御（Server Component）:
- 未ログイン → `/login?next=/products/{id}/edit`
- maker でない → `/home`
- `products.maker_id != auth.uid()` → `/home`（自社以外）
- 存在しない product → 404

データフロー:
1. `GET /v1/products/{id}` で詳細取得（Phase 6 既存）
2. `GET /v1/product-types` / `GET /v1/product-benefits` / `GET /v1/certifications` / `GET /v1/onboarding/crops` でマスタ取得（Phase 8 と同じ並列 fetch）
3. `<ProductForm mode="edit" initialValues={...} productId={id} />` でレンダリング

ProductForm の `props`:
```typescript
type Props = {
  productTypes: ProductType[];
  benefits: Benefit[];
  certifications: Certification[];
  crops: Crop[];
  categoriesL1: CategoryL1[];
  categoriesL2: CategoryL2[];
  mode?: "create" | "edit";
  productId?: string;        // mode=edit 時必須
  initialValues?: Partial<ProductFormData>;
};
```

送信先分岐:
- mode=create → `POST /api/products`（Phase 8 既存）
- mode=edit → `PUT /api/products/{productId}`
- 成功時は `/maker/products` に遷移

### 6.3 資材削除 UI

**方針 A**: `/products/[id]/edit` ページに「この資材を削除」ボタン設置
**方針 B**: `/maker/products` の各カードに「削除」アイコン設置（クイック削除）
**方針 C**: 両方

デフォルトは **方針 A**（§12 Q4 で最終確定）。

削除確認:
- `window.confirm("この資材を削除しますか？関連するレビュー・画像も削除されます。")` → OK なら `DELETE /api/products/{productId}` → `/maker/products` に遷移

### 6.4 デザイン

- 既存 shadcn コンポーネントのみ再利用
- 削除ボタンは `variant="destructive"`（Button の既存バリアント）
- 編集ボタンは `variant="outline"`

---

## 7. 受け入れ条件

### 7.1 API 動作

- [ ] farmer で自身のレビューを `PUT /v1/reviews/{id}` 成功 → reviews 行が更新
- [ ] 他人のレビューを PUT しようとすると 403
- [ ] 存在しない review_id で 404
- [ ] rating 範囲外 / body 空で 422
- [ ] farmer で自身のレビューを `DELETE /v1/reviews/{id}` 成功 → reviews 行が消える
- [ ] maker で自社資材を `PUT /v1/products/{id}` 成功 → products + 関連テーブル更新
- [ ] 他社資材を PUT しようとすると 403
- [ ] maker で自社資材を `DELETE /v1/products/{id}` 成功 → products + 関連 / reviews が CASCADE 削除
- [ ] farmer / unassigned で products PUT/DELETE すると 403（role 判定）

### 7.2 UI 動作

- [ ] farmer で `/products/[id]` に自レビューがある場合、[編集][削除] ボタン表示
- [ ] [編集] クリックでフォーム表示、送信で即反映
- [ ] [削除] クリックで confirm → 削除後レビューから消える
- [ ] maker で `/products/[id]/edit` にアクセス可能、自社以外は `/home` redirect
- [ ] 編集フォーム送信後 `/maker/products` に遷移
- [ ] `/maker/products` の資材を削除後、カードから消える
- [ ] farmer / 未ログインで `/products/[id]/edit` アクセス → redirect

### 7.3 BFF 原則

- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` 0 件維持
- [ ] `supabase.storage.*` の直叩きは Phase 7/8 の upload 箇所のみ（本 Phase で新規呼び出しは追加しない）

### 7.4 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] `from app.main import app` 成功

---

## 8. 触らないファイル

- `supabase/migrations/20260415*` / `20260420*` / `20260423*`（既存）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py`（他 Phase 範囲）
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/products/new/page.tsx`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- `docs/specs/auth-flow.md` / `products.md` / `review-post.md` / `maker-product.md`

---

## 9. 触るファイル（予想）

### 新規

- `frontend/src/app/products/[id]/edit/page.tsx`
- `frontend/src/app/products/[id]/_components/review-list-item.tsx`（レビュー 1 件の Client Component、§6.1 実装パターン）
- `frontend/src/app/api/reviews/[id]/route.ts`（PUT / DELETE BFF proxy）
- `frontend/src/app/api/products/[id]/route.ts`（PUT / DELETE BFF proxy）

※ RLS migration は§3.2 の通り追加不要。

### 既存修正

- `backend/app/routers/reviews.py`（skeleton → PUT/DELETE 実装）
- `backend/app/routers/products.py`（PUT/DELETE 追加）
- `backend/app/models/schemas.py`（`ReviewUpdatePayload` / `ProductUpdatePayload`。Create 型と同形なので型エイリアス or 継承で定義、worker 判断）
- `backend/app/main.py`（必要に応じて tag 更新）
- `frontend/src/app/products/[id]/page.tsx`（レビュー一覧の map 対象を `<ReviewListItem>` に置換、`currentUserId` を prop で渡す）
- `frontend/src/app/products/[id]/_components/review-form.tsx`（mode prop 対応）
- `frontend/src/app/products/new/_components/product-form.tsx`（mode prop 対応、`/products/[id]/edit` からも再利用）
- `frontend/src/app/maker/products/page.tsx`（各カードに [編集] リンク追加。削除ボタンは edit ページ側に配置するためここには追加しない）

---

## 10. 設計上の注意

### 10.1 products PUT のトランザクション性

- `products.update` + 関連テーブルの全削除 → 再 INSERT を非トランザクションで行う
- 途中失敗時の挙動:
  - 基本フィールド UPDATE のみ成功、関連 INSERT 失敗 → データ破損リスク（関連が消えた状態で残る）
  - **対策**: UPDATE 前の関連 ID を保持しておき、INSERT 失敗時に旧関連を復元する rollback 実装
  - **代替**: Phase 8 と同じく「失敗時はユーザーに再送信を促す」方針で v1 許容（spec §10 の既存判断を踏襲）
- **推奨**: v1 は「失敗時は 500 を返しユーザーがリロード + 再試行」で割り切り。完全トランザクションは v1.5 で Supabase Edge Function or stored procedure に逃す

### 10.2 削除時の Storage orphan

- DELETE 時に Storage オブジェクトを削除しないため、全ユーザーが画像を削除するたびに Storage にゴミが増える
- 経済的影響: 1 枚 5MB × N 削除 / 月の見積もり。launch 直後は微小、v1.5 までに cron 整備

### 10.3 reviews CASCADE の副作用

- 資材を削除すると、その資材への全レビューも CASCADE で削除される（`reviews.product_id REFERENCES products(id) ON DELETE CASCADE`）
- **ユースケース**: maker が資材を削除 → farmer の過去レビューが消える。ユーザー通知なし
- v1 では許容だが、UX として確認モーダルに「関連するレビューも削除されます」の警告を入れる（§6.3）

### 10.4 `reviews.py` skeleton の整理

- 現在 `@router.get("/")` が `{"reviews": [], "message": "Not implemented yet"}` を返している（Phase 7 で残置）
- 本 Phase で PUT/DELETE を実装する際、GET の skeleton は削除する
- URL `GET /v1/reviews/` は誰も使っていない（フロントは `/v1/products/{id}/reviews` を使用）ので削除して問題なし

---

## 11. Reviewer 呼び出し

実装完了後、`.claude/handoff/templates/worker-to-reviewer.md` に従ってハンドオフ文を生成。**Ryoga が「ハンドオフ出して」と明示するまで出さない**。

---

## 12. Ryoga 判断（確定済）

- **Q1**: 画像編集（add/remove）→ **v1.5 送り確定**（縮退ライン通り、本 Phase は画像非対応）
- **Q2**: 削除確認 UI → **`window.confirm()` 確定**（シンプル、v1.5 で AlertDialog などに差し替え）
- **Q3**: 資材編集 route → **`/products/[id]/edit` 確定**（`/products/new` の mirror pattern）
- **Q4**: 削除 UI 配置 → **方針 A（edit ページ内に削除ボタン）のみ確定**。`/maker/products` カードからはクイック削除しない（v1.5 送り）
- **Q5**: 削除時の関連レビュー CASCADE 警告 → **確認モーダルに文言入れる確定**（§6.3、§10.3 警告文言）
- **Q6**: 既存 RLS 確認 → **事前判明済、migration 追加不要確定**（§3.1 / §3.2）
- **Q7**: PUT の関連テーブル全置換 → **全削除 → 再 INSERT 確定**。失敗時は 500 を返すのみで rollback は実装しない（§4.2 処理順序 4 / §10.1）
- **Q8**: Phase 9 のブランチ基点 → **`feat/posts-and-products` に stack 確定**（Phase 7/8 が同ブランチに統合済・`main` 未 merge）

---

## 13. 作業スケジュール（目安）

| Step | 内容 | 見込み |
|---|---|---|
| 1 | 事前確認（RLS 既存状態 + Ryoga Q1-Q8 確定） | 30 分 |
| 2 | backend: reviews.py 実体化（PUT/DELETE）| 1 時間 |
| 3 | backend: products.py PUT/DELETE 追加 + schemas | 1.5 時間 |
| 4 | frontend: BFF proxy 2 本 (reviews/[id] / products/[id]) | 30 分 |
| 5 | frontend: ReviewForm mode=edit 対応 + ページ統合 | 1 時間 |
| 6 | frontend: `/products/[id]/edit` ページ + ProductForm mode=edit 対応 | 1.5 時間 |
| 7 | 検証 + commit 分割 | 30 分 |
| 合計 | | **約 6 時間** |

Phase 7/8 のペース（半日〜1 日）と同程度。

---

**以上**
