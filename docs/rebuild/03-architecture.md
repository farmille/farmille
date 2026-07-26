# 03 技術構成

前提：[00-overview.md](00-overview.md) D2・D9・D10・D12・D13。調査は2026-07-26 時点の一次情報確認済み（バージョン・既知問題は着手時に再確認すること）。

## 1. 全体構成

- フロント兼バックエンド：Next.js 16（App Router・Turbopack）／TypeScript／**Panda CSS**／Vercel
- DB・Auth・Storage：Supabase（同一プロジェクト継続・スキーマは v2 として全面刷新）
- 監視：Sentry ＋ GA4
- 品質ゲート：oxlint（主）＋ ESLint（補完）／oxfmt／tsc／Vitest／Playwright（M3 以降）／GitHub Actions
- **廃止**：FastAPI・Cloud Run・Python スタック一式（D2）

## 2. バックエンドは Next.js に集約する（D2・確定）

Route Handlers と Server Components が第一防御（認証・認可・入力検証）、RLS が第二防御という二層構造は維持し、実装場所だけを Next.js 側へ寄せる。刷新で後方互換が不要になり、v1 の処理はすべて CRUD ＋軽い集計であるため、2スタック・2デプロイ先を維持する便益がない。

構造規約：

- `src/app/` … ルーティングと画面。データ取得は Server Components から `src/server/` を呼ぶ。ページに SQL 相当のロジックを書かない
- `src/server/` … ドメインロジックと Supabase アクセスの唯一の置き場。`service_role` キーはここからのみ参照する。**UI・クライアントコンポーネントからの直接 `supabase.from()` は禁止**（`auth.*`・`storage.*` のクライアント利用のみ可）
- Route Handlers（`src/app/api/`）は、フォーム POST・Webhook・外部から叩かれる必要があるものだけに絞る。画面内の読み取りは Server Components から直接 `src/server/` を呼ぶ（プロキシ層を作らない）
- `src/components/` … 共通 UI。`styled-system/`（Panda 生成物）は gitignore し CI で codegen
- エラー形式は D9（`{ok: false, error: code}`）で統一。エラーコード → 日本語文言の辞書を1箇所に置く
- 将来 API を切り出す必要が出た場合に備え、`src/server/` は Next.js 固有 API（`cookies()` 等）への依存を入口の薄い層だけに閉じる

## 3. Panda CSS（D10）

調査結果（2026-07 時点）：`@pandacss/dev` 1.11.4。Turbopack＋PostCSS の HMR 問題は解消済みで、Next.js 16 では `postcss.config.js` に `@pandacss/dev/postcss` を足すだけでよい。RSC はビルド時 CSS 生成のため特別対応不要（スタイル目的の `"use client"` 不要）。

- セットアップ：`pnpm add -D @pandacss/dev postcss` → `panda init --postcss`。`prepare` スクリプトに `panda codegen`。`tsconfig.json` の include に `styled-system` を追加
- トークン：02 §5 の表を `theme.tokens` ＋ `theme.semanticTokens` に定義。**ライトのみ。`_dark` 条件・`prefers-color-scheme` 分岐・テーマ切替 UI は作らない**（D12）。フォントは `next/font` の `Noto_Sans_JP` を CSS 変数で渡し、`<html>` 側に className を付与
- コンポーネントは recipe（cva）／slotRecipe でバリアント管理。**実行時に決まる動的値をスタイルへ直接渡さない**（静的解析で生成漏れになる）。色分岐はすべて variant として列挙する
- 注意：`panda.config.ts` 変更後は codegen 手動再実行が必要。CI では codegen → tsc の順

## 4. lint・format（D10）

調査結果（2026-07 時点）：oxlint 1.75.0（type-aware ルールが 2026-07-22 に Stable 化）。ただし単体では jsx-a11y の完全網羅・React Compiler ルール・Next 固有ルールの完全同等性が未充足。oxfmt は 0.60.0（beta・Prettier conformance 100% 主張、ただし 0.x）。

**構成**：
- **oxlint 主体＋ESLint 補完のハイブリッド**。oxlint（`plugins: eslint, react, unicorn, typescript, nextjs, oxc`・type-aware 有効）を一次ゲートにし、ESLint は `eslint-config-next`＋`eslint-plugin-oxlint`（oxlint 実装済みルールを off にして二重実行を防ぐ）で jsx-a11y・Next 固有の残余だけを見る
- **oxfmt を採用**（新規コードベースで過去差分の互換問題がないため）。バージョンを pin し、CI で `oxfmt --check`。破壊的挙動が出た場合の退避先は Prettier（`--migrate prettier` の逆方向は不要、設定最小で運用）
- pre-commit：lint-staged で oxlint＋oxfmt のみ（ミリ秒オーダー）。ESLint フル実行は CI 側
- `pnpm lint` = `oxlint && eslint .`、`pnpm format` = `oxfmt`、`pnpm check` = lint＋`tsc --noEmit`＋`vitest run`

## 5. OpenSpec（検討結果）

調査結果：Fission-AI/OpenSpec v1.6.0（opsx コマンド体系）。Thoughtworks Radar は Assess（実験段階）。Claude Code／Cursor は skill＋command 両対応、**Codex は skill のみ**の非対称あり。

