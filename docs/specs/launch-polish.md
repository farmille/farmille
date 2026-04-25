# Farmille v1 ローンチ準備 UX 仕上げ 仕様 (Phase 11)

**作成日**: 2026-04-25
**対象**: v1 ローンチ直前の観測基盤導入 + 認証 UX 整備 + onboarding 直後体験の改善 + SNS 対策 + loading UX 標準化
**作業ブランチ**: `feat/launch-polish`（派生元: Phase 10 merge 後の `main`）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`image-edit-and-launch-ready.md` と同水準）
**前提 Phase**: Phase 10（画像編集 + 基本的な v1 機能セット）完了

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール（launch blocker の最終整備）

**必達**:
- Analytics 導入により、ローンチ後「何が見られているか / どこで離脱するか」を計測できる
- Sentry 導入により、frontend / backend のエラーがリアルタイムに把握できる
- onboarding 完了後、**farmer は `/products`、maker は `/maker/products`** に着地し、次の行動が自然に取れる
- maker ダッシュボード（= `/maker/products`）に「資材 0 件の空状態 CTA」を表示
- パスワードリセット UI が成立し、ユーザーがログインできなくなるデッドロックを避けられる
- 認証系メール（signup 確認 / password reset）が日本語 + Farmille ブランディングで届く
- セッション切れ時に「再ログインが必要です」を明示し、ログイン画面に誘導する
- LP / 資材一覧 / 資材詳細に OGP / meta tags が設定され、SNS シェア時に整った見た目になる
- 送信系ボタン（レビュー / 資材登録 / 認証）が押下時に spinner + disabled 状態を表示し、ユーザーが「押された」ことを認識できる

### 0.2 縮退ライン（落ちても翌 Phase 送り可）

- **Email テンプレートのカスタムドメイン送信**（`noreply@farmille.jp` 等、SPF/DKIM 設定込み）: §4.4 では日本語化 + Farmille ブランディングのみを必達とし、独自ドメインは v1.5 送り可
- **画像ギャラリー / リスト系の skeleton UI**: §9 では submit 系の spinner 整備を必達とし、list 系の skeleton は v1.5 送り可
- **イベント計測の網羅性**: §2 では主要 5 イベントのみを必達とし、細かい UI 操作イベントは launch 後に追加可

### 0.3 翌日送り（本 Phase 対象外）

以下は Phase 12 以降で扱う:
- farmer「自分のレビュー一覧」ページ（Phase 12）
- 画像バケット 10MB 化 + drag & drop sort（Phase 12）
- `getSession()` → `getUser()` 置換 + Storage RLS 再確認（Phase 12）
- **farmer のレビュー投稿時プロフィール必須化（progressive onboarding）**（Phase 12）
  - 方針: onboarding は「ログインのみで通過」とし、レビュー投稿フローの先頭でプロフィール（prefecture / city / 作目 1 件以上）を求める
  - スキーマ変更なし。`farmer_profiles` 行は「未設定 = 不在」で表現
  - これにより本 Phase の静的 nudge / `profile-status` endpoint は不要になった（§5 / §6.1 削除済み）
- 静的 nudge バナー（farmer プロフィール未設定）（**本 Phase から削除、上記 progressive onboarding に統合**）
- 動的 nudge（Edge Functions 経由）（Phase 13 / v1.5）
- モバイル対応確認（Phase 13 / v1.5）

### 0.4 Ryoga 直接作業（本 Phase の worker 範囲外）

- Supabase Dashboard での Email テンプレート適用（worker が用意した HTML/テキストを Ryoga が投入）
- GA4 プロパティ作成 + measurement ID 発行（or Plausible 選定時は同様の準備）
- Sentry プロジェクト作成 + DSN 発行
- OGP 用の画像素材（LP の og:image、1200×630px）

---

