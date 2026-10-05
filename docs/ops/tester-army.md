# Tester Armyでのアプリ検証

既存のPlaywrightにTester Armyを追加した。Playwrightの回帰テストとDBの権限検査を維持し、Tester Armyでは画面操作と結果の検証を行う。通常の実行にはAIのAPIキーを使わない。

依存はnpmで公開を確認した`e2e@0.17.0`、`@e2e-dev/web@0.12.0`、`ai@7.0.127`、`@ai-sdk/openai@4.0.83`に固定した。導入時のupstreamは`tester-army/e2e`の`4bfc1aae9bb02465245f10e652f4b27db92409ad`。設定とAPIは同リポジトリの`skills/e2e/SKILL.md`とsetup、writing-tests、running、agentの各文書を参照した。通常のテストでは`agent`を取得せず、`screen`と`expect`だけを使う。

## ローカル実行

Node.jsは24.8以降、または22.22.3以降が必要。ローカルSupabaseを起動し、`.env.local`にローカルの接続情報とメール設定を用意する。起動と資材seedの手順は[ローカル検証手順](local-verification.md)を参照する。

```bash
npx supabase start
pnpm exec e2e-web install chromium
node --env-file=.env.local node_modules/e2e/dist/cli/bin.js list
node --env-file=.env.local node_modules/e2e/dist/cli/bin.js run
pnpm check:tester-army:coverage
```

環境変数をシェルやCIで設定済みの場合は`pnpm test:tester-army`を使える。設定ファイルは`.env.local`を自動では読み込まない。アプリの起動処理にはSupabaseの公開URL・公開キー・秘密キーとSMTP・送信元・認証メールフックの値を明示的に渡す。

接続先は`http://localhost:3007`、DB操作先は`http://127.0.0.1:54321`に固定した。別のSupabaseを指定するとデータ操作の前に停止する。375pxのChromiumを1workerで実行し、テストごとに作った`e2e-`データだけを既存のヘルパーで片付ける。Playwrightと同じDBで同時に実行しない。

アプリはランナーが本番ビルドを作って起動する。既に起動しているローカルアプリを使う場合は`PLAYWRIGHT_EXTERNAL_WEB_SERVER=1`を指定する。CIではPlaywright完了後にTester Armyを実行し、Supabaseとメール環境を共有する。

## AIによる操作

```bash
node --env-file=.env.local scripts/run-tester-army-agent.mjs
```

`OPENAI_API_KEY`または`AI_GATEWAY_API_KEY`を設定するとLuna6で検索とプロフィール変更を操作できる。両方ある場合はOpenAIを使う。モデルはOpenAIでは`gpt-6-luna`、Gatewayでは`openai/gpt-6-luna`を指定する。必要なキーがなければ実行前にエラーで止まる。未実行のAI探索を成功したとは扱わない。キーはアプリ起動用の環境変数へ渡さない。

AI探索と通常のテストは別のglobを使う。APIキーを設定しても通常のCIではAIを呼ばない。選択したAI探索の結果も通常のテストと同じレポートへ保存するため、既存の証拠を保持したい場合は`--output .e2e/agent-run`を付ける。

## 操作範囲と証拠

[画面台帳](../../tester-army/flows.json)は実装の73画面について役割、画面状態、操作、期待結果、テスト元を記録する。`pending`はテストが存在するが実行結果をこの台帳では認定していない状態。`gap`は操作テストがまだなく、`local-only`は開発専用の画面。台帳の検査はURLの不足、重複、削除済み画面、存在しないテスト参照を検出する。

画面の撮影やURL到達は保存・提出・公開の成功を証明しない。各操作の成功は`.e2e/report.json`のtest・attempt・stepと、Playwrightの実行結果を照合する。通常は失敗時のスクリーンショット・トレース・動画を残す。公開画面の375px撮影は通常テストのartifactに含める。Secretでパスワードを入力した後はTester Armyが撮影を制限するため、会員向けの動画は既存のPlaywrightで取得する。

メーカー原稿の修正依頼・取り下げ・権限解除など、画面の状態で表示される操作を台帳とテストで区別する。企業申請の受付は資材の権限や公開状態を自動で変更しない。審査による変更と受付の成功を同じ証拠で扱わない。
