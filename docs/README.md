# Farmille ドキュメント

## リポジトリ内ドキュメント

| ドキュメント | 内容 |
|---|---|
| [architecture.md](./architecture.md) | システムアーキテクチャ・認証フロー・権限設計 |
| [database.md](./database.md) | DB設計の思想・エンティティ一覧・RLSポリシー |
| [design-tokens.md](./design-tokens.md) | UI デザイントークン (色・タイポ・スペーシング等) |
| [git-workflow.md](./git-workflow.md) | ブランチ戦略・コミット規約・PR運用・デプロイ連携 |
| [setup-log.md](./setup-log.md) | 初期環境構築の実施ログと指示書との差分記録 |
| [decisions/](./decisions/) | ADR（アーキテクチャ意思決定記録） |
| [specs/](./specs/) | 個別機能の実装仕様書（実装の唯一の正として扱う） |
| [discussions/](./discussions/) | 判断保留事項・他AIへの相談文書 |
| [reviews/](./reviews/) | Reviewer Claude への/からのハンドオフ文・指摘記録 |

## 外部ドキュメント（Google Docs）

| ドキュメント | リンク | 管理者 |
|---|---|---|
| PRD v2 | [Google Docs](https://docs.google.com/document/d/xxxxx) | 酒井・奥田・根本 |

## ドキュメント運用方針

- **コードと一緒に変更が必要なもの** → このリポジトリの `docs/` で管理
- **非エンジニアも編集するもの** → Google Docs で管理し、ここからリンク
- **技術的な意思決定** → `docs/decisions/` にADRとして記録
