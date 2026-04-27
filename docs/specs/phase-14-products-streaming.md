# Farmille `/products` ストリーミング配信 + 段階表示 仕様 (Phase 14)

**作成日**: 2026-04-26
**対象**: `/products`（資材一覧）の初期表示遅延とフィルタ操作の体感速度
**作業ブランチ**: `feat/phase-14-products-streaming`（派生元: post-launch-hardening merge 後の `main`）
**実装担当**: worker
**位置づけ**: v1 ローンチ後の UI/UX + パフォーマンス強化フェーズ第一弾
**前提 Phase**: Phase 11c hotfix #2 完了（navigation-overlay 安定動作）、Phase 12a/b/c 完了

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール（必達）

**現状の問題（observed）**:
- `frontend/src/app/products/page.tsx:67-71` で 3 本の API（`/v1/products`, `/v1/product-types`, `/v1/crops/tree`）を `Promise.all` + `cache: "no-store"` で全部 await
- `page.tsx` が return するまで client には何も届かない → 体感 1〜3 秒の真っ白（navigation-overlay に覆われる時間）
- ユーザの要望: 「サイト自体は見れて、資材一覧だけがあとから出る」段階表示

**必達**:
- `/products` の **ヘッダー / フィルタ UI / フッター** は最遅 200ms 以内に first paint
- 資材グリッド部分は **skeleton** で枠を確保し、データ到着で差し込む（streaming SSR）
- マスタデータ（`product-types`、`crops/tree`）はキャッシュに乗せ、2 回目以降は即時
- フィルタ操作時の `isPending` UI を skeleton 寄りに改善（現 `opacity-60` より能動的）

### 0.2 縮退ライン（落ちても v1.6 送り可）

- **BFF 集約エンドポイント `/v1/products/page-data`**: 3 fetch を 1 fetch に集約。実装コスト中程度のため初回 PR 範囲外でも可
- **Supabase Storage image transform**（サムネイル生成）: 一覧での画像転送量削減。優先度中、別 PR でも可
- **Backend cold start 対策**（Vercel Cron で Railway を warm に保つ）: 別 issue 化可
- **`useOptimistic` でのフィルタ即時反映**: `useTransition` + skeleton overlay で十分なら v1.6 送り

### 0.3 翌日送り（本 Phase 対象外）

- `/products/[id]` 詳細ページの streaming 化（別 spec で扱う）
- `/me/reviews`, `/maker/products` の同様改修（パターン横展開は v1.6+）
- 全文検索 / ソート / ページネーション機能追加
- Edge runtime 化検討
- Lighthouse CI 等の自動計測整備

### 0.4 Ryoga 直接作業（worker 範囲外）

- Vercel / Railway / Supabase の plan / region / cache header 設定変更
- Sentry の performance monitoring 有効化
- 計測結果のレポーティング

---

## 1. スコープ

### 1.1 対象ファイル / ルート

- `frontend/src/app/products/page.tsx`（既存、構造変更）
- `frontend/src/app/products/loading.tsx`（**新規**）
- `frontend/src/app/products/_components/product-list.tsx`（**新規**: Suspense 境界の中身）
- `frontend/src/app/products/_components/product-grid-skeleton.tsx`（**新規**: skeleton カード）
- `frontend/src/app/products/_components/type-filter.tsx`（既存、`isPending` 表現の見直し検討）
- `frontend/src/app/products/_components/crop-cascade-filter.tsx`（既存、同上）

### 1.2 対象外（触らない）

- `frontend/src/app/loading.tsx`（global overlay、Phase 11c 維持）
- `frontend/src/app/_components/navigation-overlay.tsx`（Phase 11c hotfix 維持）
- `frontend/src/components/ui/button.tsx`（Phase 11a 維持）
- `backend/app/routers/products.py`（§4 の集約エンドポイントを採用する場合のみ追加。本 Phase 必達範囲では無変更）
- `backend/app/routers/product_types.py`, `crops.py`（無変更）
- `supabase/migrations/*`（DB スキーマ変更なし）
- 認証 / RLS / Storage 周辺
- `docs/specs/*`（本 spec 作成以外）
- `.claude/`

