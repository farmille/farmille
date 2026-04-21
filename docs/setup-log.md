# Farmille v1 初期環境構築 実施ログ

**実施日**: 2026-04-17
**実施者**: Claude Code (Opus 4.7)
**ベース指示書**: `farmille_setup_instructions.md`

---

## 1. 実施サマリ

全5Phaseを完了。`make setup && make dev` でフロント(3000)・バックエンド(8000)が同時に起動する状態まで構築済み。

| Phase | 内容 | 結果 |
|---|---|---|
| 1 | 基盤ファイル作成 | ✅ 完了 |
| 2 | バックエンド (FastAPI) 構築 | ✅ 完了（要修正1件あり） |
| 3 | フロントエンド (Next.js 16) 構築 | ✅ 完了 |
| 4 | SQLマイグレーション配置 | ✅ 完了 |
| 5 | 最終検証 | ✅ 完了（1項目環境都合でスキップ） |

---

## 2. Phase別 実施内容

### Phase 1: 基盤ファイル作成

以下9点を作成：

- `/.gitignore`
- `/Makefile`
- `/CLAUDE.md`
- `/README.md`
- `/docs/README.md`
- `/docs/architecture.md`
- `/docs/database.md`
- `/docs/decisions/README.md`
- `/docs/decisions/0001-railway-adoption.md`

加えて `/supabase/migrations/` ディレクトリを作成。

### Phase 2: バックエンド構築

**作成ファイル:**

- `backend/.python-version`
- `backend/pyproject.toml`
- `backend/.env.example`
- `backend/Dockerfile`
- `backend/railway.toml`
- `backend/app/__init__.py`
- `backend/app/config.py`
- `backend/app/main.py`
- `backend/app/dependencies.py`
- `backend/app/auth/__init__.py`
- `backend/app/auth/jwt.py`
- `backend/app/auth/roles.py`
- `backend/app/routers/__init__.py`
- `backend/app/routers/health.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/products.py`
- `backend/app/routers/reviews.py`
- `backend/app/models/__init__.py`
- `backend/app/models/schemas.py`
- `backend/app/services/__init__.py`
- `backend/app/services/supabase.py`

**依存関係インストール:** `uv sync` 完了（Python 3.12.13 + FastAPI + Supabase SDK 等 74パッケージ）

**起動確認:**

- `GET /health` → 200 `{"status":"ok"}`
- `GET /docs` → 200 (Swagger UI)

### Phase 3: フロントエンド構築

**作成/生成ファイル:**

- `pnpm create next-app@latest frontend` で雛形生成 (Next.js 16.2.4 / React 19.2.4 / TypeScript / Tailwind CSS 4 / ESLint / App Router / src-dir)
- `@supabase/ssr@0.10.2` / `@supabase/supabase-js@2.103.3` を追加
- `frontend/.env.example`
- `frontend/src/lib/supabase/client.ts`
- `frontend/src/lib/supabase/server.ts`
- `frontend/src/types/database.types.ts`（プレースホルダー）
- `frontend/src/app/api/cron/keep-alive/route.ts`
- `frontend/vercel.json`
- `frontend/package.json` に `gen:types` / `gen:types:dev` スクリプト追加

**起動確認:**

- `GET /` → 200
- `GET /api/cron/keep-alive` → 500 `{"ok":false}`（バックエンド停止中のため想定通り。ルートは存在）

### Phase 4: SQLマイグレーション配置

`supabase/migrations/` に以下を配置:

| ファイル | ソース | 備考 |
|---|---|---|
| `20260415000000_farmille_init.sql` | `init.sql` | 2箇所修正適用 |
| `20260415000001_farmille_seed.sql` | `seed.sql` | そのままコピー |
| `20260415000002_farmille_seedgenre.sql` | `seedgenre.spl` | そのままコピー |
| `20260415000003_farmille_rls.sql` | `rls.sql` | そのままコピー |

**init.sql の修正箇所 (指示書セクション3.4):**

1. L99: `users.role` CHECK制約に `unassigned` を追加
   ```diff
   - role text NOT NULL CHECK (role IN ('farmer','maker','ja_staff','researcher')),
   + role text NOT NULL CHECK (role IN ('farmer','maker','ja_staff','researcher','unassigned')),
   ```
