#!/usr/bin/env bash
# ローカル Supabase に適用済みの migration と supabase/migrations/ を突き合わせ、一致しなければ非0で終わる。
# 接続先は NEXT_PUBLIC_SUPABASE_URL（環境変数を優先し、無ければ .env.local）。DB へは何も適用しない。

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

log() { printf '[check-migrations] %s\n' "$*"; }
fail() {
  log "$*"
  exit 1
}

# Next.js と同じく、環境変数が .env.local より優先される。
api_url=$(node --env-file-if-exists=.env.local -p 'process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""')
[ -n "$api_url" ] || fail "NEXT_PUBLIC_SUPABASE_URL が環境変数にも .env.local にもありません。"
[[ "$api_url" =~ ^http://(127\.0\.0\.1|localhost):([0-9]+)/?$ ]] ||
  fail "NEXT_PUBLIC_SUPABASE_URL（${api_url}）が手元の Supabase ではないので確かめません。"
api_port=${BASH_REMATCH[2]}

kong=$(docker ps --filter "publish=${api_port}" --filter 'name=^supabase_kong_' --format '{{.Names}}')
[ -n "$kong" ] || fail "ポート ${api_port} を公開している Supabase のコンテナがありません。Supabase が起動しているか確かめてください。"
db="supabase_db_${kong#supabase_kong_}"

applied=$(docker exec "$db" psql -U postgres -d postgres -XtA -v ON_ERROR_STOP=1 \
  -c 'select version from supabase_migrations.schema_migrations order by version')

pending=()
total=0
for file in supabase/migrations/*.sql; do
  total=$((total + 1))
  name=${file##*/}
  grep -qx "${name%%_*}" <<<"$applied" || pending+=("$name")
done

unknown=()
for version in $applied; do
  compgen -G "supabase/migrations/${version}_*.sql" >/dev/null || unknown+=("$version")
done

log "接続先：${api_url}（${db}）"
if [ "${#pending[@]}" -gt 0 ]; then
  log "未適用の migration が ${#pending[@]} 件あります（リポジトリ ${total} 件）。"
  printf '  %s\n' "${pending[@]}"
fi

# DB にだけある版があると、supabase migration up は履歴の不一致で止まる。
if [ "${#unknown[@]}" -gt 0 ]; then
  log "このチェックアウトに無い migration が DB に適用されています（別の worktree で適用したもの）：${unknown[*]}"
  log "DB とこのチェックアウトのスキーマが合っていません。そのファイルが main にあれば、このチェックアウトを main に追随させます。無ければ DB をどう戻すかを確認してから進めます。"
  exit 1
fi
if [ "${#pending[@]}" -eq 0 ]; then
  log "リポジトリの ${total} 件はすべて適用済みです。"
  exit 0
fi

# 適用済みの最新より古い未適用のファイルは、--include-all を付けないと適用されない。
include_all=""
[[ "${pending[0]%%_*}" > "${applied##*$'\n'}" ]] || include_all=" --include-all"
db_port=$(docker port "$db" 5432/tcp)
db_port=${db_port%%$'\n'*}
log "DB は worktree 間で共有しているので、適用は確認を取ってから次で行います。"
printf '  npx --yes supabase@2.120.0 migration up%s --db-url "postgresql://postgres:postgres@127.0.0.1:%s/postgres?sslmode=disable"\n' "$include_all" "${db_port##*:}"
exit 1