## 1. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/onboarding/complete` | Server | ロールに応じて「はじめる」ボタンのリンク先を動的に決定（maker → `/maker/products`、reviewer 系 → `/products`）。ページ自体は表示維持（祝意 UI）| 全員 |
| `/home` | Server | **薄い redirect ラッパ化に確定**（§4.1 / Q5 推奨案）。role を見て `/products` or `/maker/products` に server redirect する 1 行の page。既存リンク・OAuth callback 互換のため削除しない | 全員 |
| `/products` | Server | OGP / meta tags のみ追加（nudge バナーは Phase 12 progressive onboarding に統合のため本 Phase 対象外）| 全員閲覧 |
| `/maker/products` | Server | 資材 0 件時の空状態 CTA を「最初の資材を登録しましょう」ボタン付きに拡張 | maker |
| `/(auth)/login` | Client | 「パスワードをお忘れですか？」リンクを追加、セッション切れ toast 表示 | 全員 |
| `/(auth)/password-reset` | Client（新規） | メールアドレス入力 → Supabase の `resetPasswordForEmail` 呼び出し | 全員 |
| `/(auth)/password-update` | Client（新規） | リセットメール内リンクの着地先。新パスワード入力 → Supabase の `updateUser` 呼び出し | reset token 保持者のみ |
| `/` / `/products` / `/products/[id]` | Server | OGP / meta tags を設定 | 全員 |

新規ページは `password-reset` / `password-update` の 2 枚のみ。

**スコープ縮退の経緯**: 当初仕様にあった「farmer プロフィール未設定 nudge バナー」と「`/v1/me/profile-status` endpoint」は、Ryoga 判断（2026-04-25）で **Phase 12 の progressive onboarding（レビュー投稿時にプロフィール必須化）に統合** することになり、本 Phase からは削除済み。

---

## 2. Analytics 導入（§0.1 必達 1）

### 2.1 ツール選定

**推奨: GA4**（Google Analytics 4）
- 無料、日本語 UI、エコシステム成熟
- Farmille ユーザー層（農家 / メーカー）は cookie banner への抵抗が少ない想定
- `next/third-parties/google` で `<GoogleAnalytics />` を入れるだけで SSR/CSR 両対応

**代替: Plausible**
- privacy-friendly、cookie 不要、$9/mo
- SNS 拡散時のプライバシー配慮を重視するなら採用

Ryoga 判断 Q1 で確定（§10）。

### 2.2 最小計測イベント（必達 5 件）

| イベント | 発火タイミング | 必要 param |
|---|---|---|
| `page_view` | 全ページ遷移 | path（自動） |
| `sign_up_complete` | onboarding 完了時 | role |
| `review_submit` | レビュー投稿成功時 | product_id |
| `product_create` | 資材登録成功時 | product_type_id |
| `filter_apply` | 資材一覧で type/crop filter 適用時 | filter_type |

### 2.3 実装方針

- `frontend/src/lib/analytics/` 新規（薄いラッパ、providers 抽象化）
- 環境変数: `NEXT_PUBLIC_GA_MEASUREMENT_ID`（GA4 採用時）
- SSR で rendering 完了後のクライアント側のみで計測（PII 無し）
- **backend 側の計測は本 Phase では行わない**（BFF 経由のイベントは frontend から発火）

---

## 3. Sentry 導入（§0.1 必達 2）

### 3.1 frontend

- `@sentry/nextjs` 導入
- `next.config.ts` に Sentry plugin を差し込み、source map を自動 upload
- 環境変数: `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN`（build 時のみ）
- 無料プラン（5k errors/month）で開始

### 3.2 backend

- `sentry-sdk[fastapi]` 導入
- `backend/app/main.py` で `sentry_sdk.init(...)` を conditional に（DSN 環境変数あり時のみ）
- 環境変数: `SENTRY_DSN`

### 3.3 スコープ制限

- PII を送らない（user_id のみ、email / name は scrubbing）
- `tracesSampleRate: 0.1`（10%、無料枠節約）
- dev 環境では無効化（`NODE_ENV=production` のみ init）

---

## 4. 認証 UX 整備（§0.1 必達 3-5）

### 4.1 onboarding 完了後リダイレクト

