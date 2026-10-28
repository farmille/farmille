#!/usr/bin/env bash
# このチェックアウトにあって比べる ref に無い migration の版が、その ref の最新の版より後かを確かめる。
# 本番の supabase db push は --include-all を付けないため、main の最新より古い未適用の版があると止まる。
# 使い方：bash tools/ci/check-migration-order.sh origin/main

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

base=${1:?比べる ref（例：origin/main）を渡してください。}

log() { printf '[check-migration-order] %s\n' "$*"; }
fail() {
  log "$*"
  exit 1
}

version_of() {
  [[ "$1" =~ ^([0-9]{14})_[^/]+\.sql$ ]] || fail "版を読めない migration のファイル名です：$1"
  printf '%s\n' "${BASH_REMATCH[1]}"
}

git rev-parse --verify --quiet "${base}^{commit}" >/dev/null || fail "${base} がありません。git fetch origin main を先に実行してください。"

base_versions=$(git ls-tree --name-only "$base" supabase/migrations/ |
  while read -r file; do version_of "${file##*/}"; done | sort)
latest=$(tail -n 1 <<<"$base_versions")
[ -n "$latest" ] || fail "${base} に migration がありません。"

stale=()
for file in supabase/migrations/*.sql; do
  version=$(version_of "${file##*/}")
  grep -qx "$version" <<<"$base_versions" && continue
  [[ "$version" > "$latest" ]] || stale+=("$file")
done

if [ "${#stale[@]}" -gt 0 ]; then
  log "${base} に無い次の migration の版が、${base} の最新（${latest}）より前です。"
  printf '  %s\n' "${stale[@]}"
  log "本番の supabase db push は古い版を当てずに止まるので、このまま main に入ると本番への migration とデプロイが止まります。"
  log "${base} を取り込み、ファイル名の版を ${latest} より後に付け直してください。"
  exit 1
fi
log "${base} に無い migration は、すべて ${base} の最新（${latest}）より後の版です。"
