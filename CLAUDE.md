# Farmille プロジェクト方針

## このプロジェクトについて
BS資材（生物・微生物農業資材）の農家レビュープラットフォーム。
ターゲット：農家・JA普及員・農学者・メーカー。

## 技術スタック
- Frontend: Next.js 15 / TypeScript / Tailwind CSS 4 / Vercel
- Backend: FastAPI / Python 3.12 / uv / Railway
- DB/Auth/Storage: Supabase (PostgreSQL)

## 設計哲学（最重要）
**DOA（Data-Oriented Architecture）を最優先する。**
- データモデルは技術負債を一切作らない
- 正規化・スケーラビリティを妥協しない
- UIはバイブコーディングで爆速。ただしデータ設計の決定を覆すUIは作らない

## コーディング規約
- Railway固有の環境変数（`RAILWAY_*`）をコード上で参照しない
- DBスキーマ変更後は `pnpm gen:types` で型を再生成する
- 環境変数は `pydantic-settings` (backend) / `process.env` (frontend) 経由で読む
- 認証チェックは BFF（FastAPI）で第一防御、RLSで第二防御

## 4ロール権限体系
- `farmer`: レビュー投稿・写真アップロード
- `ja_staff`: レビュー投稿・写真アップロード（将来JA用ダッシュボード）
- `researcher`: レビュー投稿・写真アップロード
- `maker`: 資材登録・自社資材管理
- `unassigned`: オンボーディング未完了（登録直後のデフォルト）

## ディレクトリ規約
- `frontend/` : Next.js（Vercelデプロイ）
- `backend/` : FastAPI（Railwayデプロイ）
- `supabase/migrations/` : DBマイグレーション
- `docs/decisions/` : ADR（アーキテクチャ意思決定記録）

## 重要な意思決定はADRを参照
`docs/decisions/` 配下のドキュメントを参照すること。