現状参照:
- `frontend/src/app/onboarding/complete/page.tsx`: server component、`getUser()` ベース、「はじめる」ボタンが `/home` への `<Link>`
- `frontend/src/app/home/page.tsx`: server で auth + role 取得 → reviewer / maker 別の placeholder 画面（L52-64 の role 別文言）
- frontend 内に `redirect("/home")` が **8 箇所**存在（Q5 で残置決定なら影響なし、廃止なら全箇所書き換え必要）:
  - `products/new/page.tsx:33` / `products/[id]/edit/page.tsx:57, 98` / `maker/products/page.tsx:24`
  - `onboarding/farmer/page.tsx:56` / `onboarding/maker/page.tsx:38` / `onboarding/page.tsx:26`
  - `lib/auth/actions.ts:87`（signup 完了 → role 別 redirect）

変更（Q5 推奨案 = 薄い redirect ラッパ化を前提）:
- `/onboarding/complete` の「はじめる」ボタンの `<Link href>` を、サーバー側でロールを見て決定:
  - `maker` → `/maker/products`
  - `farmer` / `researcher` / `ja_staff` → `/products`
  - `unassigned` → `/onboarding`（既存ロジック維持）
  - ページ自体（祝意 UI）は維持。auto-redirect はしない（ユーザーが「はじめる」を能動的に押す体験を保つ）
- `frontend/src/app/home/page.tsx` を **薄い server redirect 1 ファイル**に置き換え:
  ```tsx
  // role を取得 → maker なら /maker/products、reviewer 系なら /products、unassigned なら /onboarding
  // 未ログインなら /login
  ```
  既存 `redirect("/home")` 呼び出し 8 箇所はそのまま残してよい（`/home` で 1 ホップ吸収）。**ただし新規コードでは role 別の直接 redirect を推奨**（`lib/auth/actions.ts:87` のみ本 Phase で role 別直接 redirect に置換、その他は Phase 12 でクリーンアップ）
- 旧 placeholder 文言（L52-64）は削除（各ランディングページの空状態 CTA が役割を引き継ぐ）

### 4.2 パスワードリセット UI

Supabase Auth の `resetPasswordForEmail` + `updateUser` を使う標準フロー。

**`/(auth)/password-reset`**（新規）:
- メールアドレス入力フォーム
- 送信時: `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://.../(auth)/password-update' })`
- 成功後: 「メールを送信しました。届かない場合は迷惑メールを確認してください」メッセージ

**`/(auth)/password-update`**（新規）:
- reset メール内リンクからの着地（Supabase が URL fragment で access_token を付与）
- 新パスワード入力 + 確認入力
- 送信時: `supabase.auth.updateUser({ password })`
- 成功後: `/login` にリダイレクト + toast「パスワードを更新しました」

**`/(auth)/login`** 修正:
- 「パスワードをお忘れですか？」リンク（`<Link href="/password-reset">`）をフォーム下に追加

### 4.3 セッション切れ UX

**検知と誘導**:
- BFF proxy（`frontend/src/app/api/**/route.ts`）が 401 を返した場合、呼び出し側 form の `mapStatus(401)` で `router.push('/login?expired=1')` を発火
- Server Component では `getUser()` が null（または `getRole()` が `unassigned` 以外の判定で失敗）の時点で `redirect('/login?expired=1')`
- login ページ側: `searchParams.expired === '1'` なら toast「セッションが切れました。再ログインしてください」を表示

**実装方針**（共通 wrapper は本 Phase では作らない）:
- 既存 form の `mapStatus()` 関数（`review-form.tsx:329`、`product-form.tsx:560`）に 401 ブランチ追加で対応
- 理由: 共通 fetch wrapper の新設は影響範囲が広く、Phase 11 の他項目（Sentry / OGP / nudge）と並行すると衝突しやすい。Phase 12 で `lib/api/client.ts` 新設 + 既存 fetch 置換を一括で行う方が安全
- 本 Phase で触るべき箇所は **既存 form 5 箇所の `mapStatus` 拡張** のみ（review-form / product-form / signup / login / onboarding-form ×2）

