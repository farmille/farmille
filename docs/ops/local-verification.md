# ローカル検証手順

刷新後のアプリを手元で動かして全画面を確認するための手順。

## 0. worktree の準備

新しい worktree では、最初に次を流す。

```bash
pnpm setup:worktree
```

- 本体チェックアウトの `.env.local` を worktree 直下へ写す。worktree に `.env.local` が既にあれば上書きしない。Claude の起動ラッパーで立てた dev サーバーは worktree の外を読めないため、写しが要る
- `src/env.ts` の必須値（`pnpm build` が要る `NEXT_PUBLIC_SITE_URL` を含む）がそろっているかを確かめ、足りなければ止まる
- `pnpm install --frozen-lockfile`（Panda の codegen を含む）と Playwright の Chromium の導入
- `pnpm setup:hooks` で push 前の検査を登録する
- 最後に `pnpm check:migrations` を流す

`pnpm check:migrations` は、`NEXT_PUBLIC_SUPABASE_URL` のポートを公開している Supabase のコンテナを Docker から探し、適用済みの migration と `supabase/migrations/` を突き合わせる。接続先は環境変数を優先し、無ければ `.env.local` の値を使う。DB には何も適用しない。

- 遅れていれば、未適用のファイルと適用のコマンドを出して非0で終わる。適用済みの最新より古いファイルが残っているときは、コマンドに `--include-all` が付く
- このチェックアウトに無い migration が DB にあるとき（別の worktree で適用したもの）も非0で終わる。この状態では `migration up` が履歴の不一致で止まるので、適用のコマンドは出さない。そのファイルが main にあれば worktree を main に追随させ、無ければ DB の扱いをユーザーと決める

- ホームが `container_type_id` 不在などの「internal」で落ちたら、まずこれを流す。既存のボリュームから起動した Supabase には、後から足した migration が入らない
- ローカルの DB は worktree 間で共有している。適用は確認を取らずに行ってよい
- 別の worktree にしか無い migration を当てると、他の worktree の `pnpm check:migrations` はその版を「このチェックアウトに無い」として止まる。その migration を入れたブランチが main に入れば、main に追随すると解ける。急ぐ場合は、そのブランチを取り込んで確かめる。E2E は DB を作り直すので、この状態でも止まらない
- 手元の Supabase が `127.0.0.1:58321`／`58322` のような別ポート（colima VM への ssh 転送）で動いていても、コマンドが出す `--db-url` をそのまま使える

### push 前の検査

既存の clone では `pnpm setup:hooks` を1回実行する。以後、push 前に必要な Storybook・E2E 検査が走る。全件を手動で確かめるときは `pnpm test:browser:local` を使う。初回設定と検査対象の決め方は [CI と push 前の検査](ci.md) を参照する。

### E2E

```bash
pnpm test:e2e:local
```

`playwright.config.ts` の決まりで、E2E は `127.0.0.1:54321` の Supabase（`supabase/config.toml` で起動したもの）にだけ流せる。global-setup が E2E 用のデータを消して運営アカウントを作るので、ほかの DB には流さない。`pnpm test:e2e:local`（`tools/dev/e2e-local.sh`）は次を順に行い、途中で止まれば理由と手順を出して非0で終わる。

- `supabase status` で 54321 のスタックが起動しているかを確かめる
- 手動の Browser checks（`.github/workflows/browser-checks.yml`）でも使う環境変数を export する。`.env.local` が `58321` など別のスタックを指していても、export した値が優先される
- `supabase db reset` で、54321 の DB をこのチェックアウトの migration と `supabase/seed.sql` で作り直し、`pnpm check:migrations` で合っていることを確かめる
- 資材マスタが無ければ `tools/migration/materials-v2-seed.sql` を入れる
- `pnpm exec playwright test` を流す。引数はそのまま渡す（例：`pnpm test:e2e:local e2e/04-search.spec.ts`）

Supabase の起動・停止は、スクリプトの中では行わない。起動は、スクリプトが出すコマンドで、確認を取らずに行ってよい。DB のボリューム `supabase_db_farmille` は worktree 間で共有していることに注意する。

54321 の DB は E2E 専用として扱い、E2E のたびに作り直す。別のブランチの migration が当たっていても E2E は止まらないが、手で入れたデータやデモアカウントのパスワードは消える。開発中の画面で 54321 を使っているときは、E2E のあとに `pnpm check:migrations` と「2. データを入れ直したいとき」で戻す。

## 1. 起動

```bash
npx --yes supabase@2.120.0 start -x studio,edge-runtime,realtime,imgproxy,logflare,vector
cp .env.example .env.local   # 初回のみ
pnpm dev
```

