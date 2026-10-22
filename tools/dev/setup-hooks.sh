#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

if current=$(git config --get core.hooksPath); then
  if [ "$current" != ".githooks" ]; then
    printf '[setup-hooks] 別の hook 設定があります：%s。既存 hook の統合が必要です。\n' "$current" >&2
    exit 1
  fi
else
  status=$?
  [ "$status" -eq 1 ] || exit "$status"
  hooks_dir=$(git rev-parse --git-path hooks)
  for hook in "$hooks_dir"/*; do
    case "$hook" in *.sample) continue ;; esac
    if [ -f "$hook" ] && [ -x "$hook" ]; then
      printf '[setup-hooks] 既存 hook があります：%s。.githooks への統合が必要です。\n' "$hook" >&2
      exit 1
    fi
  done
fi

# config は同じ clone の worktree 間で共有し、hook 本体は各 worktree のものを読む。
git config --local core.hooksPath .githooks
if [ "$(git config --get core.hooksPath)" != ".githooks" ]; then
  printf '[setup-hooks] worktree 固有の core.hooksPath を確認してください。\n' >&2
  exit 1
fi
chmod +x .githooks/pre-push
printf '[setup-hooks] push 前の Storybook・E2E 検査を登録しました。\n'
