---
name: verify-farmille
description: FarmilleのWeb UIを実操作で検証する。検索、資材詳細、感想口コミ、お気に入り比較、記事閲覧の変更後に、ローカル起動、375pxの画面操作、証跡保存、後片付けを行う。
---

# Verify Farmille

最初に[機能マップ](features/README.md)を読み、対象機能と入口を選ぶ。画面はリポジトリのPlaywright（`@playwright/test`のChromium）をNode.jsのスクリプトから動かして操作する。既存のE2Eは操作手順の参照先として使う。

## Launch

Node.js 24.22.1以上25未満（`.node-version`と`package.json`の`engines`）とpnpm 11を使う。範囲外のNode.jsでは`engineStrict`により`pnpm install`が止まる。通常の起動はリポジトリ直下の`pnpm dev`で、ポートは3007。必須設定は`src/env.ts`、ひな型は`.env.example`を参照する。秘密値をログや証跡へ出さない。

起動前に`ps -axo pid,ppid,command`と`lsof -nP -iTCP -sTCP:LISTEN`で既存プロセスを確認する。同じチェックアウトのNext.jsを二重起動しない。別ポートだけでは`.next`を分離できない。

既存の作業と分離する場合は、以下をリポジトリ直下から実行する。コピーには`rsync`を使う。ソースの未コミット変更もコピーに含める。コピーの作成中に別の編集が入った場合は、検証対象の変更を確認してからコピーを作り直す。

```bash
VERIFY_REPO="$PWD"
VERIFY_APP=$(mktemp -d /tmp/farmille-verify.XXXXXX)
VERIFY_EVIDENCE="$VERIFY_REPO/output/verification/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$VERIFY_EVIDENCE"
rsync -a --exclude=node_modules --exclude=.git --exclude=.next \
  --exclude=.codex --exclude=.claude --exclude=.ok --exclude=output \
  --exclude=test-results --exclude=playwright-report --exclude=storybook-static \
  --exclude=docs --exclude='.env*' ./ "$VERIFY_APP/"
mkdir -p "$VERIFY_APP/docs"
cp -R docs/email-templates "$VERIFY_APP/docs/"
cp .env.local "$VERIFY_APP/.env.local"
git rev-parse HEAD > "$VERIFY_EVIDENCE/revision.txt"
git status --short > "$VERIFY_EVIDENCE/worktree-status.txt"
printf '%s\n' "$VERIFY_APP" > "$VERIFY_EVIDENCE/app-path.txt"
printf 'VERIFY_APP=%s\nVERIFY_EVIDENCE=%s\n' "$VERIFY_APP" "$VERIFY_EVIDENCE"
cd "$VERIFY_APP"
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

`docs`は、手元にだけある`docs/drafts/`（本番の識別子を含むため`.gitignore`で除外している）を写さないために除外する。`supabase/config.toml`のメールテンプレートは`docs/email-templates`を参照し、無いとSupabase CLIが設定エラーで止まるため、このディレクトリだけを写す。

シェルの変数と作業ディレクトリは、コマンドの実行が分かれると引き継がれないことがある。出力された`VERIFY_APP`と`VERIFY_EVIDENCE`の実値を控え、以後のコマンドでは毎回この2つを代入し直してから実行する。

`pnpm install`のprepareがPandaのコードとNext.jsのルート型を生成する。`node_modules`は共有・リンクしない。Linuxでブラウザの共有ライブラリが足りなければ`pnpm exec playwright install --with-deps chromium`を使う。インストールが失敗したら起動せず、原因と終了コードを記録してCleanupへ進む。

コピー先で環境変数の存在と接続先だけを確認する。

```bash
cd "$VERIFY_APP"
node --env-file=.env.local -e '
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "NEXT_PUBLIC_SITE_URL"]) {
  if (!process.env[key]) throw new Error(key + " が未設定です");
}
const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw new Error("検証先がローカルSupabaseではありません");
}
console.log("Supabase origin", url.origin);
'
lsof -nP -iTCP:3107 -sTCP:LISTEN
```

3107に既存リスナーがあれば停止させず、空きポートを明示的に選び、以後のURLと`NEXT_PUBLIC_SITE_URL`をすべて揃える。既定の検証URLは`http://127.0.0.1:3107`。

