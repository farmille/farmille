# Farmille v1 メーカー資材登録機能 仕様 (Phase 8)

**作成日**: 2026-04-23
**対象**: メーカーが自社資材を登録・自社一覧を閲覧する機能（POST /v1/products + /products/new + /maker/products + 画像アップロード）
**作業ブランチ**: `feat/maker-product`（派生元: Phase 7 merge 後の `main`。Phase 7 未 merge なら `feat/review-post` に stack）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`products.md` と同水準）

---

## 0. ゴール / 縮退ライン

**必達**:
- maker ロールのユーザーが `/products/new` で自社資材を登録できる
- 登録後、`/maker/products` で自社が登録した資材の一覧が見られる
- 登録時に基本情報 + 画像 + 効果タグ / 対象作目 / 認証を入力できる
- フロントからの Supabase 直叩きはゼロ（skill §1.3 厳守）

**縮退ライン（落ちても翌 Phase 送り可）**:
- 画像アップロード（テキスト情報だけでも資材は成立）
- 効果タグ / 対象作目 / 認証の多重選択 UI（最低 1 つずつでも登録可能ならセーフ）
- `/maker/products` の整ったデザイン（最悪 `/products` の流用で可）

**翌日送り（本 Phase 対象外）**:
- 資材の編集・削除 UI（Phase 9 以降）

---

## 1. 画面一覧

| パス | 種別 | ロール制限 | データ源 |
|---|---|---|---|
| `/products/new` | Server + Client | maker のみ（他は `/home` or `/products` へ redirect） | BFF `POST /v1/products` |
| `/maker/products` | Server Component | maker のみ | BFF `GET /v1/maker/products` |

---

## 2. データ書き込み方針（skill §1.3 厳守）

- **products / product_images / 各種中間テーブルへの書き込みは BFF 経由**（`POST /v1/products`）
- **画像アップロードのみ Supabase Storage 直叩き**（skill §1.3 例外 2）
  - Phase 7 で導入したパターンを再利用（フロント upload → URL 取得 → BFF の body に含めて POST）
  - path は `{auth.uid}/pending/{product_id}_{idx}_{filename}` 相当（§5 で詳述）

---

## 3. DB スキーマ変更

### 3.1 新規: product-images Storage バケット RLS

`review-images` と同様の Storage RLS を追加:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_product_images_storage_rls.sql

-- product-images バケットは Supabase ダッシュボードで事前作成
-- MIME: image/jpeg, image/png, image/webp
-- サイズ上限: 5MB

CREATE POLICY "product_images_delete_owner" ON "storage"."objects"
  FOR DELETE TO "authenticated"
  USING (("bucket_id" = 'product-images' AND "owner" = auth.uid()));

CREATE POLICY "product_images_insert_maker" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "bucket_id" = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'maker'
    AND (storage.foldername("name"))[1] = (auth.uid())::text
  );

CREATE POLICY "product_images_select_all" ON "storage"."objects"
  FOR SELECT TO "authenticated", "anon"
  USING ("bucket_id" = 'product-images');

CREATE POLICY "product_images_update_owner" ON "storage"."objects"
  FOR UPDATE TO "authenticated"
  USING (("bucket_id" = 'product-images' AND "owner" = auth.uid()))
  WITH CHECK (
    "bucket_id" = 'product-images'
    AND "owner" = auth.uid()
    AND (storage.foldername("name"))[1] = (auth.uid())::text
  );
```

`products` / `product_images` / `product_benefit_relations` / `product_crops` / `product_certifications` は **全て既存テーブル**。新規 table migration は不要。

### 3.2 既存 RLS の確認

- `products_insert_maker` (init:220): `role = 'maker' AND maker_id = auth.uid()` → Phase 8 仕様と一致 ✅
- `product_images_insert_*`（テーブル側）: 既存あり、maker の所有 product にのみ INSERT 可 ✅
- `product_crops` / `product_benefit_relations` / `product_certifications`: 既存 RLS が maker の所有 product にのみ関連付け許可 ✅

**DB スキーマ変更は §3.1 の Storage RLS 1 本のみ**。

---

## 4. FastAPI エンドポイント

### 4.1 新規: `POST /v1/products`

配置: `backend/app/routers/products.py` に追加。

```
POST /v1/products
認証: Bearer JWT 必須
権限: maker のみ（require_role("maker")）
Payload:
  {
    "name": str (1-100, 必須),
    "product_type_id": uuid (必須),
    "general_purpose": str (任意, max 500),
    "primary_compound": str (任意, max 200),
    "mode_of_action": str (任意, max 500),
    "commercial_status": str (任意, max 50),
    "label_url": str (任意),
    "sds_url": str (任意),
    "benefit_ids": list[uuid] (任意, max 25),
    "crop_ids": list[uuid] (任意, max 50),
    "certification_ids": list[uuid] (任意, max 10),
    "image_urls": list[str] (任意, max 5)
  }
