# Farmille プロジェクト全体監査報告書 兼 リファクタリング実装指示書

作成日：2026-07-12
対象コミット：`c8241ba`（main）

あなたは経験豊富なフルスタックエンジニア（FastAPI／Next.js／Supabase）です。この文書だけを読んで、以下のリファクタリングを完遂してください。この文書は監査報告（現状の事実）と実装指示（何をどうするか）の両方を含みます。

---

## 0. 制約（最初に読むこと）

- **公開 URL・API パスを変えない。** `/v1/*` のエンドポイントパス、frontend のルーティング URL は既存のまま維持する。モジュール整理はファイル移動・統合までで、URL には触れない。
- **適用済み migration ファイル（`supabase/migrations/` 配下の既存28ファイル）を編集しない。** 変更は必ず新規 migration ファイルで行う。過去にこの規律を破ったことが今回の RLS 乖離事故（§2-1）の根本原因。
- **後方互換レイヤ・エイリアス・silent fallback を作らない。** 設定値が無い場合は起動時または呼び出し時に明示的に失敗させる。
- **`.env`・`.env.local`・secrets には触れない。** 環境変数の追加が必要な場合は `.env.example` の更新と手順書化まで（実際の値設定は人間が行う）。
- タスクは §4 の番号順を推奨するが、同一ファイルを触らないタスク同士は並行してよい。各タスク末尾の「検証」を通してから次に進む。
- 一括置換・一括削除の完了報告は、旧パターンの残存ゼロを grep で確認してから行う。
- **§6「質問すべき条件」に該当したら、進めずに質問する。**

## 1. プロジェクト概要（受け手向けの背景）

BS 資材（生物・微生物農業資材）の農家レビュープラットフォーム。

- `frontend/`：Next.js 16.2.6（docs には 15 と書かれているが実体は 16）／TypeScript／Tailwind CSS 4／Vercel
- `backend/`：FastAPI／Python 3.12／uv。**デプロイ先は GCP Cloud Run**（ADR-0013。README 等の「Railway」記述は stale。デプロイは `backend/deploy-prod.sh` の手動実行で、自動デプロイは無い）
- DB／Auth／Storage：Supabase。`supabase/migrations/` が唯一の正
- 認証の設計：**BFF（FastAPI）が第一防御、RLS が第二防御**（ADR-0002／0003／0009／0012）。backend は service_role キーで PostgREST を叩くため RLS をバイパスする。つまり RLS は「frontend が直接 Supabase を叩いた場合」と「BFF の防御漏れ」への保険
- frontend は `supabase.from()/rpc()` を直接呼ばない（BFF 原則）。`auth.*`／`storage.*` のみ許可
- 意思決定は `docs/decisions/`（ADR 0001〜0015。0010 と 0016 は未マージ PR にのみ存在）
- CI は main に存在しない（CLAUDE.md の方針で v1.5+ 送り。既製の ci.yml / ci-backend.yml が PR #38 のブランチに存在する）

## 2. 確定済みの決定事項（2026-07-12 承認済み・変更不可）

以下はオーナーの承認済み。この文書の指示はこれらを前提とする。

1. **DB スキーマ管理**：当面 SQL migration（Supabase CLI）を維持し、運用ガードレールを強化する。あわせて **ORM（SQLAlchemy 等）導入の検討**を調査タスクとして実施する（§4 T17。即時移行ではない。RLS・Storage ポリシーは SQL でしか書けないため、ORM は migration の代替にならない）。
2. **reviews の INSERT ポリシー**：ADR-0002 どおり `reviews_insert_reviewer`（farmer／ja_staff／researcher の3ロール）へ**新規 migration で修正**する。
3. **admin の Storage 書き込みポリシー**：product-images／review-images の admin INSERT に **AAL2 条件を追加**する（ADR-0012／0014 に整合）。
4. **エラーレスポンス**：backend 全体を **`{ok: false, error: "<code>"}`** 形式に統一する。frontend の参照箇所も同一 PR で更新する。
5. **`/api/cron/keep-alive`**：CRON_SECRET による呼び出し元検証を追加する。
6. **削除の承認**：以下4グループの削除・整理を実施してよい。
   - ルートの `init.sql`・`rls.sql`・`seed.sql`・`seedgenre.spl`、および `backend/railway.toml`
   - frontend/public の未参照 svg 5点（file.svg・globe.svg・next.svg・vercel.svg・window.svg）の削除と、雛形のままの `frontend/README.md` の実内容への書き換え
   - 未使用依存：`@radix-ui/react-dialog`（frontend）・`pyotp`（backend dev）を削除、`openpyxl` を main 依存から dev グループへ移動
   - `farmille_setup_instructions.md` を `docs/` 配下へ移動（アーカイブ）

## 3. 現状の実測値（この文書作成時点）

