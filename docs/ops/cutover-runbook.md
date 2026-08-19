# 本番切替 runbook（旧システム → v2）

作成日：2026-07-28（T-53）
実行者：Shun（人間）。上から順に実行する。
対象：旧システム（Vercel の旧 Next.js アプリ ＋ Cloud Run の FastAPI `farmille-api` ＋ 旧スキーマ）から、新システム（Next.js 集約 ＋ Supabase v2 スキーマ）への切替。

正となる設計：[docs/rebuild/00-overview.md](../rebuild/00-overview.md)（D1・D2）／[03-architecture.md](../rebuild/03-architecture.md) §6／[05-cleanup.md](../rebuild/05-cleanup.md) §3／[security-notes.md](security-notes.md)。

## この runbook の読み方

- 各手順は「操作 → 検証 → ロールバック可否」の3点セットで書いてある。**検証が通らなければ次へ進まない。**
- `<PLACEHOLDER>` は環境ごとの値。§0 の表に「どこで確認するか」を書いた。値そのものはこの文書に書かない。
- **要確認** と付いた箇所は、この文書を書いた時点でリポジトリ内の情報から確定できなかったもの。実行時にダッシュボードや `gcloud` の出力で確認してから進む。
- 不可逆な操作には ⚠️ を付けた。⚠️ の直前で必ず一度手を止める。

### 段階と後戻りのしやすさ

| 章 | 内容 | 後戻り |
|---|---|---|
| 0〜1 | 前提チェック・バックアップ・エクスポート | 変更なし。いつでも中止できる |
| 2 | Supabase 鍵移行（新キー作成・JWT Signing Keys 移行） | 旧キーは有効なまま。環境変数を戻せば復帰できる |
| 3 | 本番 DB の v2 切替（旧テーブル DROP） | ⚠️ **後戻り不能点。**§1 のバックアップからのリストアだけが戻る手段 |
| 4 | Vercel 切替 | デプロイは Instant Rollback で戻せるが、DB は §3 で戻せない。実質は §3 と一体 |
| 5 | 旧システム廃止 | Cloud Run とバケットの削除は不可逆。切替が安定してから実施する |

**§3 に入る前に §1 のバックアップが取れていることを必ず確認する。**

---

## 0. 前提チェックリスト

すべて ✅ になってから §1 に進む。1つでも埋まらない場合は、そのアクセスを持つ人（[access-checklist.md](access-checklist.md)）に依頼して待つ。

### 0.1 プレースホルダの確認場所

| プレースホルダ | 内容 | どこで確認するか |
|---|---|---|
| `<PROD_PROJECT_REF>` | 本番 Supabase のプロジェクト参照 ID | Supabase ダッシュボードの URL（`https://supabase.com/dashboard/project/<ref>`）または Project Settings → General → Reference ID |
| `<PROD_DB_URL>` | 本番 Postgres への接続文字列 | Supabase → Project Settings → Database → Connection string → **Session pooler**（直結は IPv6 のみのことがあるため pooler を使う） |
| `<PROD_DB_PASSWORD>` | 本番 DB パスワード | 1Password。無ければ Project Settings → Database → Reset database password で再設定する（⚠️ 既存接続が切れる。旧 Cloud Run が生きている間は影響を確認してから） |
| `<GCP_PROJECT>` | GCP プロジェクト ID | `farmille-production`（access-checklist.md #5） |
| `<CLOUD_RUN_REGION>` | Cloud Run のリージョン | `asia-northeast1` と推定（旧 `tools/migration/legacy/prod_import_2026_06_09.py` の Cloud Run URL より）。**要確認**：`gcloud run services list` の出力で確定する |
| `<VERCEL_PROJECT>` | Vercel のプロジェクト名 | Vercel ダッシュボード → Projects。リポジトリルートを Root Directory に持つプロジェクト |
| `<SITE_URL>` | 本番の公開 URL | Vercel → Settings → Domains。`https://farmille.com` を想定（access-checklist.md #6）。**要確認**：apex か `www` か、正規化の向き |
| `<REPO_ROOT>` | ローカルのリポジトリ本体 | `/Users/shun/Documents/farmille/farmille` |

### 0.2 手元の環境

```bash
# Supabase CLI（未ログインなら supabase login。トークンは §5.6 で再発行するので、ここでは既存のままでよい）
npx supabase --version
npx supabase projects list          # 本番プロジェクトが一覧に出ること

# GCP
gcloud auth list                    # アカウントが ACTIVE であること
gcloud config get-value project     # farmille-production になっていること（違えば gcloud config set project <GCP_PROJECT>）
gcloud run services list            # farmille-api とそのリージョンが見えること（<CLOUD_RUN_REGION> を確定）

# Docker（supabase start に必要。Desktop が起動していること）
docker info | head -5

# psql（本番へ SQL を流す。無ければ brew install libpq）
psql --version

# Node / pnpm（資材変換スクリプトとアプリのビルド）
node --version                      # 24 系（CI と揃える）
pnpm --version                      # 11 系
```

### 0.3 権限

- [ ] Supabase 本番プロジェクトの Owner または Admin（API キー作成・JWT Signing Keys 操作・SQL Editor 実行に必要）
- [ ] Vercel の `<VERCEL_PROJECT>` で Production 環境変数を編集できる
- [ ] GCP `<GCP_PROJECT>` で Cloud Run 削除・Secret Manager 削除・Cloud Storage 削除・請求の変更ができる（Owner 相当。**要確認**：組織ポリシーにより請求のリンク解除が上位管理者権限になる場合がある。access-checklist.md の補足を参照）
- [ ] GitHub `farmille/farmille` に `main` へマージできる権限
- [ ] DNS（お名前.com）の操作が必要になった場合の連絡先を把握している（根本さん。CLI 代行不可）

### 0.4 事前の判断待ち事項

以下は切替そのものより前に**人間の判断が要る**。未決のまま §3 に入らない。

- [ ] **旧ユーザー・旧レビューを破棄してよいか**の最終確認（D1 で決定済みだが、実データを消す前に関係者へ再周知する）
- [ ] **商品画像の表示可否**（security-notes.md §3。無許諾転載に見えるリスクがあり v1 で判断が揺れた）。根本さんの最新判断を確認する
- [ ] **要確認**：`next.config.ts` の `images.remotePatterns` に残っている `placehold.co` と `images.unsplash.com`（デモ用の記載あり）を本番前に外すか。外す場合は §4 の前に別 PR で対応する
- [ ] **要確認**：本番 Supabase の SMTP が未設定のままでよいか（security-notes.md §3）。未設定だと signup 確認メールとパスワードリセットが不達になりうる。一般ユーザーの新規登録を切替直後から受け付けるなら、Resend 等の SMTP ＋ SPF/DKIM 設定を**先に**済ませる

---

## 1. 事前準備

### 1.1 凍結アナウンス

**操作**

1. 関係者（根本さん・Ryosei さん・奥田さん・Ryoga さん。連絡基盤は Slack）へ、切替日時・停止時間帯・**旧ユーザーと旧レビューを破棄すること**・切替後は旧 URL の API が消えることを通知する。
2. 凍結の宣言：アナウンス以降、旧システムの本番 DB・Studio・Cloud Run に対する書き込み操作を全員が止める。

**検証**

- 通知の既読／返信が関係者から取れている
- 凍結宣言後に旧 DB への書き込みが無いこと（§1.2 のバックアップ取得時刻より後の更新が無いこと）を、バックアップ後に念のため確認する

```sql
-- 旧スキーマの主要テーブルの最終更新（Supabase Studio → SQL Editor）
select 'products' as t, max(updated_at) from products
union all select 'reviews', max(updated_at) from reviews
union all select 'users', max(created_at) from users;
```

