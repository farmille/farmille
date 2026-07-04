# Farmille エンジニア オンボーディング / 引き継ぎ本体

このドキュメントは、Farmille に新しく参画するエンジニアが「全体像を掴み、ローカルで動かし、
安全に本番へ反映できる」までを一気通貫で説明する引き継ぎ本体です。

- 索引・読む順番は `docs/handoff/README.md`
- アクセス権の棚卸しは `docs/handoff/access-checklist.md`
- **意思決定の正は `docs/decisions/`（ADR）と `docs/specs/`。** 本書と矛盾したら ADR / spec を優先。

> 表記について：本書で「要確認」とあるのは、引き継ぎ時点で最新状態を Ryoga / 該当ツールで
> 確認すべき項目です（メモリは point-in-time の観測で、実体とずれている可能性があるため）。

---

## 1. このプロダクトは何か

**Farmille は、BS資材（生物・微生物農業資材）の農家レビュープラットフォーム。**

- ひとことで言うと「農家が BS資材のリアルな使用レビューを共有・閲覧でき、メーカーが自社資材を
  載せられる Web のレビュープラットフォーム」（`docs/farmille-system-overview-ja.md` が核となる読み物）。
- ターゲット利用者（ロール）：
  - **農家（farmer）** … レビュー投稿・写真アップロード・お気に入り
  - **JA普及員（ja_staff）** … レビュー投稿（将来 JA 用ダッシュボード予定）
  - **農学者 / 研究者（researcher）** … レビュー投稿（学術的視点）
  - **メーカー（maker）** … 自社資材の登録・管理
  - **運営（admin）** … 全体の承認・管理（2要素認証必須）
  - **unassigned** … 登録直後・オンボーディング未完了のデフォルト
- コア価値：「メーカーが申告する推奨効果」と「農家が実感した効果」を**分離して比較できる**こと
  （`docs/database.md` の `product_benefit_relations` vs `review_benefit_relations`）。
- 現状：**v1 は 2026-06-01 に本番公開済み**。公開資材は約 379 製品（要確認: 最新件数は本番で確認）。

---

## 2. 技術スタックと構成

| レイヤー | 採用技術 | デプロイ先 |
|----------|----------|-----------|
| フロントエンド | **Next.js 16.2.6 / React 19.2.4 / TypeScript / Tailwind CSS 4** | **Vercel**（main push で自動デプロイ） |
| バックエンド（BFF） | **FastAPI / Python 3.12 / uv** | **GCP Cloud Run**（`farmille-api`、手動デプロイ。ADR-0013） |
| DB / 認証 / ストレージ | **Supabase（PostgreSQL）** | dev / prod を別プロジェクトで分離 |
| 秘密情報 | **Google Secret Manager**（backend 実行時に読み出し） | — |
| エラー監視 | **Sentry**（frontend / backend、本番のみ init） | — |

> ⚠️ **デプロイ先の歴史的経緯に注意**：`README.md` と `docs/architecture.md` は **Railway** 前提の記述が
> 残っているが、**ADR-0013（2026-06-01）で Railway → GCP Cloud Run に移行済み**。本番 backend は
> Cloud Run。`railway.toml` 等の残骸はあるが現行ではない。ADR が正。

### ⚠️ Next.js は「あなたの知っている Next.js」ではない

`frontend/AGENTS.md`（＝ `frontend/CLAUDE.md` が参照）に明記の最重要注意：

> This version has breaking changes — APIs, conventions, and file structure may all differ from your
> training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

- v16 は API・ファイル規約が訓練データと乖離している。**コードを書く前に
  `frontend/node_modules/next/dist/docs/` の該当ガイドを必ず読む**こと。
- 具体例：v16 で `middleware` ファイル規約が **`proxy` にリネーム**された（ADR-0004）。
  認証ロジックは `frontend/src/proxy.ts`（`export function proxy` + `config.matcher`）に存在し、
  **正しく配線済み**。「middleware が無い」と誤診しないこと（§9 地雷参照）。

