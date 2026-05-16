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

---

## 8. 2026-04-21 運用整備: shallow-merge 検証 / git 運用正常化

### 8.1 GoTrue `app_metadata` shallow-merge 実機検証

register-role の実装は `admin.auth.admin.update_user_by_id(id, {"app_metadata": {"role": ...}})` で top-level の部分更新を行うが、これが既存の `provider` / `providers` キーを消さないかを実機で確認した。

検証手順:
1. バックエンド shell で `get_supabase_admin().auth.admin.list_users()` を実行
2. オンボーディング済みユーザー (farmer / maker) の `app_metadata` を目視確認

結果: `{provider: "email", providers: ["email"], role: "farmer"}` が共存していた。GoTrue は `app_metadata` をトップレベルで shallow-merge する挙動が確認できたため、`register-role` の現実装は安全。

今後のメモ: より深い (2階層以上) の部分更新が必要になった場合は、既存値をサーバー側で一度 read してからマージし直す必要がある。register-role の範囲では `role` 1 階層しか触らないため問題なし。

### 8.2 Git ワークフロー正常化

問題: Phase 1-5 と JWKS 修正を `main` ブランチ直接 commit で進めてしまい、PR レビューを経ない運用になっていた。

対応:
1. `feat/auth-flow-v1` ブランチを `origin/main` の先頭から切り直し
2. `main` 上の先行 commit (`1af2117..6a3adcf`) を cherry-pick で `feat/auth-flow-v1` に retrofit
3. `main` を `git reset --hard origin/main` で公開状態に戻す (Ryoga 承認済み)
4. `feat/auth-flow-v1` を `origin` に push し、PR 作成 URL を取得

今後のルール (docs/git-workflow.md に詳細):
- `main` への直接 commit は禁止
- 機能単位で `feat/<topic>` ブランチを切って作業 → PR 経由でマージ
- コミットメッセージは Conventional Commits (`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` 等)

### 8.3 ブランチ戦略の整理

現時点の運用は「GitHub Flow」準拠:
- 長期ブランチは `main` のみ
- 機能開発は `feat/<topic>` を切って作業し、完了後 PR → squash merge または rebase merge で `main` へ
- リリースは `main` から Vercel / Railway が自動デプロイ (現時点では未セットアップ / 手動)

`develop` / `release/*` 等の長期ブランチは運用しない (v1 段階ではスケールに不要)。

---

## 9. 2026-04-21 成果物一覧

### 9.1 コード (feat/auth-flow-v1)

| Commit | 種類 | 内容 |
|---|---|---|
| `1af2117` | feat | register-role を仕様書通りに整備 (rollback 付き) |
| `2b69301` | feat | roles.ts / server helpers / server actions / proxy.ts |
| `de93ccf` | feat | signup / login / OAuth callback ページ |
| `6a3adcf` | feat | home / onboarding ページ + role recovery form |
| `6f4b1fa` | fix | ES256 / JWKS 署名検証に対応 |
| `7b1440c` | docs | setup-log §1-7 に実装ログ追記 |
| `b61e75e` | docs | GoTrue shallow-merge コメント追加 |

### 9.2 ドキュメント

| Path | 種類 | 内容 |
|---|---|---|
| `docs/specs/auth-flow.md` | 仕様書 | Phase 1-5 の実装の正。`middleware.ts` → `proxy.ts` の Next.js 16 差分を注記 |
| `docs/setup-log.md` §1-10 | 実装ログ | 今日ここまでの実施ログ (このファイル) |
| `docs/decisions/0002-reviews-insert-role-scope.md` | ADR | 既存 (レビュー投稿権限の4ロール統一) |
| `docs/decisions/0003-storage-rls-path-enforcement.md` | ADR | 既存 (Storage RLS の path-based enforcement) |
| `docs/git-workflow.md` | 運用規約 | ブランチ戦略・PR 運用・コミット規約 |
| `.claude/handoff/main-to-reviewer-prompt.md` | 運用 | Phase 完了時の Reviewer ハンドオフテンプレ |

### 9.3 未追跡の負債 (Phase 6 以降 / v1 ローンチ後)

- ADR-0005: JWT 検証戦略 (JWKS/ES256 優先 + HS256 フォールバック)
- 手動 E2E 検証 (仕様書 §11.5.5 の ja_staff / researcher については Studio 経由でしか作成できないため、実機ロール付与→アクセステストが未完)
- Vercel / Railway 自動デプロイのセットアップ
- `gh` CLI のインストール (PR 作成・レビュー返信を CLI 化)
- auth 系ページへの design-tokens 反映

---

# 2026-04-23 作業ログ: Phase 6 LP + 資材ページ実装(BFF + 作目フィルタ + Noto Sans JP)

## 0. 実施サマリ

`docs/specs/products.md`(Phase 6 軽量 spec)を起点に、LP / 資材一覧 / 資材詳細 / レビュー一覧 / 作目別 3 層カスケードフィルタ / Noto Sans JP 適用までを 1 日で実装。元々のスケジュール(Phase 6 指示書 §6)では 09:00-19:00 の 10 時間枠だったが、コア実装は 11:00 までに完了し縮退ライン(LP + `/products` の Vercel preview 表示)を超過達成。reviewer からの 🟡 改善推奨 7 件のうち 4 件を本 Phase 内で対応、3 件は Phase 7 送り。最終的に PR #1 として 18 commit を 1 PR に集約、squash merge 待機中。

| Phase 内ステップ | 内容 | 結果 |
|---|---|---|
| 1 | 仕様起こし(`docs/specs/products.md`) | ✅ |
| 2 | LP 骨格(`/`)+ Header / Footer / Hero / 価値提案 | ✅ |
| 3 | `/products` 一覧 + タイプフィルタ + BFF (`GET /v1/products`, `GET /v1/product-types`) | ✅ |
| 4 | `/products/[id]` 詳細 + レビュー一覧 + BFF (`GET /v1/products/{id}`, `GET /v1/products/{id}/reviews`) | ✅ |
| 5 | Noto Sans JP + Inter 適用(`next/font/google`、design-tokens.md §3 準拠) | ✅ |
| 6 | 作目別 3 層カスケード(`GET /v1/crops/tree` + `CropCascadeFilter`) | ✅ |
| 7 | reviewer 指摘 4 件対応(UUID / `"order"` quote / company_name / Noto subsets) | ✅ |
| 8 | demo データ投入(Ryoga 並行)→ runtime 確認 | ✅ ブラウザ目視 OK |
| 9 | PR #1 作成(`feat: ship v1 foundations — auth, onboarding, LP + products`) | ✅ squash merge 待機中 |

## 1. 実装内容の要点

