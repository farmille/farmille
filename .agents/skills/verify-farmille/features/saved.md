# お気に入りを保存して比較する

気になる資材を保存し、お気に入り一覧から複数の資材を比較する。

## Sub-features

- saved-add：資材をお気に入りへ追加する。
- saved-list：マイページで保存した資材を確認する。
- saved-compare：資材を選んで比較表を表示する。
- saved-remove：保存を解除する。

## How to get to it (user POV)

- 資材詳細の「お気に入りに追加」を押す。未ログインでは「ログインしてお気に入りに保存」が出る。
- メインナビの「マイページ」から、「お気に入りの資材」の「すべて見る・比較する」で`/me/saved`を開く。
- `/me/saved`で比較する資材を選ぶ。

## Driving it with Playwright

前提条件：[DB更新の条件](../references/mutating-e2e.md)を満たす専用一般ユーザーと2件のテスト資材がある。

- 追加：各資材詳細で`page.getByRole("button", {name:"お気に入りに追加"}).click()`を実行する。「お気に入りから解除」へ変わることを確認する。
- 一覧：マイページからお気に入り一覧を開く。保存した2件の資材名が表示され、再読込後も残ることを確認する。
- 比較：資材ごとに`page.locator('a[href="/materials/<実ID>"]').locator("..").getByRole("checkbox", {name:"比較に含める"}).check()`を実行し、`page.getByRole("button", {name:"比較する"}).click()`を押す。比較できるのは2〜4件。`/me/saved/compare`への遷移、tableの表示、2件の資材名を確認する。
- 解除：各資材詳細の「お気に入りから解除」、または`/me/saved`の「リストから外す」を押し、一覧を再読込して対象が消えたことを確認する。通した入口を記録する。

## Gotchas

- 同名の資材を避け、カードとhrefを対応づける。
- ログイン前の誘導とログイン後の保存は別の結果として記録する。
- `e2e/05-saved.spec.ts`はユーザーと資材を作成・削除するため、実行には専用DBが必要になる。