| 項目 | 結果 |
|---|---|
| frontend `tsc --noEmit` | エラー 0 |
| frontend `pnpm lint` | エラー 0 |
| frontend `vitest run` | 8ファイル33件 全パス（node_modules 再インストール後） |
| backend `pytest` | **6 failed／20 errors／199 passed**（§4 T2 参照） |
| backend `ruff check` | 32 errors（全て `scripts/` 配下。`app/` は 0） |
| backend `mypy app` | 1246 errors（設定なし・ゲートとして機能していない） |
| `pnpm audit` | **critical 2・high 4**（§4 T1 参照）。backend の pip-audit は 0 件 |
| 機密 grep 監査（CLAUDE.md 定義の3種） | 全てクリーン（BFF 違反 0、フロントへの secret 漏れ 0、RAILWAY_ 参照 0） |

**健全な領域（変更不要）**：BFF 原則違反ゼロ。backend の全書き込みエンドポイントに認証依存あり。admin ゲート（`require_role("admin")`＋AAL2）は全 `/v1/admin/*` で一貫。DB の全テーブルに RLS 有効。anon 書き込みポリシーなし。`database.types.ts` は最新 migration と同期済み。frontend に `any` 使用ゼロ。frontend の `.env.example` は実使用と完全一致。

---

## 4. 実装タスク

### P0：セキュリティ・整合性（最優先。それぞれ独立 PR 可）

#### T1. 依存脆弱性の hotfix（frontend）

CLAUDE.md の判定基準では critical／high は PR ブロック相当。現状：

- `happy-dom` <20.0.0 → **critical**（VM escape → RCE）。`>=20.8.9` へ（現在 ^16.5.3。dev 依存）
- `vitest` <3.2.6 → **critical**（UI server の任意ファイル読み取り）。`>=3.2.6` へ（現在 ^2.1.9。dev 依存）
- `vite` <=6.4.2 → high。`@vitejs/plugin-react` の更新か pnpm overrides で `vite >=6.4.3`
- `ws` <8.21.0 → high（**本番依存経路**：`@supabase/supabase-js > realtime-js > ws`）。`@supabase/supabase-js` の更新で解消するか確認し、しない場合は `package.json` の `pnpm.overrides` に `"ws": ">=8.21.0"` を追加（`fast-uri` の override が既にあるので並べる）

対象：`frontend/package.json`、`frontend/pnpm-lock.yaml`
検証：`pnpm audit --audit-level=high` で critical／high 0 件、`pnpm exec vitest run` 全パス、`pnpm exec tsc --noEmit`、`pnpm build` 成功。vitest 2→3 と happy-dom 16→20 は major 更新のため、テスト8ファイルの挙動確認を必ず行う。

#### T2. backend pytest の修復（main が赤い）

- `backend/tests/test_me_favorites.py`：存在しない fixture `fake_supabase` を参照して 20 errors。`conftest.py` の現行 fixture は `fake_admin`（`FakeSupabaseAdmin`）。テスト側を conftest の現行 API に合わせて書き直す
- `backend/tests/test_me_profile.py`：6 failed。テスト内ローカル定数 `FARMER_ID`（1111…）と conftest の `farmer_user` fixture の `sub`（2222…）が乖離。また同ファイルはローカルに `FakeAdmin` クラスを再定義しており conftest の `FakeSupabaseAdmin` と二重。conftest 側を正としてテストを修正する
- `docs/handoff/onboarding.md` §9-12 に「pytest fixture drift 26 件」として既知債務の記録あり。修正後にこの記述も更新する

対象：`backend/tests/test_me_favorites.py`、`backend/tests/test_me_profile.py`（必要なら `conftest.py` の fixture 拡張。既存 fixture のシグネチャ変更は他テストに波及するため不可）
検証：`uv run pytest` で failed／errors 0。

#### T3. RLS 修正 migration ×2（DB schema 変更・承認済み）

**着手前に必ず実 DB の適用済みポリシーを確認する**（ファイルと DB が乖離している疑いがあるため）。確認 SQL：

```sql
select polname, pg_get_expr(polqual, polrelid), pg_get_expr(polwithcheck, polrelid)
from pg_policy where polrelid = 'reviews'::regclass;
select policyname, with_check from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like '%admin%';
```

実行手段は Supabase dashboard の SQL Editor か `backend/scripts/run_sql_via_mgmt_api.py`。dev と prod 両方で確認し、結果を PR 説明に記録する。

1. **reviews ポリシー**（新規 migration。例：`20260712000000_reviews_insert_reviewer.sql`）：`reviews_insert_farmer` を DROP し、ADR-0002 の決定どおり `reviews_insert_reviewer` を CREATE。`WITH CHECK` は `(auth.jwt() -> 'app_metadata' ->> 'role') IN ('farmer','ja_staff','researcher') AND user_id = auth.uid()`。
2. **admin Storage AAL2**（新規 migration。例：`20260712000001_admin_storage_write_aal2.sql`）：`20260607000000_admin_storage_write_policies.sql` が作った `product_images_insert_admin`・`review_images_insert_admin` を DROP→再 CREATE し、`articles-hero`（`20260602000000_articles_hero_storage.sql:41-47`）と同じ `(auth.jwt() ->> 'aal') = 'aal2'` 条件を追加。同 migration が UPDATE／DELETE ポリシーも作っている場合は同様に揃える（実ファイルを読んで対象を確定すること）。