---

## 3. リポジトリレイアウト

```
farmille/
├─ frontend/            … Next.js（Vercel デプロイ）
│   ├─ src/             … App Router / コンポーネント / lib / types
│   ├─ AGENTS.md        … 「これは普通の Next.js ではない」注意（必読）
│   └─ package.json     … scripts / 依存
├─ backend/             … FastAPI（Cloud Run デプロイ）
│   ├─ app/
│   │   ├─ main.py      … FastAPI エントリ（uvicorn app.main:app）
│   │   ├─ config.py    … pydantic-settings の env 定義
│   │   ├─ routers/     … エンドポイント群（products / reviews / admin* / maker / me 等）
│   │   ├─ auth/        … JWT 検証・ロール判定
│   │   ├─ models/ services/ lib/
│   ├─ scripts/         … 運用・データ投入スクリプト（属人運用、§9-§10 参照）
│   ├─ tests/           … pytest
│   ├─ deploy-prod.sh   … 本番 Cloud Run デプロイ（手動）
│   ├─ gcp-*.sh         … GCP 設定ヘルパ（.gitignore 済、PII/設定混入注意）
│   └─ pyproject.toml   … 依存 / pytest 設定
├─ supabase/
│   └─ migrations/      … DB マイグレーション（タイムスタンプ順、§6 参照）
├─ docs/
│   ├─ decisions/       … ADR（意思決定の正、§8）
│   ├─ specs/           … 機能別 spec（実装契約、§8）
│   ├─ handoff/         … ★本引き継ぎ資料
│   ├─ architecture.md / database.md / git-workflow.md / design-tokens.md
│   ├─ farmille-system-overview-ja.md … 全体像（非エンジニア向け）
│   └─ drafts/          … runbook・投入ログ等の作業ドキュメント（本番 PII を含むものあり）
├─ CLAUDE.md            … プロジェクト方針（設計哲学・規約・型生成・依存監査）
└─ Makefile             … make setup / make dev / make stop
```

> リポジトリ直下には `init.sql` / `seed.sql` / `rls.sql` / `tmp_*.sql` 等の**初期スキャフォールド残骸**も
> あるが、現行の正は `supabase/migrations/` 配下のタイムスタンプ付きファイル。直下の `*.sql` は履歴扱い。

---

## 4. ローカル起動手順

### 前提（`README.md` より）

- Node.js 22+ / pnpm 10+ / Python 3.12+ / uv / Docker（backend ビルド確認用）

### 手順

```bash
# 1. クローン
git clone https://github.com/farmille/farmille.git
cd farmille

# 2. 環境変数（値の受け取り方は §5 とアクセスチェックリスト参照）
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
#   → 各ファイルに実値を記入

# 3. 依存インストール + 起動
make setup     # frontend: pnpm install / backend: uv sync
make dev       # backend: uvicorn app.main:app --reload --port 8000 / frontend: pnpm dev
```

`Makefile` の実体：

- `make setup` … `cd frontend && pnpm install` ＋ `cd backend && uv sync`
- `make dev` … backend を `uv run uvicorn app.main:app --reload --port 8000 &` で起動し frontend を `pnpm dev`
- `make stop` … 8000 / 3000 ポートのプロセスを kill

### 確認 URL

- フロント：http://localhost:3000
- FastAPI Docs（OpenAPI）：http://localhost:8000/docs
- ヘルスチェック：http://localhost:8000/health

### よく使うコマンド

```bash
# frontend
cd frontend
pnpm dev                 # 開発サーバ
pnpm build               # 本番ビルド確認
pnpm lint                # eslint
pnpm test                # vitest
pnpm tsc --noEmit        # 型チェック
pnpm gen:types           # 本番スキーマから型生成（$SUPABASE_PROJECT_ID 指定）
pnpm gen:types:dev       # --linked（CLI が link しているプロジェクト）から型生成

# backend
cd backend
uv run uvicorn app.main:app --reload --port 8000
uv run pytest
uv run ruff check .
uv run mypy .
```