**触るファイル**:
- `frontend/src/app/(auth)/login/page.tsx`（expired param 検出 + toast 表示）
- `frontend/src/app/products/[id]/_components/review-form.tsx`（mapStatus に 401 ブランチ）
- `frontend/src/app/products/new/_components/product-form.tsx`（同上）
- `frontend/src/app/(auth)/signup/page.tsx`（同上、必要なら）
- `frontend/src/app/onboarding/farmer/_components/farmer-form.tsx` / `onboarding/maker/_components/maker-form.tsx`（同上、必要なら）

### 4.4 Email テンプレートの日本語化 + ブランディング

**対象テンプレート**（Supabase Auth デフォルト 4 種のうち v1 で使う 2 種）:
- `Confirm signup`: サインアップ確認メール
- `Reset password`: パスワードリセットメール

**カスタマイズ内容**（Ryoga 判断 Q2 で範囲確定）:
- **A（必達）**: 本文の日本語化 + Farmille ブランディング（ロゴ URL / 緑色 primary #3A7F5C / 署名「Farmille チーム」）
- B（縮退可）: レビュー投稿時にメーカーへ通知など、認証以外の通知追加
- C（v1.5 送り）: 独自ドメイン送信（`noreply@farmille.jp` + SPF/DKIM）

**成果物**:
- `docs/email-templates/confirm-signup.html` + `.txt`（multipart 両方）
- `docs/email-templates/reset-password.html` + `.txt`
- Ryoga が Supabase Dashboard > Authentication > Email Templates に貼り付けて適用

---

## 5. maker 空状態 CTA

### 5.1 maker ダッシュボード（= `/maker/products`）の空状態 CTA

**条件**: `role = maker` かつ 自社資材 0 件（既存の「資材がありません」空状態を拡張）

**UI**: 既存の空状態コピーを CTA 付きに変更
```
まだ資材が登録されていません。
最初の資材を登録して、農家からのレビューを受け取りましょう。
[最初の資材を登録する] ← /products/new に遷移
```

### 5.2 実装方針

- **server-side 判定**: 既存の `/maker/products` ページが SSR で自社資材を取得しているため、その結果が空かどうかで条件分岐するだけ
- 新規 BFF endpoint 追加なし
- client hydration 不要

---

## 6. FastAPI エンドポイント

**本 Phase で新規 endpoint なし**。`/v1/me/profile-status` は Phase 12 progressive onboarding に統合のため不要化。

唯一の backend 修正は `backend/app/main.py` への Sentry init 追加（§3.2）。

**触らない既存 router**: auth, onboarding, products, reviews, crops, product_types, product_benefits, certifications, maker。

---

## 7. OGP / meta tags

### 7.1 対象ページと内容

| パス | title | description | og:image |
|---|---|---|---|
| `/` | `Farmille - BS資材の農家レビュープラットフォーム` | 「農家・JA 普及員・研究者が BS 資材のリアルな使用感を共有する場」（実コピーは Ryoga 確定）| `/og-lp.png`（1200×630、Ryoga 素材）|
| `/products` | `資材一覧 - Farmille` | 「BS 資材を作目・タイプ別に探せます」 | `/og-products.png`（or LP 流用）|
| `/products/[id]` | `{product.name} - Farmille` | 商品説明 + レビュー平均値（サーバー側で組み立て）| 商品の代表画像 or LP 流用 |

### 7.2 実装

- Next.js 15 の `generateMetadata` API を使う
- `frontend/src/app/layout.tsx` にデフォルトの openGraph / twitter 設定
- 各ページで `generateMetadata` を export して override
- twitter card は `summary_large_image`
- og:image の PNG 素材が揃うまでは placeholder URL を使い、Ryoga 判断 Q4 で最終素材に差し替え

---

## 8. Loading UX 標準化

### 8.1 対象（必達）

送信系（form submit）ボタン:
- signup / login
- onboarding farmer / maker form
- review submit（新規 + 編集）
- product create / update
- password reset 送信
- password update 送信

### 8.2 パターン

