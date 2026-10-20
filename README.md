# Farmille

Farmille は、BS資材（生物・微生物農業資材）を農家が評価し、使用経験を共有するレビュープラットフォームです。Next.js 16、TypeScript、Panda CSS を使用し、画面とサーバー処理を1つのアプリにまとめています。

## 設計資料

機能ごとの仕様は [`docs/rebuild/`](docs/rebuild/) の `*-SPEC.md`、用語は [`GLOSSARY.md`](GLOSSARY.md)、運用の記録と手順は [`docs/ops/`](docs/ops/) にあります。

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

コマンドの一覧は `package.json` の `scripts` にあります。検証の手順は [`AGENTS.md`](AGENTS.md) の「検証」を参照してください。

`pnpm install` の完了後に Panda CSS のコード生成が自動で実行されます。生成物は `styled-system/` に出力され、Git の管理対象には含まれません。`gen:types` の生成物は format と lint の対象外です。

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
