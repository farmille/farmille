# Farmille

BS資材（生物・微生物農業資材）の農家レビュープラットフォーム

## 技術スタック

- **Frontend**: Next.js 15 / TypeScript / Tailwind CSS 4
- **Backend**: FastAPI / Python 3.12
- **DB/Auth/Storage**: Supabase (PostgreSQL)
- **Deploy**: Vercel (frontend) / Railway (backend)

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
   # 各ファイルに実際の値を設定（SlackでSupabase認証情報を受け取る）
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
3. 本番環境変数はRailway/Vercelダッシュボードで更新

### デプロイ
- フロント: `main` ブランチへのpushで自動デプロイ（Vercel）
- バック: `main` ブランチへのpushで自動デプロイ（Railway）

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

### Railwayでビルドが失敗する
1. ローカルで `docker build -t farmille-backend ./backend` が通るか確認
2. `railway.toml` の `builder = "DOCKERFILE"` が指定されているか確認

### 型エラーが出る
1. `cd frontend && pnpm gen:types` でDB型を最新化
2. それでも解消しない場合はマイグレーションファイルを確認

### dev サーバーが停止しない
```bash
make stop
```
