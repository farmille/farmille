# 運用セキュリティ記録

旧 `docs/handoff/onboarding.md` §9（既知の地雷リスト）から、アプリ刷新後も有効な運用上の事実だけを抽出したもの。移設日：2026-07-26。

- 鍵移行の手順概要：`docs/rebuild/03-architecture.md` §6
- 実施担当：`docs/rebuild/04-implementation-plan.md` の T-06（人間作業）
- アクセス権の棚卸し：`docs/ops/access-checklist.md`

---

## 1. Cloud Build へのシークレット・アップロード（2026-07-04 発見・修正済）

`backend/deploy-prod.sh` は `cd backend && gcloud run deploy --source .` で起動するため、gcloud は `backend/.gitignore`（キャッシュ類しか除外しない）だけを参照し、`backend/` 配下の以下を Cloud Build のソースバケット `gs://farmille-production_cloudbuild` にアップロードしていた（5758 ファイル）。

- `.env`（本番／dev の service_role key・JWT secret を含む実シークレット）
- `.venv/`・`supabase/.temp/`（project ref／access token）
- `scripts/*.py`・`create-prod-users.sh`（本番投入 PII）

イメージ自体はクリーン（`Dockerfile` が `app/` のみ COPY）で、機密が乗っていたのはビルドの一時アップロード。`backend/.gcloudignore`（アローリスト方式）を追加して修正済（PR #46。アップロードは 42 ファイル・機密 0 件に減少。`gcloud meta list-files-for-upload .` で検証可）。

刷新で `backend/` を削除し Cloud Run を廃止するため、このアップロード経路自体は消滅する。ただし過去に上がった分は残るので §2 の後処理が必要。

## 2. 未実施：service_role キーと JWT secret のローテーション

**2026-07-26 時点で未実施。** 過去のデプロイで `.env` の値が繰り返し Cloud Build バケットに上がっていたため、Supabase の service_role key と JWT secret は rotate すべき状態にある。同一 prod プロジェクト・アクセス制御下なので外部公開ではないが、最小権限運用としては rotate が望ましい。最終判断は根本さんと後任で相談する。

現在の Supabase は legacy の anon／service_role／JWT secret をその場で再生成できない。新 API キー（`sb_publishable_…`／`sb_secret_…`）と JWT Signing Keys へ移行したうえで旧キーを無効化する手順になる（詳細は `docs/rebuild/03-architecture.md` §6）。刷新でキーの利用者が Vercel だけになるため、**新アプリを最初から新キーで構築し、Cloud Run 廃止と同時に旧キーを無効化する**のが最も手戻りが少ない。

T-06 に含める後処理：

- Cloud Build ソースバケットに残る旧アップロードの削除
- Supabase CLI アクセストークンの再発行
- Vercel 環境変数の整備（新キーへの差し替え）

## 3. 刷新後も有効な注意点

**Supabase Auth Admin API の `?email=` フィルタが壊れている** — `GET /auth/v1/admin/users?email=X` はフィルタを silently 無視して全ユーザーを返す。`users[0]` を信用すると最古登録ユーザーを破壊する。実際に dev で biz lead のロールを書き換える事故が起きた。`page`／`per_page` で paginate し、取得した user の email が期待値と一致する assert を入れてから PATCH／INSERT する。

**本番 Supabase は独自 SMTP 未設定** — ビルトイン送信は 2通/時 かつ spam 行きになりやすく、signup の確認メールとパスワードリセットが不達になりうる。根本対応は Resend 等の SMTP ＋ DNS（SPF／DKIM）設定。暫定回避として admin は Studio で手動作成していた。メール本文の雛形は `docs/email-templates/` に残置。

**Supabase CLI の link 先は dev** — `supabase db push --linked` を本番相手に流すと他の未適用 migration を巻き込む。本番への migration は Studio の SQL Editor で対象ファイルを個別適用するのが最安全。

**seed／一括 import の再実行で状態が巻き戻る** — 非公開化した製品（例：農薬登録のある「石灰窒素」）が再公開されたり、Storage へ移行した画像 URL が元の外部 URL に戻る。再投入時は公開フラグと画像 URL の上書きに注意する。

**dev に同名 `company_name` の synthetic メーカーが存在する** — 会社名の完全一致を前提にしたスクリプトは別アカウントを掴む。既存判定はライブ DB の実データ基準で行い、スクリプトの hardcode を信用しない。

**商品画像の表示可否はコンプラ判断の対象** — 無許諾転載に見えるリスクがあり、v1 では表示フラグの反転を繰り返した。画像を扱う際は根本さんの最新判断を確認する。

**作目マスタの表記ゆれ** — 旧 `crops`（547件）に「水稲／大豆／小麦／イネ」が無く、マスタがカタカナのみでひらがな表記に非対応だった。結果として製品の作物紐付けが約30%しか成立しなかった。資材マスタ移行（T-12）でタグ・作目を再設計する際の既知の落とし穴。

**`.gitignore` 漏れによる PII／機密混入の履歴** — 本番マスタの `*.xlsx`・本番 PII を含む `docs/drafts/`・本番 GCP project ref を含む `backend/gcp-*.sh` が ignore 漏れで `git add -A` に混入する危険があった（いずれも修正済）。`git add -A` を避け、ship するファイルだけ明示 stage する。

**秘密情報の受け渡し経路** — 低機密（dev の anon key 等）は本人限定共有の Google Doc、高機密（service_role key・JWT secret 等）は 1Password。本番の値は原則渡さない（本番フリーズ運用）。
