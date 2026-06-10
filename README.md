# Farmille

BS資材（生物・微生物農業資材）の農家レビュープラットフォーム

## 技術スタック

- **Frontend**: Next.js 15 / TypeScript / Tailwind CSS 4
- **Backend**: FastAPI / Python 3.12
- **DB/Auth/Storage**: Supabase (PostgreSQL)
- **Deploy**: Vercel (frontend) / GCP Cloud Run (backend, ADR-0013)

## セットアップ

### 前提条件
- Node.js 22+
- pnpm 10+
- Python 3.12+
- uv
- Docker（バックエンドのビルド確認用）

### 手順

1. リポジトリをクローン
   ```bash
   git clone https://github.com/farmille/farmille.git
   cd farmille
   ```

2. 環境変数を設定
   ```bash
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   # 各ファイルに実際の値を設定（dev の値は 1Password 共有 Vault から取得）
   # 軽微な UX / 文言修正のみなら frontend だけでよい → docs/onboarding-handoff.md
   ```

3. 依存関係インストール＆起動
   ```bash
   make setup
   make dev
   ```

4. 確認
   - フロントエンド: http://localhost:3000
   - FastAPI Docs: http://localhost:8000/docs
   - ヘルスチェック: http://localhost:8000/health

## 開発フロー

### DBスキーマ変更時
1. `supabase/migrations/` に新しいマイグレーションファイルを追加
2. `supabase db push` で farmille-dev に適用
3. `cd frontend && pnpm gen:types` で型を再生成
4. 型ファイルの差分をコミット

### 環境変数変更時
1. `.env.example` を更新（git管理）
2. ローカルの `.env` / `.env.local` も手動で更新
3. 本番環境変数は Vercel ダッシュボード（frontend）/ Cloud Run の `deploy-prod.sh`・Secret Manager（backend）で更新

### デプロイ
- フロント: `main` への merge で自動デプロイ（Vercel 本番）。`feat/*` 等は Preview URL を自動生成。
- バック: GCP **Cloud Run** へ `bash backend/deploy-prod.sh` で**手動**デプロイ（ADR-0013、`main` push では自動デプロイされない）。
- **本番フリーズ中は `main` に merge しない**（ADR-0016 / docs/git-workflow.md §10）。

## Supabase Storage 設定（手動）

Supabaseダッシュボードで以下を設定すること：

1. Storage → New Bucket → `review-images` を作成（Public bucket）
2. バケット設定:
   - ファイルサイズ上限: 5MB
   - 許可するMIMEタイプ: `image/jpeg`, `image/png`, `image/webp`
3. RLSポリシー:
   - アップロード: `app_metadata.role IN ('farmer', 'ja_staff', 'researcher')`
   - 閲覧: 全員（`anon` + `authenticated`）

## トラブルシューティング

### Cloud Run でビルド / デプロイが失敗する
1. ローカルで `docker build -t farmille-backend ./backend` が通るか確認
2. `gcloud` の認証・プロジェクト・region（`asia-northeast1`）を確認（`backend/deploy-prod.sh`）
3. Apple Silicon からのビルドはアーキ不一致に注意（`--platform linux/amd64` か Cloud Build、ADR-0013）

### 型エラーが出る
1. `cd frontend && pnpm gen:types` でDB型を最新化
2. それでも解消しない場合はマイグレーションファイルを確認

### dev サーバーが停止しない
```bash
make stop
```
