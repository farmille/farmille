# Farmille

Farmille は、BS資材（生物・微生物農業資材）を農家が評価し、使用経験を共有するレビュープラットフォームです。Next.js 16、TypeScript、Panda CSS を使用し、画面とサーバー処理を1つのアプリにまとめています。

## 設計資料

機能ごとの仕様は [`docs/rebuild/`](docs/rebuild/) の `*-SPEC.md`、用語は [`CONTEXT.md`](CONTEXT.md)、運用の記録と手順は [`docs/ops/`](docs/ops/) にあります。

## セットアップ

Node.js 24 と pnpm 11 を使用します。リポジトリのルートで依存関係をインストールし、環境変数のひな型をコピーします。

```bash
pnpm install
cp .env.example .env.local
```

`.env.local` の必須項目を、利用する Supabase プロジェクトと公開サイトの値に置き換えてください。`SUPABASE_SECRET_KEY` はサーバー専用であり、ブラウザへ公開してはいけません。

`pnpm dev` と `pnpm build` には、OGP・sitemap・robots の絶対 URL 生成に使う `NEXT_PUBLIC_SITE_URL` が必須です。未設定の場合は `src/env.ts` がエラーを返します。

```bash
pnpm dev
```

バックエンド用の別プロセスはありません。画面は `src/app/`、ドメインロジックと Supabase アクセスは `src/server/` にあります。

## スクリプト

| コマンド             | 用途                                        |
| -------------------- | ------------------------------------------- |
| `pnpm dev`           | 開発サーバーを起動する                      |
| `pnpm build`         | 本番用にビルドする                          |
| `pnpm start`         | ビルド済みアプリを起動する                  |
| `pnpm lint`          | oxlint と ESLint を実行する                 |
| `pnpm format`        | oxfmt でファイルを整形する                  |
| `pnpm format:check`  | oxfmt による整形差分の有無を確認する        |
| `pnpm check`         | lint、型検査、テストをまとめて実行する      |
| `pnpm test`          | Vitest を監視モードで実行する               |
| `pnpm gen:types`     | 接続先の Supabase から型定義を生成する      |
| `pnpm gen:types:dev` | linked 状態の Supabase から型定義を生成する |

`pnpm install` の完了後に Panda CSS のコード生成が自動で実行されます。生成物は `styled-system/` に出力され、Git の管理対象には含まれません。`gen:types` の生成物は format と lint の対象外です。

## 検証

```bash
pnpm lint
pnpm format:check
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
pnpm audit --audit-level=high
```

## ディレクトリ構成

```text
farmille/
├── src/
│   ├── app/             # ルーティングと画面
│   ├── server/          # ドメインロジックと Supabase アクセス
│   └── components/      # Panda recipes を使う共通 UI
├── e2e/                 # Playwright E2E
├── supabase/
│   ├── config.toml
│   └── migrations/      # v2 系の migration
├── tools/migration/     # 資材マスタ移行スクリプト
├── docs/
│   ├── rebuild/         # 機能ごとの仕様（*-SPEC.md）
│   └── ops/             # 運用記録
├── panda.config.ts
├── package.json
└── .github/workflows/   # CI
```