2. L381: `handle_new_user` トリガーのデフォルトロール変更
   ```diff
   -     'farmer',              -- デフォルトロール（オンボーディングで更新）
   +     'unassigned',          -- デフォルト（オンボーディングでロール選択後に更新）
   ```

### Phase 5: 最終検証

| # | チェック項目 | 結果 |
|---|---|---|
| 1 | `make setup` 正常完了 | ✅ |
| 2 | `make dev` で 3000/8000 同時起動 | ✅ |
| 3 | `curl :8000/health` → `{"status":"ok"}` | ✅ |
| 4 | `curl :8000/docs` で Swagger UI | ✅ 200 |
| 5 | `http://localhost:3000` でページ表示 | ✅ 200 |
| 6 | `grep -r "RAILWAY_" backend/` が 0件 | ✅ 0件 |
| 7 | `docker build -t farmille-backend ./backend` | ⚠️ スキップ (Docker Desktop未起動) |
| 8 | `CLAUDE.md` に4ロール権限体系記載 | ✅ |
| 9 | `docs/decisions/0001-railway-adoption.md` 存在 | ✅ |
| 10 | `docs/architecture.md` に4ロール/認証フロー/API一覧 | ✅ |
| 11 | `docs/database.md` にエンティティ/RLS/設計判断 | ✅ |
| 12 | `docs/README.md` にドキュメントリンク | ✅ |

---

## 3. 指示書からの差分と対応理由

### 差分1: `uv` のインストール方法 — brew → 公式インストーラー

- **問題:** `brew install uv` が依存関係を順にソースコンパイル（Python 3.14 → LLVM 21）し始め、45分経過しても完了しなかった。macOS 13 (Ventura) 用のbrewボトルが提供されていないことが原因
- **対応:** ユーザー承認のもと brew を中断し、公式インストーラー (`curl -LsSf https://astral.sh/uv/install.sh | sh`) でプリビルドバイナリを導入
- **結果:** 約10秒でインストール完了。`~/.local/bin/uv` に配置
- **影響:** 機能差なし。`~/.local/bin` を PATH に通す必要あり（インストーラーが `.zshrc` に追記済）

### 差分2: `dependencies.py` と `auth/roles.py` の循環インポート修正

- **問題:** 指示書通りに実装すると起動時に `ImportError: cannot import name 'get_current_user' from partially initialized module 'app.dependencies' (most likely due to a circular import)` が発生
  - `app.dependencies` → `from app.auth.roles import RoleChecker`
  - `app.auth.roles` → `from app.dependencies import get_current_user`
- **対応:** `dependencies.py` 側の `RoleChecker` import を `require_role` 関数内の遅延importに変更。`roles.py` の `get_current_user` import はモジュールトップのまま維持
- **修正後コード抜粋:**
  ```python
  # backend/app/dependencies.py
  def require_role(*allowed_roles: str):
      from app.auth.roles import RoleChecker  # 循環回避のため遅延import
      checker = RoleChecker(allowed_roles)
      return Depends(checker)
  ```
- **影響:** 関数呼び出し毎のオーバーヘッドは1回限り（Pythonの `sys.modules` キャッシュが効く）

### 差分3: Next.js 16 + `--src-dir` による `app/` 配置場所

- **指示書のツリー図:** `frontend/app/api/cron/keep-alive/route.ts`
- **実際の配置:** `frontend/src/app/api/cron/keep-alive/route.ts`
- **理由:** 現行Next.js 16 で `--src-dir` を指定すると `app/` は `src/app/` 配下に配置される仕様のため。指示書のツリー図は古いバージョン想定
- **影響:** なし。import alias `@/*` は `src/*` を指すため `@/lib/supabase/client` 等は従来通り解決

### 差分4: `rls.sql` / `seedgenre.sql` の追加配置

- **指示書:** init.sql と seed.sql の2ファイルのみ明記
- **ユーザー追加指示:** `rls.sql` と `seedgenre.sql` も migrations に配置
- **対応:** `20260415000002_farmille_seedgenre.sql`（seed後）、`20260415000003_farmille_rls.sql`（最後）として配置

---

## 4. 環境情報

