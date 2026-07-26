# Farmille

Farmille は、BS資材（生物・微生物農業資材）を農家が評価し、使用経験を共有するレビュープラットフォームです。

## 設計資料

設計の正は [`docs/rebuild/`](docs/rebuild/00-overview.md) です。実装や運用に関する判断では、このディレクトリの設計資料を参照してください。

## セットアップ

アプリ本体は `frontend/` にあります。

```bash
cd frontend
pnpm install
cp .env.example .env.local
```

`frontend/.env.local` の各項目に利用する環境の値を設定し、開発サーバーを起動します。

```bash
pnpm dev
```

## 検証

`frontend/` で次のコマンドを実行します。

```bash
pnpm lint
pnpm format:check
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
```

## ディレクトリ構成

```text
farmille/
├── frontend/            # Next.js 16 のアプリ本体
│   ├── src/app/         # ルーティング
│   ├── src/server/      # ドメインロジックと Supabase アクセス
│   ├── src/components/  # Panda recipes を使う共通 UI
│   ├── panda.config.ts
│   └── .oxlintrc.json / eslint.config.mjs / oxfmt 設定
├── supabase/
│   ├── config.toml
│   └── migrations/      # v2 系の migration
├── tools/migration/     # 資材マスタ移行スクリプト
├── docs/
│   ├── rebuild/         # 設計資料、入力資料、タスク指示書
│   └── ops/             # 運用記録
└── .github/workflows/   # CI
```
