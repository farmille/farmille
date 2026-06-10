# Architecture Decision Records (ADR)

プロジェクトの重要な技術的意思決定の記録。

## 命名規則
`NNNN-short-title.md` 形式。連番は4桁。

## テンプレート

```
# ADR-NNNN: タイトル

**ステータス**: Proposed | Accepted | Deprecated | Superseded
**決定日**: YYYY-MM-DD
**決定者**: 氏名

## コンテキスト
## 決定
## 理由
## 既知のリスクと対策
## 次回見直しタイミング
```

## 一覧
> この索引は非網羅。全 ADR は本ディレクトリの `NNNN-*.md` を直接参照のこと。
- [ADR-0001: バックエンドホスティングにRailwayを採用する](./0001-railway-adoption.md)
- [ADR-0013: バックエンドを Railway から GCP Cloud Run へ移行する](./0013-gcp-cloud-run-migration.md)
- [ADR-0015: product_sources テーブル（出典リンクの正規化保持）](./0015-product-sources-table.md)
- [ADR-0016: 開発引き継ぎ運用モデル（最小権限 dev / 本番フリーズ / CI 導入）](./0016-dev-handoff-operating-model.md)