**ロールバック**：不要（通知の取り消しのみ）。

### 1.2 旧本番 DB の完全バックアップ ⚠️ 最重要

これが §3 以降の唯一の生命線。**取れていなければ絶対に先へ進まない。**

**操作**

```bash
# 作業ディレクトリ（リポジトリ外。git に入れない）
mkdir -p ~/farmille-cutover/backup && cd ~/farmille-cutover/backup

# 1) ロール・スキーマ・データを分けて取る（Supabase 推奨の3分割）
npx supabase db dump --db-url "<PROD_DB_URL>" --role-only  -f roles.sql
npx supabase db dump --db-url "<PROD_DB_URL>"              -f schema.sql
npx supabase db dump --db-url "<PROD_DB_URL>" --data-only  -f data.sql

# 2) 保険としてカスタム形式のフルダンプも取る（pg_dump 直）
pg_dump "<PROD_DB_URL>" -Fc -f farmille-prod-$(date +%Y%m%d-%H%M).dump

# 3) auth スキーマ（旧ユーザー）を単体でも退避しておく
pg_dump "<PROD_DB_URL>" -Fc -n auth -f farmille-prod-auth-$(date +%Y%m%d-%H%M).dump
```

さらに、Supabase ダッシュボード側のバックアップも確認する。

- Supabase → Database → Backups で、直近の自動バックアップの日時を控える
- **要確認**：本番プロジェクトのプランによって Point-in-Time Recovery（PITR）の有無が変わる。PITR が有効なら、切替直前のタイムスタンプを控えておく（リストア先として最も確実）

**検証**

```bash
ls -lh ~/farmille-cutover/backup           # 各ファイルが 0 バイトでないこと
pg_restore --list farmille-prod-*.dump | head -30   # 目次が読めること（壊れていない証拠）
grep -c "CREATE TABLE" schema.sql          # 旧41テーブル相当の CREATE TABLE があること
```

- ⚠️ ダンプには本番の PII と資材データが入る。**リポジトリ配下に置かない・git add しない**（security-notes.md §3 の `.gitignore` 漏れ事故）。保管は暗号化されたローカル領域か 1Password のファイル添付とする

**ロールバック**：不要（読み取りのみ）。

### 1.3 フル資材マスタと product_sources のエクスポート（T-12b の実行）

リポジトリ内の `tools/migration/materials-v2-seed.sql` は**開発用の15行シード**であり、本番には使えない（[tools/migration/README.md](../../tools/migration/README.md)「フル資材マスタへの差し替え」）。フルデータは本番 DB と gitignore 済み Excel にしかない（[T-12.md](../rebuild/tasks/T-12.md) 改訂注記）。

**操作**

1. 変換スクリプトが CSV ディレクトリ入力で要求するテーブルを、本番から CSV で取り出す。Supabase Studio → SQL Editor の結果を CSV ダウンロードするか、`psql` の `\copy` を使う。

```bash
mkdir -p ~/farmille-cutover/export && cd ~/farmille-cutover/export

for t in products maker_profiles product_types product_images \
         product_application_recipes product_crops crops \
         product_benefit_relations product_benefits product_sources; do
  psql "<PROD_DB_URL>" -v ON_ERROR_STOP=1 \
    -c "\copy (select * from public.$t) to '$t.csv' with (format csv, header)"
done

wc -l *.csv
```

2. `product_sources.csv` は `material_sources` への追補用。**現時点の `convert-materials-v2.mjs` は `material_sources` を出力しない**（README「フル投入前に次の作業が必要である」）。T-12b でこの変換を追加してから §3.4 の投入を行う。追加が未了なら §3 に進まず、T-12b を先に完了させる。

3. Excel 版のフルマスタ（gitignore 済み）を持っている場合は、CSV と件数・製品名を突き合わせて、どちらを正とするか決めてから使う。**数値の突合結果を報告に残す**（固定値 294 や 381 と比較しない。README のとおり、ダンプから抽出した実件数で照合する）。

**検証**

```bash
# 入力の実件数を控える（後の照合の基準になる）
for f in ~/farmille-cutover/export/*.csv; do echo "$(basename $f): $(($(wc -l < $f) - 1))"; done

# 変換を回し、レポートを確認する
cd <REPO_ROOT>
node tools/migration/convert-materials-v2.mjs \
  --input ~/farmille-cutover/export \
  --json-output ~/farmille-cutover/export/materials-v2-normalized.prod.json \
  --sql-output  ~/farmille-cutover/export/materials-v2-seed.prod.sql \
  --report-output ~/farmille-cutover/export/materials-v2-report.prod.json

# レポートの3点を目で見る：重複統合数・タグ対応の欠落・要確認フィールド
python3 -m json.tool ~/farmille-cutover/export/materials-v2-report.prod.json | head -60
```

4. ローカルで冪等性を確認する（README の手順。**リモートには一切繋がない**）。

```bash
cd <REPO_ROOT>
npx supabase start -x studio,analytics,vector,edge-runtime,functions,inbucket,imgproxy,realtime
npx supabase db reset
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 \
  -f ~/farmille-cutover/export/materials-v2-seed.prod.sql
# 2回目。件数が変わらず、エラーが出ないこと
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 \
  -f ~/farmille-cutover/export/materials-v2-seed.prod.sql
npx supabase stop --no-backup
```

**検証の合格条件**：末尾の照合 SELECT で `expected_*` と `actual_*` が一致し、2回流しても同じ値になること。

**ロールバック**：不要（本番は読み取りのみ・投入はローカル）。

### 1.4 旧テーブルの実在確認（DROP リストの突き合わせ）

リポジトリの旧 migration 27本からは41テーブルが読み取れるが、本番には Studio から手作りされたものが混ざっている可能性がある。**消す前に実物を数える。**

```sql
-- Supabase Studio → SQL Editor（本番）
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- ビュー・関数・トリガーも確認する
select table_name from information_schema.views where table_schema = 'public';
select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';
select tgname, tgrelid::regclass from pg_trigger where not tgisinternal and tgrelid::regclass::text like 'auth.%';

-- 適用済み migration の履歴（§3.3 で使う）
select version, name from supabase_migrations.schema_migrations order by version;

-- Storage バケットの現状（§3.5 で使う）
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;
select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' order by policyname;
```

**検証**：出力を `~/farmille-cutover/pre-drop-inventory.txt` に保存する。§3.2 の DROP リストと差分が無いこと。差分があれば、そのテーブルの中身を確認してから DROP リストに足す（**勝手に足さず、何のデータか確認する**）。

**ロールバック**：不要（読み取りのみ）。

---

## 2. Supabase 鍵移行

方針は [03-architecture.md](../rebuild/03-architecture.md) §6 と [security-notes.md](security-notes.md) §2。2026-07-04 の Cloud Build secret 誤アップロード事故により service_role キーと JWT secret はローテーション対象だが、現在の Supabase では legacy キーをその場で再生成できない。**新キーを作って新アプリをそこに乗せ替え、旧キーは §5 で止める。**

この章では旧キーを止めない。止めるのは §5.4／§5.5。旧 Cloud Run が動いている間に旧キーを無効化すると旧システムが即死するため、順番を守る。

> **要確認**：以下のダッシュボード上のタブ名・ボタン名は Supabase 側の UI 変更で変わりうる。ラベルが一致しない場合は、当該画面のヘルプリンクから公式手順を開いて読み替える。

### 2.1 新 API キーの作成

**操作**

