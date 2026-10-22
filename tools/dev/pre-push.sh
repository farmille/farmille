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

verify_hash() {
  expected=$1
  file=$2
  if [ ! -f "$file" ] || [ -L "$file" ]; then
    printf '[pre-push] 検査コード・依存設定は通常のファイルである必要があります：%s\n' "$file" >&2
    exit 1
  fi
  actual=$(shasum -a 256 "$file") || exit 1
  if [ "${actual%% *}" != "$expected" ]; then
    printf '[pre-push] 登録済みの検査コード・依存設定と異なります：%s。変更をレビューし、信頼できる checkout で pnpm setup:hooks --trust-current を実行してください。\n' "$file" >&2
    exit 1
  fi
}
