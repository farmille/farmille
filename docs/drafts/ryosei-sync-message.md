# draft: Ryosei さん向け sync メッセージ

調整ポイントは 2 点。Slack 等にコピペできるように 1 メッセージ目 / 2 メッセージ目分けて書いてあります。
内容調整したら送ってください。

---

## 1 メッセージ目 (Excel 進捗確認)

> @Ryosei
>
> BS資材マスタの Excel 取り込みについて、dev に schema migration を適用したところで進捗確認させてください 🙏
>
> 現状の `Farmille_BS_materials_DB_template_detailed_prompt.xlsm` から populated されている行を helper で抽出した結果:
>
> | sheet | populated 行数 |
> |---|---|
> | products | 15 |
> | application_recipes | 98 |
> | product_images | 41 (うち 28 行は image_url 不明で skip 予定) |
>
> spec では 181 件想定で書いていたので、ローンチ DoD (2026-05-27) までに目指す populated 件数感を擦り合わせたいです:
>
> 1. v1 ローンチには **現状の 15 件で十分** か、それとも追加で **N 件は揃える** か
> 2. 残りの product 行 (約 160 行) は v1.5+ で順次追加で OK か
> 3. 画像 URL 不明 28 行の扱い: skip + あとで TODO リスト化、で問題ないか
>
> 完成版の populated 件数が見えれば prod 適用のタイミングも決められます 🙌

---

## 2 メッセージ目 (メーカー登録依頼)

> 関連で、Excel 取り込み対象のメーカーが今 dev に未登録なので登録のお願いです。
>
> 取り込み対象 (確認できた範囲):
> - ICL JAPAN
> - アグロ カネショウ
> - 愛知製鋼
>
> 取り込みの仕様上、メーカーが `users.role='maker' AND users.status='active'` で登録されている前提で seed migration が動きます (未登録だと該当 product が silent skip)。
>
> 通常の `/signup` → メール確認 → admin 承認 (`/admin/makers`) の流れで進めたいので、各社の窓口アカウント分を後日いっしょに作りましょう 💪
>
> (dev だけは私が SQL で synthetic データを作っても良いが、prod とフローを合わせたいので signup 経由推奨)

---

## Q&A の context メモ (Ryosei に送らない部分)

- Excel の populated 状況は `docs/setup-log-skip.md` と一緒に投入時点のスナップショット
- spec §0.1 / §5 / §6 R6 / §10.2 に "Ryosei さん回答待ち" タグで残置中
- 完成版が 181 件に近づく場合は helper を再実行 → 新しい seed migration ファイルを生成 (`20260527xxxxxx_seed_products_from_ryosei_export_v2.sql` のように bump) → push
- 既存の `20260526000003_seed_products_from_ryosei_export.sql` は archive 候補(ON CONFLICT で冪等なのでそのまま再 push でも可だが、履歴的に分離した方が読みやすい)