---

## 2. 設計方針

### 2.1 Streaming SSR への構造転換

現行の「page.tsx 内で全 fetch を await」を **Server Shell + Suspense 子コンポーネント** に分解する。

```
ProductsPage (server, fast: ヘッダー/フィルタ/フッターのみ render)
├── Header (即時)
├── <Suspense fallback={<FiltersSkeleton/>}>
│     └── FiltersData (server: types + tree fetch、キャッシュ ON)
│        ├── TypeFilter (client)
│        └── CropCascadeFilter (client)
│   </Suspense>
├── <Suspense fallback={<ProductGridSkeleton/>}>
│     └── ProductList (server: products fetch、searchParams 依存)
│   </Suspense>
└── Footer (即時)
```

**効果**:
- ヘッダー / フッターが先に flush される
- types + tree はキャッシュヒット時 0ms で出る
- 資材グリッドは skeleton のあとデータ到着で差し込む
- Suspense ごとに独立して stream されるため、片方が遅くてももう片方は止まらない

### 2.2 キャッシュ階層

| エンドポイント | 性質 | 戦略 |
|---|---|---|
| `/v1/product-types` | マスタデータ、更新頻度低 | `next: { revalidate: 600 }` 相当（10 分） |
| `/v1/crops/tree` | マスタデータ、ほぼ不変 | `next: { revalidate: 3600 }` 相当（1 時間） |
| `/v1/products` | リスト、searchParams 別 | `next: { revalidate: 30 }` 相当（30 秒）+ tag |
| `/v1/products/[id]` | 詳細（本 Phase 範囲外） | 別 spec |

**注意（Next.js 16 の cache API 変更）**:
- `frontend/AGENTS.md` で「学習データと違う」と明記されている
- worker は実装前に `node_modules/next/dist/docs/` の caching / fetch / `'use cache'` directive 関連ドキュメントを必ず読み、上記 `next.revalidate` 構文が現行 API と一致するか確認すること
- もし `'use cache'` directive 方式に変わっている場合はそちらを採用する。spec の意図は「マスタは長め、リストは短め、ヘッダー/フッターは静的」であり、構文の固定は要求しない

### 2.3 navigation-overlay との二重発火

- Phase 11c hotfix の overlay は document click listener で発火 → `pathname` 変化で消える
- 本 Phase の skeleton は Suspense 内側で表示
- **重畳の挙動**: Link クリック → overlay 表示 → 新ルートに遷移 → overlay 消える → page shell 即時 first paint → grid 部分は skeleton → データ到着で差し込み
- 視覚的に連続性があり破綻しない（同じ primary green のスピナー / トーンを使う）

### 2.4 フィルタ操作時の体感

現状: `type-filter.tsx` / `crop-cascade-filter.tsx` で `useTransition` の `isPending` を `opacity-60` で表現

改善案（必達）:
- `isPending` 中は `<ProductList>` 領域に skeleton overlay を被せる（`opacity-60` だけでなく skeleton 自体を上から重ねる）
- フィルタ chip は即時に新選択状態を反映（`useOptimistic` 検討、ただし複雑化するなら見送り可）

縮退案:
- `isPending` 中の skeleton は出さず、現行 `opacity-60` 維持（v1.6 送り）

---

## 3. 実装ファイル

### 3.1 新規: `frontend/src/app/products/loading.tsx`

ルートセグメント `loading.tsx` は **page.tsx の Suspense fallback として自動採用される**。`/products` への初回遷移で page.tsx の Server Component が suspend している間に表示される。

設計指針:
- ヘッダー領域は実物と同じ高さで枠だけ（layout shift 防止）
- フィルタ領域は chip の skeleton（高さ・幅実物相当）
- 資材グリッドは `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` で 6 個程度のカード skeleton
- `ProductGridSkeleton` を再利用（§3.3）
- フッター領域は枠だけ
- アニメーション: Tailwind `animate-pulse`

