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

# 照合の途中で fetch されても、すべてのファイルを同じ main の commit と比べる。
main=$(git rev-parse -q --verify 'refs/remotes/origin/main^{commit}') || main=
# 無いファイルは、main にも無ければ同じとみなす。
same_as_main() {
  if [ -e "$1" ] || [ -L "$1" ]; then
    [ -f "$1" ] && [ ! -L "$1" ] &&
      [ "$(git hash-object --no-filters -- "$1")" = "$(git rev-parse -q --verify "$main:$1")" ]
  else
    ! git cat-file -e "$main:$1" 2>/dev/null
  fi
}
current=
differs=
for file in tools/ci/browser-checks.ts tools/ci/selection.ts package.json pnpm-lock.yaml \
  pnpm-workspace.yaml .npmrc .pnpmfile.cjs .pnpmfile.mjs; do
  digest=
  # pnpm の設定ファイルは無くてもよく、無ければ「-」として組に入れる。
  case "$file" in
    pnpm-workspace.yaml | .*) [ -e "$file" ] || [ -L "$file" ] || digest=- ;;
  esac
  if [ -z "$digest" ]; then
    if [ ! -f "$file" ] || [ -L "$file" ]; then
      printf '[pre-push] 検査コード・依存設定は通常のファイルである必要があります：%s\n' "$file" >&2
      exit 1
    fi
    digest=$(shasum -a 256 "$file") || exit 1
    digest=${digest%% *}
  fi
  current="${current:+$current }$digest"
  if [ -z "$main" ] || ! same_as_main "$file"; then
    differs="${differs:+${differs}・}$file"
  fi
done
# origin/main と同じ内容なら登録なしで通し、異なる場合は登録済みの組のどれかと一致すれば通す。
trusted="$(git rev-parse --path-format=absolute --git-common-dir)/farmille-hooks/trusted"
if [ -n "$differs" ] && ! grep -qsxF "$current" "$trusted"; then
  # 依存だけの変更は、登録の代わりに pnpm の supply-chain の方針で検査する。
  # 方針を決める pnpm の設定と検査コードは main と同じものに限り、公開日の方針が効かない registry 以外の依存は登録を求める。
  if [ -n "$main" ]; then
    differs=
    for file in tools/ci/browser-checks.ts tools/ci/selection.ts pnpm-workspace.yaml .npmrc .pnpmfile.cjs .pnpmfile.mjs; do
      same_as_main "$file" || differs="${differs:+${differs}・}$file"
    done
    git cat-file blob "$main:package.json" | node -e '
      const fs = require("node:fs");
      const main = JSON.parse(fs.readFileSync(0, "utf8"));
      const current = JSON.parse(fs.readFileSync("package.json", "utf8"));
      for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
        for (const [name, spec] of Object.entries(current[field] ?? {})) {
          if (/[:/]/.test(spec)) {
            console.error(`[pre-push] package.json の ${name} は registry 以外から入れる指定です：${spec}`);
            process.exitCode = 1;
          }
        }
        delete main[field];
        delete current[field];
      }
      if (JSON.stringify(current) !== JSON.stringify(main)) process.exitCode = 1;
    ' || differs="${differs:+${differs}・}package.json"
    # pnpm が書く lockfile では、registry の依存の項目ごとに integrity だけの resolution が1行入る。
    # パッチの中身は frozen の検査で lockfile のハッシュと照合されるので、ハッシュの欄を main と比べる。
    patches='/^patchedDependencies:/ { keep = 1; print; next } /^[^ ]/ { keep = 0 } keep'
    if ! awk '
      /resolution/ && !/^    resolution: [{]integrity: [^,}]*[}]$/ { bad = 1 }
      /^[^ ]/ { if (open) bad = 1; open = 0; packages = ($0 == "packages:") }
      packages && /^  [^ ]/ { if (open) bad = 1; open = 1 }
      packages && /^    resolution: / { open = 0 }
      END { exit bad || open }
    ' pnpm-lock.yaml ||
      [ "$(awk "$patches" pnpm-lock.yaml)" != "$(git cat-file blob "$main:pnpm-lock.yaml" | awk "$patches")" ]; then
      printf '[pre-push] pnpm-lock.yaml に、registry 以外から入れる依存、integrity の無い依存、パッチの変更のどれかがあります。\n' >&2
      differs="${differs:+${differs}・}pnpm-lock.yaml"
    fi
  fi
  if [ -n "$differs" ]; then
    printf '[pre-push] %s が origin/main と異なり、登録済みの検査コード・依存設定のどの組とも一致しません。変更をレビューし、信頼できる checkout で pnpm setup:hooks --trust-current を実行してください。\n' "$differs" >&2
    exit 1
  fi
  # node_modules と lockfile を変えず、install の scripts も動かさずに、lockfile の全項目へ方針をかけ直す。
  # 環境変数やグローバル設定で緩めないよう、pnpm 11 の既定の方針を引数で固定する（pnpm-workspace.yaml は上書きしていない）。
  # shortcut: 公開からの日数は既定の1440分に固定。pnpm-workspace.yaml で minimumReleaseAge を決めたら、ここも合わせる。
  if ! output=$(pnpm install --frozen-lockfile --lockfile-only \
    --config.trust-lockfile=false --config.minimum-release-age=1440 2>&1); then
    printf '%s\n[pre-push] 依存の変更が pnpm の supply-chain の方針の検査に通りません。上の表示を確かめ、方針を外してよいと判断した場合だけ、信頼できる checkout で pnpm setup:hooks --trust-current を実行してください。\n' "$output" >&2
    exit 1
  fi
  printf '[pre-push] 依存の変更は pnpm の supply-chain の方針の検査に通りました。\n'
fi
