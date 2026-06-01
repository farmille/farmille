# v1 本番デプロイ Runbook（2026-06-01）

対象: Cloud Run（backend）+ 新規本番 Supabase + Vercel（frontend）への **単一カットオーバー公開**。
関連: [ADR-0013](../decisions/0013-gcp-cloud-run-migration.md)。判定: デプロイ前レビュー = **GO-WITH-FIXES**（low-risk 修正は適用済み）。

凡例: 🟢 = レビュー結果に依存せず着手可 ／ 🔴 = 「DB clean」ゲート / 承認待ち

---

## 0. 前提（適用済み）
- ✅ BLOCKER 3件解消（レビュー公開漏れ / backend test RED / `next` high CVE）
- ✅ low-risk 硬化（security headers / CORS trim / 検索サニタイズ / admin proxy role+AAL2 / a11y 等）
- ✅ 削除意味論 = **soft-delete** に確定・実装（[ADR-0013] とは別、`admin.py`）＋ self/admin ガード＋モデレーションテスト追加
- ✅ backend pytest（branch失敗ゼロ・156 passed）/ frontend typecheck・lint・test・build green

## 1. Supabase 本番（新規プロジェクト）
- 🟢 1.1 新規プロジェクト作成（Region 東京、強DBパスワード、`farmille-prod`）
- 🟢 1.2 認証情報を控える: `url` / `anon key` / `service_role key` / `JWT secret`
- 🟢 1.3 Auth 設定: Site URL / Redirect URLs を本番フロントドメイン、**Email confirmation ON**、**独自 SMTP 設定**（最重要・見落とし注意）
- 🟢 1.4 Storage バケット（avatars / product-images）作成、RLS は migration 経由で適用
- 🟢 1.5 PITR 有効化（本番プラン）
- 🔴 1.6 `supabase link --project-ref <prod-ref>` → `supabase db push --linked`（**push 前に §4 の重複チェック**、レビューの DB clean 後）
- 🔴 1.7 `pnpm gen:types:dev`（dev link 時）or `gen:types`（prod link 時）で `database.types.ts` 再生成 → diff コミット（**この環境では未 link で未実行＝手動必須**）
- 🔴 1.8 seed: dev synthetic makers は入れない。`20260526000003_seed_products_from_ryosei_export.sql` が本物マスタなら適用、テストなら除外（要確認）

## 2. GCP / Cloud Run
- 🟢 2.1 GCP プロジェクト作成 + 課金、API 有効化（Cloud Run / Artifact Registry / Secret Manager / Cloud Build / Logging）
- 🟢 2.2 Artifact Registry（`asia-northeast1`, Docker）
- 🟢 2.3 イメージ build & push（`--platform linux/amd64` か Cloud Build）
- 🟢 2.4 Secret Manager に `supabase_service_role_key` / `supabase_jwt_secret`（値は 1.2 後）
- 🔴 2.5 Cloud Run deploy（`asia-northeast1`）: env=`supabase_url` / `cors_origins`(本番フロント) / `environment=production` / `signup_require_email_confirm=true`、secrets マウント、`min-instances=1`、CPU1/mem512Mi/concurrency80、allow-unauthenticated（認証は BFF/JWT）
- 🟢 2.6 SA は Secret Manager accessor のみ（最小権限）

## 3. フロント / Vercel & 結線
- 🟢 3.1 Vercel Production env: backend API URL（Cloud Run URL）/ 本番 Supabase `url`・`anon key`
- 🟢 3.2 backend `cors_origins` に本番 Vercel ドメイン
- 🟢 3.3 keep-alive cron: `min-instances=1` なら削除可（scale-to-zero 運用なら叩き先を Cloud Run に張替え）
- 🟢 3.4 `next.config.ts` の画像許可ドメインに本番 Supabase Storage を確認

## 4. 本番 DB push 前チェック（§1.6 の直前）
- 🔴 重複チェック（非冪等 migration 対策・DB-05）:
  ```sql
  SELECT name, maker_id, COUNT(*) FROM products GROUP BY 1,2 HAVING COUNT(*) > 1;
  ```
  本番は fresh DB なので 0 件想定。0 件なら push 続行。

## 5. 公開前 最終ゲート
- 🔴 5.1 `pnpm audit --audit-level=high` / `uvx pip-audit`（production-runtime に critical/high なきこと。`happy-dom`/`fast-uri` は dev/build-time で非露出）
- 🔴 5.2 `/health` 疎通、主要導線スモーク（signup→確認メール→login→onboarding→products→review→report→admin）
- 🔴 5.3 Railway は疎通 OK まで残し、確認後に停止

## 残課題（launch ブロックではない・別 issue / fast-follow）
- #3 凍結ユーザーの ~1h 書込み窓 → `require_active_user` を fast-follow（freeze で refresh 失効・≤1h で締め出し）
- `test_me_profile` / `test_me_favorites`（main 同一の旧 fake harness 向け debt）／ `products.py` E402（DEP-005）
- ARCH-02 admin proxy 重複統合 ／ SEC-03 `/v1/reports` レート制限 ／ `happy-dom>=20` bump ／ UX-05 stale 窓
- GDPR 的な完全消去（PII erasure）経路（soft-delete とは別経路で必要時）