`<Button>` コンポーネントを拡張:
- `loading` prop 追加 → spinner（lucide-react `Loader2` を `animate-spin`）+ disabled
- `loadingText` prop 追加（例: "送信中..."）
- 既存 `disabled` との合成: `disabled = props.disabled || props.loading`

使用箇所で `useTransition` or `formState.isSubmitting` を `loading` に繋ぐ。

### 8.3 縮退（v1.5 送り）

- list 取得時の skeleton 表示（Supabase からのフェッチ待ち）
- 楽観的 UI（submit 前にローカル state 反映）

---

## 9. 触らないファイル

- `supabase/migrations/*`（本 Phase でスキーマ変更なし）
- `backend/app/routers/{auth,onboarding,products,reviews,crops,product_types,product_benefits,certifications,maker}.py`
- `frontend/src/app/products/[id]/_components/*`（Phase 9-10 範囲、loading 対応は form 側のみ）
- `frontend/src/app/products/new/_components/*`（同上）
- `frontend/src/app/onboarding/*`（リダイレクト先の変更のみ、form 自体は触らない）
- `docs/specs/*`（本 Phase で作成以外）
- `.claude/`

---

## 10. 触るファイル（予想）

### 新規

- `frontend/src/app/(auth)/password-reset/page.tsx` + `_components/password-reset-form.tsx`
- `frontend/src/app/(auth)/password-update/page.tsx` + `_components/password-update-form.tsx`
- `frontend/src/lib/analytics/{index.ts,events.ts}`
- `docs/email-templates/confirm-signup.{html,txt}`
- `docs/email-templates/reset-password.{html,txt}`
- `public/og-lp.png`（Ryoga 素材受領後）

### 既存修正

- `backend/app/main.py`（Sentry init のみ）
- `frontend/src/app/layout.tsx`（GA4 script、Sentry init、デフォルト OpenGraph、Noto 維持）
- `frontend/src/app/page.tsx`（`generateMetadata`）
- `frontend/src/app/products/page.tsx`（`generateMetadata` のみ。nudge は Phase 12 送り）
- `frontend/src/app/products/[id]/page.tsx`（`generateMetadata` 動的）
- `frontend/src/app/maker/products/page.tsx`（空状態 CTA 拡張）
- `frontend/src/app/onboarding/complete/page.tsx`（role 別「はじめる」ボタンリンク先決定）
- `frontend/src/app/home/page.tsx`（薄い server redirect ラッパ化、Q5 確定後）
- `frontend/src/lib/auth/actions.ts`（L87 の `/home` を role 別の直接 redirect に置換。残り 7 箇所の `redirect("/home")` は `/home` ラッパ経由で吸収するため Phase 11 では触らない）
- `frontend/src/app/(auth)/login/page.tsx`（「パスワードをお忘れですか？」リンク + expired toast）
- `frontend/src/components/ui/button.tsx`（`loading` / `loadingText` prop 追加）
- `frontend/src/app/(auth)/signup/page.tsx` / `onboarding/farmer/_components/farmer-form.tsx` / `onboarding/maker/_components/maker-form.tsx` / `products/[id]/_components/review-form.tsx` / `products/new/_components/product-form.tsx`（送信ボタンの `loading` 対応）
- `frontend/next.config.ts`（Sentry plugin wrap）
- `frontend/package.json` / `backend/pyproject.toml`（依存追加: `@sentry/nextjs` / `sentry-sdk[fastapi]` / `next/third-parties`）
- `frontend/.env.example` / `backend/.env.example`（環境変数追加）

---

## 11. 受け入れ条件