> ⚠️ **ADR-0016（最小権限 dev、PR #38 で導入）では、新エンジニアの既定は「frontend のみローカル起動」**で、
> `API_URL` を共有 dev API（Cloud Run の dev インスタンス）に向ける運用。backend をフルローカル起動するときだけ
> dev の service_role / JWT を 1Password 経由で受け取る。詳細は §5・§7・access-checklist.md。

---

## 5. 環境変数（**名前のみ。値は絶対にコミット/記載しない**）

`.env*` は `.gitignore` 済。値は Slack / Google Doc（低機密）/ 1Password（高機密）で受け取る（§12・ADR-0016）。

### frontend（`frontend/.env.example`）

| 変数名 | 用途 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL（公開前提） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（公開前提） |
| `API_URL` | backend（FastAPI / Cloud Run）の URL。サーバー側専用 |
| `NEXT_PUBLIC_SITE_URL` | 公開サイト origin（Supabase メール redirectTo 等に使用） |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 計測 ID（本番のみ。空なら未計測） |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry（クライアント/サーバ runtime）。空なら init スキップ |
| `SENTRY_AUTH_TOKEN` | build 時の source map upload 用。**CI/CD secret、コミット禁止** |
| `SENTRY_ORG` / `SENTRY_PROJECT` | source map 紐付け先 |

### backend（`backend/.env.example` ＋ `backend/app/config.py`）

| 変数名 | 用途 |
|--------|------|
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role key（最強権限・高機密）。backend のみに存在** |
| `SUPABASE_JWT_SECRET` | JWT 検証用シークレット（高機密） |
| `CORS_ORIGINS` | 許可 origin（複数は区切りで指定） |
| `ENVIRONMENT` | `development` / `production` |
| `SENTRY_DSN` | backend Sentry。本番のみ init、空ならスキップ |
| `SIGNUP_REQUIRE_EMAIL_CONFIRM` | signup のメール確認要否（dev=false / prod 想定=true。true には SMTP 設定が前提） |
| `FARMILLE_MAKER_USER_ID` | admin が「Farmille 公式」として製品登録する際の紐付け先 users.id。未設定だと 503 |

### コーディング規約（`CLAUDE.md`）

- **`RAILWAY_*` 等のホスティング固有環境変数をコードで参照しない**（ポータビリティ予算。`API_URL` のように汎用名でラップ）。
- 環境変数は backend = `pydantic-settings`、frontend = `process.env` 経由で読む。
- frontend に service_role / JWT secret を**絶対に渡さない**。検査コマンド：
  ```bash
  grep -rn "SUPABASE_SERVICE_ROLE\|SERVICE_KEY\|JWT_SECRET" frontend/src   # 必ず 0 件
  grep -rn "RAILWAY_" backend/ frontend/src                                # 規約違反検知
  ```

---

## 6. アーキテクチャ原則

正は `docs/architecture.md` / `docs/database.md` / `.claude/skills/farmille-architecture-principles/SKILL.md` / `CLAUDE.md`。

1. **DOA（Data-Oriented Architecture）最優先** — データモデルは技術負債を作らない。第3正規形を守り、
   JSONB 濫用で正規化を逃げない。UI は後から作り直せるが DB は不可逆。破壊的 ALTER より
   「新テーブル + データ移行 + 旧削除」。
2. **責務分離（BFF 第一防御 + RLS 第二防御）** — 全ビジネスロジックは FastAPI を経由する。
   - FastAPI（第一防御）：JWT 検証 → `app_metadata.role` でロール判定 → Pydantic バリデーション → DB アクセス。
   - Supabase RLS（第二防御）：行レベルで再チェック。FastAPI のバグ・直接アクセスへの保険。
3. **frontend から Supabase を直叩きしない** — 例外は **認証（Supabase Auth）と写真アップロード（Supabase Storage）の 2 つだけ**。
   それ以外で `supabase.from` / `supabase.rpc` を呼ぶのは禁止。検査：
   ```bash
   grep -rn "supabase\.\(from\|rpc\)(" frontend/src   # 必ず 0 件（auth.* / storage.* は許容）
   ```
