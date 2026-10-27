# お気に入りを保存して比較する

気になる資材を保存し、お気に入り一覧から複数の資材を比較する。

## Sub-features

- saved-add：資材をお気に入りへ追加する。
- saved-list：マイページで保存した資材を確認する。
- saved-compare：資材を選んで比較表を表示する。
- saved-remove：保存を解除する。

## How to get to it (user POV)

- 資材詳細の「お気に入りに追加」を押す。
- メインナビからマイページへ進み、お気に入りの一覧を開く。
- `/me/saved`で比較する資材を選ぶ。

## Driving it with Codex Browser

前提条件：[DB更新の条件](../references/mutating-e2e.md)を満たす専用一般ユーザーと2件のテスト資材がある。

- 追加：各資材詳細で`tab.playwright.getByRole("button", {name:"お気に入りに追加"}).click()`を実行する。「お気に入りから解除」へ変わることを確認する。
- 一覧：マイページからお気に入り一覧を開く。保存した2件の資材名が表示され、再読込後も残ることを確認する。
- 比較：各資材カードの`getByRole("checkbox", {name:"比較に含める"}).check()`を実行し、`getByRole("button", {name:"比較する"}).click()`を押す。`/me/saved/compare`への遷移、tableの表示、2件の資材名を確認する。
- 解除：各資材詳細で「お気に入りから解除」を押し、一覧を再読込して対象が消えたことを確認する。

## Gotchas

- 同名の資材を避け、カードとhrefを対応づける。
- ログイン前の誘導とログイン後の保存は別の結果として記録する。
- `e2e/05-saved.spec.ts`はユーザーと資材を作成・削除するため、実行には専用DBが必要になる。