| 項目 | 値 |
|---|---|
| OS | macOS 13.2.1 (Darwin 22.3.0) / Apple Silicon |
| Node.js | v22.22.0 |
| pnpm | 10.23.0 |
| Python | 3.12.13 (uv管理) |
| uv | 0.11.7 (公式インストーラー, `~/.local/bin/uv`) |
| Docker | 28.1.1 (CLI, Desktop未起動) |

---

## 5. 残タスク（ユーザー側対応）

### 必須

1. **環境変数の実値設定**
   - `backend/.env` (`backend/.env.example` からコピー済み) に以下を設定:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_JWT_SECRET`
   - `frontend/.env.local` (作成要) に以下を設定:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `API_URL`

2. **Supabase Storage バケット作成 (手動)**
   - バケット名: `review-images` (Public)
   - ファイルサイズ上限: 5MB
   - 許可MIMEタイプ: `image/jpeg`, `image/png`, `image/webp`
   - RLSポリシー:
     - アップロード: `app_metadata.role IN ('farmer', 'ja_staff', 'researcher')`
     - 閲覧: 全員 (`anon` + `authenticated`)

3. **マイグレーションのSupabaseへの適用**
   - `supabase link --project-ref <farmille-dev プロジェクトID>`
   - `supabase db push`

### 任意

4. **Docker ビルド確認** — Docker Desktop 起動後に `docker build -t farmille-backend ./backend`
5. **DB型の生成** — `cd frontend && pnpm gen:types:dev`（supabase CLIリンク済が前提）
6. **`tool.uv.dev-dependencies` の非推奨警告対応** — `pyproject.toml` を `[dependency-groups.dev]` 形式に移行（動作影響なし）

---

## 6. ディレクトリ最終状態

```
farmille/
├── .claude/                         # 既存（変更なし）
├── .gitignore                       # [新規]
├── CLAUDE.md                        # [新規]
├── Makefile                         # [新規]
├── README.md                        # [新規]
├── farmille_setup_instructions.md   # 指示書（既存）
├── init.sql / seed.sql / rls.sql / seedgenre.spl  # 原本（既存）
├── backend/                         # [新規 - FastAPI]
│   ├── .env.example
│   ├── .python-version
│   ├── .venv/                       # uv sync で生成
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── railway.toml
│   └── app/
│       ├── auth/ (jwt.py, roles.py)
│       ├── models/ (schemas.py)
│       ├── routers/ (auth.py, health.py, products.py, reviews.py)
│       ├── services/ (supabase.py)
│       ├── config.py
│       ├── dependencies.py
│       └── main.py
├── frontend/                        # [新規 - Next.js 16]
│   ├── .env.example
│   ├── package.json (gen:types スクリプト追記済)
│   ├── vercel.json
│   ├── next.config.ts / tsconfig.json / eslint.config.mjs / postcss.config.mjs
│   └── src/
│       ├── app/ (layout.tsx, page.tsx, api/cron/keep-alive/route.ts)
│       ├── lib/supabase/ (client.ts, server.ts)
│       └── types/database.types.ts
├── supabase/                        # [新規]
│   └── migrations/
│       ├── 20260415000000_farmille_init.sql   # 2箇所修正済
│       ├── 20260415000001_farmille_seed.sql
│       ├── 20260415000002_farmille_seedgenre.sql
│       └── 20260415000003_farmille_rls.sql
└── docs/                            # [新規]
    ├── README.md
    ├── architecture.md
    ├── database.md
    ├── setup-log.md                 # このファイル
    └── decisions/
        ├── README.md
        └── 0001-railway-adoption.md
