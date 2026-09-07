# 本番スキーマの切替

対象は `sajxnypkbybuzsqdguaa`、アプリは Vercel の `farmille/farmille`。

## データの扱い

資材、メーカー名、画像、出典、作目・効果の関連、施用レシピを移行する。元の資材IDを保持する。旧ユーザーとレビューは新アプリへ移さず、旧スキーマに保管する。Authユーザー、既存ストレージと画像ファイルは削除しない。

旧 `public` は `legacy_v1_20260908` へ移し、API利用者のスキーマアクセスを取り消す。旧Auth登録トリガーは旧ユーザーテーブルへの書き込みを終了する。新アプリの一般登録はサーバー処理からプロフィールを作成する。

## 検証用SQL

```sh
node tools/migration/prepare-production-cutover.mjs --output /tmp/farmille-cutover-dry-run.sql
node tools/migration/prepare-production-cutover.mjs --verify-rollback --output /tmp/farmille-cutover-rollback-test.sql
node --test tools/migration/prepare-production-cutover.test.mjs
```

既定のSQLは最後に `ROLLBACK` する。`--verify-rollback` は切替後に旧スキーマへ戻す操作も検証する。どちらも成功済み。資材382件、画像179件、出典828件、作目の関連611件、効果の関連1,236件、レシピ1,358件を照合した。

## 本番適用

```sh
node tools/migration/prepare-production-cutover.mjs --commit --output /tmp/farmille-cutover-commit.sql
```

公開するコミットと復旧手順を確認してから、生成したSQLを対象プロジェクトのSQL Editorで実行する。SQL EditorによるRLSの自動追加は選ばず、migration内のRLSを使用する。`supabase_migrations` はAPI非公開の履歴スキーマであり、旧履歴も保管する。

## 復旧

`tools/migration/rollback-production-cutover.sql` を対象DBで実行し、Vercelの旧Productionデプロイへ戻す。新スキーマのデータは `rollback_v2_20260908` と `rollback_v2_app_20260908` に保管する。旧Auth登録トリガー、旧スキーマの権限とmigration履歴を復旧する。

## デプロイ後の検証

```sh
FARMILLE_RELEASE_TEST_URL=https://www.farmille.com \
FARMILLE_RELEASE_SECRET_FILE=<既存接続キーの保管ファイル> \
pnpm exec playwright test --config playwright.release.config.ts
```

本番用テストは通常のE2Eとは分離する。実行ごとに専用アカウント・メーカー・資材を作成し、そのIDと専用メーカー名が一致するデータだけを片付ける。既存メーカーの資材には紐づけない。認証情報が残らないよう、trace・video・自動スクリーンショットは保存せず、認証後の画面だけを撮影する。