1. Supabase ダッシュボード → 対象プロジェクト → **Project Settings → API Keys**。
2. **Publishable key**（`sb_publishable_…`）を作成する。これがクライアントに出る公開鍵で、旧 `anon` キーの置き換え。
3. **Secret key**（`sb_secret_…`）を作成する。名前は用途が分かるもの（例：`vercel-production`）にする。これが旧 `service_role` キーの置き換え。
4. Secret key は作成直後にしか全文が見られない。**その場で 1Password に保存する。**Publishable key は公開前提なので Google Doc（低機密）でよい（security-notes.md §3 の受け渡し経路）。

**検証**

```bash
# publishable key で PostgREST が応答すること（未ログイン読み取りは D6 で全公開）
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://<PROD_PROJECT_REF>.supabase.co/rest/v1/" \
  -H "apikey: sb_publishable_xxx"
# 200 系が返ること。401/403 ならキーが有効化されていない
```

- ダッシュボードの API Keys 一覧に、新旧の両方が「有効」として並んでいること（旧 anon／service_role がまだ生きていること）

**ロールバック**：新キーを Disable／削除するだけ。旧キーは触っていないので旧システムに影響しない。

### 2.2 JWT Signing Keys への移行

**操作**

1. Supabase ダッシュボード → **Project Settings → JWT Keys**（旧称 JWT Secret の画面）。
2. **「Migrate JWT secret」相当の操作**を実行する。これで、いままでの共有秘密（HS256）が「現在の署名鍵」として新方式の管理下に入り、次に使う **standby（待機）鍵**（非対称鍵）が生成される。
   - この時点では**まだ発行される JWT の署名鍵は変わらない**。アプリへの影響は無い。
3. standby 鍵が「Standby」状態で存在することを確認する。**Rotate はここでは押さない**（§5.5 で押す）。

**検証**

```bash
# 公開鍵セット（JWKS）が配信されていること
curl -s "https://<PROD_PROJECT_REF>.supabase.co/auth/v1/.well-known/jwks.json" | head -20
```

- JWT Keys の画面で「Current key」と「Standby key」が並んでいること
- ⚠️ 既存セッションが切れていないこと（旧アプリにログインしたまま画面を1つ開き、リロードしてログアウトされないことを確認する）

**ロールバック**：Standby 鍵を破棄する（**要確認**：UI 上で standby の破棄・再生成ができるか。できない場合でも、Rotate を実行しない限り現在の署名鍵は変わらないので実害はない）。

### 2.3 新キーが v2 アプリで通ることの先行確認

本番へ切り替える前に、**Vercel の Preview 環境**で新キーの疎通だけ確認しておくと §4 の失敗が減る。

**操作**

1. Vercel → `<VERCEL_PROJECT>` → Settings → Environment Variables → **Preview** スコープに、§2.1 の新キーを入れる（`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` に publishable、`SUPABASE_SECRET_KEY` に secret）。
2. `rebuild/m0` の Preview デプロイを開く。

**検証**：Preview で資材一覧が表示され、ログイン画面が 500 にならないこと。

> ⚠️ この時点の本番 DB はまだ旧スキーマなので、Preview アプリは「テーブルが無い」系のエラーになる。**確認できるのは「キーで認証が通っているか（401/403 でないか）」まで**。テーブル不在エラーは想定内。

**ロールバック**：Preview の環境変数を消す。本番へ影響しない。

---

## 3. 本番 DB の v2 切替

⚠️ **ここからが後戻り不能点。**§1.2 のバックアップと §1.3 のエクスポートが揃っていることを、もう一度目視で確認してから始める。

順番が重要。v2 の `reviews`・`articles`・`crops` は**旧テーブルと同名**なので、旧を DROP してからでないと v2 migration が失敗する。

### 3.1 旧アプリの停止（トラフィックを止める）

**操作**

1. Cloud Run `farmille-api` へのトラフィックを止める。削除はまだしない（§5.1 で行う）。

```bash
# 最小・最大インスタンスを 0 にして実質停止させる
gcloud run services update farmille-api \
  --project <GCP_PROJECT> --region <CLOUD_RUN_REGION> \
  --min-instances=0 --max-instances=0
```

   - **要確認**：`--max-instances=0` を受け付けない場合は、`gcloud run services update-traffic farmille-api --to-revisions=LATEST=0` か、IAM の `allUsers` invoker を外して 403 にする方法をとる。どちらも復旧可能な操作を選ぶ。
2. 旧 Vercel アプリはこのあと §4 で新アプリに置き換わるので、ここでは触らない（メンテナンス表示を出したい場合のみ、Vercel の該当プロジェクトを一時的に停止する）。

**検証**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://farmille-api-<...>.<CLOUD_RUN_REGION>.run.app/health"
# 応答が 5xx か接続不可になること（エンドポイント名は gcloud run services describe で確認）
```

**ロールバック**：`--min-instances`／`--max-instances` を元の値に戻す（元の値を事前に `gcloud run services describe farmille-api --format=export` で控えておく）。

### 3.2 旧テーブル・旧オブジェクトの DROP ⚠️

**操作**（Supabase Studio → SQL Editor。本番プロジェクトであることを URL で確認してから実行）

```sql
-- =========================================================================
-- 旧スキーマの撤去。実行前に §1.4 のインベントリと突き合わせること。
-- =========================================================================
begin;

-- (1) auth.users のトリガーを外す。これを残すと v2 の新規登録が
--     「public.users が無い」で失敗する。
drop trigger if exists on_auth_user_created on auth.users;

-- (2) storage.objects の旧ポリシー。v2 の farmille_storage_* とは名前が
--     衝突しないが、PERMISSIVE ポリシーは OR で効くため残すと権限が緩む。
drop policy if exists "avatars_select_all"          on storage.objects;
drop policy if exists "avatars_insert_farmer"       on storage.objects;
drop policy if exists "avatars_update_owner"        on storage.objects;
drop policy if exists "avatars_delete_owner"        on storage.objects;
drop policy if exists "product_images_select_all"   on storage.objects;
drop policy if exists "product_images_insert_maker" on storage.objects;
drop policy if exists "product_images_insert_admin" on storage.objects;
drop policy if exists "product_images_update_owner" on storage.objects;
drop policy if exists "product_images_delete_owner" on storage.objects;
drop policy if exists "review_images_select_all"    on storage.objects;
drop policy if exists "review_images_insert_reviewer" on storage.objects;
drop policy if exists "review_images_insert_admin"  on storage.objects;
drop policy if exists "review_images_update_owner"  on storage.objects;
drop policy if exists "review_images_delete_owner"  on storage.objects;
drop policy if exists "articles_hero_select_all"    on storage.objects;
drop policy if exists "articles_hero_insert_admin"  on storage.objects;
drop policy if exists "articles_hero_update_admin"  on storage.objects;
drop policy if exists "articles_hero_delete_admin"  on storage.objects;

-- (3) 旧テーブル41本。FK は cascade に任せる（v2 はまだ存在しないので
--     cascade が新スキーマを巻き込むことはない）。
drop table if exists
  public.article_products,
  public.articles,
  public.certifications,
  public.crop_categories_l1,
  public.crop_categories_l2,
  public.crops,
  public.farmer_profiles,
  public.featured_products,
  public.home_banners,
  public.ja_profiles,
  public.maker_profiles,
  public.periods,
  public.product_application_method_relations,
  public.product_application_methods,
  public.product_application_recipes,
  public.product_application_window_relations,
  public.product_application_windows,
  public.product_benefit_relations,
  public.product_benefits,
  public.product_certifications,
  public.product_composition_type_relations,
  public.product_composition_types,
  public.product_crops,
  public.product_images,
  public.product_prefectures,
  public.product_science_technologies,
  public.product_science_technology_relations,
  public.product_sources,
  public.product_types,
  public.products,
  public.researcher_profiles,
  public.review_benefit_relations,
  public.review_crops,
  public.review_period_relations,
  public.review_point_relations,
  public.review_points,
  public.reviews,
  public.user_crops,
  public.user_favorites,
  public.user_reports,
  public.users