```

---

# 2026-04-20 作業ログ

## 実施サマリ

Phase 5 残タスク3項目（環境変数・Storage・マイグレーション適用）を解消しつつ、その過程で **Schema Drift（ローカル migration と farmille-dev リモートDBの不整合）** を検出し、`supabase db reset --linked` + migration 修正で整合化した。また Storage RLS の設計見直しを行い、ロール範囲・パス命名強制を ADR 化した。

## 1. Phase 5 残タスクの解消

| # | タスク | 対応 |
|---|---|---|
| 1 | 環境変数の実値設定 | `backend/.env` と `frontend/.env.local` に Supabase URL / keys / `API_URL` を投入済 |
| 2 | Supabase Storage バケット作成 | `review-images` バケットを Public / 5MB / jpeg・png・webp で Dashboard 手動作成。RLS は下記 migration で適用 |
| 3 | マイグレーション適用 | `supabase link` 済の上で `supabase db reset --linked` により全ローカル migration をリモート (farmille-dev) に適用 |

## 2. 発見したバグと修正

### 設計との食い違い

- **`reviews_insert_farmer` (20260415000003_farmille_rls.sql:398)** が `farmer` 単独ロールのみ許可していた。
- `docs/architecture.md:101-103, 151` および `CLAUDE.md` の 4ロール権限体系では、レビュー投稿は `farmer` / `ja_staff` / `researcher` の3ロール全員に許可される設計。
- 放置すると Storage への画像アップロードは通るが `reviews` 行 INSERT で RLS に弾かれ、`ja_staff` / `researcher` の投稿フローが半壊する状態だった。

### 修正内容

- ポリシー名を `reviews_insert_reviewer` に変更（ロール集合の論理名 `reviewer` に統一）。
- `WITH CHECK` 条件を `(auth.jwt() -> 'app_metadata' ->> 'role') IN ('farmer', 'ja_staff', 'researcher')` に修正。
- Storage RLS 側も同じ論理名で揃える（`review_images_insert_reviewer`）。

## 3. Migration ファイルの変更

| ファイル | 種別 | 概要 |
|---|---|---|
| `supabase/migrations/20260415000003_farmille_rls.sql` | 修正 | `reviews_insert_farmer` → `reviews_insert_reviewer` にリネーム + 3ロール対応 (L398-403)。セクションコメント (L390) も追従 |
| `supabase/migrations/20260420000000_review_images_rls.sql` | 新規 | `review-images` バケット RLS 4ポリシー (insert / select / update / delete)。`(storage.foldername(name))[1] = auth.uid()::text` によるパス命名強制を含む。`supabase db dump --linked --schema storage` の出力を逐語採用 |
| `supabase/migrations/20260420000000_fix_reviews_insert_reviewer.sql` | 削除 | 差分 migration として一時作成したが、`20260415000003_farmille_rls.sql` 本体への修正に吸収されたため不要化 |

## 4. ADR 追加

- **[ADR-0002](./decisions/0002-reviews-insert-role-scope.md)**: レビュー投稿可能ロールを「reviewer」論理名で3ロールに統一する。ロール集合の変更を命名に波及させないための抽象化を採用。
- **[ADR-0003](./decisions/0003-storage-rls-path-enforcement.md)**: `review-images` バケットで reviewer ロール許可 + `{uid}/{review_id}/{filename}` パス命名を RLS で強制。BFF を経由しない経路でも他人領域への書き込みを Storage RLS 単独で防ぐ設計。

## 5. 学んだ概念: Schema Drift（スキーマドリフト）

### 定義
ローカル migration（バージョン管理下のSQL群）と、実際にリモートDBに適用されている状態が乖離すること。

### 今回の発生経路
farmille-dev 環境構築時に Supabase Dashboard の SQL Editor から直接 DDL を流した変更（`users.role` CHECK 制約・`handle_new_user` のデフォルトロール・古いポリシー）が、ローカル migration に吸い上げられないまま残存していた。帯域外変更（Out-of-band change）が Schema Drift の主要因。

### 検出方法
```bash
supabase db diff --linked --schema public,storage
```
shadow DB（ローカル migration 適用後の状態）と linked remote を比較し、DDL 差分を SQL で出力する。`No schema changes found` で差分ゼロ。

### 解消方法（今回採用）
1. Drift の方向を確認（リモート側が古いか、ローカル側が古いか）。
2. 今回はローカル migration を Single Source of Truth と判断。
3. 実データが 0 件（crops の seed 復元可能分のみ）だったため、`supabase db reset --linked --yes` でリモートをローカル migration 通りに作り直し。
4. 再度 `db diff --linked` でゼロ確認。

### 解消方法（別解）
リモート側の変更を正とする場合は `supabase db pull` でリモート状態から migration を生成し、ローカル側を追随させる。

## 6. 運用原則（今後）

1. **SQL Editor で直接流した変更は必ず `supabase db pull` で migration 化する**。帯域外変更を origin に残さない。
2. **Dashboard UI からのスキーマ変更は原則避ける**。Storage バケットの設定（サイズ上限・MIME）など migration 化できない項目は例外として `setup-log.md` に手順を残す。
3. **定期的に `supabase db diff --linked` を実行してドリフト検知**。PR マージ前チェックや週次レビューでの運用を検討（ADR 化は未実施）。

## 7. 検証結果

| 項目 | 実測 | 判定 |
|---|---|---|
| `supabase db diff --linked` | `No schema changes found` | ✅ |
| `review_images_%` ポリシー数 | 4 (`insert_reviewer` / `select_all` / `update_owner` / `delete_owner`) | ✅ |
| backend `/health` (make dev クリーン起動) | HTTP 200 `{"status":"ok"}` | ✅ |
| frontend `/` (make dev クリーン起動) | HTTP 200 | ✅ |

## 8. 未実施（v1 ローンチ前に必ず実施）

- **farmille-prod への同一 migration 適用**。farmille-dev で実施した `supabase db reset --linked` と同等の手順を本番プロジェクトにも適用する必要がある。ただし本番は実データが入る前提のため、ローンチ前の「空DB状態」タイミングで reset する、または Drift が既に発生している場合は手動で差分 migration を起票して `db push` する方針を選ぶ。判断は本番リンク後に `db diff --linked` の出力を見てから確定する。

---

# 2026-04-21 作業ログ: 認証フロー v1 実装 (Phase 1-4)

## 0. 実施サマリ

`docs/specs/auth-flow.md` (v2) を唯一の正として扱い、サインアップ / ログイン / ログアウト / オンボーディング / 保護ルートの実装を完了。コミット範囲は `52b990a..6a3adcf` の4コミット。Phase 5 はコード変更を伴わない検証フェーズで、静的レビュー + ローカル smoke test までを実施。エンドツーエンド (実メール受信・JWT 更新・Supabase Studio 手動ロール変更) は Ryoga 手動確認待ち。

| Phase | 内容 | コミット | 結果 |
|---|---|---|---|
| 1 | Backend `register-role` 仕様準拠化 | `1af2117` | ✅ 完了 |
| 2 | Frontend 認証基盤 (roles / server / actions / proxy) | `2b69301` | ✅ 完了 |
| 3 | 認証画面 (signup / login / callback / complete-signup) | `de93ccf` | ✅ 完了 |
| 4 | ランディング先 (home / onboarding + 再選択UI) | `6a3adcf` | ✅ 完了 |
| 5 | 受け入れ条件 §11 検証 | コード変更なし | ⚠️ 静的項目のみ ✅、要手動確認 11 項目 |

## 1. 実装内容の要点

### Phase 1: Backend

- `backend/app/routers/auth.py`: `/v1/auth/register-role` を仕様書 §8.2 準拠に書き直し
  - `ALLOWED_SIGNUP_ROLES = {"farmer", "maker"}` (ja_staff / researcher はサインアップ不可、ログインは可)
  - `JSONResponse` で `{"ok": false, "error": "<code>"}` の一貫したエラー形式
  - `app_metadata.role` → `public.users.role` の順に更新、後者失敗時は前者を `unassigned` に戻す手動ロールバック (§8.3 準拠)
- `backend/app/models/schemas.py`: `RegisterRolePayload(role: Literal["farmer","maker"])` / `RegisterRoleResponse` 追加

### Phase 2: Frontend 認証基盤

- `frontend/src/lib/auth/roles.ts`: `REVIEWER_ROLES` / `MAKER_ROLES` / `ALL_ASSIGNED_ROLES` 定数 + 型ガード (`isAssignedRole` / `isReviewerRole` / `isMakerRole`)。ハードコード `role === 'farmer'` を避けるための抽象化 (§7.2)
- `frontend/src/lib/auth/server.ts`: `getUser` / `getRole` / `getSession` の Server Component ヘルパー
- `frontend/src/lib/auth/actions.ts`: `signUp` / `signIn` / `signOut` Server Action。バリデーション・日本語エラーメッセージ含む (§4.3 / §5.3 準拠)
- `frontend/src/proxy.ts`: 保護ルートのリダイレクト制御 (§7.3 骨格準拠)

### Phase 3: 認証画面

- `frontend/src/app/(auth)/layout.tsx`: ロゴ + カードの共通レイアウト
- `frontend/src/app/(auth)/signup/page.tsx`: 属性ラジオ / 氏名 / メール / pw 入力、成功時は確認メール案内表示
- `frontend/src/app/(auth)/login/page.tsx`: メール / pw 入力、エラーインライン表示
- `frontend/src/app/auth/callback/route.ts`: `exchangeCodeForSession` → `/api/auth/complete-signup` 呼び出し → `/onboarding` 遷移
- `frontend/src/app/api/auth/complete-signup/route.ts`: BFF として FastAPI `/v1/auth/register-role` を叩き、成功時に `supabase.auth.refreshSession()` で新 `app_metadata.role` を反映

### Phase 4: ランディング先

- `frontend/src/app/home/page.tsx`: ログイン後トップ。`isReviewerRole` / `isMakerRole` で role 別メッセージ分岐 + ログアウトボタン
- `frontend/src/app/onboarding/page.tsx`: assigned は welcome 表示、unassigned は再選択UIへフォールバック。`?recover=1` クエリで callback 失敗時の初期エラー文言を出し分け
- `frontend/src/app/onboarding/role-recovery-form.tsx`: unassigned 用クライアントフォーム。`/api/auth/complete-signup` 再試行 → 成功時 `router.replace("/home") + router.refresh()`

## 2. 仕様書から逸脱した判断

### 2.1 `middleware.ts` → `proxy.ts` (Next.js 16 リネーム)

- Next.js 16.2.4 で `middleware.ts` 規約が deprecation、`proxy.ts` + `export function proxy()` が正式規約になった
- 仕様書 §7.3 / §10 は旧規約で書かれていたため、§7 冒頭と §10 のファイルリストに「Next.js 16 系では `proxy.ts` に読み替え」の注記を追加 (ロジック・matcher・挙動はそのまま)
- 判断経緯の詳細: `docs/discussions/001-nextjs16-proxy-rename.md`
- ADR としての正式化は未起票 (v1 ローンチ後の負債返済枠に含める)

### 2.2 `NEXT_PUBLIC_SITE_URL` 追加

- `signUp` の `emailRedirectTo` に origin が必要。`.env.example` に `NEXT_PUBLIC_SITE_URL=http://localhost:3000` を追記 (未設定時は同値にフォールバック)
- 注: `.env.example` は `.env*` gitignore 配下のため追跡外。環境変数管理の整理は別タスク

