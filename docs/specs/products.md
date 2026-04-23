# Farmille v1 資材ページ + LP 仕様(Phase 6 軽量版)

**作成日**: 2026-04-23
**対象スプリント**: 4/23 単日(19:00 までに Vercel プレビュー URL 共有)
**作業ブランチ**: `feat/lp-products-v1`(派生元 `feat/onboarding-v1`)
**実装担当**: worker
**位置づけ**: 縮退前提の「軽量受け入れ条件」(Phase 5 auth-flow.md ほどの厳密度は持たない)

---

## 0. 縮退ライン(必達)

19:00 時点で以下が Vercel プレビュー URL で閲覧できれば本 Phase は成立:

- LP `/`(SSG)
- 資材一覧 `/products`(タイプフィルタ込み)

**翌日(4/24)送りでも可**:

- 資材詳細 `/products/[id]`
- レビュー一覧
- 作目別 3 層カスケードフィルタ

---

## 1. 画面一覧

| パス | 種別 | 縮退ライン | データ源 |
|---|---|---|---|
| `/` | Server Component / SSG | 必達 | 静的(LP コピー) |
| `/products` | Server Component | 必達 | BFF `GET /v1/products` |
| `/products/[id]` | Server Component / SSR | 翌日可 | BFF `GET /v1/products/{id}` |
| `/products/[id]` 内のレビュー一覧 | Server Component | 翌日可 | BFF `GET /v1/products/{id}/reviews` |
| `/products` の 3 層作目フィルタ | Server + Client | 翌日可 | BFF `GET /v1/crops/tree` |

---

## 2. データ取得方針(skill §1.3 責務分離 厳守)

- **フロント(`frontend/src/**`)から `supabase.from()` / `supabase.rpc()` を一切呼ばない**
  (Phase 5 の B 案で同じ違反を解消した経緯あり)
- 全て BFF(FastAPI `/v1/*`)経由。Server Component から `fetch(${API_URL}/v1/...)` で取得
- `process.env.API_URL` を環境変数として参照(`RAILWAY_*` 直参照は禁止)
- 認証必要なエンドポイントは Server Component で `getSession()` の `access_token` を Bearer 付与(Phase 5 と同じパターン)
- 本 Phase の API は **読み取り専用**(GET のみ)。LP 含めゲスト閲覧前提のため、認証なしで叩ける設計が望ましい

---

## 3. 必要な FastAPI エンドポイント

新規実装:

| メソッド | パス | 認証 | 役割 |
|---|---|---|---|
| `GET` | `/v1/products` | 不要 | 資材一覧。クエリで `type` / `crop_id` フィルタ |
| `GET` | `/v1/products/{id}` | 不要 | 資材詳細(JOIN: `product_types`, `maker_profiles` 等) |
| `GET` | `/v1/products/{id}/reviews` | 不要 | レビュー一覧(投稿者名・rating・body・created_at) |
| `GET` | `/v1/crops/tree` | 不要 | `crop_categories_l1` > `l2` > `crops` の 3 層ツリー |

既存スケルトン(`backend/app/routers/products.py` / `reviews.py`)を実装で埋める。

---

## 4. UI 仕様(雑)

### 4.1 LP `/`(SSG)
- Hero: Farmille のキャッチコピー + 「レビューを見る」CTA → `/products`
- 価値提案: 1-2 セクション(BS 資材の農家口コミプラットフォーム)
- フッター: 著作権 + サインアップ / ログインへの導線
- shadcn 系は Phase 5 で導入済の `Button` 等を使う

### 4.2 資材一覧 `/products`
- グリッド or リスト表示(資材名・タイプ・メーカー名)
- タイプフィルタ(BS資材・農薬・肥料・土壌改良材の 4 つ。`product_types` 由来)
- 縮退ライン: タイプフィルタは URL クエリ `?type=...` で実装(Server Component で再フェッチ)
- 3 層作目カスケードは翌日送り可

### 4.3 資材詳細 `/products/[id]`(翌日可)
- 資材名・メーカー名・タイプ・JBSA 効果タグ・対象作目
- 下部に **レビュー一覧**(rating ・本文・投稿日)
- 「レビュー投稿」CTA は v1 範囲外につき非表示 or disabled

### 4.4 デザイン
- **既存 `frontend/src/app/globals.css` を継続使用**(`tokens.css` を新設しない)
- design-tokens.md §10 で定義済の `--primary` `--foreground` `--border` などを使う
- 角丸 `rounded` / `rounded-md` のみ(`rounded-xl` 以上禁止)
- フォント: Noto Sans JP

### 4.5 画像
- 資材画像は **Unsplash / placeholder** 使用(本物の画像は v1 範囲外)
- `next/image` の `remotePatterns` に Unsplash を許可する設定が必要(`next.config.ts`)

---

## 5. 受け入れ条件(縮退ライン部分)

### 5.1 LP
- [ ] `/` にアクセスして Hero + CTA + フッターが描画される
- [ ] CTA から `/products` へ遷移できる
- [ ] design-tokens.md の primary 色(`#3A7F5C`)が CTA に反映されている

### 5.2 資材一覧
- [ ] `/products` で資材カードが表示される(空配列なら「該当なし」)
- [ ] タイプフィルタの 4 ボタン(BS資材 / 農薬 / 肥料 / 土壌改良材)が動作
- [ ] フィルタ結果が `?type=...` URL に反映される
- [ ] 全データ取得は BFF 経由(`grep -rn "supabase\.\(from\|rpc\)(" frontend/src` が 0 件)

### 5.3 翌日送り(緩い)
- [ ] `/products/[id]` で詳細表示・レビュー一覧表示
- [ ] 3 層カスケードで作目フィルタが効く(`/v1/crops/tree` 経由)

---

## 6. 触らないファイル

- `supabase/migrations/*`(DB 変更禁止)
- `backend/app/routers/auth.py` / `onboarding.py`(Phase 5 までで凍結)
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*`(同上)
- `frontend/src/proxy.ts`(認証経路の変更不要)
- `.claude/` 配下(運用基盤)

---

## 7. 触る必要があるファイル(予想)

新規:
- `frontend/src/app/page.tsx`(現在 Next.js 既定の TopPage を上書き)
- `frontend/src/app/products/page.tsx`
- `frontend/src/app/products/[id]/page.tsx`(翌日可)
- `frontend/src/app/products/_components/*`(タイプフィルタ等)
- `backend/app/routers/products.py`(スケルトンを実装で置換)
- `backend/app/routers/reviews.py`(同上)
- `backend/app/routers/crops.py`(新規 / 翌日可)
- `backend/app/models/schemas.py`(レスポンスモデル追加)

既存修正:
- `backend/app/main.py`(crops router を登録、翌日可)
- `frontend/next.config.ts`(Unsplash の `remotePatterns` 追加)

---

## 8. Reviewer 呼び出し

17:00 枠でハンドオフ。Ryoga が「ハンドオフ出して」と明示するまで worker は出さない。
雛形は `.claude/handoff/templates/worker-to-reviewer.md`。