実物 `page.tsx` のレイアウトを踏襲し、**「同じ場所に同じ大きさの灰色ブロック」が見える** こと。

### 3.2 新規: `frontend/src/app/products/_components/product-list.tsx`

server component。現 `page.tsx` の products fetch + grid 描画ロジックをここに移す。

責務:
- `searchParams` から `type_id` / `crop_id` を受け取る
- `/v1/products` を fetch（キャッシュ戦略 §2.2 適用）
- 結果が 0 件なら `<EmptyState>`、それ以外は `ProductCard` を grid で並べる
- `<EmptyState>` で必要な `selectedType.name` / `selectedCropName` は props で受け取る or 同コンポーネント内で軽量に解決（types / tree を再 fetch する必要があれば cache hit 前提で OK）

`page.tsx` 側はこれを `<Suspense fallback={<ProductGridSkeleton/>}>` で囲む。

### 3.3 新規: `frontend/src/app/products/_components/product-grid-skeleton.tsx`

責務:
- `ProductCard` と同じ外形・サイズの skeleton カードを 6 個並べる
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`（page.tsx:169 と同一）
- カード内は画像領域（`aspect-video` 等）、タイトル 2 行分、サブテキスト 1 行分の灰色ブロック
- `animate-pulse` で軽くシマー
- デザイントークン（`docs/design-tokens.md`）の muted / border 色を使う

### 3.4 既存: `frontend/src/app/products/page.tsx`

変更概要:
- 3 fetch を直接呼ぶ構造を撤廃
- ヘッダー / フィルタ / フッターは今まで通り server で render
- フィルタが必要とする `productTypes` / `tree` は **キャッシュ ON で別 fetch**（page.tsx 自体は速い）
- 資材グリッド部分は `<Suspense fallback={<ProductGridSkeleton/>}><ProductList searchParams={...}/></Suspense>` に置き換え
- `headerSubtitle` は現状 `productTypes` / `tree` に依存しているが、キャッシュヒット前提で page.tsx の中で解決して OK（最初の miss 時に 1 回だけ遅くなるが許容）

代替案: `headerSubtitle` の情報も `<Suspense>` 内で表示し、page.tsx は本当に静的な部分だけにする。worker 判断で OK だが「ヘッダーの subtitle が遅れて出る」は UX 的にやや違和感あり、§2.1 の構造（フィルタも Suspense）を採用するなら subtitle は ProductList 側に置く。

### 3.5 既存: `type-filter.tsx` / `crop-cascade-filter.tsx`

変更（§2.4 採用時）:
- `isPending` 時の `opacity-60` は維持
- 加えて、親の `<ProductList>` 領域に skeleton を被せる仕組みは page.tsx 側で実装（これらコンポーネント自体の変更は最小）

---

## 4. （任意）BFF 集約エンドポイント

§0.2 縮退ライン項目。本 Phase の必達ではないが、効果が大きいため記載。

### 4.1 概要

`backend/app/routers/products.py` に新エンドポイント `/v1/products/page-data` を追加：
- 入力: `type_id?`, `crop_id?`
- 出力: `{ products, product_types, crops_tree }` を 1 レスポンスで返す
- backend 内で 3 つの Supabase クエリを並列実行（asyncio.gather）

### 4.2 効果

- Next.js → FastAPI の往復が **3 → 1** に
- ネットワーク RTT × 2 削減（Vercel→Railway は地理的に遠ければ 100-200ms × 2）
- ただし backend 内のクエリ並列度は維持

### 4.3 トレードオフ

- 既存の単独エンドポイント（`/v1/product-types`、`/v1/crops/tree`）は他画面でも使うため**残す**
- 新設は付加であり置換ではない
- 同型のパターンを横展開すると BFF endpoint が増殖する → 採用するなら命名規約を決める（`{resource}/page-data` で統一する等）

### 4.4 採用判断

worker 着手時、§3 までを実装したあとの計測（Chrome DevTools Network タブで waterfall）で：
- products / types / tree の各 fetch が並列に走り、最遅 + 50ms 程度で揃うなら **不採用**
- どれかが直列化していたり、RTT 自体がボトルネックなら **採用**

---

## 5. （任意）Supabase Storage image transform

§0.2 縮退ライン項目。

### 5.1 概要

Supabase Storage は URL クエリパラメータでサムネイル生成可能（`?width=400&quality=80` 等）。

`product_images.image_url` を一覧で使う際、ProductCard 側でクエリパラメータを付与して 400px サムネイルを取得する。

### 5.2 効果

- 一覧での画像転送量が 1/5〜1/10
- LCP / TTI 改善
- モバイル回線で特に効く

### 5.3 注意点

- Supabase の plan により image transformation が有料機能の場合がある → Ryoga 確認
- 既存 `image_url` カラムの値は原寸 URL → ProductCard でラップする helper を作るか、URL そのものに query を appendする
- 詳細ページでは原寸を表示するため、helper は引数でサイズを受け取る形に

---

## 6. 受け入れ条件

### 6.1 機能 / UX

- [ ] `/products` 初回遷移で **ヘッダー / フッター / フィルタ枠** が 200ms 以内に first paint（ローカル開発、ネット throttle なし）
- [ ] 資材グリッド領域に skeleton カード 6 個が表示されている時間がある（即時返ってもゼロでよいが、データ遅延時に確実に見える）
- [ ] データ到着で skeleton が ProductCard に置き換わる（layout shift なし）
- [ ] 0 件結果でも skeleton → EmptyState のスムーズな置き換え
- [ ] フィルタ操作（type_id / crop_id 変更）で **navigation-overlay は出ない**（pathname 同一、§2.3）
- [ ] フィルタ操作中は `<ProductList>` 領域に skeleton（または現行 opacity-60、§2.4 縮退時）
- [ ] 2 回目以降の `/products` 遷移は types / tree が cache ヒットで即時
- [ ] back button で戻ってきた時も skeleton → データの順で破綻しない（Phase 11c hotfix #2 の overlay 永続化 regression なし）
- [ ] 検索エンジン視点での SSR 出力に資材一覧が含まれる（streaming 完了後の HTML に products がある、SEO 影響なし）

### 6.2 デザイン

- [ ] skeleton カードのサイズが ProductCard と一致（width / height / aspect-ratio）
- [ ] skeleton 色がデザイントークン準拠（`docs/design-tokens.md`、muted / border）
- [ ] `animate-pulse` のリズムが過剰でない
- [ ] グリッドのレスポンシブ breakpoint が ProductCard と一致

### 6.3 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 成功、`/products` ルートが streaming 対応（build log で Suspense boundary 確認）
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` 0 件維持
- [ ] DOA 違反なし（フロントから DB 直接アクセスなし）

