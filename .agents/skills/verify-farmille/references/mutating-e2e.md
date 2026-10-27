# DB更新を伴う検証

既存のE2Eは`pnpm test:e2e:local`（`tools/dev/e2e-local.sh`）で流す。`playwright.config.ts`は`http://localhost:3007`と、`supabase/config.toml`のSupabase（`http://127.0.0.1:54321`）だけを受け付け、`.env.local`を読まない。`pnpm test:e2e:local`は54321のスタックが起動しているかを確かめ、接続用の環境変数をexportし、`supabase db reset`でこのチェックアウトのmigrationと`supabase/seed.sql`から作り直す。`pnpm check:migrations`と資材マスタの投入を済ませてから、引数をそのまま`playwright test`へ渡す。Supabaseの起動・停止はしない。前提と手順は`docs/ops/local-verification.md`の「E2E」に従う。

54321のDBはE2E専用として扱い、実行のたびに作り直す。入っていたデータとデモアカウントのパスワードは消え、DBのボリュームはworktree間で共有している。開発中の画面で54321を使っている場合は、ユーザーの承認を得てから実行し、終わったら同じ資料の「2. データを入れ直したいとき」で戻す。別のE2Eと同じDBを同時に使わない。

`e2e/global-setup.ts`は開始時に`cleanupOwnedE2eData()`を呼んでE2E用の運営アカウントを作り、`e2e/global-teardown.ts`も終了時に同じ削除を行う。各specもユーザーや資材を作成・削除する。

実行環境とデータ操作が承認済みなら、対象のspecを選ぶ。

```bash
pnpm test:e2e:local e2e/04-search.spec.ts
pnpm test:e2e:local e2e/02-reviews.spec.ts
pnpm test:e2e:local e2e/05-saved.spec.ts
pnpm test:e2e:local e2e/11-report-reading.spec.ts
```

分離コピーを作った場合は、E2Eもコピー先（`cd "$VERIFY_APP"`）で流し、元のチェックアウトに`.next`や`test-results/`を書かない。コピーには`pnpm test:e2e:local`が使う`tools/migration/materials-v2-seed.sql`も含まれている。

テスト設定は`pnpm build && pnpm start --port 3007`を起動する。`reuseExistingServer`が`false`のため、3007を使っているプロセス（通常の`pnpm dev`など）があるとテストは始まらずに失敗する。そのプロセスは止めずに、ユーザーに確認する。`PLAYWRIGHT_EXTERNAL_WEB_SERVER=1`は自分が起動して確認したサーバーだけに使う。

テストは375×812のChromiumで動く。操作前後の証跡が足りない場合は、このスキルのPlaywrightスクリプトで補う。テスト完了後は、実行したディレクトリの`test-results/`から必要なスクリーンショットとtraceを証跡ディレクトリ（`output/verification/<実行日時>/`）へコピーする。コピー先の`test-results/`はCleanupで消える。

E2Eを使わずにこのスキルのスクリプトで投稿や保存をする場合も、書き込み先は`.env.local`の接続先になる。更新してよいDBかを先に確かめる。

ログインは画面から行う。一般ユーザーは`/login`の「メールアドレス」「パスワード」「ログインする」を使う。メーカーは`/sellers/login`の「Farmille企業会員ID」と「パスワード」を使い、運営はMFAも通す。ローカルのデモアカウントは`docs/ops/local-verification.md`の「3. ログイン情報」にある。認証stateや秘密値を証跡へ保存しない。