4. **ロールは `app_metadata.role` が正** — `user_metadata` はクライアント改ざん可能なので使わない。
   `public.users.role` も JOIN/集計用に同期保持するが、**書き込みは `POST /v1/auth/register-role` 1 箇所に集約**し原子的に両更新（直接 `UPDATE users SET role` は禁止）。
5. **migration 後は必ず型再生成** — DB スキーマ変更後に `pnpm gen:types`（または `gen:types:dev`）を実行して
   `frontend/src/types/database.types.ts` の差分をコミット。未実行だと frontend の `Database` 型が古いまま `any` 落ち/型エラー（`CLAUDE.md` §型生成）。
6. **ポータビリティ予算** — Supabase Edge Functions / Railway 固有機能に依存しない。ロジックは FastAPI に寄せる。

### DB の要点（`docs/database.md`）

- 主キーは UUID、タイムスタンプは TIMESTAMPTZ。マスタ（作目・効果区分等）は独立テーブル。
- `reviews` は `UNIQUE(user_id, product_id)`（1ユーザー×1製品=1レビュー）。
- `handle_new_user` トリガーが `auth.users` INSERT 後に `public.users` を `role='unassigned'` で自動作成。
- migration の依存順は `supabase/migrations/` のタイムスタンプ順（init → seed → rls → 各 phase）。

---

## 7. デプロイ手順と順序（⚠️ 最重要）

### 大原則：migration を先に適用してからアプリを出す

backend はスキーマにハード依存する（例：`reviews.status` カラム）。migration を先行適用しないと
全製品ページ等が 500 になる。**順序を必ず守る**：

```
1. DB migration を本番に適用
2. NOTIFY pgrst, 'reload schema';     （PostgREST にスキーマ再読込を通知）
3. pnpm gen:types                      （型再生成 → コミット）
4. backend デプロイ（Cloud Run）
5. frontend デプロイ（Vercel）
```

（実例の根拠：レビュー承認フロー deploy。runbook は `docs/drafts/review-moderation-deploy-runbook-2026-06-13.md`）

### frontend と backend はデプロイ系統が別（地雷）

- **frontend（Vercel）**：`main` への push（PR merge）で**自動デプロイ**。
- **backend（Cloud Run `farmille-api`）**：**自動デプロイされない。** `bash backend/deploy-prod.sh` を**手動実行**
  （Cloud Build 経由。事前に `gcloud auth login` が必要。gcloud 認証は失効しがち）。
  - `deploy-prod.sh` の env で `SIGNUP_REQUIRE_EMAIL_CONFIRM` / `CORS_ORIGINS` 等を管理。
  - 「コミット済みなのに本番に出ない」の多くは backend 未デプロイが原因。

### 本番 migration の適用方法（要注意）

- ローカルの Supabase CLI は **dev プロジェクトに link** されている。`supabase db push --linked` を本番に対して
  実行すると**他の未適用 migration を巻き込むリスク**がある。
- 本番への migration は **Supabase Studio の SQL Editor で対象 migration を手動適用**するのが最安全（実運用の選択）。
- 型生成の検証は `supabase gen types typescript --project-id <prod>`（Management token）で read-only に prod スキーマを
  introspect できる。

### Git / PR 運用（`docs/git-workflow.md`）

- ブランチ：`feat/*` `fix/*` `chore/*` `docs/*` `refactor/*`。`main` への直接 push は禁止（誤 push が即本番）。
- コミット：Conventional Commits（`feat:` `fix:` …）。マージは Squash and merge。
- ⚠️ **CI の現状（要確認）**：GitHub Actions の CI（`ci.yml` / `ci-backend.yml`）は **PR #38 のブランチにのみ存在し、
  main にはまだ無い**（2026-06-15 時点）。**PR #38 がマージされるまで main 宛 PR に自動 CI ゲートは効かない**。
  当面はローカルで `pnpm tsc --noEmit` + `pnpm test`（vitest）+ backend `pytest` を緑にしてから merge する運用。

