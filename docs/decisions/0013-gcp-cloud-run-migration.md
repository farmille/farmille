# ADR-0013: バックエンドを Railway から GCP Cloud Run へ移行する

**ステータス**: Accepted
**決定日**: 2026-06-01
**決定者**: 酒井涼雅（CTO）
**Supersedes**: [ADR-0001](0001-railway-adoption.md)（Railway 採用）

## コンテキスト
v1 初公開（実ユーザー）を前に、FastAPI バックエンドのホスティングを Railway から GCP **Cloud Run** へ移行する。あわせて Supabase を dev とは別の**新規本番プロジェクト**に分離する。

重要な前提として、**現時点で実ユーザーは 0**。よって「稼働中サービスのライブ移行」は発生せず、最初から目標インフラ（Cloud Run + 本番 Supabase）に載せて公開する方が、後から「ユーザーがいる状態での移行」を行うより低リスクである。ADR-0001 はこの移行を `Cloud Run (min instances=1)` / `バックグラウンドジョブ` 等のトリガーで予定済みであり、コードはポータブル設計（`Dockerfile` / `railway.toml` / `RAILWAY_*` 不使用）を維持してきた。2026-06-01 のデプロイ前レビューで `RAILWAY_*` 参照 0 件・`config.py` の env 全 pydantic-settings 経由を再確認済み。

## 決定
1. バックエンドは **Cloud Run（region: `asia-northeast1` 東京）** にデプロイする。既存 `Dockerfile`（`${PORT}` 対応・`/health` あり・非 root）を無改修で使用。
2. シークレット（`supabase_service_role_key` / `supabase_jwt_secret`）は **Secret Manager** に格納。`environment=production` / `signup_require_email_confirm=true` / `cors_origins`=本番フロントドメインを env で設定。
3. Supabase は **新規本番プロジェクト**を作成（dev/prod 分離、Region 東京）。dev synthetic makers は持ち込まない。
4. フロントエンドは引き続き **Vercel**。`railway.toml` は退役、Railway は本番疎通確認後に停止。
5. v1 公開は上記新インフラへの**単一カットオーバー**で行う（現行 Railway での暫定公開はしない）。

## 理由
1. 実ユーザー 0 の今が、ライブ移行を回避できる唯一かつ最小リスクのタイミング。
2. Cloud Run は既存コンテナをそのまま使え、scale-to-zero / 従量課金 / フルマネージドで運用負荷が低い。`min-instances=1` でコールドスタート（ADR-0001 のリスク）を解消でき、Vercel keep-alive cron の hack を不要化できる。
3. dev/prod 分離により「dev に適用 → レビュー → 本番に適用」の運用規律（CLAUDE.md）を維持し、本番に合成テストデータが混入しない。
4. 東京 region 統一（Vercel `hnd1` / Cloud Run `asia-northeast1` / Supabase 東京）でレイテンシ最小化。

## 既知のリスクと対策
| リスク | 対策 |
|---|---|
| イメージのアーキ不一致（Apple Silicon→Cloud Run） | `--platform linux/amd64` か Cloud Build でビルド |
| 本番 env 未設定で起動失敗 | `environment` / `signup_require_email_confirm` / `cors_origins` を deploy 前に必須化、`/health` で起動プローブ |
| 確認メール到達性 | 独自 SMTP（Resend/SendGrid 等）を Supabase に設定（`signup_require_email_confirm=true` の前提） |
| 新 migration の本番適用失敗 | push 前に重複チェック、デプロイ前レビューの「DB clean」確認後に適用 |
| ベンダーロックイン | 引き続き `RAILWAY_*` 同様 GCP 固有変数をコードで参照しない・ポータブル Dockerfile 維持 |

## 次回見直しタイミング
- v1 ローンチから 3ヶ月後（2026 年 8〜9 月想定）。コスト・コールドスタート・スケールを再評価。