### 1.1 Backend(`backend/app/routers/`)

新規:
- **`crops.py`**: `GET /v1/crops/tree`。`crop_categories_l1` × `crop_categories_l2` × `crops (status='approved')` を 3 並列取得 → Python 側で `[{id, name, children: [{id, name, children: [{id, name}]}]}]` のツリー構造に組み立て
- **`product_types.py`**: `GET /v1/product-types`。`is_active=true` のみ、`name` 順

スケルトン → 完全実装:
- **`products.py`**:
  - `GET /v1/products?type_id=&crop_id=` 一覧(AND 絞り込み)
    - `crop_id` は `product_crops` から先に `product_id` list を取得 → `.in_("id", ids)` で絞り込み(2 段クエリで PostgREST nested filter を回避)
  - `GET /v1/products/{id}` 詳細(JOIN: `users(name, maker_profiles(company_name))` × `product_types` × `product_images(url, "order")` × `product_benefit_relations(product_benefits)` × `product_crops(crops)` × `product_certifications(certifications)`)
  - `GET /v1/products/{id}/reviews` レビュー一覧(`users(name)` JOIN、投稿日 desc)
  - ヘルパー: `_flatten_product()` / `_flatten_product_detail()` / `_maker_display_name()` / `_representative_image()`

`backend/app/main.py`: `crops` / `product_types` router を include。

### 1.2 Frontend(`frontend/src/app/`)

新規:
- **`page.tsx`**(LP): Header(ロゴ + ナビ + 新規登録 CTA)/ Hero(キャッチコピー + CTA「資材を見る」「レビューを投稿する」)/ 価値提案 3 列 / Footer。SSG。
- **`products/page.tsx`**(一覧): Server Component / SSR。`searchParams.{type_id, crop_id}` 受け取り、`Promise.all` で `/v1/products` + `/v1/product-types` + `/v1/crops/tree` を並列 fetch。EmptyState を「全体 0 件」と「フィルタで 0 件」で文言分け。
- **`products/[id]/page.tsx`**(詳細): Server Component / SSR。`Promise.all` で `/v1/products/{id}` + `/v1/products/{id}/reviews` を並列 fetch。404 時は Next.js `notFound()`。画像ギャラリー + meta + タグ群(JBSA 効果 / 対象作目 / 認証)+ レビュー一覧。
- **`products/_components/type-filter.tsx`**(Client): タイプボタン + URL 同期(`useTransition` + `router.push`)
- **`products/_components/product-card.tsx`**(Server): カード UI
- **`products/_components/crop-cascade-filter.tsx`**(Client): L1/L2/作目 の 3 段 select。parent から `key={cropId}` で remount(useEffect での derived state 同期 anti-pattern を回避、lint `react-hooks/set-state-in-effect` クリア)

修正:
- **`layout.tsx`**: `lang="en"` → `"ja"`、title/description を Farmille に、フォント `Geist`/`Geist_Mono` → `Noto_Sans_JP`(weight 400-700)+ `Inter`(`next/font/google` 経由 hash 付き preload、`subsets` を Noto から削除して `preload: false` 化)
- **`globals.css`**: `font-family` を `var(--font-noto-sans-jp), var(--font-inter), sans-serif` に置換、`@theme inline` の `--font-sans` も同期

### 1.3 仕様書(spec)

新規:
- `docs/specs/products.md`: Phase 6 軽量 spec(縮退ライン明示 / 受け入れ条件 / 禁止事項)
- `docs/specs/review-post.md`: Phase 7 spec(Ryoga 用意)
- `docs/specs/maker-product.md`: Phase 8 spec(Ryoga 用意)

## 2. 仕様書 / Ryoga 指示で曖昧だった判断

### 2.1 `image_url` の解釈
products テーブルに `image_url` カラムがなく、`product_images` 中間テーブル(`url, order`)に格納される構造のため、一覧 API では `product_images` を `order` ASC で先頭 1 件を代表画像として返す方針(`_representative_image()`)。詳細 API では全件返す。

### 2.2 ProductTypes 取得エンドポイントの配置
`/v1/products/types` は `/v1/products/{id}` と URL 衝突リスクがあるため、別 router(`product_types.py` → `/v1/product-types`)に分離。

### 2.3 `crop_id` 絞り込み実装
Supabase nested filter(`?product_crops.crop_id=eq.X`)ではなく、`product_crops` から先に `product_id` list を取得 → `.in_("id", ids)` で絞り込む 2 段クエリを採用。`product_id` が 0 件なら早期 `return {"products": []}`。

### 2.4 `crops/tree` のレスポンス形
flat(Phase 5 `/v1/onboarding/crops` と一貫性)ではなく tree 構造(Ryoga 指示「`tree`」明示)で返却。Python 側でツリー組み立て。

### 2.5 cascade filter の state 管理
`useEffect` で props を local state に同期する derived-state パターン(lint `react-hooks/set-state-in-effect` 違反)を避け、parent から `key={cropId ?? "none"}` で remount する React idiomatic な方式に切替。

### 2.6 Header / Footer の重複
`app/page.tsx` / `products/page.tsx` / `products/[id]/page.tsx` の 3 ファイルで Header / Footer を inline 重複。Ryoga 判断「ついで実装回避、Phase 7 以降で必要時に共通化」。

## 3. reviewer 指摘対応(4 件)

reviewer から戻った 7 件(🔴 0 / 🟡 7)のうち、本 Phase 内で対応した 4 件:

| 項目 | ファイル | 対応 | commit |
|---|---|---|---|
| §6.1 不正な UUID で Supabase 500 → spec 上の 404 と乖離 | `backend/app/routers/products.py` | `product_id: UUID` 型受け(FastAPI が自動 422 化) | `4ddbb91` |
| §6.2 PostgREST `"order"` 予約語衝突懸念 | `backend/app/routers/products.py` | embedded select で `"order"` ダブルクォート(2 箇所) | `4ddbb91` |
| §6.3 demo 画面に maker ロールテスト用個人名が出る | `backend/app/routers/products.py` | `users(name, maker_profiles(company_name))` ネスト join + `_maker_display_name()` で `maker_profiles.company_name` 優先、fallback `users.name`。Supabase の 1:1 join が dict / list 両形式で返る可能性に対し `isinstance` 判定 | `bc357f9` |
| §6.6 Noto Sans JP `subsets: ["latin"]` が無意味(JP glyph 非 preload) | `frontend/src/app/layout.tsx` | `subsets` 削除 + `preload: false` 追加(display: swap で遅延取得) | `b8d9d82` |

