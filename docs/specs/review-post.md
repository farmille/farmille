# Farmille v1 レビュー投稿機能 仕様 (Phase 7)

**作成日**: 2026-04-23
**対象**: レビュー投稿フロー（POST /v1/products/{id}/reviews + UI + 画像アップロード）
**作業ブランチ**: `feat/review-post`（派生元: Phase 6 merge 後の `main`。Phase 6 未 merge なら `feat/lp-products-v1` に stack）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`products.md` と同水準、`auth-flow.md` ほどの厳密度は持たない）

---

## 0. ゴール / 縮退ライン

**必達**:
- farmer が `/products/[id]` で **rating + 本文** のレビューを投稿できる
- 投稿後、同ページのレビュー一覧に即反映される
- フロントからの Supabase 直叩きはゼロ（skill §1.3 厳守、Phase 5/6 の路線継承）

**縮退ライン（落ちても翌 Phase 送り可）**:
- 画像アップロード（本機能の中核ではあるが、最悪テキスト投稿だけで成立）
- ja_staff / researcher の投稿 UI 対応（現状 RLS で farmer のみ許可のため、v1.5 送り）

---

## 1. 画面一覧

| パス | 種別 | 変更内容 | データ源 |
|---|---|---|---|
| `/products/[id]` | Server + Client | 既存ページ下部に**レビュー投稿フォーム**を追加 | BFF `POST /v1/products/{id}/reviews` |

新規ページは作らない。Phase 6 で作った `/products/[id]` にフォームを差し込む。

---

## 2. データ書き込み方針（skill §1.3 厳守）

- **reviews テーブルへの INSERT は BFF 経由**（`POST /v1/products/{id}/reviews`）
- **画像アップロードのみ Supabase Storage 直叩き許容**（skill §1.3 例外 2「写真アップロード」）
  1. フロントで `crypto.randomUUID()` により `review_id` を先発行（§5.1 案 B）
  2. `review-images` バケットに `{uid}/{review_id}/{filename}` のパスでアップロード
  3. BFF に `review_id` + rating + body を POST（画像 URL は送らない。画像と review は Storage パスのみで紐づく）
  4. BFF は `reviews` に 1 行 INSERT。画像メタデータテーブルは存在しないため BFF は画像に関与しない（ADR-0003）
- RLS path enforcement（`{auth.uid}/{review_id}/{filename}`）は Storage RLS で強制されるため、上記 1-2 を守れば通る

---

## 3. DB スキーマ変更

本 Phase で必要な migration は 1 本（Storage RLS のみ）。**画像メタデータ用の中間テーブル `review_images` は作らない**（ADR-0003 維持）。画像と review は Storage のパス命名規約 `{uid}/{review_id}/{filename}` のみで紐づける。

### 3.1 既存 draft commit: `20260420000000_review_images_rls.sql`

Storage RLS（バケット `review-images` のポリシー）。**このファイルは既に未追跡で存在する**。Phase 7 冒頭で `git add` + commit する。

既に dev 環境に apply 済か要確認（`supabase db push --linked` で冪等に確認）。

### 3.2 変更しない RLS

reviews テーブルの既存 RLS (`reviews_insert_farmer`) は **farmer のみ許可**のまま維持。spec v1 では farmer 限定でリリース。ADR-0002 (`docs/decisions/0002-reviews-insert-role-scope.md`、現在未追跡 draft) は v1.5 以降の検討として保留。

---

## 4. FastAPI エンドポイント

### 4.1 新規: `POST /v1/products/{product_id}/reviews`

配置は `backend/app/routers/products.py` に追加（Phase 6 の `GET /v1/products/{id}/reviews` と同居。Phase 6 reviewer §5.1.4 の判断「product-scoped operations は products.py に」に従う）。

```
POST /v1/products/{product_id}/reviews
認証: Bearer JWT 必須
権限: farmer のみ（require_role("farmer")）
Payload:
  {
    "review_id": str (uuid, 必須),  // フロントで crypto.randomUUID() 発行（§5.1 案 B）
    "rating": int (1-5, 必須),
    "body": str (1-2000 文字, 必須)
  }
Response 201:
  { "ok": true, "review_id": "uuid" }
Response 409:
  { "ok": false, "error": "review_already_exists" }  // UNIQUE(user_id, product_id) 違反
Response 403 / 401 / 422:
  既存パターン
```

