# ローカル検証手順

刷新後のアプリを手元で動かして全画面を確認するための手順。所要5分（初回のみ Supabase の起動に数分）。

## 0. worktree の準備

新しい worktree では、最初に次を流す。

```bash
pnpm setup:worktree
```

- 本体チェックアウトの `.env.local` を worktree 直下へ写す。worktree に `.env.local` が既にあれば上書きしない。Claude の起動ラッパーで立てた dev サーバーは worktree の外を読めないため、写しが要る
- `src/env.ts` の必須値（`pnpm build` が要る `NEXT_PUBLIC_SITE_URL` を含む）がそろっているかを確かめ、足りなければ止まる
- `pnpm install --frozen-lockfile`（Panda の codegen を含む）と Playwright の Chromium の導入
- 最後に `pnpm check:migrations` を流す

`pnpm check:migrations` は、`NEXT_PUBLIC_SUPABASE_URL` のポートを公開している Supabase のコンテナを Docker から探し、適用済みの migration と `supabase/migrations/` を突き合わせる。接続先は環境変数を優先し、無ければ `.env.local` の値を使う。DB には何も適用しない。

- 遅れていれば、未適用のファイルと適用のコマンドを出して非0で終わる。適用済みの最新より古いファイルが残っているときは、コマンドに `--include-all` が付く
- このチェックアウトに無い migration が DB にあるとき（別の worktree で適用したもの）も非0で終わる。この状態では `migration up` が履歴の不一致で止まるので、適用のコマンドは出さない。そのファイルが main にあれば worktree を main に追随させ、無ければ DB の扱いをユーザーと決める

- ホームが `container_type_id` 不在などの「internal」で落ちたら、まずこれを流す。既存のボリュームから起動した Supabase には、後から足した migration が入らない
- ローカルの DB は worktree 間で共有しているので、適用はユーザーの確認を取ってから行う
- 手元の Supabase が `127.0.0.1:58321`／`58322` のような別ポート（colima VM への ssh 転送）で動いていても、コマンドが出す `--db-url` をそのまま使える

### E2E

`playwright.config.ts` の決まりで、E2E は `127.0.0.1:54321` の Supabase（`supabase/config.toml` で起動したもの）にだけ流せる。global-setup が E2E 用のデータを消して運営アカウントを作るので、ほかの DB には流さない。`.env.local` が別のポートを指していても、CI の E2E ジョブ（`.github/workflows/ci.yml`）と同じ環境変数を export すればそちらが優先される。`pnpm check:migrations` も export した接続先を確かめる。

```bash
npx --yes supabase@2.120.0 start -x studio,edge-runtime,realtime,imgproxy,logflare,vector
eval "$(npx --yes supabase@2.120.0 status -o env)"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY" SUPABASE_SECRET_KEY="$SERVICE_ROLE_KEY"
export SMTP_URL="smtp://127.0.0.1:54325" MAIL_FROM="Farmille <noreply@example.test>" \
  AUTH_EMAIL_HOOK_SECRET="v1,whsec_bG9jYWwtZmFybWlsbGUtZW1haWwtaG9vay10ZXN0LWtleQ=="
pnpm check:migrations
psql "$DB_URL" -tAc "select count(*) from materials"   # 0 件なら次の行で資材マスタを入れる
psql "$DB_URL" -v ON_ERROR_STOP=1 -f tools/migration/materials-v2-seed.sql
pnpm test:e2e
```

- `supabase start` は worktree 間で共有している DB を起動する。起動と migration の適用は、ユーザーの確認を取ってから行う
- `NEXT_PUBLIC_SITE_URL` は `playwright.config.ts` が `http://localhost:3007` に固定するので export しなくてよい

## 1. 起動

```bash
cd /Users/shun/Documents/farmille/farmille
npx supabase start -x studio,analytics,vector,edge-runtime,functions,inbucket,imgproxy,realtime
pnpm dev
```

- Docker のディスクに余裕がある場合は `-x` 以下を外して Studio 込みで起動してよい
- `.env.local` はローカル既定値で作成済み（gitignore 対象）。値がずれたら `npx supabase status` の `ANON_KEY` / `SERVICE_ROLE_KEY` と突き合わせる
- ブラウザで http://localhost:3000 。**スマホ幅（375px）で見るのが正**（Chrome DevTools のデバイスツールバー → iPhone SE 等）

## 2. データを入れ直したいとき

```bash
# スキーマごと初期化 → 資材15件 → 運用待ちデータ（審査中・編集局待ち・未処理通報）
npx supabase db reset
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f tools/migration/materials-v2-seed.sql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f tools/dev/seed-demo.sql
node --env-file=.env.local tools/dev/seed-demo.ts   # デモアカウントのパスワードを揃える
```

## 3. ログイン情報（ローカル専用）

パスワードはすべて `Farmille#Local2026`。

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
| レビュー全件 | 資材詳細の「レビューをすべて見る」 |
| 関連記事 | 資材詳細の「その他の記事」 |
| 使用レポート | `/reports/55555555-5555-4555-8555-555555555555` |
| 記事一覧・詳細 | `/articles` |
| メーカーページ | `/sellers/33333333-3333-4333-8333-333333333333` |
| 公開プロフィール | `/users/22222222-2222-4222-8222-222222222222` |
| 登録・ログイン | `/signup`・`/login`・`/password-reset` |
| メーカー申請 | `/sellers/apply` |

**一般ユーザー（`shiosai@example.com`）**：マイページ `/me`（自分の投稿・検討リスト・参考になった の3棚）／プロフィール編集 `/me/edit`／検討リスト `/me/saved` → 比較 `/me/saved/compare`／投稿 `/post` → レビュー・使用レポート

**メーカー（`demo-maker`）**：ダッシュボード `/dashboard` → 自社資材の確認・追加／変更／掲載終了申請・エビデンス管理／記事管理 `/dashboard/articles`

**運営（`admin@example.com`＋TOTP）**：`/admin`／メーカー審査 `/admin/sellers`（審査中1件）／資材 `/admin/materials`／タグ `/admin/tags`／通報 `/admin/reports`（未処理1件）／編集局 `/admin/usage-reports`（確認待ち1件）

## 5. 通した方がよいフロー

1. 未ログインで資材詳細 →「レビューを書く」→ ログインへ誘導される
2. 一般ユーザーでレビュー投稿 → 資材詳細の評価・件数が変わる → 編集 → 削除で戻る
3. 使用レポートを下書き保存 → 提出 → 運営の編集局で公開 → `/reports/[id]` に出る
4. `/sellers/apply` から申請 → 運営が承認 → 発行された ID とパスワードで `/sellers/login`
5. メーカーで資材変更を申請 → 運営が承認 → 公開側の資材詳細に反映される
6. レビューを通報 → 運営が対応 → 対象が公開側から消える

## 6. 既知の挙動

- 資材マスタはローカル開発用の15件のみ（本番相当の381件は `supabase login` 後に投入する。`docs/ops/cutover-runbook.md` §1.3）
- 一部の資材画像は外部サイトへの直リンクで、リンク切れだと代替アイコンが出る（Storage へのリホストは本番投入時に実施）
- 存在しない資材 ID を開くと画面には「資材が見つかりません」と出るが、HTTP ステータスは 200 になる（Next.js のストリーミング配信の仕様。SEO 上の扱いは要検討事項として記録）
- メール確認・パスワード再設定のメールは Mailpit（http://127.0.0.1:54324 ）で受け取る。上の `-x` 付き起動では Mailpit を除外しているため、メールを見るときは除外指定から `inbucket` を外して起動する
