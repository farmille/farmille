# CI の検査対象と実行回数

## PR の検査

Application quality gates はすべての PR で実行し、lint・形式・型・単体テスト・依存の監査・Story の有無・アプリのビルドを検査する。ここで失敗した場合は、Storybook と E2E を起動しない。

`tools/ci/plan.ts` は PR の比較元と HEAD の merge-base から差分を取り、`tools/ci/selection.ts` で画面検査の対象を決める。最後のコミットだけでは判定しない。

| 変更内容 | Storybook | E2E |
|---|---|---|
| 資料・エージェント設定・単体テストだけ | 省く | 省く |
| Story・Storybook の設定や検査だけ | 対象 Story または全件 | 省く |
| E2E のテストや設定だけ | 省く | 全件 |
| `src/app` 内の画面・部品 | import の利用先にある Story | 全件 |
| 共通部品・テーマ・画像・CSS・依存・未知のファイル | 全件 | 全件 |

Supabase が使う `docs/email-templates` は資料扱いにせず検査する。複数種類の変更があれば必要な検査を合わせる。

画面の選別は、静的 import・再export・文字列の動的 import を利用先へたどる。ルートをまたぐ利用先も含める。削除・rename・Next の layout や error などの暗黙の親画面・mock・型宣言の変更は全件検査する。依存を静的に解決できない場合や、変更したファイルの利用先に Story を特定できない場合も全件検査する。

選んだ Story は 320〜1440px の13幅をすべて検査する。個別部品の操作テストと375px・1440pxの代表画面の撮影も残す。選択対象がビルド後の index に存在しなければエラーにする。Story が少なく割り当てが空になった chunk だけを skip する。

Storybook は品質チェックのジョブで1回だけビルドし、同じ実行の3つの検査ジョブで共有する。共有ビルドの保存期間は1日。E2E の DB 権限検査は最初の shard で実行する。

## 新しいコミットが届いたとき

PR では古い CI と migration 検査を止め、最新コミットを検査する。main は全件検査を行い、実行中の本番デプロイや DB 移行を中断しない。main の実行待ちは最新コミットの1件にまとめる。

Preview と DB の cleanup は既存の直列実行を維持する。

## 手元での確認

```bash
pnpm exec vitest run tools/ci/selection.test.ts
node tools/ci/plan.ts pull_request <比較元の40桁SHA>
node tools/ci/plan.ts push
pnpm build-storybook
pnpm test:storybook:responsive
```

`STORYBOOK_RESPONSIVE_SELECTION` を指定しないローカル実行は全件検査になる。選別した検査を再現するときは、plan の `storybook` の値を JSON として渡す。E2E は [ローカル検証手順](local-verification.md) に従う。