処理順序:
1. payload の `review_id` を id として `reviews` に 1 行 INSERT（`INSERT INTO reviews (id, user_id, product_id, rating, body) VALUES (...)`）
2. UNIQUE(user_id, product_id) 違反 → 409
3. 画像は BFF を経由しない（フロントが Storage に直接アップロード済み。BFF は DB にメタデータを保存しないため `image_urls` を受け取らない）

### 4.2 既存変更: `GET /v1/products/{product_id}/reviews`

Phase 7 では既存実装を変更しない（画像は一覧に表示しない）。画像表示が必要になった時点で ADR を起票し、`supabase-py` の Storage `list({uid}/{review_id}/)` か、BFF で `review_id` から算出した URL を返す方式を検討する（v1.5+ スコープ）。

---

## 5. 画像アップロードの実装

### 5.1 RLS path 制約との調整

Storage RLS は `{auth.uid}/{review_id}/{filename}` を要求するが、**投稿前に review_id は存在しない**。回避案 2 つ:

- **案 A（推奨）**: アップロード先の path を `{auth.uid}/pending/{uuid}_{filename}` として投稿前に upload。投稿成功後、BFF 側で Storage の move API 経由で `{auth.uid}/{review_id}/{filename}` に rename する
- **案 B**: review_id をフロントで先に発行（uuid.v4）し、その id でアップロード後、同じ id で BFF に POST。ただし reviews の id は DB で default 採番されるため、POST body に指定する対応が必要

**v1 は案 B を採用**（実装がシンプル）:
- Payload に `review_id: uuid` を含める
- BFF は `INSERT INTO reviews (id, user_id, ...) VALUES ($1, ...)` で指定した id で挿入
- フロントは先に `review_id = crypto.randomUUID()` して、その id を Storage path と POST body 両方に使う

### 5.2 Storage 呼び出し（フロント）

```typescript
const supabase = createClient();  // frontend/src/lib/supabase/client.ts
const reviewId = crypto.randomUUID();
const userId = session.user.id;

for (const [idx, file] of files.entries()) {
  const path = `${userId}/${reviewId}/${idx}_${file.name}`;
  const { error } = await supabase.storage
    .from("review-images")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  // BFF には URL を送らない。Storage パス `{uid}/{review_id}/` で紐づく
}

// その後 BFF に POST（image_urls は送らない。Storage パスで紐づく）
fetch(`/api/reviews`, {
  method: "POST",
  body: JSON.stringify({ product_id, review_id: reviewId, rating, body }),
});
```

### 5.3 BFF proxy

`frontend/src/app/api/reviews/route.ts` に BFF proxy を追加（既存の `/api/onboarding/*` パターン踏襲）。

---

## 6. UI 仕様

### 6.1 レビュー投稿フォーム（`/products/[id]` 下部）

表示条件:
- **未ログイン**: 「ログインしてレビューを投稿する」リンク（`/login?next=/products/{id}`）
- **farmer ログイン済**: 投稿フォーム表示
- **maker / unassigned ログイン済**: 「このロールではレビュー投稿できません」の説明表示（フォーム非表示）

フォーム要素:
- **評価**: 星 5 段階の ★ クリック UI（1-5、必須）
- **本文**: textarea、1-2000 文字、必須、文字数カウンタ付き
- **画像アップロード**: drag & drop + クリック選択、最大 5 枚、各 5MB 以下、.jpg/.jpeg/.png/.webp
- **送信ボタン**: 送信中は disabled、成功後は `router.refresh()` でレビュー一覧更新

### 6.2 デザイン

- 既存 `globals.css` の CSS 変数を使用（`bg-primary` / `text-foreground` 等）
- shadcn `Button` / `Textarea` / `Input` / `Label` を再利用（Phase 5/6 で導入済）
- 星 UI は `lucide-react` の `<Star />` / `<StarOff />` or filled/unfilled の色分岐（Phase 6 reviewer §7.1 の指摘に対応）