コピー先を作業ディレクトリにしたPTYで次を実行する。ツールが返すセッションIDを保存する。

```bash
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3107 pnpm dev --hostname 127.0.0.1 --port 3107
```

`Ready`を確認してDoctorを実行する。起動ログだけで成功と判定しない。画面のコンパイルは最初のリクエスト時に起きる。

接続先のSupabaseは`.env.local`の`NEXT_PUBLIC_SUPABASE_URL`で決まり、そのoriginを証跡に記録する。`supabase/config.toml`のスタックはAPIが54321、DBが54322で、`supabase db reset`のときに`supabase/seed.sql`（一般・メーカーのデモアカウント）を入れる。資材マスタとホームのデモデータは、`docs/ops/local-verification.md`の「2. データを入れ直したいとき」で入る。`.env.local`が58321など別ポートのスタックを指していてもよい。54321のDBはE2E（push前の検査と`pnpm test:e2e:local`）のたびに作り直され、手で入れたデータは消える。

アプリのコピーはDBを分離しない。公開画面の読み取りでもDB停止や別作業のデータ変更を受けるため、接続エラーが出たら対象の検証を中断して証跡を残す。データがなければ空状態を検証し、資材詳細などは未確認として記録する。`db reset`とデータの投入は共有DBの中身を消すため、このスキルの起動処理に含めず、ユーザーの承認なしに実行しない。

## Doctor

起動直後と、画面がおかしいときに次の読み取り専用診断を1回実行する。

```bash
lsof -nP -iTCP:3107 -sTCP:LISTEN
ps -axo pid,ppid,command | rg 'next dev|next-server'
curl --fail --silent --show-error --max-time 60 \
  --output "$VERIFY_EVIDENCE/doctor-home.html" \
  --write-out '%{http_code}\n' http://127.0.0.1:3107/
```

リスナーのPIDを`lsof -a -p PID -d cwd`で照合し、`app-path.txt`に記録したコピーを指すことを確認する。PIDには直前に得た実値を入れる。Linuxの`lsof`は`next-server (v16.x)`のような括弧を含むプロセス名を読めず、リスナーもcwdも表示しないことがある。その場合は`ps`で得た`next-server`のPIDを`readlink /proc/PID/cwd`で照合し、Cleanupでのリスナーの消失は`curl`の接続失敗で確かめる。起動ログのNext.jsバージョンがコピーの`package.json`と一致し、ホームがHTTP 200で、ブラウザにFarmilleと資材検索欄が表示された場合だけ操作へ進む。

`GET /`が500のときと、200でも画面が「ページを表示できませんでした」のときは、同じPTYのログにある最初のエラーを確認する。Supabaseに接続できない場合も、ホームは200のままこの画面になる。環境変数、Supabase接続、コンパイルを切り分け、秘密値を伏せて記録する。`container_type_id`不在などの「internal」なら、`pnpm check:migrations`でmigrationの遅れを確かめる。このコマンドはDBに何も適用しない。出力された適用コマンドの扱いは`docs/ops/local-verification.md`に従う。認証が必要な機能では、画面上のアカウント種別とログイン状態も確認する。

## Drive

E2Eの設定（`playwright.config.ts`）は3007・54321・global-setupに固定されているため使わない。コピー先の直下に機能ごとのスクリプト（例：`verify-search.mjs`）を置き、コピー先から実行する。`@playwright/test`はコピー先の`node_modules`から読み込まれる。

```javascript
import fs from "node:fs/promises";
import { chromium } from "@playwright/test";

const evidence = process.env.VERIFY_EVIDENCE;
if (!evidence) throw new Error("VERIFY_EVIDENCE が未設定です");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();
async function record(name) {
  await page.screenshot({ path: `${evidence}/${name}.jpg`, type: "jpeg" });
  await fs.writeFile(`${evidence}/${name}.aria.yml`, await page.locator("body").ariaSnapshot());
  console.log(name, page.url());
}
try {
  await page.goto("http://127.0.0.1:3107/");
  await page.getByRole("search", { name: "資材検索" }).waitFor({ state: "visible" });
  await record("search-01-home");
  // 機能マップの操作を続け、操作のたびに record する
} catch (error) {
  await record("failure");
  throw error;
} finally {
  await browser.close();
}
```

