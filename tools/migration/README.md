# 資材マスタ v2 変換パイプライン

旧スキーマの資材データを中間 JSON に正規化し、v2 の `materials`、`material_images`、`material_product_types`、`material_crops` などへ投入する SQL を生成する。変換は Node.js の標準機能だけで動作し、外部パッケージを使わない。

## 現在の開発シード

入力は [`legacy/migrations-v1/20260526000003_seed_products_from_ryosei_export.sql`](legacy/migrations-v1/20260526000003_seed_products_from_ryosei_export.sql) である。この SQL から資材15行、画像13件、施用レシピ98件を抽出する。画像13件のうち、取得不能を確認済みの外部URL3件は無効データとして除外し、10件を投入する。

資材15行のうち、`BIOZ Nephrite／ICL JAPAN` の2行は同じ旧 upsert キーを持つ。旧 SQL は後の行で前の行を更新し、v2 にも `name, manufacturer_name` の一意制約があるため、投入後は14資材になる。変換時に製品名やメーカー名を加工せず、中間 JSON に入力15行と重複情報を残す。

生成物は次の3ファイルである。

- `materials-v2-normalized.json`：入力値、変換値、画像、施用レシピ、正規化分類、重複情報を保持する中間データ
- `materials-v2-seed.sql`：v2 のローカル開発シード。再実行時は資材を upsert し、対象資材の画像と分類関連を入れ直す
- `materials-v2-report.json`：件数、旧→新カラム対応、分類対応の欠落、要確認フィールド、5件の突合結果

## 生成と静的検証

リポジトリのルートで実行する。

```bash
node tools/migration/convert-materials-v2.mjs
node tools/migration/convert-materials-v2.mjs --check
node --test tools/migration/convert-materials-v2.test.mjs
```

`--check` は生成物を書き換えず、入力から再生成した内容とコミット済みファイルを比較する。差分や抽出漏れがある場合は終了コード1で失敗する。

## ローカル Supabase への投入

ローカルスタックを軽量構成で起動し、v2 migration を適用してからシード SQL を実行する。

```bash
npx --yes supabase@2.120.0 start -x studio,edge-runtime,realtime,imgproxy,logflare,vector
npx --yes supabase@2.120.0 db reset
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -v ON_ERROR_STOP=1 \
  -f tools/migration/materials-v2-seed.sql
```

シード SQL の末尾は、入力行数、重複行数、一意資材の期待件数と実件数、画像の期待件数と実件数を返す。同じ SQL をもう一度実行し、件数が変わらずエラーも出ないことを確認する。

確認後はローカルスタックを停止し、DBデータを残さない。

```bash
npx supabase stop --no-backup
```

## 対応する入力形式

`--input` で入力を差し替えられる。

```bash
node tools/migration/convert-materials-v2.mjs --input <入力パス>
```

対応形式は次のとおりである。

- 旧 INSERT SQL：現行の旧 seed SQL と同じ `products`、`product_images`、`product_application_recipes`、作物・効果の関連 INSERT
- JSON：旧テーブル名をキー、各テーブルの行配列を値にしたオブジェクト
- CSV：`products.csv` だけの単一ファイル、または旧テーブル名の CSV を置いたディレクトリ

CSV ディレクトリでは、`products.csv` を必須とする。関連データを移す場合は、`maker_profiles.csv`、`product_types.csv`、`product_images.csv`、`product_application_recipes.csv`、`product_crops.csv`、`crops.csv`、`product_benefit_relations.csv`、`product_benefits.csv` を同じディレクトリに置く。

JSON／CSV で `products.manufacturer_name` がない場合は、`products.maker_id` と `maker_profiles.user_id` から `company_name` を解決する。`products.product_type` がない場合は、`product_type_id` と `product_types.id` から分類名を解決する。必須の参照先が欠けている場合は、代替値を入れずに変換を失敗させる。

出力先を変える場合は、次のオプションを使う。

```bash
node tools/migration/convert-materials-v2.mjs \
  --input <入力パス> \
  --json-output <中間JSON> \
  --sql-output <投入SQL> \
  --report-output <照合レポート>
```

## 旧→新カラム対応

| v2 | 旧データ | 変換 |
|---|---|---|
| `materials.name` | `products.name` | そのまま |
| `materials.manufacturer_name` | `maker_profiles.company_name` | そのまま |
| `material_product_types.product_type_id` | `product_types.name` | 元の名称を `product_types` へ登録し、資材との関連を作成 |
| `material_crops.crop_id` | `product_crops`、`crops.name` | 作物名が `crops.name` と完全一致する場合だけ関連を作成 |
| `materials.sales_status` | `products.commercial_status` | そのまま |
| `materials.description` | `products.expected_effects_official` | そのまま |
| `materials.general_use` | `products.general_purpose` | そのまま |
| `materials.main_components` | `products.primary_compound` | メーカー資料の原文をそのまま保持 |
| `materials.mechanism` | `products.mode_of_action` | そのまま |
| `materials.usage_text` | `products.usage_summary`、`product_application_recipes` | 概要と「作物／目的／使い方」の箇条書きに集約 |
| `materials.price_range` | 対応値なし | `NULL` |
| `materials.official_url` | 対応値なし | `NULL` |
| `materials.catalog_url` | 対応値なし | `NULL` |
| `materials.seller_id` | 対応値なし | 全件 `NULL` |
| `material_images.url` | `product_images.url` | 取得不能を確認済みの外部URL3件を除外し、それ以外はそのまま |
| `material_images.image_type` | `product_images.image_type` | `product_packaging` → `package`、`product_logo` → `logo`、`application_scene` → `usage_scene`、`other` → `other` |
| `material_images.sort_order` | `product_images.order` | そのまま |

旧 `product_type` は名称を保ったまま `product_types` へ登録し、`material_product_types` に関連を作る。旧作物は `crops.name` と完全一致する場合だけ `material_crops` に紐づけ、メーカー記載名を `source_name` に残す。旧効果と検索補助タグも完全一致だけを採用し、表記ゆれや類義語を推測しない。対応しない値は `materials-v2-report.json` の `missing_classification_mappings` に列挙する。

## 要確認フィールド

次の値は対応先が一意に決まらないため、推測して投入しない。

- `products.label_url`：`materials.catalog_url` を指すとは限らないため `NULL`
- `products.sds_url`：`material_evidences` と `material_sources` のどちらに入れるか未確定のため未投入
- `products.technology_action`、`disease_pest_info`、`expected_effects_farmille`、`precautions`、`storage_shelf_life`、`notes`：v2 に一意な対応先がないため未投入
- `product_images.source_page_url`：資材の公式ページとは限らないため `materials.official_url` へ流用しない

`materials-v2-seed.sql` はローカル開発用であり、リモート DB には接続しない。本番の資材マスタは 2026-09-08 の切替で移行済みで、以後の取り込みは `tools/catalog/` を使う。
