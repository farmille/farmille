#!/usr/bin/env sh
# Farmille managed pre-push v1
set -eu
cd "$(git rev-parse --show-toplevel)"

for directory in tools tools/ci; do
  if [ -L "$directory" ]; then
    printf '[pre-push] 検査コードのディレクトリがシンボリックリンクです：%s\n' "$directory" >&2
    exit 1
  fi
  for entry in "$directory/package.json" "$directory/node_modules"; do
    if [ -e "$entry" ] || [ -L "$entry" ]; then
      printf '[pre-push] 検査コードの依存解決を変更するファイルがあります：%s\n' "$entry" >&2
      exit 1
    fi
  done
done

current=
differs=
for file in tools/ci/browser-checks.ts tools/ci/selection.ts package.json pnpm-lock.yaml; do
  if [ ! -f "$file" ] || [ -L "$file" ]; then
    printf '[pre-push] 検査コード・依存設定は通常のファイルである必要があります：%s\n' "$file" >&2
    exit 1
  fi
  digest=$(shasum -a 256 "$file") || exit 1
  current="${current:+$current }${digest%% *}"
  blob=$(git hash-object --no-filters -- "$file")
  if [ "$blob" != "$(git rev-parse -q --verify "refs/remotes/origin/main:$file")" ]; then
    differs="${differs:+$differs・}$file"
  fi
done
# origin/main と同じ内容なら登録なしで通し、異なる場合は登録済みの組のどれかと一致すれば通す。
trusted="$(git rev-parse --path-format=absolute --git-common-dir)/farmille-hooks/trusted"
if [ -n "$differs" ] && ! grep -qsxF "$current" "$trusted"; then
  printf '[pre-push] %s が origin/main と異なり、登録済みの検査コード・依存設定のどの組とも一致しません。変更をレビューし、信頼できる checkout で pnpm setup:hooks --trust-current を実行してください。\n' "$differs" >&2
  exit 1
fi
