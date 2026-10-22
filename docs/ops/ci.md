# CIとpush前の検査

## 開発環境の初回設定

各PCのcloneで、依存を入れた後にhookを登録する。

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm setup:hooks
```

Node.jsは`.node-version`、pnpmは`package.json`のバージョンを使う。Linuxでブラウザの共有ライブラリが不足する場合は`pnpm exec playwright install --with-deps chromium`を実行する。DockerとPostgreSQLの`psql`も必要になる。

`pnpm setup:hooks`は`core.hooksPath=.githooks`をclone内に登録する。同じcloneから作ったworktreeにも設定が適用され、各worktreeの`.githooks/pre-push`を使う。別のhooksPathや標準ディレクトリの実行可能なhookがある場合は、統合を案内して停止する。新しいworktreeの`pnpm setup:worktree`にも登録処理を含む。

hook本体はGitで共有するが、登録設定はcloneされない。別PC・別cloneでは再度登録する。hookをまだ含まない古いブランチはmainの変更を取り込む必要がある。Git GUIからpushする場合も、GUIの実行環境からNode.jsとpnpmを呼び出せるようにする。

E2Eは検証専用のSupabase（127.0.0.1:54321）を使う。Dockerを起動し、[ローカル検証手順](local-verification.md) に従ってSupabaseとmigrationを準備する。hookはDBを自動起動したりmigrationを適用したりせず、不足があればpushを止めて手順を表示する。E2E用アカウントの更新と、未投入の資材マスタの投入はE2E実行時に行う。

## push前の検査

`tools/ci/browser-checks.ts`はGitから渡された送信先のSHAと送信するHEADの差分を取り、`tools/ci/selection.ts`で対象を決める。新規ブランチ・新規タグ・mainへのpushと、比較元のcommitがローカルに無い場合は全件検査する。削除だけのpushでは検査しない。

| 変更内容 | Storybook | E2E |
|---|---|---|
| 資料・エージェント設定・単体テストだけ | 省く | 省く |
| Story・Storybookの設定や検査だけ | 対象Storyまたは全件 | 省く |
| E2Eのテストや設定だけ | 省く | 全件 |
| `src/app`内の画面・部品 | importの利用先にあるStory | 全件 |
| 共通部品・テーマ・画像・CSS・依存・未知のファイル | 全件 | 全件 |

Supabaseが使う`docs/email-templates`は資料扱いにしない。画面の選別では静的import・再export・文字列の動的importをたどり、別ルートの利用先も含める。削除・rename・Nextのlayoutやerrorなどの暗黙の親画面・mock・型宣言の変更、依存を解決できない変更は全件検査する。

選んだStoryは320〜1440pxの13幅をすべて検査する。部品の操作テストと375px・1440pxの代表画面の撮影も行う。対象Storyがビルド後のindexに存在しなければエラーになる。

送信するcommitと検査対象を一致させるため、push前に変更をcommitまたはstashする。現在のHEADと異なるcommitを送る場合は、対象ブランチに移動して個別にpushする。検査中にHEADや作業ツリーを変更した場合もpushは止まる。

Storybookのビルド・レスポンシブ検査・E2Eは順番に実行する。同じユーザーの別worktree・別cloneで検査中なら、共有DBとポートの競合を避けるため後からの実行を止める。先の検査が終わってから再実行する。異常終了でロックが残った場合は、表示されたディレクトリの`owner`にあるPIDと作業場所を確認し、検査プロセスが残っていない場合だけそのディレクトリを削除する。

直接起動したdevサーバーや個別の検査コマンドはこのロックの対象外になる。3007番と6106番が空いている状態で実行する。

## 自動CIと手動検査

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
