#!/usr/bin/env bash
# Cloud Run dev デプロイ helper（共有 dev バックエンド farmille-api-dev）。ADR-0016。
# 引き継ぎ者が frontend のみで開発できるよう、dev Supabase を指す共有 API を立てる。
# 値はすべて非機密（URL / フラグ / 公開 user id）。secret は Secret Manager 名で参照するだけ。
# 使い方: bash backend/deploy-dev.sh   (どこから実行してもOK)
set -euo pipefail
cd "$(dirname "$0")" # backend/ に移動 → --source . が backend を指す

gcloud run deploy farmille-api-dev \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --set-env-vars "^|^ENVIRONMENT=development|SIGNUP_REQUIRE_EMAIL_CONFIRM=false|SUPABASE_URL=https://chgrudbattvmcjxhaskh.supabase.co|CORS_ORIGINS=http://localhost:3000|FARMILLE_MAKER_USER_ID=46e7a39a-a1a4-4e3c-ba30-2d3f77bcf233" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key-dev:latest,SUPABASE_JWT_SECRET=supabase-jwt-secret-dev:latest"

# デプロイ後の手順:
# 1. Secret Manager に dev 用の値を `supabase-service-role-key-dev` / `supabase-jwt-secret-dev`
#    として事前登録しておく（prod の `supabase-service-role-key` / `supabase-jwt-secret` とは別 secret に分離）。
# 2. 出力された URL（例: https://farmille-api-dev-xxxx.a.run.app）を:
#    - 1Password 共有 Vault（dev / frontend の API_URL）
#    - docs/onboarding-handoff.md §4 の API_URL 欄
#    - Vercel の Preview スコープ env `API_URL`
#    に反映する。
# 3. CORS は frontend が server-side proxy（ブラウザ直叩き無し・API_URL は非 NEXT_PUBLIC）のため
#    localhost:3000 のみで十分。ブラウザ直叩きを足す場合のみ追加する。
# 4. min-instances 0 のためコールド起動が入る（dev では許容）。常時起動が必要になったら 1 に上げる。
