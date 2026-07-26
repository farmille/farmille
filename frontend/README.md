# Farmille frontend

Farmille の Web アプリケーションです。Next.js 16、TypeScript、Panda CSS を使用します。

## セットアップ

依存関係をインストールし、環境変数のひな型をコピーします。

```bash
pnpm install
cp .env.example .env.local
```

`.env.local` の必須項目を、利用する Supabase プロジェクトと公開サイトの値に置き換えてください。`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用であり、ブラウザへ公開してはいけません。

`pnpm dev` / `pnpm build` には `NEXT_PUBLIC_SITE_URL`（OGP・sitemap・robots の絶対 URL 生成に使用）が必須です。`src/env.ts` が fail fast のため、未設定のまま実行するとエラーになります。

開発サーバーは次のコマンドで起動します。

```bash
pnpm dev
```

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

`pnpm install` の完了後に Panda CSS のコード生成が自動で実行されます。生成物は `styled-system/` に出力され、Git の管理対象には含まれません。

`gen:types` の生成物は fmt と lint の対象外です。

## 検証

変更を提出する前に、次のコマンドをすべて実行します。

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
pnpm audit --audit-level=high
```
