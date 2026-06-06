# ADR-0015: product_sources テーブル（出典リンクの正規化保持）

Date: 2026-06-06
Status: Accepted

## Context

- 商品詳細ページはメーカー公式サイトの商品画像をホットリンク表示しており、
  出典を明示しないと著作権上の懸念が残る（xlsx `product_images.rights_note`
  にも「利用時は権利確認が必要」と明記されている）。
- 「該当 BS 資材かの最終確認」をユーザーが公式ページへ飛んで行える導線が必要
  （Ryoga 確定 2026-06-06）。
- データ源の `Farmille_BS_materials_DB_template_detailed_prompt.xlsx` には
  `sources` シート（605 行 / 253 製品、source_rank S:531 A:30 B:39 C:5、
  1 製品最大 6 ソース）が存在するが、248 製品投入時（2026-06-04）は
  「リサーチ資料として保持のみ」で DB 化されていなかった。

## Decision

1 製品 : N ソースをそのまま表現する **`product_sources` テーブルを新設**し、
xlsx `sources` シートを全行投入する（migration `20260606000000_product_sources.sql`）。

```
product_sources (id, product_id FK CASCADE, source_type, title, url,
                 rank CHECK (S/A/B/C), extracted_date, notes, created_at)
```

- RLS は `product_images` と同じ select_all（anon/authenticated 読み取り可）。
  書き込み policy は置かず、v1 は seed / service_role 経由のみ。
- `GET /v1/products/{id}` が `sources`（rank S>A>B>C、同 rank 内は
  公式製品ページ優先でソート済み）と `images[].source_page_url` を返す。
- フロントは商品画像直下にキャプションを表示:
  - 画像あり →「画像出典: メーカー公式サイトで確認」
    （リンク先は画像自身の `source_page_url`、無ければ代表ソース）
  - 画像なし →「メーカー公式サイトで製品を確認」（代表ソース）

### 検討した代替案

- **`products.official_url` 1 列**: 最速だが 1:N 情報（公式PDF/SDS 等 604 行分）を
  捨てる。DOA 方針（正規化・技術負債ゼロ）に反するため却下。
- **`product_images.source_page_url` 流用のみ**: 画像が無い製品
  （prod の過半）にリンクを出せず、意味的にも「画像の出典」であって
  「製品の公式ページ」ではないため単独では不採用（fallback としては利用）。

## Consequences

- seed 生成は `backend/scripts/excel_to_sources_sql.py`（既存
  `excel_to_seed_sql.py` の正規化・product 解決ロジックを再利用、冪等
  DELETE→INSERT）。出力: `docs/drafts/seed_product_sources_from_xlsx.sql`。
- 出典一覧 UI（全ソース表示）や maker 自身による編集は v1.5+ で検討可能
  （テーブルは既に対応済み）。
- 画像のホットリンク表示自体は継続（Ryoga 確定）。リスク低減は出典明示まで。