cascade;

-- (4) 旧関数
drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_updated_at() cascade;

commit;
```

**検証**

```sql
-- public スキーマにテーブルが残っていないこと（0 行になること）
select table_name from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE';

-- auth のトリガーが消えていること（0 行）
select tgname from pg_trigger
where not tgisinternal and tgrelid = 'auth.users'::regclass;

-- storage の旧ポリシーが消えていること（0 行）
select policyname from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```

**ロールバック**：⚠️ **不可。**§1.2 のダンプからのリストア（§6.3）のみ。

### 3.3 migration 履歴の整合と v2 migration の適用

`supabase db push` は remote の `supabase_migrations.schema_migrations` と手元のファイルを突き合わせる。本番には旧 migration の版番号が残っている（あるいは Studio 適用のため空の）可能性があるので、**先に履歴を合わせる**。

**操作**

```bash
cd <REPO_ROOT>
git switch rebuild/m0    # main へのマージは §4.2。この時点では m0 が v2 migration の正
git status               # クリーンであること

# 1) 本番へ link する（link 先が dev のままだと事故る。security-notes.md §3）
npx supabase link --project-ref <PROD_PROJECT_REF>
npx supabase migration list --linked        # Local / Remote の対応を目で見る
```

出力の Remote 側に v2 以外（`2026041…`〜`2026061…` の旧版番号）が残っていたら、reverted として履歴から外す。

```bash
# 2) 旧版番号を reverted にする。§1.4 で控えた実際の一覧に対して行う
npx supabase migration repair --status reverted <旧版番号> [<旧版番号> ...]
npx supabase migration list --linked        # Remote 側が空になったことを確認
```

```bash
# 3) v2 migration を適用する。seed.sql はローカル専用なので --include-seed は付けない
npx supabase db push --linked
```

**要確認**：`migration repair` が期待どおり動かない場合の代替は、Studio の SQL Editor で `delete from supabase_migrations.schema_migrations where version < '20260726';` を実行してから push する。履歴テーブルを直接触るのでバックアップ済みであることを再確認すること。

**代替経路（CLI が使えない／リスクを取りたくない場合）**：Studio の SQL Editor に、`supabase/migrations/` の10ファイルを**ファイル名の昇順で1本ずつ**貼って実行する（security-notes.md §3 の「本番は Studio で個別適用が最安全」）。

```
20260726121216_init_accounts.sql
20260726121222_init_materials_tags.sql
20260726121227_init_posts.sql
20260726121233_init_collections_reports.sql
20260726121237_init_phase2_qa.sql
20260726121242_rls_policies.sql
20260726121248_views_and_aggregates.sql
20260726121253_seed_masters.sql
20260726135935_grant_service_role_dml.sql
20260728120000_add_seller_rejected_reason.sql
```

**検証**

```sql
-- v2 のテーブルが揃っていること（26 テーブル）
select count(*) as tables from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE';

select table_name from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name;

-- 公開ビュー4本
select table_name from information_schema.views where table_schema = 'public' order by table_name;
-- public_profiles / public_sellers / helpful_counts / view_counts_daily

-- RLS が全テーブルで有効であること（0 行であること）
select c.relname from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- app スキーマの権限判定関数
select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'app' order by p.proname;

-- マスタのシード（T-11。0 件なら seed_masters が適用されていない）
select (select count(*) from public.tags) as tags,
       (select count(*) from public.crops) as crops,
       (select count(*) from public.crop_groups) as crop_groups;
```

```bash
# スキーマ差分が無いこと（04 §4・05 §4 の完了条件）
npx supabase db diff --linked
# 出力が空であること
```

**ロールバック**：v2 テーブルを DROP すれば「旧も新も無い」状態には戻せるが、旧データは戻らない。実質は §6.3 のリストア。

### 3.4 資材データの投入

**操作**

```bash
# §1.3 で生成し、ローカルで冪等性を確認済みの本番用 SQL を流す
psql "<PROD_DB_URL>" -v ON_ERROR_STOP=1 \
  -f ~/farmille-cutover/export/materials-v2-seed.prod.sql
```

- SQL は `begin; … commit;` で囲まれているため、途中で落ちれば全体が巻き戻る
- 末尾の照合 SELECT の出力（`expected_*` と `actual_*`）を控える

**検証**

```sql
select
  (select count(*) from public.materials)         as materials,
  (select count(*) from public.material_images)   as images,
  (select count(*) from public.material_tags)     as tag_links,
  (select count(*) from public.material_sources)  as sources;

-- seller_id は全件 NULL＝未 claim で開始する（01 §8）
select count(*) from public.materials where seller_id is not null;   -- 0 であること

-- 画像 URL の参照先を確認する（旧バケット product-images を指している場合がある）
select
  count(*) filter (where url like '%/product-images/%')  as legacy_bucket,
  count(*) filter (where url like '%/material-images/%') as v2_bucket,
  count(*) filter (where url not like '%supabase%')      as external
from public.material_images;
```

- **要確認**：`legacy_bucket` が 0 でない場合、v2 の資材画像は旧 `product-images` バケットの実体に依存している。この場合、**§5 で旧バケットを消してはいけない**。対応は次のいずれかで、事前に決めておく。
  1. 旧バケット `product-images` をそのまま残す（最小手数。バケット名だけ旧のまま残る）
  2. オブジェクトを `material-images` へコピーし、`material_images.url` を書き換える（別途スクリプトが要る。T-12b の追加作業）
- 無作為に5件、旧 CSV と v2 の値を突き合わせる（名前・メーカー名・分類・使用方法テキスト）。件数一致だけで合格としない

**ロールバック**：投入だけなら巻き戻せる（`delete from material_tags/material_images/material_sources/materials;`）。ただし §3.2 の DROP は戻らない。

### 3.5 Storage バケットの確認

v2 の migration はバケットを `on conflict (id) do nothing` で作る。つまり**旧から存在する `avatars` は旧の設定のまま残る**（サイズ上限・許可 MIME・public フラグが v2 の意図と違う可能性がある）。

**操作・検証**

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('avatars','material-images','review-photos','report-media','article-images')
order by id;
```

期待値（`20260726121242_rls_policies.sql` と同じであること）：

| バケット | public | file_size_limit | allowed_mime_types |
|---|---|---|---|
| avatars | true | 2097152 | image/jpeg, image/png, image/webp |
| material-images | true | 5242880 | image/jpeg, image/png, image/webp |
| review-photos | true | 5242880 | image/jpeg, image/png, image/webp |
| report-media | true | 52428800 | image/jpeg, image/png, image/webp, video/mp4, video/quicktime |
| article-images | true | 5242880 | image/jpeg, image/png, image/webp |

ずれていたら（`avatars` が該当しやすい）、明示的に合わせる。

```sql
update storage.buckets
set public = true,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'avatars';
```

さらに、v2 のポリシーだけが載っていることを確認する。

```sql
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
-- farmille_storage_public_read / _general_insert / _general_update /
-- _general_delete / _seller_insert / _seller_update / _seller_delete の7本
```

旧バケット（`product-images`・`review-images`・`articles-hero`）は、§3.4 の URL 確認の結果に従う。**依存が残っているうちは消さない。**

**ロールバック**：バケット設定の更新は元の値に戻せる（実行前の SELECT 出力を控えておく）。

### 3.6 旧 auth ユーザーの破棄 ⚠️

D1 により旧ユーザーは破棄する。旧ユーザーは v2 の `profiles` を持たないため、残すとログイン後に壊れた状態になる。

**操作**

```sql
-- 消す前に件数と内訳を控える
select count(*) from auth.users;

-- ⚠️ 不可逆。§1.2 の auth ダンプが取れていることを確認してから実行する
delete from auth.users;
```

