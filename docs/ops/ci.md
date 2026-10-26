# CIとpush前の検査

## 開発環境の初回設定

各PCのcloneで、レビュー済みの信頼できるcheckoutから依存を入れ、hookを登録する。

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm setup:hooks
```

Node.jsは`.node-version`、pnpmは`package.json`のバージョンを使う。Linuxでブラウザの共有ライブラリが不足する場合は`pnpm exec playwright install --with-deps chromium`を実行する。DockerとPostgreSQLの`psql`も必要になる。

`pnpm setup:hooks`はGit共通ディレクトリ内の`farmille-hooks/pre-push`に固定のhookを設置し、そのディレクトリの絶対パスを`core.hooksPath`に登録する。同じcloneのworktreeもこのhookを共有する。checkout先の`.githooks`に追加されたhookは実行しない。既存の`.githooks`設定は移行できる。独自のhookや別のhooksPathがある場合は、上書きせず停止する。

push時は、現在のworktreeにある検査コード・依存設定（`tools/ci/browser-checks.ts`・`tools/ci/selection.ts`・`package.json`・`pnpm-lock.yaml`）と、pnpmの方針を決める設定（`pnpm-workspace.yaml`・`.npmrc`・`.pnpmfile.cjs`・`.pnpmfile.mjs`）を照合し、信頼できる場合だけ検査コードを実行する。これらがすべて`origin/main`（`refs/remotes/origin/main`）の中身と同じなら、登録なしで通す。mainに取り込まれた内容はレビュー済みとして扱う。比べるのはcheckoutにあるファイルのバイト列そのもので、改行の変換やGitのフィルターは適用しない（`.gitattributes`はブランチ側の中身のため）。`core.autocrlf`などでcheckoutの中身がmainのblobと異なる環境では一致せず、登録が要る。1つでも異なる場合は、SHA-256の組が`farmille-hooks/trusted`の一覧のどれかと一致したときに通す。無いpnpmの設定ファイルは「-」として組に入れる。どれとも一致しなければ、依存だけの変更に当たるかを調べ、当たらなければ`origin/main`と異なるファイルを表示してpushを止める。検査コード・依存設定のファイルが無い場合も止める。検査コードのシンボリックリンクや、`tools`・`tools/ci`内に置かれた`package.json`・`node_modules`も拒否し、検証したファイルと実際の読み込み先を一致させる。

依存だけが`origin/main`と異なるブランチは、登録の代わりにpnpmのsupply-chainの方針で検査する。次をすべて満たす場合が当たる。

- `tools/ci/browser-checks.ts`・`tools/ci/selection.ts`とpnpmの方針を決める設定が`origin/main`と同じ（mainに無いファイルは無いまま）
- `package.json`は`dependencies`・`devDependencies`・`optionalDependencies`を除けば`origin/main`と同じで、依存の指定に`:`と`/`を含まない（git・URL・`link:`・`file:`・`npm:`の別名を使わない）
- `pnpm-lock.yaml`の`packages`のどの項目にも、integrityだけの`resolution`がある（registryから入れる依存だけ）
- `pnpm-lock.yaml`の`patchedDependencies`（パッチのハッシュ）が`origin/main`と同じ

当たる場合は`pnpm install --frozen-lockfile --lockfile-only`を実行し、通ればpushを続ける。pnpm 11はinstallのたびに、lockfileの全項目へ`minimumReleaseAge`（既定は公開から1440分）などの方針をかけ直し、方針に反する項目があれば止まる。このコマンドは`node_modules`とlockfileを変えず、installのscriptsも実行しない。パッチの中身はlockfileのハッシュと照合される。環境変数（`pnpm_config_*`）は`pnpm-workspace.yaml`より優先されるため、`trustLockfile=false`と`minimumReleaseAge=1440`をコマンドの引数で固定する。`pnpm-workspace.yaml`で`minimumReleaseAge`を決めるときは、`tools/dev/pre-push.sh`の値も合わせる。

依存を足したworktreeでは、pushより前の`pnpm install`・単体テスト・buildで依存のコードが動くため、push前の登録では依存のコードの実行を防げない。依存の安全は、pnpmの方針（公開からの日数、`allowBuilds`にないinstall scriptsの拒否、git・tarballから入れる推移依存の拒否）と、上のpush前の検査で守る。push前の照合では、検査を弱める変更と、pnpmの方針そのものの変更を登録の対象にする。`overrides`・`allowBuilds`・`minimumReleaseAgeExclude`を変えると`pnpm-workspace.yaml`が変わるため、登録が要る。

検査コード、`package.json`の依存以外の欄、pnpmの方針、パッチを変えたブランチと、registry以外から依存を入れるブランチが登録を要する。pnpmの方針の検査に通らない依存は、方針を外してよいと判断した場合だけ登録する。対象ファイルの変更をレビューした後、信頼できるcheckoutから次を実行し、今の組を一覧に足す。

```bash
pnpm setup:hooks --trust-current
```

一覧は同じcloneの全worktreeで共有する。`--trust-current`は今の組を一覧の末尾に足し（登録済みの組は末尾へ移す）、登録の新しい20組だけを残す。ほかのブランチが登録した組は消えないため、ブランチを切り替えるたびに登録し直す必要はない。上限は、後で問題が見つかった依存の組をいつまでも通さないために置く。一覧から消えた組のブランチは、もう一度登録する。複数のworktreeで同時に`--trust-current`を実行すると、片方の登録が失われることがある。pushが止まったら、もう一度登録する。

通常の`pnpm setup:hooks`や`pnpm setup:worktree`は一覧に組を足さない。今のcheckoutがpushの照合に通らなければ、pushと同じ理由を表示して止まる。初回の登録だけは、今の組を一覧に入れる。

`tools/dev/pre-push.sh`が変わっても、設置済みのhookは古い内容のまま動く。新しい内容を含むブランチでは、通常の`pnpm setup:hooks`と`pnpm setup:worktree`が「登録済みの内容と異なります」で止まる。変更がmainに入った後、cloneごとに1回、mainの最新を取り込んだ信頼できるcheckoutから`pnpm setup:hooks --trust-current`を実行する。照合する組にpnpmの設定を加える前に登録した組は、新しいhookでは一致しない。依存だけのブランチは登録なしで通り、それ以外のブランチはもう一度登録する。

`origin/main`は`git fetch`で取得した時点の中身を使う。mainで検査コード、`package.json`の依存以外の欄、pnpmの設定が更新されると、それより前のmainから分かれたブランチは一致しなくなる。mainを取り込むか、`--trust-current`で登録する。mainで依存だけが更新された場合は、依存だけの変更として検査する。

登録したコードからは各worktreeのbuild・testを実行するため、未信頼ブランチを安全に実行するための隔離機能ではない。依存のインストール・セットアップ・pushは、対象のコードを信頼できると確認してから行う。

hookのソースはGitで共有するが、設置済みのhookと登録設定はcloneされない。別PC・別cloneでは再度登録する。hookをまだ含まない古いブランチはmainの変更を取り込む必要がある。Git GUIからpushする場合も、GUIの実行環境からNode.jsとpnpmを呼び出せるようにする。

E2Eは検証専用のSupabase（127.0.0.1:54321）を使う。Dockerを起動し、[ローカル検証手順](local-verification.md) に従ってSupabaseとmigrationを準備する。hookはSupabaseを自動起動せず、起動していなければpushを止めて手順を表示する。E2Eの直前に、54321のDBをpushするブランチのmigrationと`supabase/seed.sql`で作り直す（入っていたデータは消える）。別のworktreeで当てたmigrationがDBに残っていても、E2Eはそのブランチのスキーマで流れる。E2E用アカウントの更新と資材マスタの投入は、作り直した後に行う。

### 1組だけを登録する古いhookからの移行

一覧を使う前に登録したcloneでは、`farmille-hooks/pre-push`に4ファイルのハッシュを1組だけ埋め込んだ古いhookが動き続ける。古いhookは一覧も`origin/main`も見ないため、登録した組と異なるブランチのpushは止まる。この仕組みがmainに入った後、cloneごとに1回、mainの最新を取り込んだ信頼できるcheckoutから次を実行する。

```bash
git fetch origin main
pnpm setup:hooks --trust-current
```

hookの中身が変わるため、移行するまでは、この仕組みを含むブランチの通常の`pnpm setup:hooks`と`pnpm setup:worktree`が「登録済みの内容と異なります」で止まる。移行後は、この仕組みを含まない古いブランチの`pnpm setup:hooks`と`pnpm setup:worktree`が、一覧のファイル（`farmille-hooks/trusted`）を管理対象外のhookとみなして止まる。古いブランチでhookを登録し直すときは、先にmainを取り込む。pushは設置済みの新しいhookが照合するため、古いブランチのままでも、4ファイルが`origin/main`か一覧と一致すれば通る。

## push前の検査

`tools/ci/browser-checks.ts`はGitから渡された送信先のSHAと送信するHEADの差分を取り、`tools/ci/selection.ts`で対象を決める。新規ブランチは送信先のリモート追跡ブランチ `main` とのmerge-baseから差分を取る。mainへのpushも通常の更新と同じ差分判定を使う。新規タグと、比較元のcommitやmainとの分岐点を取得できない場合は全件検査する。削除だけのpushでは検査しない。

| 変更内容 | Storybook | E2E |
|---|---|---|
| 資料・エージェント設定・単体テスト・hook・lint・GitHub設定だけ | 省く | 省く |
| Story・Storybookの設定や検査だけ | 対象Storyまたは全件 | 省く |
| E2Eのテスト・設定・ローカル起動やmigration確認スクリプトだけ | 省く | 全件 |
| `src/app`内の画面・部品 | importの利用先にあるStory | 全件 |
| CSSだけ | 全件 | 省く |
| 共通部品・テーマ・画像・依存・未知のファイル | 全件 | 全件 |

複数種類の変更があれば、それぞれに必要な検査を実行する。開発ツールの除外対象は `tools/ci/selection.ts` に列挙し、未知のスクリプトを一律に除外しない。hook自身の動作はGitを使う統合テストで検証する。

Supabaseが使う`docs/email-templates`は資料扱いにしない。画面の選別では静的import・再export・文字列の動的importをたどり、別ルートの利用先も含める。削除・rename・Nextのlayoutやerrorなどの暗黙の親画面・mock・型宣言の変更、依存を解決できない変更は全件検査する。

選んだStoryは320〜1440pxの13幅をすべて検査する。部品の操作テストと375px・1440pxの代表画面の撮影も行う。対象Storyがビルド後のindexに存在しなければエラーになる。

送信するcommitと検査対象を一致させるため、push前に変更をcommitまたはstashする。現在のHEADと異なるcommitを送る場合は、対象ブランチに移動して個別にpushする。検査中にHEADや作業ツリーを変更した場合もpushは止まる。

Storybookのビルド・レスポンシブ検査・E2Eは順番に実行する。同じユーザーの別worktree・別cloneで検査中なら、共有DBとポートの競合を避けるため後からの実行を止める。先の検査が終わってから再実行する。異常終了でロックが残った場合は、表示されたディレクトリの`owner`にあるPIDと作業場所を確認し、検査プロセスが残っていない場合だけそのディレクトリを削除する。

直接起動したdevサーバーや個別の検査コマンドはこのロックの対象外になる。3007番と6106番が空いている状態で実行する。

## 自動CIと手動検査

コード変更後は、次の品質検査を実行する。

```bash
pnpm lint && pnpm format:check && pnpm exec tsc --noEmit && pnpm exec vitest run && pnpm check:stories && pnpm build
```

自動CIのApplication quality gatesは、lint・形式・型・単体テスト・依存の監査・Storyの有無・アプリのビルドを検査する。成功後にDatabase authorizationがローカルSupabaseでDB権限を検査する。mainでは、この2ジョブの成功後にDB移行と本番デプロイを行う。migration変更時のDBリセット検査も継続する。

ブラウザ検査をGitHub上で全件実行する場合は、Actionsの **Browser checks** から **Run workflow** を選び、対象ブランチを指定する。失敗時の成果物は7日間保存する。このworkflowはmainに取り込まれた後に手動実行できる。

PRの新しいcommitが届いたら古いCIを止める。mainの実行中のDB移行とデプロイは中断せず、待機分を最新の1件にまとめる。PreviewとDB cleanupは既存の直列実行を維持する。

Git hookは`git push --no-verify`、未登録のclone、GitHub上の編集やmergeでは実行されない。サーバー側の必須チェックにはならないため、ブラウザ検査の実行結果をPRに残す。GitHubの必須チェックに旧Storybook・E2Eジョブを登録している場合は、削除したチェック名がmergeを妨げないよう設定を更新する。

## 手元で全件検査する

未コミットの作業ツリーも含めて検査できる。

```bash
pnpm test:browser:local
```

hookと同じ実行器とロックを使い、Storybookをビルドして全Storyを検査した後にE2Eを実行する。失敗した検査の時点で停止する。個別の実行手順は [ローカル検証手順](local-verification.md) を参照する。
