#!/usr/bin/env bash
# PR の checkout にあって main の checkout に無い migration の版が、main の最新の版より後かを確かめる。
# 本番の supabase db push は --include-all を付けないため、main の最新より古い未適用の版があると止まる。
# PR の checkout はファイル名を読むだけで、中のコードは実行しない。
# 使い方：bash tools/ci/check-migration-order.sh <main の checkout> <PR の checkout>

set -euo pipefail

main_dir=${1:?main の checkout を渡してください。}
pr_dir=${2:?PR の checkout を渡してください。}

log() { printf '[check-migration-order] %s\n' "$*" >&2; }
fail() {
  log "$*"
  exit 1
}

versions() {
  local dir=$1/supabase/migrations file name
  [ -d "$dir" ] || fail "${dir} がありません。"
  for file in "$dir"/*.sql; do
    name=${file##*/}
    [[ "$name" =~ ^([0-9]{14})_[^/]+\.sql$ ]] || fail "版を読めない migration のファイル名です：${file}"
    printf '%s %s\n' "${BASH_REMATCH[1]}" "$name"
  done
}

main_versions=$(versions "$main_dir" | cut -d ' ' -f 1 | sort)
pr_versions=$(versions "$pr_dir" | sort)
latest=$(tail -n 1 <<<"$main_versions")

stale=()
while read -r version name; do
  grep -qx "$version" <<<"$main_versions" && continue
  [[ "$version" > "$latest" ]] || stale+=("supabase/migrations/${name}")
done <<<"$pr_versions"

if [ "${#stale[@]}" -gt 0 ]; then
  log "main に無い次の migration の版が、main の最新（${latest}）より前です。"
  printf '  %s\n' "${stale[@]}" >&2
  log "本番の supabase db push は古い版を当てずに止まるので、このまま main に入ると本番への migration とデプロイが止まります。"
  log "main を取り込み、ファイル名の版を ${latest} より後に付け直してください。"
  exit 1
fi
log "main に無い migration は、すべて main の最新（${latest}）より後の版です。"
