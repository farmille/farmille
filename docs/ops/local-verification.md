# ローカル検証手順

刷新後のアプリを手元で動かして全画面を確認するための手順。所要5分（初回のみ Supabase の起動に数分）。

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
| 出品者（メーカー） | `/sellers/login` | ログイン ID `demo-maker` |
| 出品者（JA） | `/sellers/login` | ログイン ID `demo-ja` |
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
| 出品者ページ | `/sellers/33333333-3333-4333-8333-333333333333` |
| 公開プロフィール | `/users/22222222-2222-4222-8222-222222222222` |
| 登録・ログイン | `/signup`・`/login`・`/password-reset` |
| 出品者申請 | `/sellers/apply` |

**一般ユーザー（`shiosai@example.com`）**：マイページ `/me`（自分の投稿・検討リスト・参考になった の3棚）／プロフィール編集 `/me/edit`／検討リスト `/me/saved` → 比較 `/me/saved/compare`／投稿 `/post` → レビュー・使用レポート

**出品者（`demo-maker`）**：ダッシュボード `/dashboard` → 自社資材の一次情報編集・エビデンス・分類変更申請／記事管理 `/dashboard/articles`

**運営（`admin@example.com`＋TOTP）**：`/admin`／出品者審査 `/admin/sellers`（審査中1件）／資材 `/admin/materials`／タグ `/admin/tags`／通報 `/admin/reports`（未処理1件）／編集局 `/admin/usage-reports`（確認待ち1件）

## 5. 通した方がよいフロー

1. 未ログインで資材詳細 →「レビューを書く」→ ログインへ誘導される
2. 一般ユーザーでレビュー投稿 → 資材詳細の評価・件数が変わる → 編集 → 削除で戻る
3. 使用レポートを下書き保存 → 提出 → 運営の編集局で公開 → `/reports/[id]` に出る
4. `/sellers/apply` から申請 → 運営が承認 → 発行された ID とパスワードで `/sellers/login`
5. 出品者で一次情報を編集 → 公開側の資材詳細に反映される
6. レビューを通報 → 運営が対応 → 対象が公開側から消える

## 6. 既知の挙動

- 資材マスタはローカル開発用の15件のみ（本番相当の381件は `supabase login` 後に投入する。`docs/ops/cutover-runbook.md` §1.3）
- 一部の資材画像は外部サイトへの直リンクで、リンク切れだと代替アイコンが出る（Storage へのリホストは本番投入時に実施）
- 存在しない資材 ID を開くと画面には「資材が見つかりません」と出るが、HTTP ステータスは 200 になる（Next.js のストリーミング配信の仕様。SEO 上の扱いは要検討事項として記録）
- メール確認・パスワード再設定のメールは Mailpit（http://127.0.0.1:54324 ）で受け取る。上の `-x` 付き起動では Mailpit を除外しているため、メールを見るときは除外指定から `inbucket` を外して起動する
