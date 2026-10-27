---
name: verify-farmille
description: FarmilleのWeb UIを実操作で検証する。検索、資材詳細、感想口コミ、お気に入り比較、記事閲覧の変更後に、ローカル起動、375pxの画面操作、証跡保存、後片付けを行う。
---

# Verify Farmille

最初に[機能マップ](features/README.md)を読み、対象機能と入口を選ぶ。操作はCodex in-app Browserで行う。既存のPlaywrightテストは操作手順の参照先として使う。

## Launch

Node.js 24、pnpm 11を使う。通常の起動はリポジトリ直下の`pnpm dev`で、ポートは3007。必須設定は`src/env.ts`、ひな型は`.env.example`を参照する。秘密値をログや証跡へ出さない。

起動前に`ps -axo pid,ppid,command`と`lsof -nP -iTCP -sTCP:LISTEN`で既存プロセスを確認する。同じチェックアウトのNext.jsを二重起動しない。別ポートだけでは`.next`を分離できない。

既存の作業と分離する場合は、以下をリポジトリ直下から実行する。ソースの未コミット変更もコピーに含める。コピーの作成中に別の編集が入った場合は、検証対象の変更を確認してからコピーを作り直す。

```bash
VERIFY_REPO="$PWD"
VERIFY_APP=$(mktemp -d /tmp/farmille-verify.XXXXXX)
VERIFY_EVIDENCE="$VERIFY_REPO/output/verification/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$VERIFY_EVIDENCE"
rsync -a --exclude=node_modules --exclude=.git --exclude=.next \
  --exclude=.codex --exclude=.claude --exclude=.ok --exclude=output \
  --exclude=test-results --exclude=playwright-report --exclude=storybook-static \
  --exclude=docs --exclude=tools/migration --exclude='.env*' ./ "$VERIFY_APP/"
cp .env.local "$VERIFY_APP/.env.local"
git rev-parse HEAD > "$VERIFY_EVIDENCE/revision.txt"
git status --short > "$VERIFY_EVIDENCE/worktree-status.txt"
printf '%s\n' "$VERIFY_APP" > "$VERIFY_EVIDENCE/app-path.txt"
cd "$VERIFY_APP"
pnpm install --frozen-lockfile
```

`pnpm install`のprepareがPandaのコードとNext.jsのルート型を生成する。`node_modules`は共有・リンクしない。インストールが失敗したら起動せず、原因と終了コードを記録してCleanupへ進む。

コピー先で環境変数の存在と接続先だけを確認する。

```bash
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

Supabaseは`supabase/config.toml`のAPIポートを確認する。2026-10-03の設定は58321、seedは無効。既存のローカルDBに公開資材が入っていることを前提とする。アプリのコピーはDBとブラウザのCookieを分離しない。公開画面の読み取りでもDB停止や別作業のデータ変更を受けるため、接続エラーが出たら対象の検証を中断して証跡を残す。データがなければ空状態を検証し、資材詳細などは未確認として記録する。共有DBのreset、migration適用、seed投入をこのスキルの起動処理に含めない。

## Doctor

起動直後と、画面がおかしいときに次の読み取り専用診断を1回実行する。

```bash
lsof -nP -iTCP:3107 -sTCP:LISTEN
ps -axo pid,ppid,command | rg 'next dev|next-server'
curl --fail --silent --show-error --max-time 60 \
  --output "$VERIFY_EVIDENCE/doctor-home.html" \
  --write-out '%{http_code}\n' http://127.0.0.1:3107/