- **要確認**：Studio の Authentication → Users から一括削除する方法もある。SQL で消す場合、`auth.identities`・`auth.sessions` 等は FK の cascade で落ちるはずだが、実行前に `select count(*) from auth.identities;` を控えて、削除後に 0 になることを確認する
- 運営（admin）アカウントを旧環境から引き継ぐ場合は、**消す前に対象ユーザーを除外する**か、§3.7 で作り直す

**ロールバック**：⚠️ 不可。§1.2 の `farmille-prod-auth-*.dump` からの部分リストアのみ。

### 3.7 admin アカウントの作成

v2 の運営操作（出品者審査・資材登録／claim・タグ管理・通報処理・編集局）は admin かつ AAL2 が必要（01 §4）。**切替直後から必要になる**ので、ここで作る。

`tools/dev/create-local-admin.ts` は**ローカル専用でリモートには実行できない**（スクリプト自身が接続先を検査して落ちる）。本番では手動で行う。

**操作**

1. Supabase Studio → Authentication → Users → Add user で運営用アカウントを作成する（メール＋パスワード。SMTP 未設定でも Studio 作成なら確認メール不要。security-notes.md §3 の暫定回避と同じ）。
2. 同じ画面（または SQL）で `app_metadata.account_type = 'admin'` を付与する。

```sql
-- 対象を1人に限定して更新する。email の一致を必ず確認する
-- （Auth Admin API の ?email= フィルタは壊れている。security-notes.md §3）
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"account_type":"admin"}'::jsonb
where email = '<ADMIN_EMAIL>';

select id, email, raw_app_meta_data from auth.users where email = '<ADMIN_EMAIL>';
```

3. §4 のデプロイ後、`<SITE_URL>/admin` にアクセスすると AAL1 の admin は `/admin/mfa` へ誘導される。そこで TOTP を登録する。**リカバリ用に TOTP のシークレットを 1Password に保存する。**

**検証**：`/admin` の書き込み操作（例：タグの追加）が MFA 登録後に通ること。MFA 未登録の状態では弾かれること。

**ロールバック**：作成したユーザーを削除する。

---

## 4. Vercel 切替

### 4.1 本番環境変数の設定

Vercel → `<VERCEL_PROJECT>` → Settings → Environment Variables → **Production** スコープ。

| 変数名 | 値 | 取得元 | 備考 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<PROD_PROJECT_REF>.supabase.co` | Supabase → Project Settings → API | 公開値 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | §2.1 で作成 | **新 API キーを入れる。旧 anon（JWT 形式）は入れない** |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | §2.1 で作成・1Password | サーバー専用。`NEXT_PUBLIC_` を付けない |
| `NEXT_PUBLIC_SITE_URL` | `<SITE_URL>` | Vercel → Settings → Domains | 末尾スラッシュ無し。OGP・メールのリンクに効く |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-…` | GA4 の管理画面 → データストリーム | 未設定なら GA4 を送らない実装（T-52） |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry の DSN | Sentry → Project Settings → Client Keys | 未設定だと SDK を初期化しない（`sentry.server.config.ts`） |
| `SENTRY_ORG` | Sentry の org slug | Sentry の URL | ビルド時のみ使用（`next.config.ts`） |
| `SENTRY_PROJECT` | Sentry の project slug | Sentry の URL | ビルド時のみ使用 |
| `SENTRY_AUTH_TOKEN` | Sentry の auth token | Sentry → Settings → Auth Tokens | ソースマップ upload 用。ビルド時のみ |

削除するもの：

- 旧 Cloud Run の API ベース URL を指す変数（`API_URL` / `NEXT_PUBLIC_API_URL` 等）。**要確認**：実際の変数名は Vercel の一覧で確認する。v2 のコードは `src/env.ts` に無い変数を一切読まないため、残しても害は無いが、混乱を避けるため消す
- その他、旧アプリだけが読んでいた変数

**検証**

```bash
# Vercel CLI を使う場合（任意）
vercel env ls production
```

- `src/env.ts` が要求する `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`・`NEXT_PUBLIC_SITE_URL`・`SUPABASE_SECRET_KEY` の4つが Production に揃っていること（**fail fast 実装なので1つでも欠けると実行時に例外になる**）

**ロールバック**：変数を旧値に戻す（旧値を控えておく）。再デプロイが要る。

### 4.2 `rebuild/m0` を `main` へマージして本番デプロイ

**操作**

```bash
cd <REPO_ROOT>
git fetch origin
git switch rebuild/m0
git status                       # クリーンであること

# CI と同じゲートを手元でも一度通す
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
```

- マージ前に Vercel の Settings → Build and Deployment → Root Directory をリポジトリルートに変更して保存する。旧ディレクトリは存在しないため、この設定を更新しないまま次のデプロイを始めない
- PR を作ってマージする（05 §4「削除は必ず PR で行い、差分一覧を人間が確認してからマージする」）。GitHub Actions の CI（`ci.yml` の app ジョブと e2e ジョブ）が green であることを確認してからマージ
- マージ後、Vercel が `main` の Production デプロイを自動で開始する

**検証**

- Vercel → Deployments で Production が Ready になること
- ビルドログに `Sentry` のソースマップ upload 成功が出ていること（`SENTRY_AUTH_TOKEN` が効いている証拠）
- Vercel → Settings → **Cron Jobs が空**であること（旧 keep-alive の cron が消えていること。`vercel.json` に cron 定義が無いため、デプロイで消える）

**ロールバック**：Vercel の Instant Rollback で直前の Production デプロイに戻せる。ただし旧デプロイは旧スキーマ前提なので、DB を戻さない限り動かない（§6 参照）。

### 4.3 ドメイン・DNS の確認

新旧で **Vercel プロジェクトは同一**（リポジトリルートを Root Directory に持つ既存プロジェクトを引き継ぐ。03 §7）。したがって**通常は DNS 変更は不要**で、確認だけで済む。

**操作・検証**

```bash
dig +short <SITE_URL の apex ドメイン>
dig +short www.<apex ドメイン>
curl -sI "https://<SITE_URL>/" | head -12    # 200 と HSTS ヘッダが返ること
```

- Vercel → Settings → Domains で、対象ドメインが「Valid Configuration」であること
- 証明書の有効期限が切れていないこと
- apex と `www` のリダイレクトの向きが `NEXT_PUBLIC_SITE_URL` と一致していること（不一致だと OGP・canonical・認証のリダイレクトがずれる）
- **要確認**：Vercel プロジェクトが新旧で別だった場合のみ DNS 切替が発生する。その場合はレジストラ操作が必要で、根本さんへの依頼になる（CLI 代行不可。access-checklist.md #6）

**ロールバック**：DNS を変更していなければ不要。変更した場合は旧レコードに戻す（TTL 分の反映待ちがある）。

### 4.4 Supabase Auth の設定確認

**操作・検証**（Supabase → Authentication → URL Configuration）

- **Site URL** が `<SITE_URL>` になっていること（旧 URL のままだと確認メール・パスワードリセットのリンクが旧サイトへ飛ぶ）
- **Redirect URLs** に本番ドメインと Vercel Preview のパターンが入っていること
- メールテンプレートが `docs/email-templates/` の内容と一致していること（Authentication → Email Templates）
- **要確認**：SMTP。§0.4 の判断に従う。未設定のままなら、切替後1週間は「新規登録メールが届かない」問い合わせが来る前提で運用する

**ロールバック**：設定を戻すだけ。

### 4.5 本番の動作確認チェックリスト（E2E 8フローの手動版）

