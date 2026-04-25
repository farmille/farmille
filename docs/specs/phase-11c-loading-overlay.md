# Farmille v1 ローディングオーバーレイ 仕様 (Phase 11c)

**作成日**: 2026-04-25
**対象**: 内部ナビゲーション（ページ遷移）開始から次画面 first paint までの 1-2 秒の待機時間を可視化
**作業ブランチ**: `feat/launch-polish-3-loading-overlay`（派生元: Phase 11b merge 後の `main`）
**実装担当**: worker
**位置づけ**: Phase 11 ホットフィックス、軽量受け入れ条件
**前提 Phase**: Phase 11a / 11b 完了（Button loading prop / `landingPathForRole` / `getUser` memoize 済み）

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール（v1 launch 前必達）

**必達**:
- 内部ナビゲーション（Link クリック / `router.push` / Server Action 後の `redirect`）開始から次画面の Server Component fetch 完了まで、**半透明オーバーレイ + 中央スピナー**を表示
- 「クリックした → 何か動いている」のフィードバックがユーザに即座に届くこと（実測 1-2 秒の待機を埋める）
- Phase 11a で実装済の **Button loading prop は維持**し、本機能と**役割分担**する（§5）

### 0.2 縮退ライン（落ちても v1.5 送り可）

- **個別ルートの skeleton**（資材カード型のプレースホルダ等）: v1 は global overlay のみ、ルート別の skeleton は v1.5 送り
- **クリック直後 0ms フィードバック**: Next.js の client-side navigation 開始まで ~50ms かかるが、体感 OK と割り切り。グローバルクリックリスナーで 0ms overlay は v1.5 送り
- **キーボードナビゲーション時の挙動最適化**: a11y フル対応は v1.5 送り

### 0.3 翌日送り（本 Phase 対象外）

- Phase 12 progressive onboarding / `/me/reviews` / drag&drop / `getSession→getUser`
- アップロード進捗バー（XHR progress）

---

## 1. 適用対象 / 対象外

### 1.1 適用対象（overlay を表示する遷移）

- `<Link href="/internal/path">` クリック（同 origin）
- `useRouter().push("/path")` / `useRouter().replace("/path")`
- Server Action 後の `redirect("/path")`
- Form action による Server Action 経由の遷移

### 1.2 対象外（overlay を表示しない）

- 外部リンク（`<a href="https://..." target="_blank">`、SDS / PDF 等）→ 新タブで開くため現タブは無変化
- Form 入力中のクリック（送信前）→ Phase 11a の Button loading prop で「ボタン押下のフィードバック」を担当
- 同一ルート内の `searchParams` 変更（例: フィルタ操作）→ 既存の `useTransition` ベース UI（`isPending` で opacity 60%）が担当、上書きしない
- Modal の開閉、shadcn Popover / Dialog 等の non-navigation interaction
- 初回ページロード（GET /products 等）→ Server Component が初期 render するだけで navigation pipeline を通らない

---

## 2. 技術選定: Next.js `loading.tsx` convention

Next.js 16 / React 19 の **`app/loading.tsx`** ファイル convention を採用する。理由:

- ファイル名規則だけで `<Suspense>` が自動生成される（custom 実装より stable）
- client-side navigation 中の Server Component suspend を自動検知
- 前のページが visible のまま loading.tsx の overlay が被さる挙動になり、UX 一貫
- Next.js の組み込み「instant navigation」（cache hit 時）に干渉しない（不要な flash 回避）

**Q3 採用**: `Next.js のネイティブ` 方針。

採用しない代替案:
- (B) Custom global overlay component + click listener: 実装複雑、Next.js のキャッシュ判定とずれる、Suspense より下流で動く
- (C) `nprogress` 系 top progress bar: visual style が Ryoga 指定の「中央スピナー + 半透明」と異なる。Phase 12+ で追加検討余地

---

## 3. 実装ファイル

### 3.1 新規: `frontend/src/app/loading.tsx`

```tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm"
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">読み込み中</span>
    </div>
  );
}
```

**設計意図**:
- `app/loading.tsx` はルート Suspense boundary として全ルート共通の fallback になる
- `fixed inset-0` で画面全体を覆う、`z-50` でモーダル / ヘッダー上に表示
- `bg-white/60 backdrop-blur-sm` で「画面が少し白っぽくなる」効果（Ryoga 指定）
- `Loader2` は Phase 11a Button loading で使用済 → デザイン一貫
- `text-primary` (#3A7F5C) でブランド色に揃える
- `role="status"` + `aria-live="polite"` + `sr-only` で screen reader 対応（最低限の a11y）

### 3.2 個別ルート loading.tsx は本 Phase で**作らない**

- v1 は global 1 ファイルで全ルートカバー
- 個別ルートで「資材カード型の skeleton」「商品詳細用 skeleton」等を作るのは v1.5 / Phase 12+ で（§0.2 縮退）

### 3.3 既存 layout / page には変更なし

- `app/layout.tsx` は既存のまま、Next.js が自動的に `app/loading.tsx` を Suspense fallback として割り当てる
- 各 `page.tsx` のコードは無変更

---

## 4. UI 仕様

### 4.1 オーバーレイ

| プロパティ | 値 | 理由 |
|---|---|---|
| 位置 | `fixed inset-0` | 画面全体カバー |
| z-index | `z-50` | shadcn 既存コンポーネント (Dialog, Popover) は z-40 以下 |
| 背景 | `bg-white/60` (white 60%) | Ryoga 指定「少し白っぽく」 |
| ぼかし | `backdrop-blur-sm` | 背景コンテンツが「見えるが操作不能」を視覚化 |
| クリック透過 | しない（pointer-events-auto） | 重複クリック防止（次画面が来るまで操作受け付けない） |

### 4.2 スピナー

| プロパティ | 値 | 理由 |
|---|---|---|
| アイコン | `Loader2` (lucide-react) | Phase 11a Button loading prop と統一 |
| サイズ | `h-12 w-12` (48px) | 画面中央で視認できる十分な大きさ、過剰でない |
| 色 | `text-primary` (#3A7F5C) | デザイントークン (`docs/design-tokens.md`) のブランド色 |
| アニメーション | `animate-spin` | Tailwind 標準、Phase 11a と同じ |

### 4.3 表示タイミング

- Next.js の client-side navigation 開始 → Server Component が suspend → loading.tsx 表示
- Server Component の fetch 完了 → 新ルートが ready → loading.tsx unmount
- 「待機 < 50ms」の高速遷移では loading.tsx が一瞬出ない（Next.js が抑制）→ flash しない

### 4.4 transition

- 当面なし（`fade-in` / `fade-out` は v1.5 送り）
- 1-2 秒の表示時間に対して fade animation は誤差範囲

---

## 5. Button loading prop との役割分担（Q-2 = b 採用）

| 役割 | 場所 | 実装 |
|---|---|---|
| **「ボタン押された反応」** | ボタン内 (button element) | Phase 11a `<Button loading={isPending}>` の中に Loader2 spinner |
| **「次画面ロード待ち」** | 画面全体 (overlay) | 本 Phase の `app/loading.tsx` |

シナリオ例（フォーム送信）:

```
1. User clicks submit button
2. Button loading prop → ボタン内 spinner 表示（即座 = ステップ 1-7 通じて）
3. Server Action 実行開始
4. Server Action: DB 書き込み等
5. Server Action: redirect("/products") 呼ぶ
6. Next.js client が redirect 受信 → navigation 開始
7. /products の Server Component fetch 開始
8. app/loading.tsx の overlay 表示 ← ここで初登場（ステップ 6-9 の間）
9. Fetch 完了 → /products page 描画
10. overlay unmount
```

**重ねがけは発生する**が、Button loading は「ボタン内」、overlay は「画面全体」で空間的に役割が異なる。ユーザは「ボタン押されて、画面全体が処理中になっている」と認識する。

---

## 6. 触らないファイル

- `frontend/src/app/layout.tsx`（Next.js が自動連動するため変更不要）
- `frontend/src/components/ui/button.tsx`（Phase 11a 実装済、本 Phase で再変更不要）
- 各 `page.tsx`（loading.tsx は親ディレクトリに置くだけで自動適用）
- 既存 form 内の `<Loader2 />` inline 表示（signup / login の auth raw button 含む）
- backend 全般
- `supabase/migrations/*`
- `docs/specs/*`（本 spec 作成以外）
- `.claude/`

---

## 7. 受け入れ条件

### 7.1 機能

- [ ] `<Link href="/products">` クリック時に画面が白っぽくなり中央でスピナーが回る
- [ ] router.push("/...") 経由の遷移でも同じ overlay 表示
- [ ] フォーム送信成功後の `redirect()` 経由遷移でも overlay 表示（ボタン内 spinner と併用）
- [ ] 外部リンク（`target="_blank"`）クリック時は overlay 出ない
- [ ] 同一ルート内の searchParams 変更（型フィルタ等）では overlay 出ない（既存 `isPending` opacity 60% を上書きしない）
- [ ] 高速遷移時に overlay が一瞬 flash しない（Next.js の自動抑制）

### 7.2 デザイン

- [ ] 背景 `bg-white/60 backdrop-blur-sm` で「画面が少し白っぽくなる」効果
- [ ] スピナーが画面中央 (`flex items-center justify-center`)
- [ ] スピナー色が primary green (#3A7F5C)
- [ ] z-50 で他要素の上に重なる
- [ ] スクリーンリーダで「読み込み中」と読める（role / aria-live / sr-only）

### 7.3 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功 + `app/loading.tsx` が build output に含まれる
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` 0 件維持（変更なしのはずだが念のため）
- [ ] 既存機能の regression なし（Phase 11a/11b の動作確認: signup / onboarding / review / product / password reset）

### 7.4 Ryoga 手動 E2E

- [ ] LP `/` から `/products` へ Link クリック → overlay 表示 → /products 表示
- [ ] /products から /products/[id] → overlay 表示
- [ ] レビュー投稿成功 → overlay 表示 → ページリフレッシュ
- [ ] 資材登録成功 → overlay 表示 → /maker/products 着地
- [ ] 既存タイプフィルタ・作目フィルタ操作で overlay 表示**しない**（既存 isPending UI のみ）

---

## 8. 実装手順 + commit 方針

### 8.1 ブランチ

`feat/launch-polish-3-loading-overlay`（main から派生）

### 8.2 commit 構成

```
1 commit で完結:
  feat(ui): add global navigation loading overlay
```

実装は 1 ファイル新設 + 動作確認のみ。分割不要。

### 8.3 工数目安

実装 5 分 + 検証 15 分 = **約 20 分**

---

## 9. 設計上の注意

### 9.1 React 19 の Suspense と Next.js の Streaming

- Next.js 16 + React 19 では Server Component が自動的に Suspense boundary を生成
- `app/loading.tsx` がそのフォールバック
- Streaming SSR でも動作（Server から RSC payload が届くまで loading.tsx 表示）

### 9.2 `app/(auth)/loading.tsx` 等のルートグループ別配置

- 不要。`app/loading.tsx` 1 個で全ルート共通カバー
- 例外的にルートグループ別 UI を出したい場合は `app/(auth)/loading.tsx` を追加（v1.5 / Phase 12+）

### 9.3 cache 判定との相互作用

- Next.js は同一ルートへの再遷移時に cache 利用 → 即座に表示（loading.tsx 飛ばす）
- 初回遷移や `cache: "no-store"` の場合のみ loading.tsx 表示
- これは UX 上望ましい挙動（無駄な flash 回避）

### 9.4 既存の `isPending` UI（タイプ / 作目フィルタ）との関係

- `frontend/src/app/products/_components/type-filter.tsx`、`crop-cascade-filter.tsx` の `isPending` 時の `opacity-60` 表現は同一ルート内の searchParams 変更で発火する
- これは loading.tsx を発火させない（同一ルート、Suspense を通らない）
- 既存挙動は維持され、本 Phase の global overlay とは独立に動く

### 9.5 「クリック直後 0ms フィードバック」の限界

- Next.js は Link クリック → 内部で navigation 開始 → ~50ms 後に Server Component が suspend し loading.tsx 表示
- ~50ms の遅延はほぼ知覚されない（ヒトの knee-jerk reaction が 100ms 以上）
- それでも気になる場合: Phase 11c-2 として global click listener で 0ms overlay 表示（v1.5 検討）

---

## 10. ローンチ後改善案 (v1.5+)

- **個別ルート skeleton**: `/products` に資材カード型 skeleton、`/products/[id]` に商品詳細型 skeleton を per-route loading.tsx で実装
- **クリック直後 0ms overlay**: global click listener + setState で Next.js suspend より早く反応
- **fade transition**: overlay の出現 / 消失を 100ms fade
- **進捗 bar 系**: `nprogress` 系 top bar との併用検討
- **アップロード進捗**: 画像 upload の XHR progress を spinner 内に %表示

---

## 11. 2026-04-26 hotfix: prefetch suspense gap

Phase 11c リリース後、本番（https://farmille.vercel.app）で `<Link>` クリック時に overlay が出ないケースが多数あることが判明。原因と対策:

### 11.1 原因

- Next.js は `<Link>` 周辺を prefetch して RSC payload をクライアントメモリにキャッシュする
- prefetch hit 時の `<Link>` クリックは Server Component を suspend しないため、`app/loading.tsx` (Suspense fallback) が発火しない
- しかし体感 1-2 秒の待機は依然存在する（hydration + 画像ダウンロード等の post-fetch コスト）
- `loading.tsx` は Suspense でしか掴めず、本番の主要遷移パスをカバーできない

### 11.2 対策: document click listener + derived pendingPathname

新規 client component `frontend/src/app/_components/navigation-overlay.tsx` を `app/layout.tsx` の `<body>` 末尾に常設。

実装方針:
- `document.addEventListener("click", ...)` で全ての `<a>` クリックを bubble phase で捕捉（event delegation、全 `<Link>` の置換不要）
- 同一 origin / 内部 path / target=_self / 修飾キー無し / 同一 path 以外への遷移時のみ overlay 表示
- `usePathname()` の値変化で derived state (`pendingPathname !== pathname`) として overlay 自動非表示
- `app/loading.tsx` は維持。Server Action redirect / `useRouter().push` / 真の slow fetch では引き続き Suspense fallback が機能

### 11.3 同一 path クリックの扱い

ヘッダーロゴ等で現在 path と同じ URL をクリックすると pathname 変化が起きないため overlay が消えなくなる risk。click 時に `url.pathname === pathname` なら最初から overlay を出さないことで回避。

### 11.4 既存 `loading.tsx` との二重発火

両者とも同視覚（`bg-white/60 backdrop-blur-sm` + 中央スピナー、`z-50`）で重なっても破綻しない。`pendingPathname` 一致で overlay が消えた後に Suspense fallback が出るパターンも視覚連続。

### 11.5 React 19 StrictMode 二重発火

`useEffect` の dev mode 二重実行は `addEventListener` / `removeEventListener` の cleanup 対称性で副作用なし。production では 1 回。

### 11.6 受け入れ条件（追加）

- [ ] 本番（Vercel）で `<Link href="/products">` クリック → ネットワーク throttle 無しでも overlay が瞬時に表示
- [ ] 遷移先到着で overlay が消える（pathname 変化検知）
- [ ] 外部リンク / `target="_blank"` / `download` / Cmd+クリック等で overlay 出ない
- [ ] アンカーリンク（`#section`）で overlay 出ない
- [ ] 同一 path クリック（`/` → `/` 等）で overlay 出ない（出っぱなし防止）
- [ ] フィルタ操作（searchParams 変更）で overlay 出ない（pathname 同一）
- [ ] Server Action `redirect()` / `router.push()` 経路は既存 `loading.tsx` Suspense fallback でカバー（regression なし）

### 11.7 触らないファイル（再掲）

- `frontend/src/app/loading.tsx`（維持）
- `frontend/src/components/ui/button.tsx`（Phase 11a Button loading prop 維持）
- 各 `<Link>`（event delegation でカバーするため置換不要）

### 11.8 commit

`fix(ui): show navigation overlay on link click to bypass prefetch suspense gap`

---

## 12. 2026-04-26 hotfix #2: back button で overlay が永続表示される bug

### 12.1 症状

PR #14 hotfix リリース後、`<Link>` 遷移直後にブラウザの戻るボタンを押すと、戻り先で overlay が消えなくなる症状が発覚。次の forward navigation まで画面が操作不能。

再現手順（https://farmille.vercel.app）:
1. `/products` を開く
2. ヘッダーの「自分のレビュー」または資材カードから `/products/[id]` に遷移
3. 遷移先で overlay が一瞬出て消える（正常）
4. ブラウザの戻るボタンを押す
5. `/products` に戻るが overlay が出続ける（bug）

### 12.2 原因

`navigation-overlay.tsx` の derived state パターン:

```tsx
const isNavigating = pendingPathname !== null && pendingPathname !== pathname;
```

タイムライン:
1. 初期: `pathname = "/products"`、`pendingPathname = null`
2. クリック: `setPendingPathname("/me/reviews")`、overlay 表示
3. 遷移完了: `pathname = "/me/reviews"`、derived `isNavigating = false`、overlay 非表示。**ただし `pendingPathname` は `"/me/reviews"` のまま残存**
4. back button: `pathname = "/products"`、`pendingPathname = "/me/reviews"`（stale）→ derived `isNavigating = true` → overlay 復活

`NavigationOverlay` は `app/layout.tsx` に常設のため component 再マウントは起きず、stale state が永続。

PR #14 で worker が「`react-hooks/set-state-in-effect` lint 警告回避」を理由に「2 useEffect 構造（spec 提示）」を「1 useEffect + derived state」に変更したのが原因。derived state は pathname の単方向参照のみで、`pendingPathname` の双方向同期 mechanism が無かった。

### 12.3 修正

pathname 変化を useEffect で監視し `setPendingPathname(null)` で reset:

```tsx
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setPendingPathname(null);
}, [pathname]);
```

`react-hooks/set-state-in-effect` lint 警告は外部 prop (pathname) 変化に対する derived state 同期パターンには適用対象外。React 公式推奨パターン。`eslint-disable-next-line` で限定抑制し、コメントで根拠記載。

修正後:
- forward nav: click → `setPendingPathname(target)` → overlay 表示 → 遷移完了で pathname 変化 → useEffect 発火 → `setPendingPathname(null)` → overlay 非表示
- back nav: pathname 変化 → useEffect 発火 → `setPendingPathname(null)`（既に null でも no-op）→ overlay 非表示
- bfcache restore: 同じく pathname 変化検知で reset

### 12.4 受け入れ条件（追加）

- [ ] `/products` → `/me/reviews` 遷移後、back button で `/products` に戻ると overlay が出ない
- [ ] `/products` → `/products/[id]` 遷移後、back button で `/products` に戻ると overlay が出ない
- [ ] `/maker/products` 等 reviewer 系以外でも back button で overlay が出ない
- [ ] 任意の forward → back の往復で overlay が永続化しない
- [ ] forward navigation 中の overlay 表示は引き続き機能（§11.6 既存条件 regression なし）

### 12.5 commit

`fix(ui): clear pending pathname on pathname change to fix back-button overlay persistence`

---

**以上**
