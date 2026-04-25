# ADR-0002: レビュー投稿可能ロールを「reviewer」論理名で3ロールに統一する

**ステータス**: Accepted
**決定日**: 2026-04-20
**決定者**: 酒井涼雅（CTO）

## コンテキスト
初期マイグレーション `20260415000003_farmille_rls.sql:398-403` の `reviews_insert_farmer` ポリシーが `farmer` 単独ロールのみ許可していた。一方、`docs/architecture.md:101-103, 151` および `CLAUDE.md` の 4ロール権限体系では、レビュー投稿は `farmer` / `ja_staff` / `researcher` の3ロール全てに許可される設計。

Supabase Storage バケット `review-images` の RLS ポリシー策定時にこの不整合が発覚。Storage 側を設計通り3ロール許可で実装すると、画像はアップロードできるが `reviews` 行の INSERT で RLS に弾かれ、`ja_staff` / `researcher` の投稿フローが半壊する状態だった。

## 決定
1. `reviews_insert_farmer` を DROP し、`reviews_insert_reviewer` に置き換える（migration `20260420000000_fix_reviews_insert_reviewer.sql`）。
2. WITH CHECK 条件を `(auth.jwt() -> 'app_metadata' ->> 'role') IN ('farmer', 'ja_staff', 'researcher')` に修正。
3. Storage RLS・DB RLS 双方で「レビュー投稿可能ロールの集合」を指す論理名として **`reviewer`** をポリシー命名に使用する。今後「レビュー投稿可否」を表現する全ポリシーは `<table>_<op>_reviewer` 形式で統一する。

## 理由
1. **Single Source of Truth は `architecture.md`**: 設計ドキュメントが3ロール許可と明記しており、コードがそれに追従すべき。
2. **ロール集合に論理名を与える**: 既存命名 (`_farmer`, `_maker`) はロール=1対1だったが、レビュー関連は3ロール集合。`_farmer_ja_researcher` のような列挙は可読性が低く、将来4番目のロールが追加された際に命名変更コストが発生する。`reviewer` という論理ロール名で抽象化することで、ロール集合の変更を命名に波及させない。
3. **Storage RLS との命名一貫性**: 同じ PR で追加する `review_images_insert_reviewer` と命名規則を揃え、DB/Storage 横断で「レビュー投稿可ユーザー」が `reviewer` であることを明示する。
4. **単一 migration で閉じる修正**: `farmer` → `reviewer` はポリシー差し替えのみで、既存データ・FK・アプリコードへの影響なし。ロールバック容易。

## 既知のリスクと対策
| リスク | 対策 |
|---|---|
| 本番DBに `reviews_insert_farmer` が既に存在する場合 | `DROP POLICY IF EXISTS` で冪等に置換。Supabase Studio で適用後に `pg_policies` を目視確認 |
| BFF 側で `role == 'farmer'` をハードコードしている箇所がある | `backend/app/` 配下を grep し、レビュー投稿エンドポイントのロール判定も3ロール対応済みか確認（第一防御の整合） |
| 将来「レビュー投稿可能ロール」が変更される | `reviewer` 論理名は保ちつつ `IN (...)` のリストのみを更新。ADRを Superseded にせず追記で対応 |
| 他の `_farmer` 固定ポリシーにも同様の食い違いがある可能性 | `crops_insert_farmer` は「作目申請=農家のみ」で設計通り。他は該当なし（2026-04-20時点の grep で確認） |

## 次回見直しタイミング
- 5番目のロールを追加する時（現状4ロール設計）
- JAダッシュボード等でロール別の投稿権限差（例: ja_staff は下書きのみ）を導入する時
- v1 ローンチ後の初回レトロ（2026年8〜9月想定）で他 `_farmer` / `_maker` 命名も `reviewer` 同様の論理名に統一すべきか再評価
