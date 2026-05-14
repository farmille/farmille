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
- [ADR-0001: バックエンドホスティングにRailwayを採用する](./0001-railway-adoption.md)
- [ADR-0002: レビュー投稿可能ロール統一](./0002-reviews-insert-role-scope.md)
- [ADR-0003: Storage RLS パス強制](./0003-storage-rls-path-enforcement.md)
- [ADR-0004: Next.js 16 proxy 規約](./0004-nextjs16-proxy-file-convention.md)
- [ADR-0005: JWT 検証戦略](./0005-jwt-verification-strategy.md)
- [ADR-0006: URL 名前空間 3 層分類](./0006-url-namespace-policy.md)
- [ADR-0007: Storage RLS 監査](./0007-storage-rls-audit.md)
- [ADR-0008: `/home` をコンテンツ閲覧入口として再定義](./0008-home-content-entry-revival.md)
- [ADR-0009: メーカー承認フロー + アドミン画面導入](./0009-maker-approval-flow-and-admin-panel.md) — Draft
- [ADR-0010: 講演会機能の v1 完版採用](./0010-events-feature-v1-inclusion.md) — Draft
- [ADR-0011: 「使用版」CTA 撤回 + マネタイズ方針ピボット](./0011-sample-version-cta-withdrawal-and-monetization-pivot.md) — Draft