```

リスナーのPIDを`lsof -a -p PID -d cwd`で照合し、`app-path.txt`に記録したコピーを指すことを確認する。PIDには直前に得た実値を入れる。起動ログのNext.jsバージョンがコピーの`package.json`と一致し、ホームがHTTP 200で、ブラウザにFarmilleと資材検索欄が表示された場合だけ操作へ進む。

`GET /`が500なら、同じPTYのログにある最初のエラーを確認する。環境変数、Supabase接続、コンパイルを切り分け、秘密値を伏せて記録する。認証が必要な機能では、画面上のアカウント種別とログイン状態も確認する。

## Drive

`computer-use-coordination`を読み、バックグラウンドの専用タブを使う。新規cuaセッションの最初の呼び出しは次の1行だけにする。

```javascript
let tab = await cua.createBrowserTab("iab", "http://127.0.0.1:3107/", { visible: false });
```

返されたブラウザIDを指定して`cua.getBrowser`を取得する。viewport capabilityのdocumentationを読み、`set({width:375,height:812})`を実行する。既にcuaを利用中なら既存のブラウザバインディングを再利用する。

機能マップのセレクターを現在のAXまたはDOMスナップショットと照合し、`tab.playwright`から操作する。各操作の後に`tab.getAXState()`を読み、URLと表示内容を確認する。遷移中なら`waitForURL`に加え、期待する入力欄の`waitFor({state:"visible"})`で読込完了を待つ。URLが変わってもスケルトン表示中の場合がある。見つからないラベルを推測で置換しない。DOMの読み取りは許容するが、内部状態やイベントを直接変更して操作を代用しない。

まず[検索](features/search.md)のホーム検索、並び替え、入力の変更、検索解除、下部ナビ、リロードを通す。各入口の結果を別々に記録する。

既存E2Eを実行する場合は[DB更新を伴う検証](references/mutating-e2e.md)を先に読む。`pnpm test:e2e`を公開画面の疎通確認として実行しない。

## Evidence

証跡は`output/verification/<実行日時>/`へ残す。コピー先の中に置かない。

- 操作前後の375pxスクリーンショットをJPEGで保存する。cuaの`tab.screenshot({fullPage:false})`のバイト列をファイルへ書き出す。
- AXまたはDOMスナップショット、操作したラベル、入力値、URL、期待値と実際の表示を保存する。スクリーンショットだけで操作成功と判断しない。
- 起動ログ、Doctorの結果、リビジョン、未コミット変更の一覧を保存する。HTTPの結果はUI検証の代用にしない。
- 投稿や保存はリロードと別の表示箇所で永続化を確認する。必要なDB読み取りは、承認済みのテスト用接続先に限定する。
- 外部サービスのモックは既存の本番境界に限る。dry-runという名前だけで副作用なしと判断せず、通信、生成ファイル、DB更新を確認する。
- 秘密値、Cookie、アクセストークン、パスワード、認証用QRを保存しない。認証フォームを撮る場合は入力前に撮る。

結果は`result.md`に、機能ID・入口・操作・期待値・観測結果・成功／失敗／skip・未確認事項を記載する。画面幅をDOMから確認し、横方向のはみ出しも記録する。スクリーンショットを目視し、ローディング画面やエラー画面を成功証跡にしない。

cua内での保存は次の形を使う。`evidence`にはLaunchで作った証跡ディレクトリの絶対パスを渡す。

```javascript
let fs = await import("node:fs/promises");
await fs.writeFile(evidence + "/search.jpg", await tab.screenshot({ fullPage: false }));
await fs.writeFile(evidence + "/search.txt", await tab.playwright.domSnapshot());
```

## Cleanup

成功・失敗のどちらでも実行する。

1. 作成したブラウザタブだけを閉じ、変更したviewportを`reset()`で戻す。
2. 起動したPTYのセッションIDへCtrl-Cを送り、終了コードを確認する。プロセス名でkillしない。元からある開発サーバーやSupabaseを止めない。
3. `lsof -nP -iTCP:3107 -sTCP:LISTEN`で自分のリスナーが消えたことを確認する。残っていればPIDと作業ディレクトリを照合する。
4. この実行で作った`app-path.txt`のコピー先だけを削除する。削除前に`/tmp/farmille-verify.*`配下であることを確認する。元リポジトリと証跡ディレクトリは削除しない。
5. `test -s "$VERIFY_EVIDENCE/result.md"`と`find "$VERIFY_EVIDENCE" -name '*.jpg' -size +0c`で証跡が残っていることを確認する。失敗時もログと失敗画面を残す。

## Helpers

このスキル専用の実行ファイルはない。起動は`pnpm dev`、閲覧はcua、HTTP診断は`curl`を使う。既存テストの入口と制約は[DB更新を伴う検証](references/mutating-e2e.md)にまとめている。

画面やラベルを変更したら`/maintain-verification-skill`で機能マップを更新する。