### 2.3 再選択UIの POST 先

- `/api/auth/recovery` を新設せず、既存の `/api/auth/complete-signup` を再利用 (§9.2 準拠)

## 3. 受け入れ条件 §11 の自己判定

| 項目 | 判定 | 検証方法 |
|---|---|---|
| 11.1 / 11.2 サインアップ全工程 | ⏸️ 要手動確認 | 実メール受信 + リンククリック + Supabase Studio 確認が必要 |
| 11.3.1 / 11.3.2 ログインフォーム・Cookie | ⏸️ 要手動確認 | Supabase 起動環境で実操作 |
| 11.3.3 / 11.3.4 role 別遷移 | ✅ | `actions.ts:88` の redirect 分岐 |
| 11.4 ログアウト | ✅ | `actions.ts:91-95` / `home/page.tsx` のボタン |
| 11.5.1〜11.5.4 Middleware リダイレクト | ✅ | `curl` で 307 / Location 確認済 |
| 11.5.5 ja_staff / researcher → /home | ⏸️ 要手動確認 | Studio で手動設定後の動作確認 |
| 11.6.1 パスワード不一致メッセージ | ✅ | `actions.ts:71-74` 日本語化 |
| 11.6.2 FastAPI 失敗時の再選択UI | ✅ | `callback/route.ts:37-41` で `?recover=1` 付与 |
| 11.7.1 ハードコード回避 | ⚠️ | 認可判定は定数経由、サインアップ入力値検証 (境界) に `"farmer"/"maker"` リテラル残存。仕様許容範囲内と判断 |
| 11.7.2 ロール定数定義 | ✅ | `roles.ts:1-2` |