- `.env.local` の `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`・`SUPABASE_SECRET_KEY` は、`npx supabase status` の `API_URL`・`ANON_KEY`・`SERVICE_ROLE_KEY` に合わせる。必須の変数は `src/env.ts` が起動時に検証する。`pnpm build` も `NEXT_PUBLIC_SITE_URL` が無いと失敗する
- worktree（`.claude/worktrees/` 配下）では、worktree 直下に `.env.local` を置く。Claude の起動ラッパーは worktree の外のファイルを読めない
- ブラウザで http://localhost:3007 。

## 2. データを入れ直したいとき

```bash
# スキーマと supabase/seed.sql（一般・メーカーのデモアカウント）を初期化
npx --yes supabase@2.120.0 db reset
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f tools/migration/materials-v2-seed.sql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f tools/dev/seed-home-demo.sql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f tools/dev/seed-demo.sql
node --env-file=.env.local tools/dev/create-local-admin.ts admin@example.com   # 運営アカウントを作る
node --env-file=.env.local tools/dev/seed-demo.ts   # デモアカウントのパスワードを揃える
```

## 3. ログイン情報（ローカル専用）

`seed-demo.ts` を流すと、パスワードはすべて `Farmille#Local2026` になる。

| 役割 | 入口 | ID |
|---|---|---|
| 一般ユーザー | `/login` | `shiosai@example.com` |
| メーカー1 | `/sellers/login` | ログイン ID `demo-maker` |
| メーカー2 | `/sellers/login` | ログイン ID `demo-bio` |
| 運営 | `/login` → `/admin` | `admin@example.com` |

運営は初回に2要素認証（TOTP）の登録が必要。`/admin` へアクセスすると登録画面へ誘導されるので、認証アプリ（1Password・Google Authenticator 等）で QR を読み取って6桁を入力する。登録済みの状態を捨ててやり直すときは次を実行する。

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "delete from auth.mfa_factors where user_id = (select id from auth.users where email='admin@example.com');"
```

## 4. 画面一覧（確認の順路）

**公開（ログイン不要）**

| 画面 | URL |
|---|---|
| ホーム | `/` |
| 資材検索 | `/search` |
| 資材詳細 | `/materials/11111111-1111-4111-8111-111111111111` |
| 感想口コミ全件 | 資材詳細の「もっと見る（全N件）」 |
| メーカーの記事 | 資材詳細の「メーカーの記事」 |
| 実証詳細レポート | `/reports/55555555-5555-4555-8555-555555555555` |
| 記事一覧・詳細 | `/articles` |
| メーカーページ | `/sellers/33333333-3333-4333-8333-333333333333` |
| 公開プロフィール | `/users/22222222-2222-4222-8222-222222222222` |
| 登録・ログイン | `/signup`・`/login`・`/password-reset` |
| メーカー申請 | `/sellers/apply` |

**一般ユーザー（`shiosai@example.com`）**：マイページ `/me`／プロフィール編集 `/me/edit`／お気に入り `/me/saved` → 比較 `/me/saved/compare`／投稿 `/post`

**メーカー（`demo-maker`）**：ダッシュボード `/dashboard` → 製品情報の管理 `/dashboard/materials`／各種お手続き `/dashboard/applications`／記事管理 `/dashboard/articles`／会社紹介 `/dashboard/profile`

**運営（`admin@example.com`＋TOTP）**：`/admin`／メーカー確認 `/admin/sellers`／企業からの申請 `/admin/company-applications`／資材の登録・編集 `/admin/materials`／製品情報の表現確認 `/admin/materials/expressions`／タグ・作物マスタ `/admin/tags`／通報 `/admin/reports`／実証詳細レポート編集局 `/admin/usage-reports`

## 5. 通した方がよいフロー

1. 未ログインで資材詳細 →「感想口コミを書く」→ ログインへ誘導される
2. 一般ユーザーで感想口コミを投稿 → 資材詳細の評価・件数が変わる → 編集 → 削除で戻る
3. 実証詳細レポートを下書き保存 → 提出 → 運営の編集局で公開 → `/reports/[id]` に出る
4. `/sellers/apply` から申請 → 運営が承認 → Mailpit に届いた案内でパスワードを設定し、ログイン ID で `/sellers/login`
5. メーカーで資材ページの原稿を保存 → 表現確認へ送信 → 運営が `/admin/materials/expressions` で公開 → 公開側の資材詳細に反映される
6. 感想口コミを通報 → 運営が対応 → 対象が公開側から消える

## 6. 既知の挙動

- 資材マスタはローカル開発用の14資材だけ（`tools/migration/README.md`）
- 存在しない資材 ID を開くと画面には「資材が見つかりません」と出るが、HTTP ステータスは 200 になる（Next.js のストリーミング配信の仕様。SEO 上の扱いは要検討事項として記録）
- メール確認・パスワード再設定のメールは Mailpit（http://127.0.0.1:54324 ）で受け取る