### 6.4 Ryoga 手動 E2E（本番 Vercel）

- [ ] `/` から `/products` へ Link クリック → navigation-overlay → /products shell が早く出る → グリッドだけ後から
- [ ] `/products` で type_id 変更 → グリッドだけ skeleton → 結果差し込み（ヘッダー無変化）
- [ ] `/products` で crop の cascade 操作 → 同上
- [ ] `/products` で 0 件結果 → skeleton → EmptyState
- [ ] `/products` → `/products/[id]` → back → /products に戻って overlay 永続化なし（Phase 11c hotfix #2 維持）
- [ ] モバイル Safari / Chrome で同等の挙動

### 6.5 計測（任意・推奨）

- [ ] Chrome DevTools Performance タブで TTFB / FCP / LCP を before/after 比較
- [ ] Network タブで products / types / tree の waterfall を確認
- [ ] 実 backend を含む navigation で「資材グリッド差し込みまで」の時間を秒単位で記録
- [ ] 結果は PR description に記載

---

## 7. 実装手順 + commit 方針

### 7.1 ブランチ

`feat/phase-14-products-streaming`（main から派生）

### 7.2 commit 構成（推奨 3 commits）

```
1. feat(products): add product grid skeleton component
   - product-grid-skeleton.tsx 新規

2. feat(products): split product list into suspense boundary
   - product-list.tsx 新規（page.tsx の products fetch 部分を移管）
   - page.tsx 構造変更
   - loading.tsx 新規

3. perf(products): cache master data fetches with revalidate
   - types / tree fetch にキャッシュ戦略適用
   - 必要なら page.tsx / product-list.tsx 微修正
```