`e2e/` の8フロー（T-51）を本番相手に手で通す。**本番にデータが残る**ので、作った検証データは最後に消す。admin 承認・通報処理のように不可逆に近いものは、捨てアカウント・捨て資材で行う。

375px 相当（スマホ表示が最優先。D13）で確認する。

| # | フロー | 主な確認点 | 後始末 |
|---|---|---|---|
| 1 | 一般登録 → ログイン → ログアウト | handle 重複時に日本語エラーが出る／確認メールの到達（SMTP 次第） | 検証ユーザーを削除 |
| 2 | レビュー投稿 → 資材詳細に反映 → 編集 → 削除 | 星の集計値と件数が即時に更新される／写真アップロードが `review-photos` に入る | レビュー削除で集計が戻る |
| 3 | 使用レポート 下書き → 提出 | pending 状態で公開側が 404 になる | draft／pending を admin で削除 |
| 4 | 検索（タグ AND／OR・並び替え） | 同一分類 OR・分類間 AND／オートコンプリート／結果から詳細へ遷移 | 不要 |
| 5 | 検討リスト保存 → `/me/saved` → 比較表 | 保存トグルの往復／比較表の列が崩れない | 保存を解除 |
| 6 | 出品者申請 → admin 承認 → 出品者ログイン → ダッシュボード | 承認で合成メールの Auth ユーザーが発行される／MFA（AAL2）が要求される | 検証出品者を suspended にするか削除 |
| 7 | 出品者：一次情報編集 → 公開反映／記事作成 → 公開 → 資材ページに関連記事 | 一次情報層のカラムだけ編集できる（分類層は不可） | 記事を下書きに戻すか削除 |
| 8 | 通報 → admin で resolve → 対象非公開／編集局：pending → 公開 | 通報後に対象が非表示になる／編集局から公開できる | 検証データを削除 |
| 補 | 未ログインで保護ページへ → リダイレクト。`?next=` に外部 URL を細工 → `/` に落ちる | open-redirect 対策（safe-next）の回帰 | 不要 |

そのほか本番特有の確認：

- [ ] 画像が表示される（`material_images.url` が §3.4 の確認どおりのバケットを指しており、`next.config.ts` の `remotePatterns` に一致する）
- [ ] `robots.txt`・`sitemap.xml` が新サイトの内容を返す（T-26）
- [ ] `/dev/tokens`・`/dev/ui`（スタイルガイド）が 404 になる（両ページとも `NODE_ENV === "production"` で notFound する実装。念のため実物で確認する）
- [ ] 404 ページ・エラーページが日本語で出る（T-52）
- [ ] Sentry にテスト用の例外が届く（意図的に存在しない資材 ID を叩く等）
- [ ] GA4 のリアルタイムでページビューが計上される

**ロールバック**：§6 参照。

---

## 5. 旧システム廃止

⚠️ この章は**切替が安定してから**実施する。目安として §4 の全チェックが通り、24時間以上ユーザー影響のあるエラーが出ていないこと。各手順は基本的に不可逆。

### 5.1 Cloud Run サービスの削除 ⚠️

**操作**

```bash
# 消す前に定義を退避しておく（再作成の手がかり。コード自体は git 履歴に残っている）
gcloud run services describe farmille-api \
  --project <GCP_PROJECT> --region <CLOUD_RUN_REGION> \
  --format=export > ~/farmille-cutover/farmille-api-service.yaml

gcloud run services delete farmille-api \
  --project <GCP_PROJECT> --region <CLOUD_RUN_REGION>
```

**検証**

```bash
gcloud run services list --project <GCP_PROJECT>    # farmille-api が消えていること
```

**ロールバック**：サービス定義は上の YAML に、アプリコードは `backend/` 削除前のコミット（T-01 より前）に残っている。再デプロイは可能だが手間がかかる。**旧キーを止めた後は動かないので、§5.4 より前に判断する。**

### 5.2 Cloud Build ソースバケットの掃除 ⚠️

2026-07-04 の事故で、`.env`（本番／dev の service_role key・JWT secret）・`supabase/.temp`（project ref／access token）・本番 PII を含むスクリプトが `gs://farmille-production_cloudbuild` へアップロードされていた（security-notes.md §1）。**過去に上がった分は今も残っている。**

**操作**

```bash
# 何が入っているか確認する
gcloud storage ls gs://farmille-production_cloudbuild/ | head -20
gcloud storage du -s gs://farmille-production_cloudbuild/

# ⚠️ 中身を全削除する（バケット自体を消す場合は --recursive でバケットごと）
gcloud storage rm --recursive "gs://farmille-production_cloudbuild/**"
# バケットごと消す場合
# gcloud storage rm --recursive gs://farmille-production_cloudbuild
```

- **要確認**：バージョニングが有効だと `rm` で古い世代が残る。`gcloud storage ls -a gs://…` で世代を確認し、残っていれば `--all-versions` 相当の削除を行う
- **要確認**：ビルドログ用の別バケット（`gs://<プロジェクト番号>.cloudbuild-logs.googleusercontent.com` 等）や Artifact Registry のイメージ（`cloud-run-source-deploy` リポジトリ）も残っている可能性がある。`gcloud storage ls` と `gcloud artifacts repositories list` で棚卸しし、不要なら消す。イメージ自体は `Dockerfile` が `backend/app/` のみ COPY するためクリーンだが、課金対象として残る

**検証**

```bash
gcloud storage ls gs://farmille-production_cloudbuild/    # 空、またはバケット自体が無いこと
```

**ロールバック**：不可。復元不要（消したいものを消している）。

### 5.3 Secret Manager の削除 ⚠️

**操作**

```bash
gcloud secrets list --project <GCP_PROJECT>

gcloud secrets delete supabase-service-role-key --project <GCP_PROJECT>
gcloud secrets delete supabase-jwt-secret       --project <GCP_PROJECT>
```

**検証**

```bash
gcloud secrets list --project <GCP_PROJECT>   # 上の2つが消えていること
```

**ロールバック**：不可（Secret Manager の削除は取り消せない）。ただし中身は §5.4／§5.5 で無効化する旧キーなので、失うものは無い。

### 5.4 旧 API キー（anon／service_role）の無効化 ⚠️

⚠️ **これを実行すると旧システムは完全に動かなくなる。**§5.1 まで完了していること、新アプリが新キーで安定していることを確認してから行う。

**操作**

1. Supabase → Project Settings → **API Keys** → **Legacy API keys**（**要確認**：タブ名）。
2. 旧 `anon` と `service_role` を **Disable** にする。

**検証**

```bash
# 旧 anon キーで叩いて 401 になること
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://<PROD_PROJECT_REF>.supabase.co/rest/v1/materials?select=id&limit=1" \
  -H "apikey: <旧 anon キー>"
# 401 が返ること

# 新 publishable キーでは 200 が返ること
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://<PROD_PROJECT_REF>.supabase.co/rest/v1/materials?select=id&limit=1" \
  -H "apikey: sb_publishable_xxx"
```

- 本番サイトを開き直し、資材一覧・ログインが動くこと

**ロールバック**：Disable は Enable に戻せる（**要確認**：UI 上で再有効化が可能かを実行前にヘルプで確認する。戻せない仕様なら、この操作は完全に不可逆として扱う）。

### 5.5 JWT 署名鍵の Rotate → 待機 → Revoke ⚠️

§2.2 で standby 鍵を作ってある。ここで実際に切り替える。**旧 anon／service_role は legacy JWT secret で署名された JWT なので、§5.4 を先に済ませておくこと**（順序を逆にすると旧キーが突然死する）。

**操作（Rotate）**

1. Supabase → Project Settings → **JWT Keys** → **Rotate**。
2. これ以降に発行される JWT は新しい鍵で署名される。既存の access token は**期限が切れるまで**は旧鍵で検証される（旧鍵は「Previously used」として残る）。