あわせて更新：`docs/decisions/0007-storage-rls-audit.md` の RLS 台帳（20260607000000 の admin ポリシー群が未記載のため、AAL2 追加後の姿で追記）、`docs/database.md:109` の reviews 行、`docs/setup-log.md:294-310` 付近に「吸収は実際には行われておらず 2026-07 に新規 migration で是正した」旨の追記。
適用：`supabase db push --linked`（dev）→ 動作確認 → prod への適用は人間の承認を得てから。ポリシー変更のみでテーブル定義は不変のため `gen:types` の差分は出ないはずだが、手順どおり実行して無差分を確認する。
検証：上記確認 SQL を再実行し、意図した式になっていること。admin での記事 hero 画像アップロード（AAL2 セッション）が引き続き成功すること。

#### T4. admin プロキシ4本を `proxyToBackend` に統一（frontend・認証の第二防衛線）

`frontend/src/lib/admin-proxy.ts` の `proxyToBackend()` は `/v1/admin/*` への転送時に admin ロール＋AAL2 を BFF でも再検証する設計（ADR-0009／0012）。以下4本は手書き fetch でこれを迂回しており、ログイン確認しかしていない：

- `frontend/src/app/api/admin/makers/[user_id]/approve/route.ts`
- `frontend/src/app/api/admin/makers/[user_id]/reject/route.ts`
- `frontend/src/app/api/admin/products/[id]/route.ts`（PUT）
- `frontend/src/app/api/admin/users/[user_id]/role/route.ts`

FastAPI 側の権威ゲートは効いているため即時の脆弱性ではないが、`admin-proxy.ts:35-37` の申し送りが警告するとおりの穴。4本とも `proxyToBackend` 呼び出しに書き換える（body の透過、レスポンスステータスの透過は既存ヘルパが対応済み。reject はエラーコード `rejection_reason_required` 等の透過が保たれることを確認）。
検証：admin アカウントでメーカー承認／却下・製品編集・ロール変更の実操作。非 admin セッションで各ルートに直接 POST し 403 を確認。

#### T5. オープンリダイレクト検証の一本化（frontend）

強化版 `safeNextPath`（`frontend/src/lib/auth/safe-next.ts`。制御文字・TAB バイパス対応済み、テストあり）に対し、弱い再実装が2箇所ある：

- `frontend/src/app/auth/callback/route.ts:53`（`startsWith("/") && !startsWith("//")` のみ）
- `frontend/src/app/report/user/[user_id]/page.tsx:79-85`（`sanitizeFrom`）

両方を `safeNextPath` の import に置き換え、ローカル実装を削除する。
検証：`pnpm exec vitest run`（safe-next.test.ts）、ログイン→callback→`?next=` 付き遷移の実機確認、`%09//evil.example` のような細工 URL が `/` に落ちること。

#### T6. cron エンドポイントの呼び出し元検証（承認済み）

`frontend/src/app/api/cron/keep-alive/route.ts` に Vercel cron の標準方式を追加：`Authorization: Bearer ${process.env.CRON_SECRET}` の一致検証、不一致は 401。`CRON_SECRET` 未設定時は 500 でエラーを返す（silent skip にしない）。`frontend/.env.example` に `CRON_SECRET=` を追記。
人間の作業：Vercel ダッシュボードで `CRON_SECRET` を設定（Vercel cron は自動でこのヘッダを付与する）。
検証：ローカルでヘッダ無し 401／正しいヘッダ 200。デプロイ後に Vercel の cron 実行ログで 200 を確認。

#### T7. 設定読み取りの fail-fast 化（プロジェクト規約違反の是正）

- `frontend/src/app/layout.tsx:11` と `frontend/src/lib/auth/actions.ts:150` の `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"` を除去し、未設定なら throw する共通 getter（例：`lib/env.ts` の `requireEnv("NEXT_PUBLIC_SITE_URL")`）に置き換える。password-reset メールの `redirectTo` が localhost に化ける事故を防ぐ
- `backend/app/main.py:36` の `os.getenv("SENTRY_DSN")` を `app/config.py` の `Settings` に `sentry_dsn: str | None = None` として移し、`settings.sentry_dsn` 経由に統一（env 読み取り経路を pydantic-settings に一本化する規約）
- `backend/.env.example` に `SIGNUP_REQUIRE_EMAIL_CONFIRM`・`FARMILLE_MAKER_USER_ID`・`REVIEW_IMAGES_ENABLED` を追記（config.py に存在するのに example に無く、運用者から不可視）