`isPending` 中の skeleton overlay（§2.4）を採用する場合は 4 つ目の commit:

```
4. feat(products): show skeleton overlay during filter pending
```

§4 / §5 を採用する場合は別 PR（本 PR には混ぜない）。

### 7.3 工数目安

- §3 実装: 2-3 時間
- 計測 + 検証: 1 時間
- 合計: **半日**

§4 / §5 を含めると追加で半日〜1 日。

---

## 8. 設計上の注意

### 8.1 Next.js 16 cache API 変更（再掲）

`frontend/AGENTS.md` に明記の通り、Next.js 16 はキャッシュ関連 API が学習データと異なる可能性が高い。worker は **必ず** `node_modules/next/dist/docs/` で以下を確認:
- `fetch` の cache options（`next: { revalidate, tags }`）の現行表記
- `'use cache'` / `cacheTag` / `cacheLife` directive の有無
- ルートセグメントの `export const revalidate` / `dynamic` 設定の挙動
- `loading.tsx` と Suspense 境界の自動関係

memory feedback「lint 回避で spec state 構造を変えない」と同じ精神で、**spec の意図（「マスタは長め、リストは短め、shell は静的」）を満たすこと**を優先し、構文の固定はしない。

### 8.2 Suspense の粒度

- 細かく切りすぎると stream chunk が増えて overhead 増
- 粗すぎると先述の「全 fetch 待ち」と変わらない
- 本 Phase の最低粒度: ① shell（page.tsx 直下）② フィルタ ③ 資材グリッド の 3 層
- 詳細ページ（/products/[id]）は別 spec

### 8.3 SEO / SSG

- `/products` は SEO 対象（メタデータあり、metadata.ts 相当を持つ）
- streaming SSR でも HTML 完成後の DOM には全コンテンツが含まれるため Google bot 等は問題なし
- ただし TTFB は早くなり、TTI は変わらない or やや遅くなる可能性 → Lighthouse で確認

### 8.4 navigation-overlay との視覚連続性

- 共通: `bg-white/60 backdrop-blur-sm` + primary green スピナー
- skeleton は別系統（pulse 灰色）
- 「overlay → shell → skeleton → 実データ」の視覚遷移が自然か Ryoga 手動確認

### 8.5 Backend cold start

- §0.2 縮退項目だが、実測で cold start 由来の +1〜3 秒があるなら本 Phase の skeleton で「動いてる感」を出すことで体感悪化を吸収できる
- 抜本対策（Vercel Cron で warm pinger）は別 issue

---

## 9. ローンチ後改善案 (v1.6+)

- `/products/[id]` 詳細ページの同様 streaming 化
- `/me/reviews`, `/maker/products` への横展開
- 全文検索（PostgreSQL `tsvector` or Meilisearch）+ 検索結果の streaming
- ページネーション or infinite scroll
- `useOptimistic` でのフィルタ即時反映
- Lighthouse CI で perf regression 検出
- Sentry Performance Monitoring の有効化と budget 設定

---

## 10. ビズ向け要約（参考、PR description 用）

このフェーズで何が変わるか（非エンジニア向け）:

- **before**: 資材一覧ページを開くと、すべてのデータが揃うまで真っ白で 1〜3 秒待たされる
- **after**: ページの枠（ヘッダー、フィルタ、フッター）は瞬時に表示。資材リスト部分だけ「読み込み中の灰色ブロック」が出ている間にデータが届き、自然にカードに置き換わる
- **意図**: 「動いている」フィードバックを最速で出して離脱を防ぐ。実際の速度向上もあるが、それ以上に **体感速度** を変える

---

**以上**
