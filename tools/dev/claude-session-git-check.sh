#!/usr/bin/env bash
# Claude Code のセッション開始時に、origin/main からの遅れと main の未コミット変更を知らせる。
# 出力はセッションの文脈に入る。確認できなくてもセッションは止めない。

set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 0

branch=$(git branch --show-current)

if GIT_TERMINAL_PROMPT=0 git fetch --quiet origin main 2>/dev/null; then
  behind=$(git rev-list --count HEAD..origin/main)
  if [ "$behind" -gt 0 ]; then
    echo "[git-check] ${branch:-HEAD} は origin/main より ${behind} commit 遅れている。着手前に main を取り込むか、新しい worktree で始める。"
  fi
else
  echo "[git-check] origin/main を取得できなかったので、main からの遅れは確認していない。"
fi

# worktree から始めたセッションでも、main を checkout している作業ツリー（多くは本体チェックアウト）を見る
main_tree=$(git worktree list --porcelain | awk '/^worktree /{path=substr($0,10)} $0=="branch refs/heads/main"{print path; exit}')
if [ -n "$main_tree" ]; then
  dirty=$(git -C "$main_tree" status --porcelain | wc -l | tr -d ' ')
  if [ "$dirty" -gt 0 ]; then
    echo "[git-check] main の作業ツリー（${main_tree}）に未コミットの変更が ${dirty} 件ある。別セッションの作業かもしれないので、同じファイルを触る前にユーザーに確認する。"
  fi
fi
