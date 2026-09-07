# 05 リポジトリ掃除 — 削除・移設・残存リスト

方針（D11）：後方互換は持たない。旧仕様のドキュメント・コードは削除する。ただし**運用上の記録**（secret 事故と未実施のローテーション・アクセス棚卸し）と**移行の材料**だけは残す。実行は M0 の T-01（削除・移設）と、資材移行完了後の T-53（旧 migration・旧テーブル・GCP 資産の最終削除）の2段階。バックエンドは Next.js 集約が確定済み（D2）なので、backend/ の削除に条件は付かない。

## 1. 移設（削除より先に実施）

| 現在地 | 移設先 | 理由 |
|---|---|---|
| docs/handoff/onboarding.md の §9（既知の地雷・secret 事故記録・ローテーション未実施） | docs/ops/security-notes.md（要点を抽出して新規作成） | ローテーションは未実施のまま。刷新と無関係に有効な運用記録 |
| docs/handoff/access-checklist.md | docs/ops/access-checklist.md | 権限棚卸しは継続利用 |
| docs/email-templates/ | 残置（docs/email-templates/ のまま） | Supabase Auth のメールテンプレートはスキーマ非依存で v2 でも使う |
| backend/scripts/excel_to_seed_sql.py・excel_to_sources_sql.py・validate_excel_for_prod.py・rehost_product_images.py・fetch_og_images.py・run_sql_via_mgmt_api.py・configure_supabase_smtp.py・create_farmille_maker.py・gen_maker_setup.py・prod_import_2026_06_09.py・prod_import_sources_2026-06-09.py | tools/migration/legacy/ | 資材マスタ移行（T-12）の参照実装・メーカー名正規化ロジックの正。移行完了後に tools/migration/legacy/ ごと削除してよい |

## 2. 第1弾削除（M0・T-01。移設完了後）

**docs 配下**
- docs/specs/ 全24ファイル（旧 UI の実装契約。全面刷新で無効）
- docs/requirements/ 全10ファイル（新要件 reference/requirements-v1-2026-07-06.txt に置換済み）
- docs/drafts/ 全7ファイル（日付付き一次資料）
- docs/decisions/ 全15ファイル＋README（D11：ADR 体系は docs/rebuild/ に置換。技術的に生き残る内容は本設計に転記済み——JWT 検証方式は 01 §4、admin AAL2 は 01 §4・02、proxy.ts 規約は Next 16 の框架規約として自明）
- docs/qa/・docs/reviews/・docs/discussions/・docs/migrations-draft/（旧実装のテスト記録・凍結レビュー・未適用ドラフト）
- docs/setup-log.md・setup-log-admin-aglist-v2.md・setup-log-skip.md
- docs/architecture.md・docs/database.md・docs/design-tokens.md・docs/farmille-system-overview-ja.md・docs/git-workflow.md・docs/manual-test-review-moderation-2026-06-15.md（旧構成前提。必要な内容は 03 に再定義済み）
- docs/handoff/（§1 の移設後に残りを削除）
- docs/refactor-brief-2026-07-12.md（旧リファクタ計画。刷新決定で失効。未完の引き継ぎ事項＝secret ローテーションは docs/ops/security-notes.md と T-06 に転記済み）

**ルート**
- init.sql・rls.sql・seed.sql・seedgenre.spl（migrations に同内容あり・削除承認済み）
- farmille_setup_instructions.md（初期構築の歴史文書）
- Makefile（新 pnpm スクリプト体系に置換。必要なら M0 で新規作成）

**アプリ本体（現在はリポジトリ直下。T-02 の再初期化で一掃）**
- src/ 配下の旧実装全部・public/ の create-next-app 残骸 svg・Tailwind 関連設定
- 依存整理：tailwindcss・@tailwindcss/postcss・tailwind-merge・clsx・@radix-ui/react-dialog を削除。@dnd-kit・cmdk・class-variance-authority・@radix-ui/* は新 UI で使うものだけ残す（既定は削除、必要になった時点で再追加）
- 残す依存：next・react・@supabase/ssr・@supabase/supabase-js・@sentry/nextjs・@next/third-parties・lucide-react・remark/rehype 系（記事の Markdown 描画）
- 残すコード（新 src/ へ移植）：lib/auth/safe-next.ts＋テスト（open-redirect 対策）・lib/supabase/paths.ts（Storage パス検証の考え方）・lib/markdown/render.ts
- vercel.json の cron 定義（keep-alive）を削除（Cloud Run のコールドスタート対策だったため不要になる）

**backend（§1 のスクリプト移設が済み次第、ディレクトリごと削除）**
- backend/ 全体：`backend/app/`（FastAPI ルーター22本）・tests/・Dockerfile・railway.toml・deploy-prod.sh・create-prod-users.sh・pyproject.toml・uv.lock・.gcloudignore。Next.js 集約が確定しているため（D2）、残す理由がない
- 削除前の確認：資材マスタ移行（T-12）に必要なスクリプトが tools/migration/legacy/ へ移設済みであること

## 3. 第2弾削除（T-53。資材マスタ移行の検証完了後）

- tools/migration/legacy/migrations-v1/ の旧 migration 27ファイル（T-01 で supabase/migrations/ から退避済み。v2 migration との同居を避けるため第1弾に前倒しした。v2 系 migration 適用と旧テーブル DROP の完了後に削除）
- tools/migration/legacy/（旧 migration と資材移行スクリプト一式をまとめて削除）
- リポジトリ外（T-53 runbook に含める）：Cloud Run サービス `farmille-api`・Secret Manager の supabase-service-role-key／supabase-jwt-secret・GCP プロジェクトの課金停止・Vercel の cron 設定

## 4. 完了条件

- 第1弾後：`git grep -l "Railway\|FastAPI\|farmer\|ja_staff\|4ロール"` が docs/rebuild/reference/ と docs/ops/ 以外でゼロ（歴史記録は reference と ops にのみ残る）
- 第2弾後：リポジトリ構成が 03 §7 の目標形と一致。`supabase db diff --linked` 無差分
- 削除は必ず PR で行い、差分一覧を人間が確認してからマージする
