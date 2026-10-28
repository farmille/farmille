# テストの削除・統合

2026-10-28の調査対象156ファイルについて、削除・統合・維持の判定を[適用一覧](test-consolidation-20261028.tsv)に記録する。削除・統合したテスト宣言名と、残す保証の所在を各行に示す。

調査基準は`b4b577ca5b392dd5fb40426f04e79f6fd82c9d77`、適用baseは`923e54073ef14b6a6c3c891f1dcb4d05196bf757`。両者で変わった感想口コミE2E、ReviewForm、公開レポート、Fieldの接続を現行ソースと照合している。

入力の上限・enum・未知値、フォームのアクセシビリティ、白背景への画像変換、reCAPTCHAのtoken・secret、乱数API、2500件の取得、本番release検査を維持する。プレビューと公開記事は独立して描画するため、プレビューの2件も維持する。

重い準備は既存の操作へ統合する。登録・メール確認・入力保持、レポートの品種と比較資材、閲覧記録、公開済み投稿の非公開化を既存E2Eのfixtureで検査する。検索条件と並び順はユニットへ、メーカーの新規作成・紐づけと匿名閲覧の保存はpgTAPでも検査する。Storage・メール・Route・middleware・新規メーカー選択の実接続は代表E2Eに残す。

Storybookは320・375・767・768・1023・1024・1440pxを検査する。任意幅でだけ起きる折り返しは、この7幅では検出できない。撮影専用テストは通常実行でskipし、次のコマンドで利用できる。

```sh
CAPTURE_STORYBOOK=1 pnpm test:storybook:responsive --grep スクリーンショット
CAPTURE_SCREEN_FLOW=1 pnpm test:e2e:local e2e/09-screen-inventory.spec.ts
CAPTURE_ACCOUNT_FLOW=1 pnpm test:e2e:local e2e/11-registration.spec.ts e2e/06-seller-approval.spec.ts
```

追加の検査は`SearchResults.test.tsx`、`RatingSummary.test.tsx`、受付確認の`route.test.ts`、`seller_approval.test.sql`に置く。製品コード・DB schema・依存関係の変更はない。
