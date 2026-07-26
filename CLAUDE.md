# Farmille プロジェクト方針

> **刷新中（2026-07-26〜）**：アプリを全面的に作り直している。
> **設計の正は [`docs/rebuild/`](docs/rebuild/00-overview.md)**。本ファイルの以下の記述は旧実装（試作）向けであり、刷新の進行に伴って置き換わる。新規の実装判断は必ず docs/rebuild を参照すること。

## このプロジェクトについて
BS資材（生物・微生物農業資材）の農家レビュープラットフォーム。
ターゲット：農家・JA普及員・農学者・メーカー。

## 技術スタック（刷新後）
- Next.js 16 / TypeScript / Panda CSS / Vercel（フロント兼バックエンド）
- DB/Auth/Storage: Supabase (PostgreSQL)
- FastAPI・Cloud Run・Python スタックは廃止（docs/rebuild/03-architecture.md）

## 設計哲学（最重要）
**DOA（Data-Oriented Architecture）を最優先する。**
- データモデルは技術負債を一切作らない
- 正規化・スケーラビリティを妥協しない
- UI もデータ層と同じ品質基準で作る（型安全・fail fast・トークン経由・実画面での検証）。データ設計の決定を覆す UI は作らない

## コーディング規約
- DBスキーマ変更後は `pnpm gen:types` で型を再生成する（詳細は §「型生成」）
- 環境変数は `src/env.ts` の1箇所で検証してから使う。既定値でのフォールバックを書かない
- 認証チェックは Next.js のサーバー側（`src/server/`）で第一防御、RLSで第二防御
- UI・クライアントコンポーネントから `supabase.from()` を直接呼ばない（`auth.*` / `storage.*` は可）

## 型生成（`pnpm gen:types`）

Supabase の DB スキーマから TypeScript 型定義（`frontend/src/types/database.ts` 等）を再生成するコマンド。`supabase gen types typescript --linked` を `package.json` の `scripts.gen:types` に登録している想定。

**実行タイミング**:
- migration を `supabase db push --linked` で dev に適用した直後
- master データの seed が変わった直後
- カラム追加 / 削除 / 型変更を伴う ALTER の直後

**未実行で起こる症状**:
- frontend の `Database` 型が古いままで、新カラムへのアクセスが `any` 落ち or TS error
- `pnpm tsc --noEmit` が通っても実体と型が乖離

CI / Phase クローズ時のチェックリストに「migration 追加 → `pnpm gen:types` → diff コミット」を入れる。

## 依存セキュリティ監査

**ローカル / PR 着手時に必ず実行**:

```bash
# frontend (pnpm)
cd frontend
pnpm audit --audit-level=high                  # high 以上の既知脆弱性を抽出
pnpm audit --json | jq '.advisories'           # 詳細を JSON で
pnpm outdated                                   # major upgrade 候補の把握

# backend (uv)
cd backend
uv pip list --outdated                          # 古いパッケージ
uvx pip-audit                                   # PyPI Advisory DB 照合
```

**判定基準**:
- `critical` / `high` が出たら **PR ブロック**（hotfix で先に塞ぐか、別 PR で固定）
- `moderate` 以下は issue 起票して次 sprint で対応
- 直接依存（direct）が原因の脆弱性は最優先、推移依存（transitive）は upstream 修正待ちでも可

**手動 grep 監査（補助）**:

```bash
# 機密リーク兆候
grep -rn "SUPABASE_SERVICE_ROLE\|SERVICE_KEY\|JWT_SECRET" frontend/src        # フロントに漏れていないか（必ず 0 件）
grep -rn "process\.env\.[A-Z_]*SECRET" frontend/src                            # サーバー専用変数のフロント参照

# BFF 原則違反検知（既存スキル）
grep -rn "supabase\.\(from\|rpc\)(" frontend/src                               # 必ず 0 件（auth.* / storage.* は別途許容）

# Railway 固有環境変数の漏洩（規約違反）
grep -rn "RAILWAY_" backend/ frontend/src
```

**月次推奨**:
- `gh dependabot alerts list`（GitHub Dependabot を有効化済の場合）
- backend: `uvx safety check`（PyUp 系 DB 照合、pip-audit と相補）

なお `npm audit` は使わない（pnpm に揃える）。CI 化は v1.5+ で GitHub Actions に組み込む（現状はローカル実行）。

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
