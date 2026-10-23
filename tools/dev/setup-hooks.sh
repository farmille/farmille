#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != "--trust-current" ]; }; then
  printf 'Usage: pnpm setup:hooks [--trust-current]\n' >&2
  exit 1
fi
common_dir=$(git rev-parse --path-format=absolute --git-common-dir)
hooks_dir="$common_dir/farmille-hooks"

if current=$(git config --get core.hooksPath); then
  if [ "$current" != ".githooks" ] && [ "$current" != "$hooks_dir" ]; then
    printf '[setup-hooks] 別の hook 設定があります：%s。既存 hook の統合が必要です。\n' "$current" >&2
    exit 1
  fi
else
  status=$?
  [ "$status" -eq 1 ] || exit "$status"
  current="$common_dir/hooks"
fi

if [ "$current" != "$hooks_dir" ]; then
  for hook in "$current"/*; do
    case "$hook" in *.sample) continue ;; esac
    if [ "$hook" = ".githooks/pre-push" ] && cmp -s "$hook" <(printf '%s\n' \
      '#!/usr/bin/env sh' 'set -eu' 'cd "$(git rev-parse --show-toplevel)"' \
      'exec node tools/ci/browser-checks.ts pre-push'); then
      continue
    fi
    if [ -f "$hook" ] && [ -x "$hook" ]; then
      printf '[setup-hooks] 既存 hook があります：%s。既存 hook の統合が必要です。\n' "$hook" >&2
      exit 1
    fi
  done
fi

if [ -L "$hooks_dir" ]; then
  printf '[setup-hooks] hook の保存先がシンボリックリンクです：%s\n' "$hooks_dir" >&2
  exit 1
fi
for hook in "$hooks_dir"/* "$hooks_dir"/.[!.]* "$hooks_dir"/..?*; do
  [ -e "$hook" ] || [ -L "$hook" ] || continue
  if [ "$hook" != "$hooks_dir/pre-push" ] || [ -L "$hook" ] || \
    ! grep -qx '# Farmille managed pre-push v1' "$hook"; then
    printf '[setup-hooks] 管理対象外の hook があります：%s。上書きせず停止します。\n' "$hook" >&2
    exit 1
  fi
done

temporary=$(mktemp -d "$common_dir/farmille-hooks.XXXXXX")
trap 'rm -rf "$temporary"' EXIT
cat tools/dev/pre-push.sh > "$temporary/pre-push"
for file in tools/ci/browser-checks.ts tools/ci/selection.ts package.json pnpm-lock.yaml; do
  digest=$(shasum -a 256 "$file")
  printf "verify_hash '%s' '%s'\n" "${digest%% *}" "$file" >> "$temporary/pre-push"
done
printf '%s\n' 'exec node tools/ci/browser-checks.ts pre-push "$@"' >> "$temporary/pre-push"

if [ -f "$hooks_dir/pre-push" ] && ! cmp -s "$temporary/pre-push" "$hooks_dir/pre-push" && \
  [ "${1:-}" != "--trust-current" ]; then
  printf '[setup-hooks] 登録済みの内容と異なります。変更をレビューし、信頼できる checkout で pnpm setup:hooks --trust-current を実行してください。\n' >&2
  exit 1
fi
mkdir -p "$hooks_dir"
chmod 755 "$temporary/pre-push"
mv "$temporary/pre-push" "$hooks_dir/pre-push"
git config --local core.hooksPath "$hooks_dir"
if [ "$(git config --get core.hooksPath)" != "$hooks_dir" ]; then
  printf '[setup-hooks] worktree 固有の core.hooksPath を確認してください。\n' >&2
  exit 1
fi
printf '[setup-hooks] push 前の検査を登録しました：%s\n' "$hooks_dir"