静的確認済: 13項目 / 要手動確認: 11項目 / 未達成: 0項目

## 4. Smoke Test 結果 (`localhost:3100` の `pnpm dev` 上)

| リクエスト | 期待 | 実測 |
|---|---|---|
| GET `/login` | 200 | ✅ 200 |
| GET `/signup` | 200 | ✅ 200 |
| GET `/home` (unauth) | 307 → `/login` | ✅ 307 / `Location: /login` |
| GET `/onboarding` (unauth) | 307 → `/login` | ✅ 307 / `Location: /login` |
| GET `/auth/callback` (no code) | 307 → `/login?error=missing_code` | ✅ 307 / クエリ付き |
| POST `/api/auth/complete-signup` (no session) | 401 | ✅ 401 |
| `pnpm build` | 成功 | ✅ 全ルート正常生成、Proxy (Middleware) 認識 |

## 5. 残タスク

### 必須 (v1 ローンチ前)
- Ryoga による手動 E2E 確認 (受け入れ条件 §11 の要手動確認 11 項目)。手順は `/docs/specs/auth-flow.md` §11 を順に通す
- ADR-0004 として `proxy.ts` 規約の正式化 (Next.js 16 breaking change 対応)

### 任意
- `docs/specs/auth-flow.md` 自体を git 追跡するか判断 (現状 `docs/specs/` ディレクトリ全体が未追跡)
- E2E テスト自動化 (Playwright 等) — v1.5 以降