---

## 8. 設計メモ・仕様の在り処

### ADR（意思決定の正）— `docs/decisions/`

| ADR | ステータス | 1行要約 |
|-----|-----------|---------|
| 0001 railway-adoption | Accepted（**ADR-0013 で Superseded**） | backend ホスティングに Railway を採用（後に Cloud Run へ移行） |
| 0002 reviews-insert-role-scope | Accepted | レビュー投稿可能ロールを「reviewer」論理名で farmer/ja_staff/researcher の3ロールに統一 |
| 0003 storage-rls-path-enforcement | Accepted | `review-images` バケットで reviewer ロール許可 + パス命名を RLS 強制（写真は BFF を通さないため RLS が唯一の書込制御） |
| 0004 nextjs16-proxy-file-convention | Accepted | Next.js 16 の `middleware`→`proxy` リネーム規約を採用（`proxy.ts`） |
| 0005 jwt-verification-strategy | Accepted | JWT 検証は JWKS 経由 ES256 を第一、HS256 共有シークレットを後方互換 fallback |
| 0006 url-namespace-policy | Accepted | URL を `/maker/*`（ロール固有）/`/me/*`（個人データ）/root（公開）の3層に分類 |
| 0007 storage-rls-audit | Accepted | Storage RLS 監査と二重防御構造の確認（Phase 12a） |
| 0008 home-content-entry-revival | Accepted | `/home` をコンテンツ閲覧入口として再定義 |
| 0009 maker-approval-flow-and-admin-panel | Draft | メーカー承認フロー（pending→active）+ アドミン画面導入 |
| 0011 sample-version-cta-withdrawal-and-monetization-pivot | Draft | 「使用版」CTA 撤回 + マネタイズ方針ピボット |
| 0012 admin-2fa-promotion-to-v1 | Accepted | Admin 2FA（TOTP）を v1 必達に繰り上げ |
| 0013 gcp-cloud-run-migration | Accepted | backend を Railway → GCP Cloud Run へ移行（ADR-0001 を Supersede） |
| 0014 articles-hero-storage | Accepted | Articles hero 画像の Supabase Storage 戦略 |
| 0015 product-sources-table | Accepted | `product_sources` テーブル（出典リンクの正規化保持） |

> ⚠️ 番号の欠番・未マージ注意（要確認）：
> - **ADR-0010**（講演会 / events 機能）は他 ADR から参照されるが `docs/decisions/` に**ファイルが存在しない**。
>   PR #29（events）側にある可能性。
> - **ADR-0016**（最小権限 dev / 本番フリーズ運用モデル）はメモリ・spec から参照されるが main 未マージ。
>   **PR #38** のブランチに存在（`0016-minimal-dev-handoff-operating-model.md`）。
> - 新規 ADR を起票するときは `gh pr list --state open` で**予約番号も確認**する（main の最大値だけ見ない）。

### spec（実装契約）— `docs/specs/`

機能別の詳細仕様。主なもの（索引）：

- 認証/オンボーディング：`auth-flow.md` / `progressive-onboarding.md`
- 製品・レビュー：`products.md` / `review-post.md` / `edit-delete.md` / `review-images-and-admin-review-actions.md`
- メーカー：`maker-product.md` / `my-materials.md` / `manufacturers-public.md` / `maker-approval-admin.md`
- **`maker-account-provisioning.md`（法人アカウント プロビジョニング、Draft / 2026-06-29 起草）** … §10 参照
- ホーム/記事/プロフィール：`home.md` / `articles.md` / `farmer-profile.md`
- アドミン：`admin-aglist-alignment-v2.md` ほか
- Phase 系：`phase-11c-*` / `phase-12a-security-refactor.md` / `launch-polish.md` / `post-launch-hardening.md` など

### その他の正・在り処

