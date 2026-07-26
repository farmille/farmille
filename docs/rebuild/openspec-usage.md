# OpenSpec 運用メモ

前提：[03-architecture.md](03-architecture.md) §5（決定の要約）。

## 位置づけ

設計の正は docs/rebuild/ のまま変わらない。OpenSpec は**実装タスク（docs/rebuild/tasks/T-xx）の受け渡しフォーマット**としてだけ使う試験運用であり、`openspec/specs/` を真実のソースにする全面採用ではない。全面採用は v1 リリース後に改めて判断する。

## 使い方

1. docs/rebuild/tasks/T-xx.md の内容をもとに `/opsx:propose` で change を作成する（proposal・design・tasks の3アーティファクトを生成）
2. `/opsx:apply` でタスクを実装する（tasks.md のチェックボックスを進めながら実装）
3. 検証は既存の品質ゲートをそのまま使う。専用の verify コマンドは無い
   - 04 §4（`pnpm lint` / `format:check` / `tsc --noEmit` / `vitest run` / `pnpm build`）
   - UI を含むタスクは 03 §8 の完了定義（375px の実画面で操作・スクリーンショット添付）まで通す
4. 検証を通したら `/opsx:archive` で change をアーカイブする

実体は `/opsx:propose → apply → archive` の3コマンド。verify は既存の検証ゲートに委ね、OpenSpec 側の工程として独立させない。

## 試験運用の範囲

M2 の最初の委譲タスク1件でこの流れを試す。導入は非破壊（`openspec/` ディレクトリの追加のみで既存のタスク指示書は変えない）なので、効果が薄ければ docs/rebuild/tasks/ のタスク指示書（Markdown）方式に一本化して撤去する。

## 生成物

`openspec init --tools claude,cursor,codex` で以下が生成される。

- `openspec/config.yaml` … コミット対象
- `.claude/` `.cursor/` `.codex/` 配下のスキル・コマンド一式 … 既存の `.gitignore`（ローカルのエージェントツール状態）に従いローカルのみ。コミットしない