---

## 7. 受け入れ条件

### 7.1 API 動作
- [ ] farmer で `POST /v1/products/{id}/reviews` 成功 → reviews テーブルに 1 行（id は payload の `review_id`）作成
- [ ] アップロードした画像が Supabase Storage の `review-images/{uid}/{review_id}/` 配下に存在
- [ ] maker / unassigned / 他 role で 403
- [ ] 未ログインで 401
- [ ] 同一 farmer が同 product に 2 回投稿 → 409
- [ ] rating が 1-5 範囲外 or body 空で 422
- [ ] フロントが画像 6 件以上を選択した場合、アップロード前にクライアント側で弾く（UI 制約）

### 7.2 UI 動作
- [ ] `/products/[id]` の farmer ログイン時に投稿フォーム表示
- [ ] 画像 0 枚でも投稿可能
- [ ] 送信成功後、レビュー一覧に即反映
- [ ] 投稿後、同じページを再読み込みしても 409 エラーとして「既に投稿済み」の表示

### 7.3 BFF 原則
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）維持
- [ ] 写真アップロードの `supabase.storage.*` のみ新規追加で許容

### 7.4 ビルド
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] `cd backend && uv run uvicorn app.main:app --port 8000` 起動 OK

---

## 8. 触らないファイル

- `supabase/migrations/20260415*`（init / seed / rls の既存分）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py`（Phase 5/6 で凍結）
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- `docs/specs/auth-flow.md` / `products.md`（過去 Phase の spec は不変）

---

## 9. 触るファイル（予想）

### 新規
- `frontend/src/app/products/[id]/_components/review-form.tsx`
- `frontend/src/app/products/[id]/_components/review-image-upload.tsx`
- `frontend/src/app/api/reviews/route.ts`（BFF proxy）

※ `backend/app/routers/reviews.py` は**作らない**。POST は `products.py` に配置（Phase 6 の `GET /v1/products/{id}/reviews` と同居）。

### 既存修正
- `supabase/migrations/20260420000000_review_images_rls.sql`（未追跡 draft を git add + commit）
- `backend/app/routers/products.py`（POST `/reviews` を追加。GET は Phase 7 で変更しない）
- `backend/app/models/schemas.py`（`ReviewCreatePayload` 追加）
- `frontend/src/app/products/[id]/page.tsx`（フォーム埋め込み + 認証判定）
- （必要なら）`frontend/next.config.ts` の `images.remotePatterns` に Supabase Storage ドメインを追加

---

## 10. 設計上の注意

- **reviews の UNIQUE (user_id, product_id)**: 同一 farmer が同 product に複数投稿できない制約が既にある。409 で返す明示的ハンドリングが必要
- **画像 orphan の扱い**: ADR-0003 維持により中間テーブルが無く、投稿失敗時に Storage にアップロード済みの画像は `{uid}/{review_id}/` 配下に残る。v1 ではクリーンアップ実装なし。v1.5 で cron or 投稿失敗時のクライアント側 Storage delete を検討
- **BFF のトランザクション**: Phase 7 の BFF は `reviews` INSERT 1 本のみ（中間テーブル無し）。失敗時のロールバックは不要

---

## 11. Reviewer 呼び出し

実装完了後、`.claude/handoff/templates/worker-to-reviewer.md` に従ってハンドオフ文を生成。**Ryoga が「ハンドオフ出して」と明示するまで出さない**。

## 12. Ryoga 判断（確定済）

- Q1: 画像 path 制約の回避案 → **案 B 確定**（フロントで `crypto.randomUUID()` 発行、Storage path と POST body 両方に使う）
- Q2: ADR-0002 の 3ロール拡張 → **v1.5 送り確定**。Phase 7 では `reviews_insert_farmer` のまま維持。ADR-0002 は Phase 7 では commit しない
- 中間テーブル `review_images` → **作らない確定**（ADR-0003 維持。画像と review は Storage パスで紐づく）

---

**以上**
