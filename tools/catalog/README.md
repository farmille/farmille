# 資材カタログの取り込み

Excelから製品名・正式名称・読み・別名・容器分類・分類タグ・資料リンクを取り込む。メーカーの製品説明と原稿履歴、既存UUID、投稿、保存、編集権を保持する。公開する資料は現在の公開版に保存し、メーカーが通常の原稿編集で変更・削除できる。

必要なスキーマは `20261010120000_catalog_import.sql`。Node.js 22.18以上、Python 3、psqlを使用する。Excelの抽出に追加のPythonパッケージは不要。

## 計画を作る

承認された環境のDB接続URLを `CATALOG_DATABASE_URL` に設定する。共有DBへの適用は、対象環境と差分について承認を得てから行う。資料・スナップショット・計画には公開前の情報が含まれるため、Gitに追加しない。

```sh
python3 tools/catalog/extract.py /path/to/catalog.xlsx /tmp/catalog-source.json
node tools/catalog/cli.ts snapshot > /tmp/catalog-snapshot.sql
psql "$CATALOG_DATABASE_URL" -XAt -v ON_ERROR_STOP=1 \
  -f /tmp/catalog-snapshot.sql > /tmp/catalog-snapshot.json
node tools/catalog/cli.ts plan \
  --source /tmp/catalog-source.json \
  --snapshot /tmp/catalog-snapshot.json \
  --out /tmp/catalog-plan
```

`report.json` に公開件数、項目別の変更、画像資料の除外件数、分類マスタの変更、未解決の差分が出る。未解決があれば終了コード2で終了し、`apply.sql` は生成しない。同じ出力先に残った古いSQLも削除する。

## 差分を解決する

初回は現在値と取り込み値が異なる項目を確認する。再取り込みでは、前回の取り込み値と現在値と今回値を比較する。

| 現在値         | 今回値     | 処理                 |
| -------------- | ---------- | -------------------- |
| 前回と同じ     | 変更あり   | 今回値を反映する     |
| 編集・削除済み | 前回と同じ | 現在値を保持する     |
| 編集・削除済み | 変更あり   | 明示的な判断を求める |
| 今回値と同じ   | 任意       | 変更しない           |

`report.json` の各差分の `key`、`currentHash`、`sourceHash` をそのまま使い、判断をJSON配列に記録する。`take_source` は今回値を反映し、`keep_current` は現在値を保持する。ハッシュが変わった解決指定や、該当する差分のない指定は受け付けない。

```json
[
  {
    "key": "report.json にある key",
    "currentHash": "report.json にある currentHash",
    "sourceHash": "report.json にある sourceHash",
    "action": "keep_current"
  }
]
```

```sh
node tools/catalog/cli.ts plan \
  --source /tmp/catalog-source.json \
  --snapshot /tmp/catalog-snapshot.json \
  --resolutions /tmp/catalog-resolutions.json \
  --out /tmp/catalog-plan
```

メーカーの下書き・表現確認中・修正待ちの原稿がある資材は、公開版を変更しない。原稿を処理してから再計画するか、現在値を保持する。分類マスタの既存行を変える場合も個別の判断を求める。編集権やメーカー確認記録がある場合、メーカー名の変更は運営の変更手続きで行う。

`product-map.json` は資材UUIDとの対応表。PRD-000092からPRD-000031への統合は、既存の対応と異なる場合に差分として出る。旧UUIDに投稿・編集権・原稿などがあれば対応先の変更を拒否する。`keep_current` で旧UUIDを維持できる。参照のない旧資材を統合した場合も行は削除せず、非公開にする。対応表の変更は `--map` で指定する。

## 適用と確認

```sh
psql "$CATALOG_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f /tmp/catalog-plan/apply.sql
```

適用は1トランザクションで行う。関連テーブルをロックし、計画後の更新を検出したら全体を中止する。関係する投稿や原稿の子項目の変更も検出対象になるため、適用直前に計画を作る。同じ適用SQLの再実行は何もしない。新しいスナップショットから同じ資料を再計画したときは、変更が0件になることを確認する。

資料を改訂する場合は、新しい公開版に既存の製品説明・施用方法・登録情報・関係会社を引き継ぐ。メーカーが削除した資料は、取り込み元が変わらない限り復活しない。取り込んだ資料の公開版は、メーカー確認済みとして表示しない。

製品画像は `public/images/container-shapes/1.png`〜`10.png` を使う。分類0と未分類は共通のプレースホルダーを表示する。画像資料と画像ファイルへの直接リンクは取り込み対象から除く。試験資料は題名とURLだけで公開できる。

2026-10-09版の検証値は383製品、公開資材235件、画像資料533件除外、URL正規化後1200リンク。既存UUIDの対応を保持する判断やメーカー編集により、DB上の資材数・リンク数は変わり得る。
