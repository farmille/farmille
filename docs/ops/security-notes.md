# 運用セキュリティ記録

アプリ刷新（2026-07-26）後も有効な運用上の事実をまとめる。

## 1. 旧キーの後処理（2026-07-26 時点で未実施）

旧 `backend/` の Cloud Run デプロイ（2026-07-04 に発見・修正済み、PR #46）で、本番と dev の service_role key・JWT secret を含む `.env` が Cloud Build のソースバケット `gs://farmille-production_cloudbuild` に繰り返し上がっていた。`backend/` と Cloud Run は刷新で廃止したが、上がった分は残る。外部公開ではないが、最小権限運用としては旧キーを無効化するのが望ましい。最終判断は根本さんと相談する。

Supabase の legacy キー（anon／service_role／JWT secret）はその場で再生成できない。アプリは新 API キー（`sb_publishable_…`／`sb_secret_…`）で動いているので、残る後処理は次の3つ。

- JWT Signing Keys への移行と旧キーの無効化
- Cloud Build ソースバケットに残る旧アップロードの削除
- Supabase CLI アクセストークンの再発行

## 2. 刷新後も有効な注意点

**Supabase Auth Admin API の `?email=` フィルタが壊れている** — `GET /auth/v1/admin/users?email=X` はフィルタを silently 無視して全ユーザーを返す。`users[0]` を信用すると最古登録ユーザーを破壊する。実際に dev で biz lead のロールを書き換える事故が起きた。`page`／`per_page` で paginate し、取得した user の email が期待値と一致する assert を入れてから PATCH／INSERT する。

**Supabase CLI の link 先は dev** — migration は main への push 後に CI（`.github/workflows/ci.yml` の deploy ジョブ）が dev と本番へ適用する。

**seed／一括 import の再実行で状態が巻き戻る** — 非公開化した製品（例：農薬登録のある「石灰窒素」）が再公開されたり、Storage へ移行した画像 URL が元の外部 URL に戻る。再投入時は公開フラグと画像 URL の上書きに注意する。

**dev に同名 `company_name` の synthetic メーカーが存在する** — 会社名の完全一致を前提にしたスクリプトは別アカウントを掴む。既存判定はライブ DB の実データ基準で行い、スクリプトの hardcode を信用しない。

**商品画像の表示可否はコンプラ判断の対象** — 無許諾転載に見えるリスクがあり、v1 では表示フラグの反転を繰り返した。画像を扱う際は根本さんの最新判断を確認する。

**作目マスタの表記ゆれ** — 旧 `crops`（547件）に「水稲／大豆／小麦／イネ」が無く、マスタがカタカナのみでひらがな表記に非対応だった。結果として製品の作物紐付けが約30%しか成立しなかった。作物名の完全一致に頼る処理は、環境ごとの表記の違いで取りこぼす。

**`.gitignore` 漏れによる PII／機密混入の履歴** — 本番マスタの `*.xlsx` や本番 PII を含む資料が、ignore 漏れで `git add -A` に混入する危険があった（修正済）。`git add -A` を避け、ship するファイルだけ明示 stage する。

**秘密情報の受け渡し経路** — 低機密（dev の anon key 等）は本人限定共有の Google Doc、高機密（service_role key・JWT secret 等）は 1Password。本番の値は原則渡さない（本番フリーズ運用）。