**検証**

```bash
curl -s "https://<PROD_PROJECT_REF>.supabase.co/auth/v1/.well-known/jwks.json"
# 新旧2つの鍵が並んでいること
```

- 本番サイトで**新規ログイン**が通ること
- 既にログイン中のセッションが切れていないこと

**待機**

- Authentication → Settings の **JWT expiry**（既定 3600 秒）を確認する。この時間が経てば、旧鍵で署名された access token はすべて失効する
- 安全側に倒し、**最低でも 24 時間**空ける（**要確認**：リフレッシュトークンの設定次第で必要な待機時間は変わる。JWT expiry を確認したうえで判断する）

**操作（Revoke）** ⚠️

3. 待機後、Supabase → Project Settings → JWT Keys → 「Previously used」の鍵を **Revoke**。

**検証**

```bash
curl -s "https://<PROD_PROJECT_REF>.supabase.co/auth/v1/.well-known/jwks.json"
# 新しい鍵だけになっていること
```

- 本番サイトでログイン・投稿・admin 操作が通ること
- Supabase の Auth ログに認証失敗の急増が無いこと

**ロールバック**：Rotate までは戻せる余地がある（**要確認**：ロールバック相当の操作が UI にあるか）。**Revoke は不可逆**で、旧鍵で署名された残存トークンは即座に無効になる。実害は「一部ユーザーが再ログインを求められる」程度だが、実施は業務時間内に行う。

### 5.6 Supabase CLI アクセストークンの再発行 ⚠️

旧 `backend/supabase/.temp/` に access token が入ったまま Cloud Build へ上がっていた（security-notes.md §1）。

**操作**

1. https://supabase.com/dashboard/account/tokens を開く。
2. 既存のトークンを **Revoke** する。
3. 新しいトークンを **Generate** し、1Password に保存する。
4. ローカルを新トークンで貼り直す。

```bash
npx supabase login --token <新トークン>
npx supabase projects list      # 一覧が取れること
```

- ローカルに残る `supabase/.temp/` を掃除する（`.gitignore` 済みだが念のため）

**検証**：`npx supabase projects list` が新トークンで通り、旧トークンを設定した状態では 401 になること。

**ロールバック**：新トークンを作り直せばよい（不可逆な損失は無い）。

### 5.7 GCP 課金の停止 ⚠️

**操作**

1. §5.1〜§5.3 が済み、`<GCP_PROJECT>` に生きているリソースが無いことを確認する。

```bash
gcloud run services list          --project <GCP_PROJECT>
gcloud storage ls                 --project <GCP_PROJECT>
gcloud secrets list               --project <GCP_PROJECT>
gcloud artifacts repositories list --project <GCP_PROJECT>
gcloud sql instances list         --project <GCP_PROJECT>   # 無いはずだが確認
```

2. Cloud Console → お支払い → プロジェクトのリンクを解除する（`gcloud billing projects unlink <GCP_PROJECT>`）。
   - **要確認**：組織ポリシーにより、請求のリンク解除が上位管理者（奥田さん等）の権限になる場合がある（access-checklist.md 補足）。その場合は依頼する
3. プロジェクト自体を消す場合は最後に。削除予約から実際の削除まで猶予期間があり、その間は復元できる。

```bash
# ⚠️ 最終手段。実行前に §5.1 の YAML 退避とダンプ類が手元にあることを確認する
# gcloud projects delete <GCP_PROJECT>
```

**検証**

- Cloud Console のお支払い画面で `<GCP_PROJECT>` が「請求先アカウントなし」になっていること
- 翌月の請求に `<GCP_PROJECT>` の課金が出ないこと（**切替後1か月は請求を確認する**）

**ロールバック**：リンク解除は再リンクで戻せる。プロジェクト削除は猶予期間内なら復元できる。

### 5.8 リポジトリの第2弾削除（05 §3）

**操作**：資材移行の検証（§3.4）が完了しているので、次を削除する PR を出す。

- `tools/migration/legacy/migrations-v1/`（旧 migration 27ファイル）
- `tools/migration/legacy/`（旧スクリプト一式ごと）

**検証**

```bash
cd <REPO_ROOT>
# 旧スタックの語が実装・設定に残っていないこと（T-01 と同じ判定）
git grep -l "Railway\|FastAPI\|ja_staff\|4ロール" -- . \
  ':!docs/rebuild' ':!docs/ops' ':!tools/migration/legacy'
# 出力が空であること

npx supabase db diff --linked    # 無差分であること
```

- **注**：05 §4 の完了条件は `farmer` も禁止語に含めているが、v2 では `profiles.standpoint` の値として `'farmer'` を正規に使う（01 §3）。したがって `farmer` は除外して判定する。`docs/rebuild/` に残る「FastAPI を廃止した」等の記述は設計の履歴として意図的に残すものなので、こちらも除外する
- リポジトリ構成が 03 §7 の目標形と一致していること

**ロールバック**：git で戻せる。

---

## 6. ロールバック手順

### 6.1 どの段階まで戻れるか

| 到達地点 | 戻れるか | 戻し方 |
|---|---|---|
| §1 完了（バックアップ済み） | ○ 完全に戻れる | 何も変えていない。中止するだけ |
| §2 完了（新キー作成・JWT 移行） | ○ 戻れる | 新キーを Disable。旧キーは有効なまま。JWT は Rotate 前なので影響なし |
| §3.1 完了（Cloud Run 停止） | ○ 戻れる | `--min-instances`／`--max-instances` を元に戻す |
| **§3.2 実行後（旧テーブル DROP）** | ✗ **戻れない** | §6.3 のリストアのみ |
| §3.3〜§3.7 完了（v2 適用・データ投入） | △ | v2 側は作り直せるが旧データは戻らない |
| §4 完了（Vercel 切替） | △ | デプロイは Instant Rollback で戻るが、DB が v2 なので旧アプリは動かない |
| §5.1〜§5.3 実行後（Cloud Run／バケット／Secret 削除） | ✗ | 再構築が必要（コードは git 履歴にある） |
| §5.4 実行後（旧 API キー Disable） | △〜✗ | Enable に戻せるかは**要確認** |
| §5.5 Revoke 実行後 | ✗ | 不可逆。ただし影響は再ログイン要求のみ |

### 6.2 §3.2 より前で中止する場合

1. Cloud Run のインスタンス設定を元に戻す（§3.1 のロールバック）。
2. Vercel の Production 環境変数を触っていれば旧値に戻す。
3. Supabase の新 API キーを Disable にする（残しても旧システムに影響は無いので、そのままでもよい）。
4. 関係者へ「切替を中止した」と通知する。

旧システムはそのまま動く。所要は数分。

### 6.3 §3.2 以降で中止し、旧システムへ戻す場合

⚠️ **これは災害対応。**判断に迷ったら「戻す」より「新システムを直す」ほうが速いことが多い。旧システムへ戻すと、切替後に新システムへ投稿されたデータ（レビュー・使用レポート・出品者申請）は失われる。

1. 関係者へ「本番を旧システムへ巻き戻す。切替後の投稿は失われる」と通知する。
2. Vercel の Production デプロイを、切替前のデプロイへ Instant Rollback する。
3. Supabase の DB を §1.2 のバックアップから戻す。