- **Claude 永続メモリ**：`~/.claude/projects/-Users-ryogasakai-dev-farmille/memory/`（`MEMORY.md` が索引）。
  「地雷」「本番構成」「進行中作業」の最新観測はここに蓄積（§9・§12）。
- **過去の引き継ぎ（ハンドオフ log）**：`.claude/handoff/log/`（phase 単位の詳細引き継ぎが蓄積）。
- **作業 runbook / 投入ログ**：`docs/drafts/`（デプロイ runbook・データ投入監査。**本番 PII を含むものあり**）。
- **Claude 会話ログそのもの**：設計の経緯・口頭決定の記録源。リポジトリ外（§12）。

---

## 9. 既知の地雷リスト（踏み抜き注意）

過去に実際に踏んだ / 未解決の落とし穴。**本番に触れる前に必ず一読**。

1. **Supabase Admin API の `?email=` フィルタが壊れている** — `GET /auth/v1/admin/users?email=X` は
   フィルタを silently 無視して**全ユーザーを返す**。`users[0]` を信用すると別人（最古登録ユーザー）を
   破壊する。実際に dev で biz lead のロールを書き換える事故が発生。**`page`/`per_page` で paginate し、
   取得 user の email が期待値と一致する assert を入れてから PATCH/INSERT する**こと。

2. **削除意味論（hard / soft）が未確定（要確認・本番適用前に確定）** — `admin.py` の
   `delete_user_account` は**ハード削除**だが、`20260527000000_user_reports_and_soft_delete.sql` は
   「削除は soft / 通報は監査ログ保持」と**正反対**を宣言。FK CASCADE で通報対象を削除すると
   監査ログが消える。`users.deleted_at` 列はあるがどの経路も書かない**デッドカラム**。
   推奨は soft-delete 寄せ（`deleted_at=now()`+ban）。**製品/法務判断は biz lead（奥田さん）**。

3. **crops マスタ欠落** — `crops`（547件）に「水稲/大豆/小麦/イネ」が無く、ひらがな表記も非対応
   （マスタはカタカナ）。製品の作物紐付けが約30%しか成立せず、多数の製品が作物0。v1.5 fast-follow 想定で
   投入自体はブロックしない。

4. **商品画像の表示は単一フラグ制御（要確認・現在値）** — `frontend/src/lib/flags.ts` の
   `PRODUCT_IMAGES_ENABLED`。コンプラ判断で false（全面非表示）→デモ向け true→… と反転を繰り返している。
   **現在値と「なぜその値か」を必ず確認**（無許諾転載に見えるリスクで根本さん指示が入る領域）。

5. **dev synthetic メーカーの同名 `company_name` 衝突** — dev には同じ会社名のテスト用 maker アカウントが
   存在する。`company_name` 完全一致を前提にしたスクリプトは別人を掴む。既存判定は「ライブ DB の
   `maker_profiles` 基準」で行い、スクリプトの hardcode を信用しない。

6. **Next.js 16 の `middleware`→`proxy` リネーム** — 認証ロジックは `frontend/src/proxy.ts` に存在し
   **正しく配線済み**。「middleware が無い＝未配線」と**誤診しない**こと。`frontend/AGENTS.md` の
   「訓練データで判断するな、`node_modules/next/dist/docs/` を読め」は本物。

7. **SMTP 未設定で認証メールが届かない** — 本番 Supabase は独自 SMTP 未設定（ビルトインは 2通/時 + spam 行き）。
   signup の確認メール・パスワードリセットメールが不達になりうる。根本対応は Resend 等 + DNS（SPF/DKIM）。
   admin は Studio 手動作成で回避している。`SIGNUP_REQUIRE_EMAIL_CONFIRM` の値とあわせて挙動を確認。

8. **frontend / backend のデプロイ系統が別**（§7 再掲） — main push で出るのは Vercel だけ。
   Cloud Run は `deploy-prod.sh` を手動実行。`gcloud auth login` の失効にも注意。

9. **本番 CLI link は dev** — `supabase db push --linked` を本番相手に流すと他 migration を巻き込む。
   本番 migration は Studio SQL Editor で個別適用（§7）。

