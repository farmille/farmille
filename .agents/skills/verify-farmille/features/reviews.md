# 感想口コミを書く

使用した資材の作目、評価、感想を投稿し、自分の投稿を編集する。

## Sub-features

- review-post：感想口コミを投稿する。
- review-edit：自分の投稿を編集する。
- review-delete：自分のテスト投稿を削除する。
- review-helpful：参考になったを切り替える。

## How to get to it (user POV)

- メインナビの「投稿する」から`/post`へ進み、「<資材名>を選択」を押して「感想口コミを書く」を選ぶ。
- 資材詳細の下部の「感想口コミを書く」、または`/materials/<実ID>/review/new`を開く。
- 自分の口コミカードの「編集」から編集画面へ進む。
- 資材詳細や感想口コミ一覧（`/materials/<実ID>/reviews`）で、他のユーザーの口コミカードの「参考になった」を押す。

## Driving it with Playwright

前提条件：[DB更新の条件](../references/mutating-e2e.md)を満たす専用一般ユーザーとテスト資材がある。参考になったの確認には、投稿者とは別の専用一般ユーザーも要る。

- 作目：入力はcombobox「使用対象作目」。`page.getByRole("combobox", {name:"使用対象作目", exact:true}).fill("トマト")`を実行し、`page.getByRole("option", {name:"トマト なす科果菜類", exact:true}).click()`で選ぶ。候補の名前は「<作目> <作物分類>」。選べる作目は1つで、別の候補を選ぶと置き換わる。選択中の作目はボタン「<作目>を削除」で表示される。
- 投稿：`page.getByRole("radio", {name:"4", exact:true}).check()`、`page.getByLabel("感想口コミ本文").fill(実行IDを含む本文)`を実行する。確認のチェックボックス（「実際に使用した感想を、使用条件や感じた変化が分かるよう…」）の文面を読み、適合するテスト本文で`page.getByRole("checkbox", {name:/実際に使用した感想を、使用条件や感じた変化/}).check()`を実行してから`page.getByRole("button", {name:"投稿する"}).click()`を押す。region「通知」の「感想口コミを投稿しました。」と`/materials/<実ID>`への遷移を確認する。
- 永続化：投稿本文を含む`page.getByRole("article").filter({hasText:本文})`と作目を確認する。リロード後と、`/me`のnav「投稿の種類」の「感想口コミ」（`tab=reviews`）でも本文と作目を確認する。
- 編集：`/me`のカードには「編集」がないため、投稿した資材の`/materials/<実ID>`へ戻る。本文を含むarticle内の`getByRole("link", {name:"編集"}).click()`から本文と評価を変え、`page.getByRole("button", {name:"変更を保存する"}).click()`を実行する。再読込後の内容を確認する。
- 参考になった：削除より前に行う。投稿者のページは残したまま、`browser.newContext({viewport:{width:375,height:812}})`で作った別のコンテキストで別の専用ユーザーとして画面からログインし、同じ`/materials/<実ID>`を開く。編集後の本文を含むarticleの`getByRole("button", {name:/参考になった/})`を押す。`aria-pressed`と件数（「参考になった0」→「参考になった1」）の変化を確認する。再読込後も残ることを確認し、もう一度押して元の状態に戻す。
- 削除：最後に投稿者のページへ戻り、この実行で作成した削除可能なテスト投稿だけを対象にする。article内の「削除」、`page.getByRole("alertdialog")`内の「削除する」の順に進む。適用される操作承認に従い、削除後に一覧と再読込で消えたことを確認する。

## Gotchas

- 認証画面への遷移を投稿成功に数えない。
- 本文の存在だけで、別のユーザーや資材の投稿を成功証跡にしない。
- 自分の口コミの「参考になった」は無効のボタンで、押せない。
- ホームには感想口コミのカードがない。ホームからの導線として検証しない。
- 操作と検証項目の詳細は`e2e/02-reviews.spec.ts`を参照する。
