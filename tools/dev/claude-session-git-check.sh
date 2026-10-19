#!/usr/bin/env bash
# Claude Code のセッション開始時に、origin/main からの遅れと main の未コミット変更を知らせる。
# 出力はセッションの文脈に入る。確認できなくてもセッションは止めない。

set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 0

if ! GIT_TERMINAL_PROMPT=0 git fetch --quiet origin main 2>/dev/null; then
  echo "[git-check] origin/main を取得できなかったので、main からの遅れは確認していない。"
  exit 0
fi

branch=$(git branch --show-current)
behind=$(git rev-list --count HEAD..origin/main)
dirty=$(git status --porcelain | wc -l | tr -d ' ')

if [ "$behind" -gt 0 ]; then
  echo "[git-check] ${branch:-HEAD} は origin/main より ${behind} commit 遅れている。着手前に main を取り込むか、新しい worktree で始める。"
fi
if [ "$branch" = "main" ] && [ "$dirty" -gt 0 ]; then
  echo "[git-check] main に未コミットの変更が ${dirty} 件ある。別セッションの作業かもしれないので、触る前にユーザーに確認する。"
fi
