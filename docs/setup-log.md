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