### 11.1 Analytics

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` 設定時、GA4 の DebugView に `page_view` が流れる
- [ ] onboarding 完了で `sign_up_complete` が role 付きで発火
- [ ] レビュー投稿成功で `review_submit` が product_id 付きで発火
- [ ] 資材登録成功で `product_create` が発火
- [ ] 資材一覧 filter 変更で `filter_apply` が発火
- [ ] dev 環境（`NODE_ENV=development`）では計測されない

### 11.2 Sentry

- [ ] frontend の意図的な throw が Sentry ダッシュボードに出る
- [ ] backend の意図的な 500 が Sentry ダッシュボードに出る
- [ ] 両方とも user_id のみで email / name が scrubbed されている

### 11.3 認証 UX

- [ ] onboarding 完了 → maker は `/maker/products` に着地
- [ ] onboarding 完了 → farmer / researcher / ja_staff は `/products` に着地
- [ ] `/home` 直アクセスで role 別に上記にリダイレクト（or 404 でも可）
- [ ] login 画面の「パスワードをお忘れですか？」から `/password-reset` に遷移
- [ ] メール受信 → リンククリック → `/password-update` でパスワード変更 → `/login` リダイレクト + toast
- [ ] 認証 2 種のメールが日本語 + Farmille ブランディングで届く（Ryoga が Dashboard 貼り付け後）
- [ ] 401 検知時に `/login?expired=1` に飛び、toast が表示される

### 11.4 maker 空状態 CTA

- [ ] maker で資材 0 件だと `/maker/products` に CTA 付き空状態
- [ ] maker で資材 1 件以上ある時は通常の一覧表示

### 11.5 OGP

- [ ] `/` の `view-source` に `og:title` / `og:description` / `og:image` / `twitter:card` が揃う
- [ ] `/products/[id]` の og:title が商品名になる
- [ ] og:image の URL が absolute（`https://...`）

### 11.6 Loading UX

- [ ] 送信系ボタン全てが押下中 spinner + disabled
- [ ] 2 回押し防止（連打で multiple submit されない）

### 11.7 BFF 原則

- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` 0 件維持
- [ ] password reset / update は Supabase Auth SDK（`supabase.auth.resetPasswordForEmail` / `supabase.auth.updateUser`）を使用 — これらは `auth.*` であり skill §1.3 の `from()` / `rpc()` 禁止対象外（既存 signup / login と同パターン、新規例外ではない）

### 11.8 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功（新規 auth ページ 2 枚反映）
- [ ] backend `from app.main import app` 成功
- [ ] E2E 手動確認: signup → onboarding → ロール別着地 → レビュー投稿（analytics 発火確認）

---

## 12. 設計上の注意

### 12.1 Analytics と PII

- email / name を event param に含めない
- user_id（UUID）は OK だが、これも不要なら入れない
- dev 環境 off は Sentry も同じ（二重にコストを発生させない）

### 12.2 Sentry の source map

- `SENTRY_AUTH_TOKEN` は CI/CD の secret として扱う（リポジトリにコミットしない）
- dev では source map upload をスキップ

### 12.3 パスワードリセット URL の redirectTo

- 本番では `https://farmille.jp/password-update`（確定前は Ryoga 環境に合わせて `.env` で切替）
- Supabase Auth の **Allow List** に追加が必要（Ryoga Dashboard 作業）

### 12.4 `/home` 廃止の互換性

- 既存 OAuth の redirect URL が `/home` を指しているか要確認（`backend/app/routers/auth.py` の OAuth callback、grep 結果は 0 件で実質影響なし）
- frontend 内の `redirect("/home")` は **8 箇所**残存（§4.1 一覧参照）。本 Phase では `lib/auth/actions.ts:87` のみ書き換え、残り 7 箇所は `/home` 薄ラッパ経由で 1 ホップ吸収する方針（Phase 12 でクリーンアップ）
- **Q5 で「廃止」を選んだ場合は、本 Phase の触るファイルに 7 箇所追加 + 工数 +0.5 日**になる旨 worker / Ryoga で合意してから着手

### 12.5 nudge / progressive onboarding（Phase 12 送り）

- 本 Phase の nudge バナーは削除済（Ryoga 判断 2026-04-25）
- 代わりに Phase 12 で「**レビュー投稿フローの先頭にプロフィール入力ステップを差し込む**」progressive onboarding 方式に変更
- onboarding 自体はメールアドレスとロール選択のみで通過させる（誰でもまず「動ける」状態に）
- スキーマ変更なし。`farmer_profiles` 行未存在 = 「未設定」として扱う