検証：frontend は env 未設定でビルド時／実行時に明示エラーになること、設定済みで従来どおり動くこと。backend は `uv run pytest` と起動確認。

#### T8.（人間のみ・コード変更なし）運用上の未解決事項

実装担当はこの項を実施できない。オーナーへの依頼事項として報告に含めること。

1. **Supabase service_role キー・JWT secret のローテーション**：2026-07-04 の Cloud Build への secret 誤アップロード事故（PR #46 で再発防止済み）の後、ローテーションが未実施のまま（`docs/handoff/onboarding.md` §9-13）。手順：Supabase dashboard で JWT secret と service_role キーを再生成 → GCP Secret Manager の `supabase-service-role-key`・`supabase-jwt-secret` を更新 → `bash backend/deploy-prod.sh` で再デプロイ → ローカル各自の `backend/.env` を更新。旧キーのセッションは失効するため告知タイミングに注意。
2. **本番 Cloud Run の SENTRY_DSN 確認**：`deploy-prod.sh` の `--set-env-vars` に SENTRY_DSN が含まれておらず（このフラグは既存 env を置き換える）、本番 backend の Sentry が初期化されていない可能性が高い。Cloud Run コンソールで実際の env を確認し、必要なら deploy-prod.sh に追記。
3. **Vercel への CRON_SECRET 設定**（T6 連動）。

### P1：構造リファクタ（P0 完了後。T9→T10 の順以外は独立）

#### T9. backend 共通ヘルパの抽出とエラー封筒統一（決定事項4）

現状、同一ロジックがルーター間で大量に重複している。`app/lib/` 配下に共通モジュールを新設し、全ルーターを移行する：

- `app/lib/responses.py`：`error_response(status_code, code) -> JSONResponse`（封筒は `{"ok": False, "error": code}` に統一）。現在 `_error()` が9ファイルに重複しており、`reports.py:25` は引数順が逆、`me_profile.py:31` は封筒が `{detail, code}` と別形式。**`me_profile.py`・`articles.py`・`me_favorites.py`・`manufacturers.py`・`maker_profile.py`・`products.py:520` 系の HTTPException（detail=dict／detail=文字列）も全てこの封筒に置換**。frontend 側の参照（`error ?? detail` フォールバック、`admin/reviews/_components/review-moderation-action.tsx:152` 等のメッセージマップ）を同一 PR で確認・更新する
- `app/lib/supabase_rows.py`：`coerce_one(value)`（1:1 join が dict／list どちらでも返る問題の正規化。現在8実装）、`maker_display_name(maker)`（現在6実装）、`representative_image(images)`（現在8実装）、`is_unique_violation(msg)`（現在3実装・判定文字列も不統一）、`is_active_maker(user_row)`（ADR-0009 の active／deleted_at 判定。現在6箇所にインライン）
- `app/lib/pagination.py`：`page_range(page, per_page) -> tuple[int, int]`（現在5＋1箇所に同じ計算式）
- 定数：`REVIEWER_ROLES` を `app/auth/roles.py` に一本化（現在 `me.py:9`・`me_favorites.py:31` に重複。`roles.py` には `SIGNUP_ROLES` が既にあるので隣に置く）
- `app/routers/_sorting.py`・`_image_path.py`・`_review_images.py` を `app/lib/` へ移動（5ファイルから cross-import されており「ルーター私有」ではない。`app/lib/supabase_paths.py` と同族）。import 文を全ルーター・全テストで更新
- `app/models/schemas.py:136` の `ArticleCategory` 二重定義を1つに統合。`articles.py:10`・`manufacturers.py:28` の未使用 `logger` は、T14 のログ統一で使うため削除ではなく実際に使うこと

検証：`uv run pytest` 全パス、`uv run ruff check app`、`grep -rn "def _error" app/routers` が 0 件、`grep -rn "_coerce_one\|_maker_display_name\|_representative_image" app/routers` が 0 件（lib への import のみ残る）。API の実レスポンスが変わるのは「エラー時の body 形式」のみで、正常系レスポンスは不変であることを FastAPI TestClient で確認。

#### T10. frontend BFF プロキシの共通化

`src/app/api/` の32ルートのうち18本が `proxyToBackend` 相当の20行前後を手書き再実装しており、`getAuth()` ヘルパも4ファイルにコピペされている。方針：

- `lib/admin-proxy.ts` を `lib/bff-proxy.ts` にリネームし、汎用化する（現機能は維持：`/v1/admin/*` 自動 admin＋AAL2 判定、`requireAdmin` の明示指定、GET の body 除去、ステータス透過）。追加要件：クエリ文字列の透過、204 対応、成功時ステータスの指定（201 等）
- 18本の手書きルートを新ヘルパ呼び出しへ移行（一覧は監査所見 §5-1 参照）。**T4 の4本を先に済ませてから着手**
- `process.env.API_URL` の直読みが47箇所・`if (!apiUrl)` ガードが26ファイルに散在している。`lib/env.ts` に `requireApiUrl()` を作り、route handler・page・`fetch-home.ts`・`generateMetadata`（現在 silent `return {}`）を含め全て統一。フォールバック値は置かない

