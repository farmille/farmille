#!/usr/bin/env bash
# 新しい worktree で実画面と E2E を確かめられるところまで準備する。
# 本体チェックアウトの .env.local を写し、依存と Playwright の Chromium を入れ、migration の遅れを確かめる。
# 既存の .env.local は上書きしない。DB へは何も適用しない。

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

readonly ENV_LOCAL=".env.local"

log() { printf '[setup-worktree] %s\n' "$*"; }
fail() {
  log "$*"
  exit 1
}

main_checkout=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
if [ -e "$ENV_LOCAL" ]; then
  log "既存の ${ENV_LOCAL} を使います（上書きしません）。"
elif [ "$main_checkout" = "$(git rev-parse --show-toplevel)" ]; then
  fail "本体チェックアウトに ${ENV_LOCAL} がありません。.env.example を写して値を入れてください。"
elif [ -f "${main_checkout}/${ENV_LOCAL}" ]; then
  cp -p "${main_checkout}/${ENV_LOCAL}" "$ENV_LOCAL"
  log "${main_checkout}/${ENV_LOCAL} を写しました。"
else
  fail "写し元の ${main_checkout}/${ENV_LOCAL} がありません。"
fi

# src/env.ts の getter をすべて読み、アプリが起動時に要る値がそろっているかを同じ規則で確かめる。
# シェルから引き継いだ値が .env.local の欠けを隠さないよう、環境変数を空にして読む。
env -i PATH="$PATH" HOME="$HOME" node --env-file="$ENV_LOCAL" --input-type=module -e '
  const { clientEnv, serverEnv } = await import("./src/env.ts");
  try {
    for (const env of [clientEnv, serverEnv]) for (const name of Object.keys(env)) env[name];
  } catch (error) {
    console.error(`[setup-worktree] .env.local の値が足りません：${error.message}`);
    process.exit(1);
  }
'
log "${ENV_LOCAL} に必須の値がそろっています。"

pnpm setup:hooks
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
log "依存（Panda の codegen を含む）と Playwright の Chromium を入れました。"

bash tools/dev/check-migrations.sh
log "準備ができました。pnpm dev で http://localhost:3007 に起動します。"