### 12.6 Email テンプレートの確認

- 日本語フォントがメールクライアントで崩れないように、システムフォントのみ使う（`font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif`）
- HTML 版は基本的な style inline、テキスト版は plain

---

## 13. Ryoga 判断

### 確定済（2026-04-25）

- **Q3**: farmer プロフィール「完了」判定 → **本 Phase からは外す**。Phase 12 progressive onboarding（レビュー投稿時にプロフィール必須化）に統合
- **Q5**: `/home` → **薄い redirect ラッパとして残す**（`lib/auth/actions.ts:87` のみ Phase 11 で role 別直接 redirect に置換、残り 7 箇所は Phase 12 でクリーンアップ）
- **Q7**: ja_staff / researcher の nudge → **Phase 12 progressive onboarding に統合**（本 Phase 対象外）

### 未確定

- **Q1**: Analytics は GA4 / Plausible どちらを採用する？（推奨: GA4）
- **Q2**: Email 整備範囲は A（日本語化 + ブランディング）/ B（+ 通知メール追加）/ C（+ 独自ドメイン）のどこまで？（推奨: A）
- **Q4**: OGP 用の `og-lp.png`（1200×630）素材は Ryoga が用意 or worker がプレースホルダ作成？
- **Q6**: Sentry / GA4 のプロジェクト作成 + 環境変数発行は本 Phase 実装前に Ryoga 完了する？それとも worker が placeholder で進めて後で差し替える？（推奨: placeholder 並列、ローンチ直前差し替え）

---

## 14. 作業スケジュール + Phase 11a / 11b 分割

### 14.1 Phase 11a: observability + 基盤（先行）

**ブランチ**: `feat/launch-polish-1-observability`
**目的**: ローンチに必須の観測基盤と、影響が薄く広い見た目改善を集中投入

**含む**:
- §2 Analytics 導入（GA4）
- §3 Sentry 導入（frontend + backend）
- §7 OGP / meta tags
- §8 Loading UX 標準化
- §4.4 Email テンプレート HTML 作成（Ryoga 貼り付けは別作業）
- §5 maker 空状態 CTA（軽量で OGP / Loading と同梱しても破綻しない）

**commit 構成**（4 commits）:
```
1. chore(phase11a): add Sentry + GA4 scaffolding, env vars, deps
2. feat(frontend): OGP / meta tags across public pages
3. feat(ui): Button loading prop and apply to submit sites
4. chore(phase11a): add JP email templates and maker empty-state CTA
```

**工数目安**: 半日 + 半日 + 半日 + 1-2h = **約 1.5 日**

### 14.2 Phase 11b: 認証 UX

**ブランチ**: `feat/launch-polish-2-auth-ux`（11a merge 後 main から派生）
**目的**: 認証まわりの不便解消（password reset / session expire / role 別着地）

**含む**:
- §4.1 onboarding 完了後 role 別リダイレクト + `/home` ラッパ化
- §4.2 password reset / update UI
- §4.3 session expire 検知 + toast

**commit 構成**（3 commits）:
```
1. feat(auth): post-onboarding role-based redirect and /home wrapper
2. feat(auth): password reset and update flow
3. feat(auth): session expire detection and login toast
```

**工数目安**: 1-2h + 半日 + 半日 = **約 1 日**

### 14.3 全体工数

- Phase 11a: 約 1.5 日
- Phase 11b: 約 1 日
- 検証 / Ryoga 手動: 半日 × 2
- **合計: 約 3 日**（11a / 11b の並列化は不可、11a merge → main 安定 → 11b 派生の順序）

### 14.4 Ryoga 事前作業（11a 着手前に揃えたい）

- Q1（GA4 / Plausible）確定
- Q2（Email 範囲 A/B/C）確定
- Q4（OGP 素材入手 or placeholder 容認）確定
- Q6（環境変数 placeholder 進行 or 事前発行）確定 — 推奨は placeholder 並列

---

**以上**
