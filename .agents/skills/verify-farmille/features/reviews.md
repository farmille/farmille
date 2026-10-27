# 感想口コミを書く

使用した資材の作目、評価、感想を投稿し、自分の投稿を編集する。

## Sub-features

- review-post：感想口コミを投稿する。
- review-edit：自分の投稿を編集する。
- review-delete：自分のテスト投稿を削除する。
- review-helpful：参考になったを切り替える。

## How to get to it (user POV)

- メインナビの「投稿する」から`/post`へ進み、資材を選んで「感想口コミを書く」を選ぶ。
- 資材詳細の投稿導線、または`/materials/<実ID>/review/new`を開く。
- 自分の口コミカードの「編集」から編集画面へ進む。
- ホームや資材詳細の口コミカードで「参考になった」を押す。

## Driving it with Codex Browser

前提条件：[DB更新の条件](../references/mutating-e2e.md)を満たす専用一般ユーザーとテスト資材がある。

- 作目：`tab.playwright.getByRole("textbox", {name:"作目"}).fill("トマト")`を実行し、`getByRole("button", {name:"トマトを選択", exact:true}).click()`で選ぶ。
- 投稿：`getByRole("radio", {name:"4", exact:true}).check()`、`getByLabel("感想口コミ本文").fill(実行IDを含む本文)`を実行する。画面の禁止表現の確認チェックを読み、適合するテスト本文でチェックして「投稿する」を押す。
- 永続化：投稿本文を含む`getByRole("article").filter({hasText:本文})`を確認する。リロード後とマイページから到達した投稿でも本文と作目を確認する。
- 編集：同じarticle内の`getByRole("link", {name:"編集"}).click()`から本文と評価を変え、`getByRole("button", {name:"変更を保存する"}).click()`を実行する。再読込後の内容を確認する。
- 削除：この実行で作成した削除可能なテスト投稿だけを対象にする。article内の「削除」、dialog内の「削除する」の順に進む。適用される操作承認に従い、削除後に一覧と再読込で消えたことを確認する。
- 参考になった：対象articleの`getByRole("button", {name:/参考になった/})`で選択状態と件数の変化を確認する。再読込後も残ることを確認し、元の状態に戻す。

## Gotchas

- 認証画面への遷移を投稿成功に数えない。
- 本文の存在だけで、別のユーザーや資材の投稿を成功証跡にしない。
- 操作と検証項目の詳細は`e2e/02-reviews.spec.ts`を参照する。