## 6. 参照ドキュメント

- 実装の正: `docs/specs/auth-flow.md`
- Next.js 16 リネーム判断: `docs/discussions/001-nextjs16-proxy-rename.md`
- Ryoga→Reviewer ハンドオフ文: チャット上で作成済 (ファイル保存なし、必要に応じて再生成可能)

## 7. バグ修正: Supabase JWT Signing Keys (ES256 / JWKS) 対応

### 症状
認証フロー実装直後のE2E試験で `POST /v1/auth/register-role` が全て 401 Unauthorized で失敗。`public.users` の INSERT (`handle_new_user` トリガー経由) は成功していたが、`app_metadata.role` と `public.users.role` の更新が走らない状態。

### 原因
Supabase は 2024 年後半以降、新規プロジェクトの JWT 署名方式を **ES256 (非対称鍵 / JWKS)** にデフォルト切替済。`farmille-dev` プロジェクトも新方式で初期化されていたため、発行される access_token のヘッダーは:

```json
{ "alg": "ES256", "kid": "<UUID>", "typ": "JWT" }
```

となる。一方 backend `app/auth/jwt.py:verify_jwt()` は `algorithms=["HS256"]` 固定で `SUPABASE_JWT_SECRET` (legacy HS256 共有シークレット) を使う実装だったため、署名検証で `JWTError` → `None` を返し、`get_current_user` が 401 を投げていた。

2026-04-17 の初期セットアップ時にこの仕様差分を検出できていなかったのが根本原因。

### 診断
ブラウザ Cookie (`sb-<project-ref>-auth-token`) から access_token を取り出し、ヘッダー部を base64 decode することで `alg=ES256` / `kid=<UUID>` を確認。JWKS エンドポイント (`https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`) に 2 件の `kty=EC, alg=ES256, crv=P-256` キーが存在することも確認。

### 修正
- `backend/app/auth/jwt.py` を書き換え、トークンヘッダーの `alg` を見て分岐:
  - `alg == "HS256"` の場合は従来通り `SUPABASE_JWT_SECRET` で検証 (後方互換)
  - それ以外 (ES256 等) の場合は JWKS を取得し `kid` に一致する公開鍵で検証
- JWKS はプロセス内で 1 回取得してキャッシュ。鍵ローテーション時に `kid` が見つからない場合は 1 度だけ force refresh して再試行
- `httpx` と `python-jose[cryptography]` は既存依存のため追加インストール不要

### 検証
- JWKS エンドポイントから 2 キー取得できることを確認
- Ryoga が再ログイン → メール確認リンククリック → `/v1/auth/register-role` が 200 OK になり `app_metadata.role` / `public.users.role` が `farmer` / `maker` に更新されることを確認

### 未実施 (負債)
- ADR-0005「JWT 検証は JWKS 経由 ES256 を第一、HS256 はフォールバック」の起票 (v1 ローンチ後の負債返済枠)
- JWKS のネットワーク障害時の挙動 (現状は起動時 1 回 HTTP GET、失敗時は以降の全リクエストが 401)。v1.5 以降で httpx 非同期化 + リトライ検討