検証：`grep -rn "process\.env\.API_URL" frontend/src` のヒットが `lib/env.ts` の1箇所のみ。`pnpm exec tsc --noEmit`・`vitest run`・主要フロー実機確認（ログイン、レビュー投稿、お気に入り、admin 各操作、オンボーディング farmer/maker）。

#### T11. frontend の重複解消（小粒・独立）

- **ロール定数の一本化**：`src/types/admin.ts:146` の `UserRole` を `lib/auth/roles.ts` からの派生に変更。`src/app/me/reviews/page.tsx:9` のローカル `REVIEWER_ROLES` を `lib/auth/roles.ts` の import に置換
- **エラーコード→日本語メッセージ辞書の共通化**：`review-moderation-action.tsx:152` と `role-change-action.tsx:133` の switch を `lib/error-messages.ts` に統合（T9 の封筒統一と整合させる）
- **画像アップロードの共通 hook**：`product-image-upload.tsx`・`review-image-upload.tsx`・`avatar-upload.tsx`・`hero-image-upload.tsx` の4コンポーネントから、MIME 検証・サイズ上限・drag&drop・`storage.upload → getPublicUrl` を `hooks/use-image-upload.ts` に抽出。UI はそれぞれ維持
- **配置の入れ替わり是正**：`src/app/_components/navigation-overlay.tsx`（全ページ共通のはず）を `src/components/` へ、`src/components/google-form-review-embed.tsx`（products/[id] 専用・フラグで停止中）を `src/app/products/[id]/_components/` へ移動
- `src/app/page.tsx:35` と `src/app/home/page.tsx:47` の同一ラッパー JSX を共有コンポーネント化
- `src/__tests__/.gitkeep` を削除

検証：`tsc --noEmit`・`vitest run`・該当画面の実機確認。

#### T12. 承認済み削除の実施（決定事項6）

1. `git rm init.sql rls.sql seed.sql seedgenre.spl backend/railway.toml`。削除前に再確認：`grep -rn "railway.toml\|seedgenre.spl" --include='*.py' --include='*.ts' --include='*.toml' --include='Makefile' .` がコード参照 0 件であること（docs 内の歴史的言及は残ってよいが、README の Railway トラブルシュート節は T15 で書き換える）
2. `git rm frontend/public/{file,globe,next,vercel,window}.svg`。`frontend/README.md` を実内容（起動方法・テスト・gen:types・環境変数）で書き換え
3. `frontend/package.json` から `@radix-ui/react-dialog` を削除。`backend/pyproject.toml` の dev から `pyotp` を削除し、`openpyxl` を `[project].dependencies` から `[dependency-groups]` の新グループ `scripts`（または dev）へ移動。`backend/Dockerfile` が `uv sync` で main のみ入れていることを確認し、イメージから openpyxl が消えることを確認
4. `git mv farmille_setup_instructions.md docs/farmille-setup-instructions-2026-04-17.md`（冒頭に「歴史的文書・現状は README と docs/handoff/ を参照」の注記を1行追加）

検証：`pnpm install && pnpm build`、`docker build -t farmille-backend ./backend`、`uv run pytest`。

#### T13. backend モジュール整理（URL 不変）

- `maker.py`（1エンドポイント）と `maker_profile.py` を統合する。両者は main.py で同一 prefix `/v1/maker` にマウントされており分割理由が無い。統合後のファイル名は `maker.py`、docstring に両サーフェスを記載
- `admin.py:6-12` の docstring を実際の13エンドポイントに合わせて全列挙に更新（現在5つのみ記載で、最も権限の強いルーターの表面積を過少申告している）
- `reviews.py` の docstring に「レビューの作成・一覧は products.py（`POST/GET /v1/products/{id}/reviews`）、自分のレビュー一覧は me.py にある」旨の案内を追記（ファイル移動はしない。URL 固定のため）

検証：`uv run pytest`、`/docs`（開発環境）で全エンドポイントの消失が無いこと（統合前後で OpenAPI の paths 数が一致）。

#### T14. backend エラーハンドリング・ログの統一

- `onboarding.py`（5箇所）・`reviews.py`（2箇所）・`auth.py:53,60`・`products.py:194,252,608,672` の「except Exception → 500 返却のみ・ログ皆無」を、admin 系と同じ `logger.exception(...)` 付きに統一。`import logging` が無いファイルには追加
- ILIKE 検索語のエスケープ：`products.py:316`・`admin_products.py:172` は `,()*` を除去するが、ワイルドカード `%`・`_` を通している。`app/lib/` に `escape_ilike(q)` を作り（`%`→`\%`、`_`→`\_` エスケープ＋既存のメタ文字除去）、`admin.py:411` の users 検索（現在カンマ除去のみ）も含め3箇所を統一