10. **seed / import 再実行の巻き戻し地雷** — seed や一括 import を再実行すると、
    非公開化したはずの製品（例：農薬登録のある「石灰窒素」）が**再公開**されたり、Storage 移行した
    画像 URL が**元に戻る**。再投入時は公開フラグ・URL の上書きに注意。

11. **`.gitignore` 漏れによる PII / 機密混入** — 過去に `*.xlsx`（本番マスタ）・`docs/drafts/`（本番 PII）・
    `backend/gcp-*.sh` が ignore 漏れで `git add -A` 混入の危険があった（修正済）。
    **`git add -A` を避け、ship するファイルだけ明示 stage** する。

12. **backend テスト腐敗（要確認）** — メモリ時点で pytest fixture drift 26 件 + ruff 7 件の負債。
    解消後に backend CI を required へ昇格予定。最新状況は `uv run pytest` / `uv run ruff check .` で確認。

13. **Cloud Build へのシークレット・アップロード（2026-07-04 発見・修正済）** — `deploy-prod.sh` は
    `cd backend && gcloud run deploy --source .` で起動するため、gcloud は `backend/.gitignore`（キャッシュ類
    しか除外しない）だけを参照し、**backend/ 配下の `.env`（本番/dev の service_role key・JWT secret を含む
    実シークレット）・`.venv/`・`supabase/.temp/`（project ref/token）・`scripts/*.py`・`create-prod-users.sh`
    （本番投入 PII）を Cloud Build のソースバケット（`gs://farmille-production_cloudbuild`）にアップロードして
    いた**（5758 ファイル）。イメージ自体はクリーン（`Dockerfile` が `app/` のみ COPY）だが、ビルドの一時
    アップロードに機密が乗っていた。**`backend/.gcloudignore`（アローリスト方式）を追加して修正済**
    （PR #46。アップロードは 42 ファイルに減少、機密 0 件。`gcloud meta list-files-for-upload .` で検証可）。
    - ⚠️ **未対応の follow-up**：過去のデプロイで `.env` の値が繰り返しバケットに上がっていた事実があるため、
      厳密には **Supabase service_role key / JWT secret のローテーション**を検討する（同一 prod プロジェクト・
      アクセス制御下なので外部公開ではないが、最小権限運用としては rotate が望ましい）。判断は根本さん / 後任と相談。

---

## 10. 進行中・未了の作業

### Open PR（`gh pr list --state open` で最新確認）

| PR | 内容 | 関連 |
|----|------|------|
| **#29** | `feat(events)`: v1 events（講演会）フロー + メーカー一斉メール | ADR-0010（events、要確認: ADR ファイル所在） |
| **#31** | `feat(admin)`: admin TOTP 2FA フロー | ADR-0012 |
| **#38** | `chore`: dev 引き継ぎ運用モデル（最小権限 dev + 本番フリーズ + CI 段階導入） | ADR-0016。**マージまで main に CI ゲート無し** |

### 別途作成中の spec

- **`docs/specs/maker-account-provisioning.md`（法人＝メーカーアカウント プロビジョニング、Draft / 2026-06-29）** —
  現状スクリプト属人運用の maker アカウント作成を正式フロー化する spec。
  「admin が管理画面で発行 → 実担当者が招待リンクで claim → 出品管理」を目指す。
  DDL / API シグネチャは未確定（DOA レビュー前 / ADR 起票前）。**DB に触れる最終形は data lead + Ryoga の DOA レビューで確定**。

### 未了・follow-up（要確認）

- 削除意味論 hard/soft の確定（§9-2）。
- crops マスタ整備（§9-3、v1.5 fast-follow）。
- backend テスト腐敗の解消 → backend CI を required 化（§9-12）。
- **Supabase service_role key / JWT secret のローテーション検討**（§9-13。過去のデプロイで `.env` が
  Cloud Build バケットに繰り返し上がっていたため。`.gcloudignore` で今後は防止済だが、過去分の rotate は別判断）。
