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

## 3. Node.js と eMudhra の証明書対策（2026-10-22）

Node.js は 24.22.1 以降の 24 系を使用する。[2026-10-21 のセキュリティリリース](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)には、DNS・TLS・Brotli などの脆弱性修正と、eMudhra の漏えいした中間証明書の拒否が含まれる。通常の証明書チェーンに加え、Sectigo のクロス署名経路も拒否する。

開発環境と GitHub Actions は `.node-version` に揃える。`package.json` の `engines.node` と `pnpm-workspace.yaml` の `engineStrict` で、修正版より古い Node.js でのインストールを拒否する。npm パッケージの監査だけでは Node.js 本体の脆弱性は確認できない。

[Vercel はメジャーバージョンだけを選択でき、マイナー・パッチの更新はサービス側が管理する](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)。プロジェクト設定は 24.x。`engines.node` は既存のデプロイを更新しないため、マージ後に新しいデプロイを作成し、ビルドと Functions の実際の Node.js バージョンを確認する。古いビルド環境では依存インストールが失敗するので、制約を緩めず Vercel の更新状況を確認する。

証明書の確認には、[Mozilla の担当者が公開した検査サイト](https://emudhra.we-have-a-problem.com/)を使用できる。認証情報を送らず、次を各実行環境で実行する。

```bash
node --input-type=module <<'JS'
console.log(process.version);
for (const url of [
  'https://nodejs.org/',
  'https://dv-g3b-emudhra.we-have-a-problem.com/',
  'https://dv-g3b-aaa-emudhra.we-have-a-problem.com/',
]) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    console.log(url, response.status);
    await response.body.cancel();
  } catch (error) {
    console.log(url, error.cause?.code ?? error.name);
  }
}
JS
```

通常の HTTPS は成功し、2つの検査サイトは `CERT_REVOKED` になることを確認する。タイムアウトや DNS エラーは証明書を拒否した証拠にはならない。2026-10-22 のローカル検証では 24.22.0 が通常経路を HTTP 200 で受け入れ、24.22.1 は両経路を `CERT_REVOKED` で拒否した。本番 Functions のパッチ版と拒否動作は未確認。