検証：`uv run pytest`。検索窓に `%`・`_`・`()` を含む語を入れて意図どおり文字として扱われること（dev 実機）。

#### T15. ドキュメントの現実同期（コード変更なし・独立実施可）

以下は「Railway が現行」「Next.js 15」等の stale 記述の是正。歴史的文書（日付付き specs／drafts／archived PRD）は対象外とし、現行を名乗る文書のみ直す：

1. `README.md`：Deploy 節を Cloud Run＋手動 `deploy-prod.sh` に書き換え（10・58・62行目）、「Railway でビルドが失敗する」節を削除または Cloud Run 版に置換（78-80行目）、Next.js 15→16
2. `CLAUDE.md`：9・90行目の Railway→Cloud Run、26行目の `database.ts`→`database.types.ts`、「登録している想定」→実登録済みの断定に修正、Next.js 15→16
3. **ルートの指示ファイル構成を frontend と同じポインタ型に統一**：現状ルートは AGENTS.md（未追跡・CLAUDE.md の完全コピー）で、放置すると必ず drift する。CLAUDE.md の内容を AGENTS.md に移し、CLAUDE.md は `@AGENTS.md` の1行にして、両方をコミットする
4. `docs/architecture.md`：10・27-31・192-201行目の Railway 記述と mermaid 図を Cloud Run に更新
5. `docs/git-workflow.md`：168-179行目の「Railway 自動デプロイ」表を「backend は手動デプロイ」に修正
6. `docs/decisions/README.md`：ADR 一覧が 0001 しか載っていない。0001〜0015 を全て列挙し、0010 は「PR #29 に存在・未マージ」と注記
7. `docs/database.md`：初期 migration の内容しか反映していない（articles・user_favorites・featured_products・home_banners・user_reports・product_sources・product_application_recipes・reviews のモデレーション列・users.status/deleted_at・admin ロール・Storage 4バケットが全て未記載）。全28 migration を反映して書き直すか、冒頭に「エンティティ詳細は migrations が正。本書は初期設計の記録」と役割を明示するかの二択。**後者を推奨**（維持コストが低く、drift の再発を防ぐ。詳細一覧は自動生成が向く）
8. `docs/specs/maker-approval-admin.md`・`admin-aglist-alignment-v2.md`・`review-images-and-admin-review-actions.md` 内の `database.ts` 参照（9箇所）を `database.types.ts` に修正

検証：`grep -rn "Railway" README.md CLAUDE.md AGENTS.md docs/architecture.md docs/git-workflow.md` のヒットが「歴史的経緯」文脈のみ。`grep -rn "types/database\.ts\b"` が 0 件。

#### T16. proxy.ts の保護パス拡張（追加的な第二防衛線）

`frontend/src/proxy.ts:5` の `PROTECTED_PATHS` は `/home`・`/onboarding` のみで、`/me`・`/maker`・`/settings`・`/admin` は各ページの個別ガード頼み。`PROTECTED_PATHS` に `"/me", "/maker", "/settings", "/admin"` を追加する。**`/products` は追加しない**（一覧・詳細が公開のため。`/products/new`・`/products/[id]/edit` はページ内ガードのままとする。prefix 一致で公開ページを巻き込むリスクの方が大きい）。各ページの既存ガードは削除しない（多層防御の維持）。
検証：未ログインで `/me/materials`・`/maker/products`・`/settings`・`/admin` に直アクセス→ `/login` リダイレクト。公開ページ（`/products`・`/products/[id]`・`/articles`・`/manufacturers`）が未ログインで従来どおり見えること。

### P2：中期タスク（設計判断・調査を含む）

#### T17. ORM（SQLAlchemy 等）導入の検討（決定事項1・調査タスク）

成果物はコードではなく **ADR ドラフト**（`docs/decisions/0017-orm-evaluation.md` 等）。以下を比較・検証して推奨を出す：

- 現行：supabase-py（PostgREST・HTTP）＋service_role。利点：接続管理不要・Supabase 機能（Storage・Auth admin API）と同一クライアント。欠点：クエリビルダの型安全性が無い（mypy 1246 errors の主因）、join 結果の dict/list 揺れ（T9 で吸収）
- 案A：SQLAlchemy Core／ORM ＋ Supabase の Postgres 直接続（Supavisor 経由のプーリング、Cloud Run のコネクション数設計、Secret 管理の追加）。RLS は第二防御として残る（直接続でも service_role 相当の権限になるため、防御構造は現行と同じ）
- 案B：現行維持＋型付けの改善（PostgREST レスポンスの Pydantic 化を T9 のヘルパ上に積む）
- 判断軸：型安全性・移行コスト（22ルーター）・Cloud Run との相性・テスト容易性（現在の FakeSupabaseAdmin パターンとの互換）
- **注意：どの案でも `supabase/migrations/` の SQL とRLS ポリシーは残る。**ORM の metadata から migration を生成する方式（alembic autogenerate）は RLS・Storage ポリシーを扱えないため、スキーマの二重管理になる。この制約を ADR に明記すること