- レビュー非公開化の DOA 負債（`status=rejected` に「却下」と「公開後取り下げ」が潰し込まれ区別不能）→
  `unpublished` status 追加 or moderation-events テーブルを DOA レビュー（migration 要。stage1 レビューで判明）。
- CTO 前提作業：dev backend（Cloud Run `farmille-api-dev`）の常設 + URL を 1Password / Vercel Preview env に反映、
  GitHub branch protection 有効化（ADR-0016 / PR #38）。
- SMTP（Resend 等）+ DNS 設定で認証メール不達を解消（§9-7）。
- 独自ドメイン `farmille.com` への移行（DNS 作業が必要。§11・§12）。

---

## 11. ステークホルダー窓口（役割のみ。連絡先は別途）

> 個人の連絡先は本書に書かない。役割と「何を聞くか」のみ。実際の連絡導線は Ryoga から引き継ぐ。

| 役割 | 担当 | 何を相談するか |
|------|------|---------------|
| biz / プロダクト lead | **奥田さん** | スコープ判断・公開/非公開の運用ロジック・UX 判断・課金方針。spec/ADR で「biz 判断要」はここ宛 |
| データ責任者（data lead） | **Ryosei Nemoto** | データ系（マスタ・投入・DB に触れる設計の DOA レビュー） |
| 画像コンプラ / DNS 等 | **根本さん** | 商品画像の表示可否（コンプラ）、ドメイン/DNS（お名前.com 管理） |
| 役員デモ / 優先度（過去事例） | 桑江さん 等 | 役員向けデモのゴール調整（緊急対応の文脈で登場） |
| 外部技術アドバイザー | 藤島氏 | アーキテクチャ/設計判断のレビュー観点（説明可能性） |
| CTO / 現 worker（引き継ぎ元） | **Ryoga（酒井涼雅）** | 技術全般・本番権限・このドキュメントの空欄埋め |

- 共同創業者 3 名（Ryoga / 奥田 / 根本）が admin（2FA 必須）。
- 役割分担の原則：**スコープ・公開ロジック・UX = 奥田／データ系 = Ryosei** で窓口を分ける。

---

## 12. リポジトリ外で引き継ぐべきもの

リポジトリだけでは引き継ぎが完結しない。以下は Ryoga から別途引き継ぐ：

1. **Claude 会話ログ** — 設計の経緯・口頭決定・地雷を踏んだ記録の一次情報源。
2. **Claude 永続メモリ `memory/` ディレクトリ** — `~/.claude/projects/-Users-ryogasakai-dev-farmille/memory/`。
   `MEMORY.md` が索引。本番構成・地雷・進行中作業の最新観測が蓄積（ただし point-in-time。実体は要検証）。
3. **過去のハンドオフ log** — `.claude/handoff/log/`（phase 単位の詳細引き継ぎ）。
4. **秘密情報の受け渡し経路（ADR-0016）**：
   - 低機密（dev anon key・dev API URL 等）… **Google Doc**（本人限定共有）。
   - 高機密（dev/prod の service_role key・JWT secret 等）… **1Password**。
   - **prod の値は原則渡さない**（本番フリーズ運用）。
5. **各クラウドの管理者権限委譲** — GitHub org / Vercel / Supabase（dev・prod）/ GCP（`farmille-production`）/
   ドメイン・DNS（お名前.com）/ Sentry（access-checklist.md で棚卸し）。
6. **Notion 等のドキュメント基盤（要確認）** — 存在すれば共有。本リポジトリからは存在/URL を確認できないため要確認。

---

### 付記：本書の更新方針

- 本書は「読み物」。**事実が変わったら ADR / spec / memory を先に更新**し、本書は索引・要約として追従させる。
- 「要確認」と書いた箇所は、引き継ぎ完了前に Ryoga が最新値で確定・置換すること（埋めるべき空欄は README の
  チェックリストと、本書 §7/§9/§10 の「要確認」を参照）。
