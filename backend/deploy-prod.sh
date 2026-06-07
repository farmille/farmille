#!/usr/bin/env bash
# Cloud Run 本番デプロイ helper (ADR-0013)。
# 値はすべて非機密 (URL/フラグ)。secret は Secret Manager 名で参照するだけ。
# 使い方: bash backend/deploy-prod.sh   (どこから実行してもOK)
set -euo pipefail
cd "$(dirname "$0")" # backend/ に移動 → --source . が backend を指す

gcloud run deploy farmille-api \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --set-env-vars "ENVIRONMENT=production,SIGNUP_REQUIRE_EMAIL_CONFIRM=true,SUPABASE_URL=https://sajxnypkbybuzsqdguaa.supabase.co,CORS_ORIGINS=https://farmille.vercel.app,FARMILLE_MAKER_USER_ID=64f02946-f5f2-443b-ad8d-8647a2effd59" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,SUPABASE_JWT_SECRET=supabase-jwt-secret:latest"