#### T18. DB 運用ガードレール（決定事項1）

- `docs/git-workflow.md` か CLAUDE.md に規律を明文化：「適用済み migration の編集禁止・修正は常に新規ファイル」「migration 追加 PR には `pnpm gen:types` の diff を含める」
- 乖離検知手順の整備：`supabase db diff --linked` をリリース前チェックに追加（Makefile に `make db-diff` ターゲット）。`supabase/config.toml` が無く `supabase init` 未実施のため、ローカル完結の検証環境が無い点も記録
- `supabase/migrations/20260526000003_seed_products_from_ryosei_export.sql` は maker アカウント不在の新環境では silent no-op になる（ファイル自身のヘッダに記載あり）。新環境構築手順書（`docs/handoff/onboarding.md`）に「maker アカウント投入後にこの migration の効果を検証する」旨を追記

#### T19. backend の型契約強化（T9 完了後）

- `schemas.py` の未使用モデル群（`ArticleListItem` 系5つ・`FavoriteListItem` 系3つ・`UserResponse`・`HealthResponse`・`RegisterRoleResponse`・`AdminUserActionPayload`）は、対応するエンドポイントに `response_model` として接続するのが原則。接続先が無い・仕様が読み取れないものは**削除前に §6 に従い質問**
- 書き込み系 payload の `extra="forbid"` を全モデルに統一（現在5/20のみ。typo フィールドの silent 無視を防ぐ）
- mypy：`pyproject.toml` に `[tool.mypy]` を追加し、現実的なベースライン（`ignore_missing_imports` ＋ 段階的厳格化）を設定。1246 errors の大半は supabase-py の JSON 型に対する index アクセスで、T9／T17 の帰結に依存するため、まず「新規コードで増やさない」ゲートから始める

#### T20. frontend の型契約強化

- ページ内手書きレスポンス型（`ProductDetail` が products/[id]/page.tsx と edit/page.tsx で別定義、等）を `database.types.ts` の Row 型からの `Pick` 派生か、`src/types/api.ts` への集約で一本化
- `types/admin.ts`（404行・手書き）は backend の `schemas.py` と二重管理。T19 で backend に response_model が入った後、OpenAPI からの型生成（`openapi-typescript` 等）への移行を検討事項として ADR に含める
- エラー UX：`src/app/` に `error.tsx`・`not-found.tsx` が皆無で、backend の 403/404 も英語のデフォルトエラー画面に落ちる。ルートに `error.tsx`・`not-found.tsx` を追加し、ページの `throw new Error` を 404 系は `notFound()` に寄せる

#### T21. scripts の整理（優先度低）

- maker 名正規化（`_KABU` パターン＋ `norm_maker`）が4スクリプトに重複。`excel_to_seed_sql.py` の `normalize_maker_name` が正（`prod_import_sources_2026-06-09.py` は既に import しており前例あり）。残り3つ（`gen_maker_setup.py`・`prod_import_2026_06_09.py`・`validate_excel_for_prod.py`）を import に置換
- `prod_import_2026_06_09.py`・`prod_import_sources_2026-06-09.py` は日付入りの一次輸入スクリプトで、`/Users/ryogasakai/dev/farmille` という他人のローカル絶対パスをハードコードしている。`backend/scripts/archive/` へ移動し、冒頭に「2026-06-09 の本番投入記録。再実行不可」を注記（削除は §6 に従い要質問）
- ruff の 32 errors は全て scripts 配下。`uv run ruff check scripts --fix` で10件自動修正し、残りの E701（1行複文）は歴史的スクリプトなら `per-file-ignores` で除外してよい
- 6ファイルにハードコードされた prod プロジェクト ref `sajxnypkbybuzsqdguaa` は、再利用系スクリプト（`configure_supabase_smtp.py` 等）のみ env 引数化。一次輸入スクリプトはアーカイブのため対象外

#### T22. CI（方針の記録のみ・今回実装しない）

CLAUDE.md の方針どおり v1.5+ 送り。ただし PR #38（`chore/dev-handoff-operating-model` ブランチ）に `ci.yml`・`ci-backend.yml`・CODEOWNERS・PR テンプレートが既に存在する。導入時はゼロから書かずこの PR の資産を使うこと。T2 完了（pytest green 化）が backend CI を required にする前提条件。

---

## 5. 監査所見の詳細（タスク化済みの根拠と、タスク化しなかった事実）

### 5-1. frontend：手書きプロキシ18本の一覧（T10 の対象）