```bash
cd "$VERIFY_APP"
VERIFY_EVIDENCE="$VERIFY_EVIDENCE" node verify-search.mjs
```

1つの機能を1つのスクリプトにまとめる。初回は入口を開いてariaスナップショットを読み、機能マップのlocatorが現在の画面と合うことを確かめてから操作を足す。失敗したらスナップショットを読み直し、スクリプトを直して最初から流す。

遷移は`page.waitForURL`に加え、期待する要素の`waitFor({state:"visible"})`で読込完了を待つ。URLが変わってもスケルトン表示中の場合がある。SSR直後の未hydrationのボタンは押しても動かないことがあるため、`e2e/support/ui.ts`の`waitForReactHydration`と同じ確認をしてから押す。見つからないラベルを推測で置換しない。DOMの読み取りは許容するが、`page.evaluate`で内部状態やイベントを直接変更して操作を代用しない。

ログインが要る機能は、同じスクリプトの中で画面からログインする。メールアドレスとパスワードは環境変数で渡し、スクリプト・ログ・証跡に書かない。`storageState`などの認証stateをファイルへ保存しない。

まず[検索](features/search.md)のホーム検索、並び替え、入力の変更、検索解除、下部ナビ、リロードを通す。各入口の結果を別々に記録する。

既存E2Eを実行する場合は[DB更新を伴う検証](references/mutating-e2e.md)を先に読む。`pnpm test:e2e`を公開画面の疎通確認として実行しない。

## Evidence

証跡は`output/verification/<実行日時>/`へ残す。コピー先の中に置かない。

- 操作前後の375pxスクリーンショットをJPEGで保存する。
- ariaスナップショット、操作したlocator、入力値、URL、期待値と実際の表示を保存する。スクリーンショットだけで操作成功と判断しない。
- 実行したスクリプトと、その標準出力・終了コードを保存する。
- 起動ログ、Doctorの結果、リビジョン、未コミット変更の一覧を保存する。HTTPの結果はUI検証の代用にしない。
- 投稿や保存はリロードと別の表示箇所で永続化を確認する。必要なDB読み取りは、承認済みのテスト用接続先に限定する。
- 外部サービスのモックは既存の本番境界に限る。dry-runという名前だけで副作用なしと判断せず、通信、生成ファイル、DB更新を確認する。
- 秘密値、Cookie、アクセストークン、パスワード、認証用QRを保存しない。認証フォームを撮る場合は入力前に撮る。

結果は`result.md`に、機能ID・入口・操作・期待値・観測結果・成功／失敗／skip・未確認事項を記載する。画面幅をDOMから確認し、横方向のはみ出しも記録する。スクリーンショットを目視し、ローディング画面やエラー画面を成功証跡にしない。

## Cleanup

成功・失敗のどちらでも実行する。

1. スクリプトが終了し、起動したChromiumが残っていないことを`ps -axo pid,ppid,command`で確認する。残っていれば、この実行のスクリプトから起動したものだけを止める。
2. 起動したPTYのセッションIDへCtrl-Cを送り、終了コードを確認する。プロセス名でkillしない。元からある開発サーバーやSupabaseを止めない。
3. `lsof -nP -iTCP:3107 -sTCP:LISTEN`で自分のリスナーが消えたことを確認する。残っていればPIDと作業ディレクトリを照合する。
4. 実行したスクリプトを証跡へコピーしてから、この実行で作った`app-path.txt`のコピー先だけを削除する。削除前に`/tmp/farmille-verify.*`配下であることを確認する。元リポジトリと証跡ディレクトリは削除しない。
5. `test -s "$VERIFY_EVIDENCE/result.md"`と`find "$VERIFY_EVIDENCE" -name '*.jpg' -size +0c`で証跡が残っていることを確認する。失敗時もログと失敗画面を残す。

## Helpers

このスキル専用の実行ファイルはない。起動は`pnpm dev`、画面操作はPlaywrightのスクリプト、HTTP診断は`curl`を使う。既存テストの入口と制約は[DB更新を伴う検証](references/mutating-e2e.md)にまとめている。

画面やラベルを変更したら`/maintain-verification-skill`で機能マップを更新する。