Response 201:
  { "ok": true, "product_id": "uuid" }
Response 403 / 401 / 422:
  既存パターン
```

処理順序（全て同一 maker_id = auth.uid() で書く）:
1. products INSERT（returning id） → product_id 取得
2. image_urls → product_images に bulk INSERT
3. benefit_ids → product_benefit_relations に bulk INSERT
4. crop_ids → product_crops に bulk INSERT
5. certification_ids → product_certifications に bulk INSERT
6. 2-5 で失敗時は 1 の products 行を削除（CASCADE で関連も消える）

### 4.2 新規: `GET /v1/maker/products`

配置: **新規 router** `backend/app/routers/maker.py`（`/v1/maker/*` namespace を分離）。

```
GET /v1/maker/products
認証: Bearer JWT 必須
権限: maker のみ
Response 200:
  { "products": [{ id, name, type_name, image_url, created_at }] }
```

自社の `maker_id = auth.uid()` で絞り込み、最新順。一覧 API の `/v1/products` と同じ formatter (`_flatten_product`) を再利用。

### 4.3 main.py 更新

`backend/app/main.py` に `maker.router` を `/v1/maker` で `include_router`。

---

## 5. 画像アップロードの実装

### 5.1 RLS path 制約

Storage RLS の path 強制は `{auth.uid}/{何か}/{filename}` の 2 階層以上。Phase 7 の review と同じく、**登録前に product_id は存在しない**ので path に反映できない。

**案**: `{auth.uid}/pending/{uuid}_{idx}_{filename}` でアップロード。BFF 側で `product_id` が確定後、**rename は実施しない**（v1 はシンプルに public URL を product_images に保存するのみ）。

Phase 9 以降で「画像を個別削除したい」が出てきたら path 整理を考える。v1 ではシンプル優先。

### 5.2 実装パターン

Phase 7 で作った `review-image-upload` コンポーネントを **generic 化 or 複製**して `product-image-upload` として再利用。

フロントの流れ:
1. ユーザーが画像を選択
2. `crypto.randomUUID()` で nonce 生成
3. Storage `product-images` バケットに `${userId}/pending/${nonce}_${idx}_${filename}` でアップロード
4. 返った public URL を配列に蓄積
5. フォーム送信時、`image_urls` として BFF に POST
6. BFF が product INSERT 後、product_images に URL を記録

---

## 6. UI 仕様

### 6.1 `/products/new`（資材登録フォーム）

**アクセス制御**: maker 以外は `/home` にリダイレクト（Server Component で `getRole()` チェック）

**フォーム要素**:

| 項目 | 型 | 必須 | UI |
|---|---|---|---|
| 製品名 | text | ✅ | `<Input>` max 100 |
| タイプ | select | ✅ | `product_types` から `<Select>`（事前に BFF `GET /v1/product-types` で取得） |
| 一般用途 | text | | `<Textarea>` rows=3, max 500 |
| 主成分 | text | | `<Input>` max 200 |
| 作用機序 | text | | `<Textarea>` rows=3, max 500 |
| 販売状況 | select | | 「販売中 / 準備中 / 販売終了」の固定 3 択 |
| 効果タグ | multi | | `product_benefits` を `<Command>` Multi-Select（Phase 6 の CropPicker と同型） |
| 対象作目 | multi | | `/v1/crops/tree` から階層選択（Phase 6 CropCascadeFilter の流用検討） |
| 認証 | multi | | `certifications` から multi-select |
| 画像 | file[] | | 0-5 枚、5MB/枚、.jpg/.png/.webp |

**送信**:
- ローディング中は全 input disabled
- 成功後 `router.push("/maker/products")` でリダイレクト
- 失敗時はフォーム上部にエラー表示

### 6.2 `/maker/products`（自社資材一覧）

**アクセス制御**: maker 以外は `/home` にリダイレクト

**レイアウト**:
- ページ上部に「新規登録」ボタン（`/products/new` へのリンク）
- カードまたはテーブル（Phase 6 の `/products` の `ProductCard` 再利用）
- 空配列時: 「まだ資材を登録していません」プレースホルダ + 新規登録 CTA
- **v1 ではカードクリック → `/products/[id]` に遷移**。編集 UI は Phase 9 以降

### 6.3 デザイン

- 既存 `globals.css` 継続使用
- shadcn コンポーネント（Button / Input / Textarea / Select / Command / Popover）を再利用
- Phase 7 で導入した star rating や画像 drag & drop があれば再利用

---

## 7. 受け入れ条件

### 7.1 API 動作
- [ ] maker で `POST /v1/products` 成功 → products + 各関連テーブルに行が作成される
- [ ] farmer / unassigned で 403
- [ ] 未ログインで 401
- [ ] 必須項目欠落 / 型不正で 422
- [ ] maker で `GET /v1/maker/products` → 自社資材のみ返る
- [ ] 別 maker で叩くと他社の資材は含まれない

### 7.2 UI 動作
- [ ] `/products/new` が maker 以外でアクセスすると `/home` にリダイレクト
- [ ] 必須項目未入力でバリデーションエラー
- [ ] 画像 0 枚でも登録成功
- [ ] 成功後 `/maker/products` に遷移、登録した資材がリストに含まれる
- [ ] 登録資材のカードクリックで `/products/[id]` に遷移、詳細が表示される

### 7.3 BFF 原則
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）維持
- [ ] `supabase.storage.*` の利用は画像アップロード箇所のみ

### 7.4 ビルド / 検証
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功

---

## 8. 触らないファイル

- `supabase/migrations/20260415*`（既存 init / seed / rls）
- `supabase/migrations/20260420*`（Phase 7 で commit 済）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `reviews.py`（他 Phase の範囲）
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/products/[id]/*`（Phase 6/7 で完成、ここで改修しない）
- `frontend/src/proxy.ts`
- `.claude/` 配下
- `docs/specs/auth-flow.md` / `products.md` / `review-post.md`

---

## 9. 触るファイル（予想）

### 新規
- `supabase/migrations/YYYYMMDDHHMMSS_product_images_storage_rls.sql`（§3.1）
- `backend/app/routers/maker.py`（自社資材一覧 router）
- `frontend/src/app/products/new/page.tsx`
- `frontend/src/app/products/new/_components/product-form.tsx`
- `frontend/src/app/products/new/_components/tag-multi-select.tsx`（効果タグ / 認証で使う）
- `frontend/src/app/products/new/_components/product-image-upload.tsx`
- `frontend/src/app/maker/products/page.tsx`
- `frontend/src/app/api/products/route.ts`（BFF proxy for POST /v1/products）
- `frontend/src/app/api/maker/products/route.ts`（BFF proxy for GET /v1/maker/products）

### 既存修正
- `backend/app/routers/products.py`（POST 追加）
- `backend/app/models/schemas.py`（`ProductCreatePayload` 追加）
- `backend/app/main.py`（`maker.router` の include_router 追加）

---

## 10. 設計上の注意

- **products INSERT と関連テーブル INSERT は非トランザクション**: supabase-py は単発 REST。失敗時の手動ロールバック（products 行削除 → CASCADE で関連消去）を実装する。Phase 5 onboarding / Phase 7 reviews と同パターン
- **maker が未 onboarding の場合**: `maker_profiles` 行が存在しない maker は /products/new にアクセス可能だが、実運用では onboarding 完了が前提。`/products/new` の Server Component で `/v1/onboarding/status` を叩いて `has_profile=false` なら `/onboarding/maker` にリダイレクトするのが丁寧（v1 必須ではない、時間があれば実装）
- **maker_id の書き換え攻撃**: BFF で `maker_id = current_user.id` を強制（payload の maker_id は受け取らない or 無視する）
- **画像 orphan**: 登録失敗時に Storage にアップロード済の画像は残存。v1 では許容。掃除は v1.5 以降

---

## 11. Reviewer 呼び出し

実装完了後、`.claude/handoff/templates/worker-to-reviewer.md` に従ってハンドオフ文を生成。**Ryoga が「ハンドオフ出して」と明示するまで出さない**。

## 12. Ryoga 判断依頼事項

- Q1: `/maker/products` のパスは `/maker/products` で良いか（将来 `/maker/dashboard` 等を作るなら `/maker/*` namespace として妥当）
- Q2: `product-images` Supabase Storage バケットの事前作成は Ryoga が Supabase Studio で実施予定か、worker に手順を委ねるか
- Q3: 効果タグ / 対象作目 / 認証の UI は Phase 6 の `CropPicker` / `CropCascadeFilter` の流用で良いか、新規デザインで作るか

---

**以上**