`api/products/route.ts`、`api/products/[id]/route.ts`、`api/auth/complete-signup/route.ts`、`api/admin/products/[id]/route.ts`、`api/admin/makers/[user_id]/{reject,approve}/route.ts`、`api/admin/users/[user_id]/role/route.ts`、`api/me/favorites/route.ts`、`api/me/favorites/[id]/route.ts`、`api/me/favorites/[id]/kind/route.ts`、`api/me/profile/route.ts`、`api/me/reviews/route.ts`、`api/maker/products/route.ts`、`api/maker/profile/route.ts`、`api/onboarding/{farmer,maker}/route.ts`、`api/reviews/route.ts`、`api/reviews/[id]/route.ts`（admin 4本は T4 が先行）

### 5-2. backend：重複ロジックの所在（T9 の対象）

- `_error()` ×9：admin.py:48、admin_articles.py:51、admin_products.py:107、admin_reports.py:40、admin_reviews.py:48、auth.py:19、onboarding.py:12、reports.py:25（引数順が逆）、me_profile.py:31（封筒が別形式）
- join 正規化 ×8：admin.py:52、admin_products.py:58、admin_reviews.py:52、articles.py:61、me_favorites.py:37、manufacturers.py:33、home.py:48、products.py:33（各所コメントで「◯◯と同じ防御」とコピーを自認）
- `_maker_display_name` ×6、`_representative_image` ×8、ページネーション計算 ×6、一意制約違反判定 ×3、ADR-0009 active 判定 ×6（所在は各該当ファイルの grep で再確認可能）

### 5-3. タスク化しなかった事実（把握のための記録）

- `docs/migrations-draft/role-drift-trigger.sql`：意図的に未適用の draft（ファイル自身に DRAFT 明記）。現状維持
- `docs/drafts/` の7ファイル：日付付き一次資料。`admin-articles-featured-impl-plan.md` のみ将来計画で完了状態が不明（オーナー確認事項）
- migration の命名規約が3世代混在（連番コピー→phase 番号→機能名）。実害なし。phase17 が欠番だが機能に schema 変更が無かった可能性が高い
- `user_reports.reporter_user_id` に汎用 index が無い（部分 unique index のみ）。「自分の通報一覧」機能を実装する際に追加すること
- `products.py` 等の画像 URL 入力（`image_urls`）は外部 URL 直入力を許す v1 仕様（`admin_products.py:16` に明記）。ADR-0015（product_sources）が緩和策
- backend に AGENTS.md／CLAUDE.md が無い。運用地雷が多い領域（deploy-prod.sh・scripts）なので、T15 のついでに backend/AGENTS.md を置く価値はあるが必須ではない
- `.claude/`（skills・handoff log）は gitignore 対象で、リポジトリだけでは onboarding.md が参照する一部資料を検証できない（仕様どおり）
- admin 一覧ページ群（products 515行・users 425行等）は searchParams 解析・fetch・テーブル描画・バッジが1ファイル同居。T10/T11 完了後の分割候補だが、動作に問題は無く優先度は下げた

## 6. 質問すべき条件（実装担当への指示）

次に該当したら、作業を止めてオーナーに質問すること：

- 仕様がコードと文書から判断できない、または相互に矛盾している（例：T3 で実 DB のポリシーがファイルとも ADR とも違う第三の状態だった場合）
- 削除の可否に確信が持てない（例：T19 の未使用 Pydantic モデル、T21 の一次輸入スクリプトの削除）
- 公開 API・DB schema・保存済みデータに影響しうる変更が、この文書の承認範囲（§2）を超える場合
- 認証・外部連携（Supabase Auth・Vercel・GCP・Sentry・GA）の設定変更が必要になった場合（env 追加の手順化はよいが、実値の設定・ローテーションは人間の作業）
- 互換性を壊す可能性がある場合（エラー封筒統一で frontend 未更新の参照が見つかった等は、同一 PR で両側を直すこと）
- 複数の設計案があり判断が必要な場合（T15-7 の database.md の扱いは推奨を書いたが、全面書き直しを選ぶ場合は工数が大きいため確認）

## 7. 全体の検証（各 PR 共通の完了条件）

```bash
# frontend
cd frontend
pnpm exec tsc --noEmit && pnpm lint && pnpm exec vitest run && pnpm build
pnpm audit --audit-level=high        # T1 以降 critical/high 0 件を維持

# backend
cd backend
uv run ruff check app && uv run pytest
docker build -t farmille-backend .   # 依存変更時

# 規約 grep（全て 0 件を維持）
grep -rn "supabase\.\(from\|rpc\)(" frontend/src | grep -v "^\s*//"
grep -rn "SUPABASE_SERVICE_ROLE\|SERVICE_KEY\|JWT_SECRET" frontend/src
grep -rn "RAILWAY_" backend/ frontend/src
```

UI・認証・RLS に触れるタスク（T3〜T6・T10・T16）は、型チェック・テスト通過だけで完了とせず、`make dev` で起動して該当フローを実際に操作して確認すること。