**判断：限定導入。** 設計の正は本ドキュメント群（docs/rebuild/）に置き、OpenSpec は**実装タスクの受け渡しフォーマット**としてだけ使う。

- M0 で `openspec init --tools claude,cursor,codex` を実行し、M2 の最初の委譲タスク1件で proposal→apply→archive を試す
- 効果が薄ければ docs/rebuild/tasks/ のタスク指示書（Markdown）方式に一本化して撤去する（導入は非破壊なので撤退容易）
- 全面採用（specs/ を真実のソースにする移行）は v1 リリース後に再判断

## 6. 環境・デプロイ・運用

- 環境変数（最小集合）：`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`・`SUPABASE_SERVICE_ROLE_KEY`（サーバー専用）・`NEXT_PUBLIC_SITE_URL`・`NEXT_PUBLIC_GA_MEASUREMENT_ID`・`NEXT_PUBLIC_SENTRY_DSN`・`SENTRY_AUTH_TOKEN`。**silent fallback 禁止**：必須変数は起動時検証（`src/env.ts` の1箇所で fail fast）
- Supabase：`supabase init` を実施して `supabase/config.toml` をコミット（現行未実施）。migration 運用規約＝「適用済みファイルの編集禁止・修正は新規ファイル・PR に `pnpm gen:types` の差分を含める・リリース前に `supabase db diff --linked`」
- Storage バケット（新設計）：`avatars`／`material-images`／`review-photos`／`report-media`／`article-images`。パス規約は `{所有者id}/…` とし、RLS でパスを強制する（旧設計の方式を踏襲）
- **引き継ぐ運用課題（人間の作業・最優先）**：2026-07-04 の Cloud Build への secret 誤アップロード事故後、**service_role キーと JWT secret のローテーションが未実施のまま**（docs/ops/security-notes.md に記録と手順を移設）。現在の Supabase では legacy の anon／service_role／JWT secret を**その場で再生成することはできず**、新 API キー（`sb_publishable_…`／`sb_secret_…`）と JWT Signing Keys へ移行したうえで旧キーを無効化する手順になる。刷新でキーの利用者が Vercel だけになるため、**新アプリを最初から新キーで構築し、Cloud Run 廃止と同時に旧キーを無効化する**のが最も手戻りが少ない
- Next.js 集約に伴い廃止するもの：Cloud Run サービス `farmille-api`・Secret Manager の `supabase-service-role-key` と `supabase-jwt-secret`・Vercel cron の keep-alive（Cloud Run のコールドスタート対策だったため不要）・GCP 側の請求

## 7. リポジトリ構成（目標形）

```
farmille/
├── frontend/            # Next.js 16（名称は現行維持。Vercel 設定を引き継ぐ）
│   ├── src/app/         # ルーティング（02 §2）
│   ├── src/server/      # ドメインロジック・Supabase アクセス
│   ├── src/components/  # 共通 UI（Panda recipes）
│   ├── panda.config.ts
│   └── .oxlintrc.json / eslint.config.mjs / oxfmt 設定
├── supabase/
│   ├── config.toml
│   └── migrations/      # v2 系のみ（旧28本は削除）
├── tools/migration/     # 資材マスタ移行スクリプト（一次実行）
├── docs/
│   ├── rebuild/         # 本設計（正）＋ reference/ ＋ tasks/
│   └── ops/             # 運用記録（secret ローテーション・アクセス棚卸し）
└── .github/workflows/   # CI（lint・typecheck・test・build）
```

backend/ は資材マスタ移行に必要なスクリプトを tools/ へ移設したうえで削除する（05 参照）。単一スタックになるため、`frontend/` という名前は「アプリ本体」の意味に読み替える（改名はしない。Vercel のプロジェクト設定・ビルドパスを引き継ぐため）。

## 8. フロントエンド実装規約（D13）

旧方針の「UI はバイブコーディングで爆速」という規約は廃止する。データ層と同じ品質基準を UI にも適用する。

- **型**：`any` を書かない。API・DB の戻り値は `database.types.ts` から派生させ、ページごとに手書きの重複型を作らない
- **スタイル**：色・余白・角丸・タイポの生値をコンポーネントに直書きしない。すべて Panda のトークン経由。条件分岐は recipe の variant として列挙する（動的値をスタイルへ渡さない）
- **状態とデータ取得**：取得は Server Components、変更は Server Actions か Route Handlers に寄せる。クライアント側の状態は入力フォームとトグルに限る
- **fail fast**：環境変数・必須パラメータが無い場合はフォールバックせずエラーにする。`?? "http://localhost:3000"` のような既定値を書かない
- **エラー表示**：例外を握り潰さない。404・403・500 をユーザーに意味の伝わる日本語で出し分ける（`error.tsx`・`not-found.tsx` を必ず置く）
- **完了の定義**：型チェックと lint が通っただけでは完了としない。**375px の実画面で対象フローを操作し、スクリーンショットを添えて初めて完了**（04 §4）
- **共通化**：同じ UI パターンを3回書く前に共通コンポーネント化する。ページ内に長大なインライン JSX と業務ロジックを同居させない
