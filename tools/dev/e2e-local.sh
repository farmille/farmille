#!/usr/bin/env bash
# 手元で E2E を流す。supabase/config.toml の Supabase（127.0.0.1:54321）へ CI の E2E ジョブと同じ環境変数で向け、
# migration の遅れを確かめ、資材マスタが無ければ入れてから、引数をそのまま playwright test に渡す。
# Supabase の起動・停止と migration の適用はしない。足りなければ手順を出して非0で終わる。

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

readonly SUPABASE_CLI="supabase@2.120.0"
readonly LOCAL_API_URL="http://127.0.0.1:54321"

log() { printf '[e2e-local] %s\n' "$*"; }
fail() {
  log "$*"
  exit 1
}

if ! status_env=$(npx --yes "$SUPABASE_CLI" status -o env); then
  log "supabase/config.toml の Supabase（${LOCAL_API_URL}）が起動していません。"
  log "DB のボリュームは worktree 間で共有しているので、起動は確認を取ってから次で行います。"
  printf '  npx --yes %s start -x studio,edge-runtime,realtime,imgproxy,logflare,vector\n' "$SUPABASE_CLI"
  exit 1
fi
eval "$status_env"
[ "${API_URL:-}" = "$LOCAL_API_URL" ] ||
  fail "supabase status の API_URL が ${LOCAL_API_URL} ではありません（${API_URL:-空}）。"

# .env.local が別のスタックを指していても、Next.js と playwright.config.ts は環境変数を優先する。
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY" SUPABASE_SECRET_KEY="$SERVICE_ROLE_KEY"
export SMTP_URL="smtp://127.0.0.1:54325" MAIL_FROM="Farmille <noreply@example.test>" \
  AUTH_EMAIL_HOOK_SECRET="v1,whsec_bG9jYWwtZmFybWlsbGUtZW1haWwtaG9vay10ZXN0LWtleQ=="
log "接続先：${API_URL}"

bash tools/dev/check-migrations.sh

has_material=$(psql "$DB_URL" -X -tA -v ON_ERROR_STOP=1 \
  -c "select exists (select 1 from public.materials where name = 'Actibio X EVO53' and manufacturer_name = 'ICL JAPAN')")
if [ "$has_material" = "t" ]; then
  log "資材マスタは投入済みです。"
else
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f tools/migration/materials-v2-seed.sql
  log "資材マスタ（tools/migration/materials-v2-seed.sql）を投入しました。"
fi

exec pnpm exec playwright test "$@"