```bash
# a) v2 スキーマを落とす
psql "<PROD_DB_URL>" -v ON_ERROR_STOP=1 -c "drop schema public cascade; create schema public;"
psql "<PROD_DB_URL>" -v ON_ERROR_STOP=1 -c "drop schema if exists app cascade;"

# b) 旧スキーマとデータを戻す
psql "<PROD_DB_URL>" -v ON_ERROR_STOP=1 -f ~/farmille-cutover/backup/roles.sql
psql "<PROD_DB_URL>" -v ON_ERROR_STOP=1 -f ~/farmille-cutover/backup/schema.sql
psql "<PROD_DB_URL>" -v ON_ERROR_STOP=1 -f ~/farmille-cutover/backup/data.sql

# c) auth スキーマ（旧ユーザー）を戻す
pg_restore -d "<PROD_DB_URL>" --clean --if-exists -n auth \
  ~/farmille-cutover/backup/farmille-prod-auth-*.dump
```

   - **要確認**：`drop schema public cascade` は Supabase の内部オブジェクトを巻き込む可能性がある。PITR が使える契約なら、**まず PITR での復元を検討する**（Supabase → Database → Backups → Point in Time）。PITR のほうが安全かつ速い
4. Cloud Run を再稼働させる（§3.1 のロールバック。既に §5.1 で削除済みなら、`farmille-api-service.yaml` と git 履歴の `backend/` から再デプロイする）。
5. Vercel の環境変数を旧値へ戻す。
6. Supabase の旧 API キーが Disable なら Enable に戻す。JWT を Revoke 済みなら、全ユーザーが再ログインになる。

### 6.4 「戻さずに直す」判断基準

次のいずれかなら、巻き戻さず前進で直すほうが速い。

- 環境変数の設定漏れ・値の誤り（`src/env.ts` が例外を投げる） → 値を直して再デプロイ
- 資材データの件数不足・タグ欠落 → `materials` 系だけ入れ直す（§3.4 のロールバック）
- 画像が出ない → バケットの参照先ずれ（§3.4 の確認）。URL 書き換えかバケット温存で解決
- 特定画面だけ 500 → Sentry のスタックトレースを見て hotfix を出す

巻き戻しを選ぶのは、**認証が全ユーザーで壊れている／データが破損している／原因が特定できない**場合に限る。

---

## 7. 切替後1週間の監視項目

毎日決まった時刻に見る。異常があれば Sentry の issue かメモに記録し、対応の要否を判断する。

### 7.1 Sentry（フロント＋サーバー）

- **新規 issue の発生数**。切替当日〜翌日は増えるのが普通だが、同じ issue が繰り返し出るものを優先する
- **`src/env.ts` の「必須の環境変数 … が設定されていません」** — 出たら環境変数の設定漏れ。即対応
- **Supabase の 401／403 由来の例外** — RLS の想定外拒否か、キーの不整合。§5.4／§5.5 の直後は特に注意
- **`PGRST` 系のエラーコード** — スキーマと型のずれ（`gen:types` 未反映）を疑う
- **Storage の 404／403** — §3.4 のバケット参照ずれ
- サンプリングは `tracesSampleRate: 0.1`。パフォーマンス系の母数が少ないので、遅さの判断は Vercel 側の数値と併せて見る

### 7.2 Vercel

- **Deployments** — 意図しない再デプロイが走っていないこと
- **Runtime Logs** — 5xx の発生率。特に Server Actions・Route Handlers（`/api/*`）
- **Function の実行時間とエラー率** — 資材検索・資材詳細のように DB を叩く経路
- **Cron Jobs が空のまま**であること（旧 keep-alive が復活していないこと）
- **帯域・関数実行数** — Cloud Run から Vercel へ処理が寄ったので、切替前より増える。プランの上限に近づいていないか

### 7.3 Supabase

- **Authentication → Logs** — signup／login の失敗率。**確認メールの不達**（SMTP 未設定の場合）が問い合わせとして出る前提で見る
- **Logs → API（PostgREST）** — 4xx／5xx の傾向。403 の急増は RLS の想定違い
- **Logs → Postgres** — スロークエリ、接続数の張り付き
- **Database → Reports** — DB サイズ・接続数・キャッシュヒット率
- **Storage** — アップロード失敗（サイズ上限・MIME 制限。§3.5 で設定を合わせたバケットで特に）
- **Database → Backups** — 自動バックアップが取れ続けていること

### 7.4 業務側の指標

- 新規登録数・レビュー投稿数・使用レポート提出数が 0 のまま推移していないか（0 なら投稿導線が壊れている疑い）
- 出品者申請が届いているか（admin の審査キューを毎日確認する）
- 通報の滞留（編集局の pending が積み上がっていないか）
- 資材ページの画像欠損の報告

### 7.5 1週間後の締め

- [ ] §5 の未実施項目（特に §5.5 の Revoke・§5.7 の課金停止）を完了させる
- [ ] `docs/ops/security-notes.md` §2 の「未実施：service_role キーと JWT secret のローテーション」を、実施済みの記録に更新する
- [ ] `docs/ops/access-checklist.md` から GCP 関連（#5）を削除し、廃止済みと記録する
- [ ] 05 §3 の第2弾削除 PR（§5.8）をマージする
- [ ] 切替の実績（詰まった箇所・要確認だった箇所の結論）をこの runbook に追記する

---

## 付録：要確認一覧

実行時に確定させる項目。ここが埋まらないまま先へ進まない。

| # | 章 | 要確認の内容 |
|---|---|---|
| 1 | §0.1 | Cloud Run のリージョン。`asia-northeast1` と推定（旧スクリプトの URL 由来）。`gcloud run services list` で確定する |
| 2 | §0.1 | 本番の公開 URL が apex（`farmille.com`）か `www` か、リダイレクトの向き |
| 3 | §0.3 | GCP の請求リンク解除が上位管理者の権限になるか（組織ポリシー依存） |
| 4 | §0.4 | `next.config.ts` の `remotePatterns` からデモ用ホスト（placehold.co・images.unsplash.com）を外すか |
| 5 | §0.4 | 本番 Supabase の SMTP を切替前に設定するか。未設定なら確認メール不達を許容する運用になる |
| 6 | §1.2 | 本番プロジェクトのプランと PITR の有無。あればリストア手段の第一候補になる |
| 7 | §1.3 | `convert-materials-v2.mjs` に `product_sources` → `material_sources` の変換が未実装。T-12b で追加が必要 |
| 8 | §1.3 | フルマスタの正を本番 DB とするか Excel とするか。件数の突合結果で判断する |
| 9 | §2 全般 | Supabase ダッシュボードのタブ名・ボタン名（API Keys / Legacy API keys / JWT Keys / Migrate / Rotate / Revoke）。UI 変更で変わりうる |
| 10 | §2.2 | Standby 鍵を破棄・再生成できるか（Rotate 前のロールバック手段） |
| 11 | §3.1 | `--max-instances=0` が使えない場合の代替（traffic 0 か IAM 剥奪） |
| 12 | §3.3 | `supabase migration repair` が期待どおり動くか。動かない場合は履歴テーブルの直接操作 |
| 13 | §3.4 | `material_images.url` が旧バケット `product-images` を指す場合の扱い（温存するかコピー＋書き換えか） |
| 14 | §3.6 | 旧 `auth.users` の一括削除を SQL で行うか Studio で行うか。関連テーブルの cascade を実測で確認する |
| 15 | §4.1 | Vercel に残る旧アプリ用の環境変数名（`API_URL` 等）。実物を一覧で確認する |
| 16 | §4.3 | 新旧で Vercel プロジェクトが同一か。別なら DNS 切替（根本さんへの依頼）が発生する |
| 17 | §5.2 | Cloud Storage のバージョニング有無。ビルドログ用バケットと Artifact Registry の残存 |
| 18 | §5.4 | 旧 API キーの Disable を Enable に戻せるか |
| 19 | §5.5 | Revoke までの待機時間。JWT expiry の設定値とリフレッシュトークンの挙動を確認して決める |
| 20 | §6.3 | `drop schema public cascade` が Supabase の内部オブジェクトに与える影響。PITR が使えるならそちらを優先する |