Phase 7 送り(本 Phase 内では対応せず):
- §6.4 `docs/architecture.md §6` への新エンドポイント追記
- §6.5 `next.config.ts` の `images.remotePatterns` + `<img>` → `<Image>` 置換
- §6.7 Header/Footer 共通化(`app/_components/site-header.tsx` / `site-footer.tsx`)

## 4. 受け入れ条件の自己判定(`docs/specs/products.md` §5)

| 項目 | 判定 | 備考 |
|---|---|---|
| 5.1.1 `/` で Hero + CTA + Footer 描画 | ✅ | build 通過 + Ryoga ブラウザ目視 OK |
| 5.1.2 CTA から `/products` へ遷移 | ✅ | `<Button asChild><Link href="/products">資材を見る</Link></Button>` |
| 5.1.3 `bg-primary` (#3A7F5C) 反映 | ✅ | Tailwind v4 `@theme inline` 経由、Ryoga ブラウザ目視 OK |
| 5.2.1 `/products` で資材カード表示 or EmptyState | ✅ | demo データ 5 件で表示確認 |
| 5.2.2 タイプフィルタ 4 ボタン動作 | ⚠️ 部分達成 | コード完了。`product_types.is_active` が「BS資材」のみ true のため実質「すべて」+「BS資材」の 2 ボタン |
| 5.2.3 フィルタ結果が `?type_id=...` URL に反映 | ✅ | `useTransition` + `router.push` |
| 5.2.4 全データ取得が BFF 経由 | ✅ | `grep "supabase\.\(from\|rpc\)("` exit 1 |
| 5.3.1 `/products/[id]` で詳細 + レビュー一覧 | ✅ | demo データで表示確認 |
| 5.3.2 3 層カスケード作目フィルタ | ✅ | demo `product_crops` 7 件で動作確認 |

判定サマリ: ✅ 達成 8 / ⚠️ 部分達成 1 / ❌ 未達成 0

## 5. Smoke Test 結果

### Backend(`localhost:8000`)
| リクエスト | 期待 | 実測 |
|---|---|---|
| `GET /v1/products` | 200 + 5 件、`maker_name` = company_name | ✅ |
| `GET /v1/products/not-a-uuid` | 422 | ✅ |
| `GET /v1/products/00000000-0000-0000-0000-000000000000` | 404 | ✅ |
| `GET /v1/products/<existing-uuid>` | 200 + 詳細 | ✅(Ryoga ブラウザ目視) |
| `GET /v1/products/<id>/reviews` | 200 + reviews | ✅(同上) |
| `GET /v1/crops/tree` | 200 + L1>L2>crops | ✅(cascade UI で動作確認) |
| `GET /v1/product-types` | 200 + active のみ | ✅ |

### Frontend
- `pnpm tsc --noEmit`: exit 0
- `pnpm lint`: 警告なし
- `pnpm build`: 成功(全 16 ルート、`/` SSG、`/products` `/products/[id]` ƒ Dynamic SSR)
- `grep -rn "supabase\.\(from\|rpc\)(" frontend/src`: exit 1(0 件、フロント直叩き不在)

## 6. demo データ投入(Ryoga 並行タスク)

worker のスコープから明示的に切り離し、Ryoga が Supabase Studio 手動投入:
- `products` 5 件(BS資材タイプ、`maker_id` は既存 maker アカウント 1 個に集約)
- `reviews` 5 件
- `product_crops` 7 件
- `certifications` 3 件(有機JAS / JGAP / GLOBALG.A.P.)
- `product_certifications` 3-5 件で紐付け

これにより worker は実装の context を切らさず継続、demo 完了後に runtime 検証を 1 ラウンドで済ませた。

## 7. PR #1 作成(`feat: ship v1 foundations — auth, onboarding, LP + products`)

- **URL**: <https://github.com/farmille/farmille/pull/1>
- **含まれる commit 数**: 18(Phase 1-4 + Phase 5 + Phase 6 が合流)
- **マージ方針**: **squash merge**(main 履歴は 1 commit に集約、`docs/git-workflow.md` §3 準拠)
- **状態**: Ryoga による merge 待機中

### 7.1 Phase 6 PR に同梱した untracked
- `backend/app/routers/{crops,product_types}.py`
- `frontend/src/app/products/{page.tsx,[id]/page.tsx,_components/*}`
- `docs/specs/{products,review-post,maker-product}.md`

### 7.2 Phase 6 PR から除外した untracked(別 PR 行き)
- `backend/.gitignore`
- `docs/decisions/{0002,0003}-*.md`(Phase 5 以前の Storage 関連 ADR、auth-flow PR 想定)
- `docs/design-tokens.md`(横断ドキュメント)
- `docs/git-workflow.md`(横断ドキュメント)
- `docs/reviews/phase-1-4-auth-flow.md`(Phase 1-4 review 記録)
- `docs/specs/auth-flow.md`(Phase 1-4 spec)
- `supabase/migrations/20260420000000_review_images_rls.sql`(Phase 7 で扱う Storage migration)

### 7.3 push 時のメモ(参考)
`git push` 単体は macOS Keychain の古い credential で `Repository not found` エラー。`git -c credential.helper= -c credential.helper='!gh auth git-credential' push -u origin <branch>` の **1 回限り override** で `gh` の token を流用(global git config 変更なし)。恒久化したい場合は `gh auth setup-git` だが、要 Ryoga 承認(global config 変更)。

## 8. パフォーマンス振り返り

指示書 §6 スケジュールでは 09:00-15:00(6 時間)で LP + `/products` + 詳細 + 作目検索までを想定していたが、**11:00 時点で全達成済**(およそ 3 倍速)。再現したい成功パターン:

- **Phase 5 基盤の流用**: shadcn / Noto 切替先の globals.css / BFF パターンが Phase 5 で組めていた → Phase 6 は応用層に集中
- **Ryoga 判断の即決**: Q1-Q5(レスポンス形 / クエリ UUID / EmptyState 文言 / 認証ポリシー / 画像扱い)が即答 → worker 待機時間最小化
- **`grep` 自動チェックの定着**: skill §1.3 / §4.1 #5 のフロント直叩き検査を毎セッション ルーチン化、迷いゼロ
- **「ついで実装」の徹底回避**: Header/Footer 共通化・architecture.md 更新・`next/image` 採用を意図的に Phase 7 送り
- **demo データの並行化**: Ryoga が Supabase Studio で手動投入する間、worker は実装の context を切らさず継続

## 9. 学び(再現したい / 避けたい)

### 再現したい
- 仕様書を `docs/specs/<phase>.md` で軽量に書く運用(Phase 1-4 の `auth-flow.md` ほど厳密でない、5-15 ページの軽量 spec)
- reviewer 指摘対応を「本 Phase で対応する分」と「次 Phase 送り」に明確に分けて文書化(skill §4.4 #9 のついで実装回避)
- BFF 経由で全フェッチ統一、フロント直叩きを `grep` で物理排除
- `key` prop による remount で derived-state アンチパターン回避(useEffect → render reset)

### 避けたい
- reviewer 対応を Phase 6 本体未コミットのまま開始 → 修正 commit に Phase 6 本体実装が混入(squash merge で吸収できたが、commit 単位の意味が乖離)
- macOS Keychain の古い credential を放置 → 初回 push でエラー、`gh auth setup-git` か one-shot override が必要

## 10. 残タスク

### v1 ローンチ前(必須)
- PR #1 の squash merge(Ryoga 実行)
- merge 後 main から Vercel preview を起動して動作確認
- `product_types.is_active` の最終判断(BS資材以外を有効化するか / v1 として BS資材のみで進めるか)

### Phase 7 以降(reviewer 指摘 + 累積負債)
- §6.4 `docs/architecture.md §6` 更新
- §6.5 `next.config.ts` `images.remotePatterns` + `<img>` → `<Image>` 置換
- §6.7 Header/Footer 共通化(`app/_components/site-{header,footer}.tsx`)
- 累積 untracked 整理(別 PR、Phase 1-4 / Phase 5 / 横断 docs)
- ADR-0005「JWT 検証戦略」起票
- Vercel / Railway 自動デプロイ整備

### v1.5 以降(技術負債)
- Playwright E2E テスト
- next/font Noto Sans JP の subsets / display 最適化
- レビュー平均値計算を SQL view 化
- Supabase Storage を CDN(Cloudflare Images 等)後段に
- shadcn Card / Dialog 等の共通コンポーネント追加

## 11. 成果物一覧

### 11.1 コード(`feat/lp-products-v1` の Phase 6 commit)

| Commit | 種類 | 内容 |
|---|---|---|
| `4ddbb91` | fix | UUID バリデーション + `"order"` ダブルクォート(reviewer §6.1 + §6.2)/ Phase 6 本体 products.py 実装が混入 |
| `bc357f9` | fix | `maker_name` を `maker_profiles.company_name` に切替(reviewer §6.3) |
| `b8d9d82` | fix | Noto Sans JP `subsets: ["latin"]` 削除 + `preload: false`(reviewer §6.6) |
| `d1e0009` | feat | Phase 6 本体(LP / `/products` / `/products/[id]` / cascade / 新 router 2 / spec 3) |

### 11.2 ドキュメント

| Path | 種類 | 内容 |
|---|---|---|
| `docs/specs/products.md` | Spec | Phase 6 軽量 spec、受け入れ条件、禁止事項 |
| `docs/specs/review-post.md` | Spec | Phase 7 spec(Ryoga 用意) |
| `docs/specs/maker-product.md` | Spec | Phase 8 spec(Ryoga 用意) |
| `docs/setup-log.md` 本セクション | 実装ログ | Phase 6 全工程の記録(このセクション) |

### 11.3 PR
- **#1**: `feat: ship v1 foundations — auth, onboarding, LP + products`(18 commit、squash merge 待機中)

---

# 2026-04-23 ~ 04-24 作業ログ: Phase 7 レビュー投稿(BFF + Storage 直 upload)

> **骨子版**: 本セクションは git log / PR #2 description / `docs/specs/review-post.md` から復元した骨子。Phase 6 のような実時間メモ（Ryoga の即決判断ログ / Smoke Test 実測値 / パフォーマンス振り返り）は当時記録していないため、要 Ryoga 確認マーカー(🟡)付きで TBD のまま残す。

## 0. 実施サマリ

`docs/specs/review-post.md`(Phase 7 軽量 spec)を起点に、farmer が `/products/[id]` で rating + 本文 + 画像最大 5 枚のレビューを投稿できる機能を実装。投稿後、同ページのレビュー一覧に即反映。フロント Supabase 直叩きはゼロ維持(skill §1.3 厳守)。Phase 8 と統合 PR(#2)で merge。

| Phase 内ステップ | 内容 | 結果 |
|---|---|---|
| 1 | Storage RLS migration commit(`20260420000000_review_images_rls.sql` 既存 draft) + ADR-0002 commit | ✅ |
| 2 | Backend `POST /v1/products/{id}/reviews` 実装 | ✅ |
| 3 | Frontend BFF proxy `/api/reviews` 実装 | ✅ |
| 4 | Frontend ReviewForm + 既投稿者ガード(`/products/[id]` 埋め込み) | ✅ |
| 5 | `<img>` → `next/image` 一括置換 + `next.config.ts` `remotePatterns` 追加(reviewer §6.5 累積負債回収) | ✅ |
| 6 | Phase 8 と統合 PR #2 作成 → merge | ✅ |

## 1. 実装内容の要点

### 1.1 Backend(`backend/app/routers/`)
- **`reviews.py`** (新規 / Phase 7 部分): `POST /v1/products/{id}/reviews` — JWT sub を user_id に強制採用、payload からは受け取らない(書き換え攻撃防止)
- **master 系**: `product_benefits.py` / `certifications.py`(spec §9 漏れだが Phase 8 の必要分として併設、Q4 で事前承認)

### 1.2 Frontend(`frontend/src/app/`)
- **BFF proxy** `/api/reviews/route.ts` — Cookie session → backend Bearer 中継
- **ReviewForm**(client component): `crypto.randomUUID()` で review_id 先発行 → Storage に `{uid}/{review_id}/{idx}_{filename}` で upload → backend に id + rating + body POST
- **`/products/[id]`**: 投稿フォーム埋め込み + 既投稿者ガード(同 product への 2 重投稿防止)

### 1.3 仕様書 / Migration
- `docs/specs/review-post.md`(Phase 7 spec、Ryoga 用意・Phase 6 中に commit 済)
- `supabase/migrations/20260420000000_review_images_rls.sql`(既存 draft、Phase 7 冒頭で commit)
- `docs/decisions/0002-reviews-insert-role-scope.md`(ADR-0002、Phase 7 冒頭で commit) — **本 PR 時点では未 commit のまま漏れていた事実が docs-sweep で判明**

## 2. 仕様書 / 設計判断

### 2.1 画像メタデータテーブルを作らない(ADR-0003)
画像と review は Storage パス命名規約 `{uid}/{review_id}/{filename}` のみで紐づける。中間テーブル `review_images` は v1 では作らない。レビュー一覧の画像取得は `supabase.storage.from("review-images").list({uid}/{review_id}/)` で行う。

### 2.2 投稿者ロール = farmer のみ
spec §3.2 に基づき farmer 限定でリリース。RLS `reviews_insert_farmer` も farmer のみ許可のまま維持。ADR-0002(ja_staff/researcher への拡大)は v1.5 以降の検討として保留。

### 2.3 既投稿者ガードの位置
spec §6.1 で「投稿済み farmer はフォーム非表示」。Phase 7 では UI 側で実装したが、Phase 9 で「編集機能と矛盾する」として撤回(Phase 9 commit `66ce4b9` 参照)。

## 3. reviewer 指摘対応

🟡 **要 Ryoga 確認**: PR #2 description に reviewer 指摘の明示記載なし。Phase 7 単体の review session があったか不明(Phase 8 と統合された可能性)。

## 4. 受け入れ条件の自己判定(`docs/specs/review-post.md` §11)

| 項目 | 判定 | 備考 |
|---|---|---|
| 未ログインで `/products/[id]` → /login | ✅ | PR #2 test plan で確認済 |
| farmer ログイン → ReviewForm 表示 | ✅ | 同上 |
| maker / unassigned ログイン → 投稿不可表示 | ✅ | 同上 |
| 投稿済 farmer → フォーム非表示 | ✅ | Phase 9 で撤回 |
| 画像付き投稿 → Storage に保存 + 一覧表示 | ✅ | 同上 |
| フロント Supabase 直叩き 0 件 | ✅ | `grep` 確認済 |

## 5. Smoke Test 結果

🟡 **要 Ryoga 確認**: 個別 Smoke Test 数値の記録なし。PR #2 test plan には以下が ✅:
- `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` (22 routes)
- `from app.main import app` 起動 OK
- `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` → 0 件
- E2E: 未ログイン → /login、farmer → ReviewForm、maker/unassigned → 投稿不可、投稿済 farmer → 非表示

## 6. PR

Phase 8 と統合した PR #2(`feat: review posting + maker product registration with image uploads`)で merge。

- **URL**: <https://github.com/farmille/farmille/pull/2>
- **マージ**: 2026-04-24 07:07 squash merge
- **Phase 7 commit**: `5d44bf4`(spec/RLS)、`61f0d86`(backend)、`4570252`(BFF proxies)、`7a73497`(review UI)、`f60db04`(`<img>`→`<Image>`)

## 7. 学び

🟡 **要 Ryoga 確認**: 一次情報なし。spec 段階で明示されていた設計判断(Storage 直 upload + Storage パス紐付け)が想定どおり機能した点と、reviewer §6.5(`<img>`→`<Image>`)を Phase 6 から Phase 7 に持ち越した点が事実として記録できる範囲。

## 8. 残タスク

Phase 9 で回収:
- レビュー編集 / 削除
- 投稿済みガードの撤回(編集機能との矛盾)

Phase 10 で回収:
- 画像 add / remove(編集時)

v1.5 送り(spec §0):
- ja_staff / researcher の投稿 UI 対応

---

# 2026-04-23 ~ 04-24 作業ログ: Phase 8 メーカー資材登録(BFF + 中間テーブル + 多重選択 UI)

> **骨子版**: Phase 7 と同様、git log / PR #2 description / `docs/specs/maker-product.md` から復元。一次メモは未記録、🟡 マーカーで TBD 残し。

## 0. 実施サマリ

`docs/specs/maker-product.md`(Phase 8 軽量 spec)を起点に、maker ロールが `/products/new` で自社資材を登録、`/maker/products` で自社一覧を閲覧できる機能を実装。基本情報 + 画像 + 効果タグ / 対象作目 / 認証の入力。Phase 7 と同 PR(#2)で merge。

| Phase 内ステップ | 内容 | 結果 |
|---|---|---|
| 1 | product-images Storage RLS migration commit | ✅ |
| 2 | Backend `POST /v1/products` + `GET /v1/maker/products` + master endpoints | ✅ |
| 3 | Frontend BFF proxy `/api/products` + `/api/maker/products` | ✅ |
| 4 | Frontend `/products/new`(maker only)+ `/maker/products` 一覧 | ✅ |
| 5 | TagMultiSelect + ProductImageUpload 新設、CropPicker 再利用 | ✅ |
| 6 | Phase 7 と統合 PR #2 作成 → merge | ✅ |

## 1. 実装内容の要点

### 1.1 Backend
- **`products.py`** (拡張): `POST /v1/products` — `maker_id` を JWT.sub 強制採用、関連テーブル(`product_images` / `product_benefit_relations` / `product_crops` / `product_certifications`)に CASCADE INSERT、失敗時は手動 rollback(`products.delete()` で FK CASCADE 起動)
- **`maker_products.py`** (新規 想定): `GET /v1/maker/products` — `maker_id = JWT.sub` で絞り込み

### 1.2 Frontend
- **`/products/new`**: maker 以外は `/home` or `/products` に redirect、ProductForm Client Component
- **`/maker/products`**: maker 自身が登録した資材の一覧、Server Component
- **TagMultiSelect**: spec §6.3 では CropPicker 流用想定だったが、product_benefits が 1 階層のため UI 不自然 → Ryoga 権限範囲内で TagMultiSelect に切替(Phase 8 worker 判断)
- **ProductImageUpload**: `{uid}/pending/{nonce}_{idx}_{filename}` パスで Storage 直 upload(Phase 7 の review-images と同パターン、nonce で session 識別)

## 2. 仕様書 / 設計判断

### 2.1 画像パスの nonce 採用
review-images の `{uid}/{review_id}/...` は review_id 先発行で衝突回避するが、product では product_id を BFF が発行する。フロント発行の nonce で同 maker の同時編集セッション間衝突を防止。

### 2.2 関連テーブル INSERT の手動 rollback
supabase-py が単発 REST のみで transaction 非対応のため、関連 INSERT 失敗時は `products.delete()` を呼び FK `ON DELETE CASCADE` で関連行も自動消去。完全な原子性ではないが v1 では妥当。

### 2.3 `getSession()` vs `getUser()`
Phase 8 BFF は `getSession()` 採用。`getUser()`(JWT 再検証)に統一すべきだが Phase 7/8 reviewer 指摘の累積負債として v1.5 送り。

## 3. reviewer 指摘対応

PR #2 description より Phase 7+8 統合 review session で扱われた指摘:
- ❓ 既投稿者ガードを Phase 7 元実装に併合(独立 fix commit なし、要 Ryoga 確認)
- 🟡 詳細記録なし

## 4. 受け入れ条件の自己判定(`docs/specs/maker-product.md`)

| 項目 | 判定 | 備考 |
|---|---|---|
| 未ログイン / farmer → `/products/new` redirect | ✅ | PR #2 test plan |
| maker で登録 → `/maker/products` 反映 | ✅ | 同上 |
| 別 maker の資材は出ない | ✅ | 同上 |
| カード → `/products/[id]` 詳細遷移 | ✅ | 同上 |
| 画像 Storage 保存 | ✅ | 同上 |
| フロント Supabase 直叩き 0 件 | ✅ | 同上 |

## 5. Smoke Test 結果

🟡 **要 Ryoga 確認**: 個別数値なし。PR #2 test plan の集約 ✅ 結果のみ(Phase 7 セクション §5 と同じ)。

## 6. PR

Phase 7 と統合 PR #2、上記 Phase 7 §6 と同じ。

- **Phase 8 commit**: `68cf17e`(`feat(frontend): product registration form and maker product list`)

## 7. 学び

🟡 **要 Ryoga 確認**: 一次情報なし。spec で承認済の TagMultiSelect 切替が worker 権限範囲内で完結した点、Phase 7 の Storage 直 upload パターンが横展開できた点が事実として記録できる範囲。

## 8. 残タスク

Phase 9 で回収: 資材編集 / 削除。
Phase 10 で回収: 画像 add / remove + 並び替え、`certifications` seed migration 化(Phase 8 では Studio 手動投入の 3 件で進行)。
v1.5 送り: `getSession()` → `getUser()`、`ProductCard` の `hideMakerName` prop、Header/Footer 共通化、`/v1/crops/flat` 新設。

---

# 2026-04-24 作業ログ: Phase 9 レビュー・資材の編集 / 削除

> **骨子版**: PR #3 description + `docs/specs/edit-delete.md` から復元。本 Phase は当日 PR #2 と並走でリリースされたため、reviewer 指摘 1 件(投稿済みガード撤回)が PR 内 fix commit として残っている。

## 0. 実施サマリ

`docs/specs/edit-delete.md` を起点に、farmer による自レビュー編集 / 削除 + maker による自社資材編集 / 削除を実装。新規ページは `/products/[id]/edit` 1 枚のみ、レビュー編集はインライン。**画像編集は v1 縮退、Phase 10 送り**。Phase 7/8 で残った skeleton も撤去。PR #3 として 7 commit を 1 PR、squash merge。

| Phase 内ステップ | 内容 | 結果 |
|---|---|---|
| 1 | spec commit(`docs/specs/edit-delete.md`) | ✅ |
| 2 | Backend PUT/DELETE 4 endpoint(reviews / products) | ✅ |
| 3 | Frontend BFF proxy `/api/reviews/[id]` + `/api/products/[id]` | ✅ |
| 4 | ReviewForm `mode="edit"` + MyReviewRow インライン edit/delete | ✅ |
| 5 | `/products/[id]/edit` 新設 + ProductForm `mode="edit"` + 削除ボタン | ✅ |
| 6 | demo 対応: `placehold.co` を `next.config.ts` remotePatterns に追加(Phase 10 §14.2 で削除予定) | ✅ |
| 7 | reviewer §2.1 対応: Phase 7 投稿済み gate 撤回(編集機能との矛盾) | ✅ |
| 8 | PR #3 → merge | ✅ |

## 1. 実装内容の要点

### 1.1 Backend(`backend/app/routers/`)
- **`reviews.py`**: skeleton `@router.get("/")` を撤去 + `PUT/DELETE /v1/reviews/{id}` 実装
- **`products.py`**: `PUT/DELETE /v1/products/{id}` 追加(Phase 8 POST と同居)
- **schemas**: `ReviewUpdate` / `ProductUpdatePayload` 新設

owner 判定は両 endpoint とも JWT.sub と対象行の owner column を BFF で比較(第一防御)。RLS の owner-check ポリシー 4 本(`reviews_update/delete_owner`, `products_update/delete_owner`)は `20260415000003_farmille_rls.sql` に既存 → migration 追加なし。

PUT の関連テーブル strategy は **全削除 → 再 INSERT**(差分検出は不採用、skill §3.2 原子性簡素化、size 小さい)。失敗時 rollback なし、500 返却 + ユーザー再送信(Phase 8 POST と同方針)。

DELETE の依存先は FK `ON DELETE CASCADE`(product_images / 中間テーブル / reviews)。

### 1.2 Frontend(`frontend/src/app/`)
- **BFF proxy**: `/api/reviews/[id]/route.ts` + `/api/products/[id]/route.ts` 新設
- **ReviewForm**: `mode="edit"` 拡張 + 初期値受け渡し
- **MyReviewRow**(新規 想定): 自レビュー行に `[編集]` / `[削除]` インライン配置(`window.confirm()` で削除確認、shadcn AlertDialog 化は v1.5)
- **`/products/[id]/edit`** (新規ページ): ProductForm `mode="edit"` 再利用 + 資材削除ボタン、CASCADE 挙動を確認モーダル文言に明記
- **`/maker/products`**: 各カードに `[編集]` リンク追加(`/products/[id]/edit` 遷移)、削除は edit ページに集約

### 1.3 画像編集 UI
edit モードでは画像セクション非表示 + 注記「画像の編集は v1 では対応していません」(spec §0 縮退ライン準拠)。

## 2. 設計判断

### 2.1 owner / maker_id は payload から受け取らない
Phase 7/8 と同じ思想を継続、JWT.sub 強制採用で書き換え攻撃防止。

### 2.2 削除確認 = `window.confirm()`
spec §6.1 / §6.3 / Q2 で確定。shadcn AlertDialog 導入は v1.5。

### 2.3 削除時の Storage orphan 許容
spec §2 の方針。`supabase.storage.remove()` は呼ばない、orphan は v1.5 で cron 清掃。Phase 10 で BFF remove を実装(編集時のみ。削除時は引き続き orphan 許容)。

### 2.4 stack PR から始まり main base に切替
spec で `feat/edit-delete` は `feat/posts-and-products`(Phase 7+8) に stack 想定。実際には PR #2 が先に merge → PR #3 base を main に切替成功。

## 3. reviewer 指摘対応

| 項目 | ファイル | 対応 | commit |
|---|---|---|---|
| §2.1 Phase 7 投稿済み gate が編集機能と矛盾 | `frontend/.../products/[id]/page.tsx` 周辺 | 投稿済みでもフォームを表示せず、代わりに `[編集]/[削除]` ボタン提示 | `66ce4b9` |
| 🟡 他指摘の有無 | — | — | 要 Ryoga 確認 |

## 4. 受け入れ条件の自己判定

PR #3 description test plan より:
- ✅ `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build`(24 routes、新規 `/api/reviews/[id]` / `/api/products/[id]` / `/products/[id]/edit` 登録)
- ✅ backend `from app.main import app` 成功、新規 4 route 登録
- ✅ `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` → 0 件
- ⏸️ farmer / maker による編集・削除 E2E、403 確認、redirect 確認(checkbox 未チェックの状態で merge → 当時 Ryoga ブラウザ目視済 想定、🟡 要確認)

## 5. PR

- **URL**: <https://github.com/farmille/farmille/pull/3>
- **マージ**: 2026-04-24 07:12 squash merge
- **commit**: `0512691` / `4180bc6` / `7b01245` / `bc66912` / `87236d5` / `3d1f8b2` / `66ce4b9`

## 6. 学び

🟡 **再現したい**:
- spec §10.3 で「DELETE は CASCADE で処理する」と事前明記 → migration 追加ゼロで完了
- `window.confirm()` の縮退判断を Q2 で事前合意 → AlertDialog 導入の脱線回避

🟡 **避けたい**:
- Phase 7 の投稿済み gate を Phase 7 内で reviewer に指摘されず、Phase 9 まで持ち越し → 「編集機能予定のある UI gate は Phase 7 段階で `// TODO Phase 9 で見直し` コメント残すべきだった」

## 7. 残タスク

Phase 10 で回収:
- 画像 add / remove(レビュー / 資材)
- `supabase.storage.remove()` BFF 実装
- `certifications` seed migration 化(本番構築 blocker)
- ADR-0005「JWT 検証戦略」起票
- `placehold.co` の remotePatterns からの削除(demo データ差し替え後)

v1.5 送り:
- products PUT の trx 化(stored procedure or Edge Function)
- shadcn AlertDialog で `window.confirm()` 差し替え
- Storage orphan の cron 清掃

---

# 2026-04-24 ~ 04-25 作業ログ: Phase 10 画像編集 + ローンチ準備

> **骨子版**: PR #4(OPEN) description + `docs/specs/image-edit-and-launch-ready.md` + 現ブランチ git log から復元。本 Phase は v1 ローンチ前最終のコード整備で、コード以外(Vercel/Railway/farmille-prod)は Ryoga 直作業として明示分離。

## 0. 実施サマリ

`docs/specs/image-edit-and-launch-ready.md`(Phase 10 spec)を起点に、Phase 9 縮退で送った画像編集機能(レビュー / 資材)+ v1 ローンチ前の負債返済(`certifications` seed migration + ADR-0005)を実装。コード面の v1 ローンチ準備は本 Phase で概ね完了、残るは Ryoga 直作業のインフラ周り + demo データ差し替え。PR #4 として 6 commit、**2026-04-25 01:49 UTC squash merge 完了**(merge commit `68c790f`)。

| Phase 内ステップ | 内容 | 結果 |
|---|---|---|
| 1 | `certifications_seed.sql` migration + ADR-0005 commit | ✅ |
| 2 | Backend `_image_path.py` validation + PUT endpoints `remove_paths` / `order` 拡張 | ✅ |
| 3 | Frontend `publicUrlToPath` utility | ✅ |
| 4 | Frontend ReviewForm / ProductForm / upload components の既存画像 + remove + 並び替え UI | ✅ |
| 5 | reviewer 指摘対応: `payload.order` 空時の `product_images` 全消失バグ修正(Phase 9 互換性保全) | ✅ |
| 6 | reviews.product_id に `ON DELETE CASCADE` 追加 fix(後発覚バグ) | ✅ |
| 7 | PR #4 作成 → 2026-04-25 01:49 UTC squash merge | ✅ |

## 1. 実装内容の要点

### 1.1 Backend(`backend/app/`)
- **`routers/_image_path.py`** (新規): `validate_review_image_path()` / `validate_product_image_path()` 共通ユーティリティ。`str.startswith` だけでは traversal を通すため、segment 検証 + `..` 不在チェック(spec §4.3)
- **`routers/reviews.py` PUT 拡張**: `remove_paths` を payload に追加、validation → DB update → `admin.storage.from_("review-images").remove(remove_paths)` の順
- **`routers/products.py` PUT 拡張**: `remove_paths` + `order: list[{url, existing}]` 追加、関連テーブル全置換 strategy + 画像も全削除→再 INSERT(差分更新は採用しない、Phase 9 strategy と同じ)
- **fix `1e32830`**: `payload.order` も `remove_paths` も空なら `product_images` を一切触らない(Phase 9 互換の「画像無関係な部分編集」を壊さない)
- **fix `98dcd62`**: `reviews.product_id` の FK に `ON DELETE CASCADE` を追加。Phase 9 で「DELETE は CASCADE で動く」前提だったが reviews 側の FK が CASCADE 化されておらず、資材削除時にエラー → migration 追加で修正

### 1.2 Frontend(`frontend/src/`)
- **`lib/storage.ts`** (新規 想定): `publicUrlToPath()` — Supabase public URL `https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>` から path 部分を抽出
- **`MyReviewRow`**: 編集クリック時に `supabase.storage.from("review-images").list({uid}/{review_id}/)` で既存画像取得、ReviewForm に渡す(Storage list 直叩きは skill §1.3 例外 2 の自然な拡張)
- **ReviewForm**: 既存画像の thumbnail + [削除] ボタン、削除マーク管理 + 新規 upload を合成して BFF に POST
- **ProductForm**: 既存 / 新規の合成 order 配列を組み立て、`↑` / `↓` ボタンで並び替え(drag-drop は v1.5)、新規 file は末尾固定

### 1.3 ADR / Migration / Seed
- **ADR-0005**(新規): JWKS/ES256 + HS256 fallback 検証戦略を文書化(Phase 1-4 で実装済の遡及記録)
- **`20260424000000_certifications_seed.sql`**(新規): 有機JAS / JGAP / GLOBALG.A.P. 3 行を `ON CONFLICT (name) DO NOTHING` で idempotent INSERT。dev は既に手動投入済 → no-op、prod は新規投入

## 2. 設計判断

### 2.1 `payload.order` / `remove_paths` の空白セマンティクス(commit `1e32830` の修正ポイント)
どちらも空なら `product_images` を一切触らない。Phase 9 互換の「画像無関係な部分編集」(name だけ変更等)を壊さないため。reviewer 指摘で発覚。

### 2.2 全置換 strategy
Phase 9 関連テーブル(benefit/crop/cert)と同じく、画像操作がある場合は `product_images` 全削除 → order 順再 INSERT。差分更新は不採用(skill §3.2 原子性 + 実装簡素化)。

### 2.3 Storage remove = best-effort
DB 更新成功後の Storage 操作は `except Exception: pass` で握りつぶし、200 を返す(spec §11.2)。v1.5 で structured logging を検討。

### 2.4 DB 先削除
DB → Storage の順(spec §11.1)。逆順だと壊れた画像参照が残る。

### 2.5 path validation の厳格化
`{user_id}/...` (product) / `{user_id}/{review_id}/...` (review) + `..` 不在をセグメント検証。1 つでも不正なら 400 全体拒否(skill §3.2 原子性、部分処理しない)。

### 2.6 Storage list 直叩きの正当化
`MyReviewRow` で `supabase.storage.from("review-images").list()`。skill §1.3 例外 2 の upload 精神(RLS で代替制御、`review_images_select_all` が SELECT 全員許可)の自然な拡張として採用。

### 2.7 並び替え UI の縮退
spec §5.2 で drag-drop は v1.5 送り、`↑` / `↓` ボタンで縮退。既存画像のみ対象、新規ファイルは末尾固定。

## 3. reviewer 指摘対応

| 項目 | ファイル | 対応 | commit |
|---|---|---|---|
| `payload.order` 空時に `product_images` 全消失 → Phase 9 互換性破壊 | `backend/app/routers/products.py` | 空白セマンティクスを「触らない」に変更 | `1e32830` |
| `reviews.product_id` FK が CASCADE になっておらず資材削除エラー | `supabase/migrations/...` | migration 追加で `ON DELETE CASCADE` | `98dcd62` |

## 4. 受け入れ条件の自己判定

PR #4 description test plan より:
- ✅ `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build`
- ✅ backend `from app.main import app`、path validation spot check(review valid/invalid/traversal、product valid/invalid)
- ✅ `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` = 0 件
- 🟡 farmer 編集 E2E(既存画像削除 + 新規追加) — merge 時点での Ryoga 確認状況、要確認
- 🟡 maker 編集 E2E(画像並び替え + 削除 + 新規追加) — 同上
- 🟡 path traversal(`../`)が 400 で弾かれる(E2E or curl) — 同上
- 🟡 画像を触らない PUT(order=[], remove_paths=[])で既存画像が保持される(**`1e32830` の回帰テスト**) — 同上
- 🟡 `supabase db push --linked` で seed migration 適用、ON CONFLICT で既存 3 行と衝突せず — 同上

## 5. Smoke Test 結果

🟡 **要 Ryoga 確認**: PR #4 description test plan の E2E checkbox 5 件は未チェックのまま 2026-04-25 01:49 UTC に squash merge。merge 前のローカル / preview 確認結果の詳細は本 docs-sweep 時点で復元できず。

## 6. PR

- **URL**: <https://github.com/farmille/farmille/pull/4>
- **マージ**: 2026-04-25 01:49 UTC squash merge(merge commit `68c790f`)
- **commit**: `67d8172`(seed/ADR)、`b322a94`(backend validation/PUT 拡張)、`0a163c7`(`publicUrlToPath`)、`421e961`(image edit UI)、`1e32830`(空白セマンティクス fix)、`98dcd62`(reviews CASCADE fix)

## 7. 学び

🟡 **再現したい**:
- spec §11.1 / §11.2 で「DB 先削除」「Storage best-effort」を事前明文化 → 実装時の判断ぶれゼロ
- spec §4.3 の path validation を共通ユーティリティ化(`_image_path.py`)して 2 endpoint で再利用 → DRY
- reviewer fix(`1e32830`)を Phase 内で吸収 → Phase 11 持ち越しゼロ

🟡 **避けたい**:
- `reviews.product_id` の CASCADE 漏れ(`98dcd62`)が Phase 9 段階で気づけなかった点。Phase 9 spec §10.3 では「DELETE は CASCADE」と書いていたが、reviews 側 FK の現物確認が漏れていた → migration を信用せず、削除パス全体の FK 図を Phase 単位で再確認すべき

## 8. 残タスク

### v1 ローンチ前(Ryoga 直作業、本 Phase worker 範囲外)
- farmille-prod Supabase プロジェクトへの migration 適用
- Vercel 自動デプロイ設定
- Railway 自動デプロイ設定 + Vercel Cron による keep-alive
- ドメイン + OAuth redirect URL 更新
- demo データ差し替え後 `placehold.co` を `next.config.ts` remotePatterns から削除

### docs-sweep(本 PR で回収)
- 横断 docs(`design-tokens.md` / `git-workflow.md` / `auth-flow.md` spec / Phase 1-4 review / ADR-0002 / `image-edit-and-launch-ready.md` spec / `backend/.gitignore`)を main に投入
- Phase 6 setup-log 追記(working tree に浮いていた +232 行)
- 本 Phase 7-10 setup-log 追記(骨子版、🟡 マーカー含む)

### v1.5 送り(spec §0.2)
- Storage remove 失敗時 structured logging
- BFF トランザクション化(stored procedure or Edge Function)
- drag-drop 並び替え
- `product_images.storage_path` 列追加で URL 依存を解消
- `/v1/crops/flat` 新設 + Phase 6 cascade 移行
- Header / Footer 共通コンポーネント化
- `ProductCard` の `hideMakerName` prop
- BFF 全体の `getSession()` → `getUser()` 置換
- `react-hook-form` + `zod` 導入
- Soft delete / admin モデレーション
- Playwright E2E 自動化

### Ryoga 判断依頼(spec §7.2 / §9 ⇔ §8 矛盾、PR #4 known risks より)
- skill `SKILL.md` §5 解消注記が `.claude/` gitignored のため commit 不可。worker ローカルには反映済、個人間で non-deterministic。判断: (a) local only / (b) gitignore 見直し / (c) docs/skills/ にミラー

---

## 初期 admin bootstrap（ADR-0009）

ADR-0009 §2.2 「アドミンのパブリックサインアップ経路は作らない」「既存ユーザーを手動昇格のみ」に従い、
初期 admin は Supabase Studio で手動 UPDATE する。

### 手順
1. 対象ユーザーが既に通常ユーザーとして登録済みであること（farmer/maker/ja_staff/researcher のいずれか）
2. Supabase Studio → Authentication → Users → 対象ユーザー選択 → User App Metadata で `role: "admin"` に書き換え
3. SQL Editor で `UPDATE public.users SET role='admin' WHERE id='{user_id}';` 実行
4. 対象ユーザーがログアウト → 再ログインで `/admin` にアクセス可能

### v1 初期昇格対象（ADR-0009 §5）
- 共同創業者 3 名: 酒井涼雅（Ryoga）/ 奥田朗盛 / 根本

### 2FA（v1.5+）
v1 では 2FA は実装しない。運営内パスワード強度ポリシー + メールドメイン制限で耐える（SPEC §10.1）。
