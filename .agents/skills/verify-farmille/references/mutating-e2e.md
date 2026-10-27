# DB更新を伴う検証

`playwright.config.ts`は`http://localhost:3007`とSupabaseの`http://127.0.0.1:54321`を要求する。`.env.local`を自動で読み込む設定はない。必要な変数を実行環境へ明示的に渡す。

現在の`supabase/config.toml`はAPIを58321に設定している。この接続先の違いをURLの書き換えだけで回避しない。専用のローカルE2E環境を用意し、設定、実接続先、認証のリダイレクト先を揃えてから実行する。

`e2e/global-setup.ts`は管理者を作り、開始時と終了時に`cleanupOwnedE2eData()`を呼ぶ。各specもユーザーや資材を作成・削除する。`e2e/support/test-data.ts`の削除条件と対象DBを確認し、そのDBがこのテストのために破棄・更新可能である場合だけ実行する。別のE2Eと同じDBを同時に使わない。

実行環境とデータ操作が承認済みなら、対象のspecを選ぶ。

```bash
pnpm test:e2e e2e/04-search.spec.ts
pnpm test:e2e e2e/02-reviews.spec.ts
pnpm test:e2e e2e/05-saved.spec.ts
pnpm test:e2e e2e/11-report-reading.spec.ts
```

通常はテスト設定が`pnpm build && pnpm start --port 3007`を起動する。`PLAYWRIGHT_EXTERNAL_WEB_SERVER=1`は自分が起動して確認したサーバーだけに使う。

テストは375×812のChromiumで動く。ブラウザでの開発検証はCodex Browserを優先するが、既存の自動E2Eを実行する場合はリポジトリの設定を使う。成功時の操作前後の証跡が足りない場合は、Browserの実操作で補う。テスト完了後は`test-results/`の必要なスクリーンショットとtraceを`output/verification/<実行日時>/`へコピーし、次の実行で失われないようにする。

ログインは画面から行う。一般ユーザーは`/login`の「メールアドレス」「パスワード」「ログインする」を使う。メーカーは`/sellers/login`の「ログインID」を使い、運営はMFAも通す。認証stateや秘密値を証跡へ保存しない。
