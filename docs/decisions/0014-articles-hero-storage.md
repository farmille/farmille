# ADR-0014: Articles hero 画像の Supabase Storage 戦略

**作成日**: 2026-06-02
**ステータス**: Accepted
**関連 Phase**: Admin Articles CMS（次フェーズ・v1 公開後）
**関連 ADR**:
- ADR-0003 storage-rls-path-enforcement（既存 Storage RLS 設計 / path 強制）
- ADR-0005 jwt-verification-strategy（JWT 検証方針）
- ADR-0007 storage-rls-audit（Storage RLS 二重防御の監査 / §1 一覧）
- ADR-0009 maker-approval-flow-and-admin-panel（admin パネル導入）
- ADR-0012 admin-2fa-promotion-to-v1（admin role + AAL2 強制）
**関連 spec**:
- `docs/drafts/admin-articles-cms-spec.md`（採用スコープ）
- `docs/drafts/admin-articles-featured-impl-plan.md`（背景プラン Phase B）

## 1. コンテキスト

Admin Articles CMS（`/admin/articles` のフル CRUD）で記事の hero 画像を admin が
差し替えられるようにする。これまで articles の `hero_image_url` は SQL 直挿入 + 外部 URL
（Unsplash 等）で 3 件だけ仕込んでいたが、運用で UI から画像を入れ替えたい需要が出た。

背景プラン（`admin-articles-featured-impl-plan.md`）では 2 案を比較していた:

- **A. URL 直入力**: 最速だが URL 切れ / 画質統制不能 / Next.js Image の host allowlist 運用が必要
- **B. Supabase Storage `articles-hero` バケット**: フル統制・admin 完結だが RLS / アップロード UI / ADR が必要

2026-06-02 の決定で **B（Storage）** を採用する。理由:

1. hero 画像は記事と寿命を共にする一次コンテンツであり、外部 URL 切れリスクを admin に
   背負わせたくない
2. `next.config.ts` の `images.remotePatterns` は build 時 fix のため、外部 URL 直入力だと
   admin が任意 host を入れたときに `next/image` が壊れる。Storage 公開 URL は既存 allowlist
   （`*.supabase.co /storage/v1/object/public/**`）で 1 個だけ通せば済む
3. 既存 `product-images` / `avatars` バケットと同型の Storage RLS パターンが確立しており、
   新規設計負債が小さい

## 2. 決定

### 2.1 バケット `articles-hero`

- **`public = true`**（公開バケット、anon read 可）。記事自体が公開コンテンツであり、hero 画像も
  同程度の機密性。署名 URL 運用（private）は admin / anon 双方の表示経路を複雑にするだけで
  privacy 上の利得が無い
- 書き込みは **admin ロール + AAL2 のみ**
- バケット作成は **migration の `insert into storage.buckets ... on conflict do nothing`** で行う
  （`product-images` / `avatars` は Studio 手動作成だったが、本バケットは migration で宣言的に
  作る。dev / prod の差分を SQL に集約して再現性を上げる）
- `file_size_limit` / `allowed_mime_types` は migration の bucket 行で `5MB` /
  `image/jpeg, image/png, image/webp` を設定（hero は本文より大きめを許容）

### 2.2 RLS（`storage.objects`）

| 操作 | ポリシー名 | 対象 role | 条件 |
|---|---|---|---|
| SELECT | `articles_hero_select_all` | anon, authenticated | `bucket_id = 'articles-hero'` |
| INSERT | `articles_hero_insert_admin` | authenticated | bucket 一致 AND `app_metadata.role = 'admin'` AND AAL2 |
| UPDATE | `articles_hero_update_admin` | authenticated | bucket 一致 AND `app_metadata.role = 'admin'` AND AAL2 |
| DELETE | `articles_hero_delete_admin` | authenticated | bucket 一致 AND `app_metadata.role = 'admin'` AND AAL2 |

**role claim の出典について（spec との差分・重要）**:
spec ドラフトには `auth.jwt()->>'role'='admin'` と書かれているが、**この式は採用しない**。
Farmille の role 権威は `app_metadata.role`（ADR-0002 / ADR-0009、`jwt.py:get_user_role`）であり、
Supabase JWT のトップレベル `role` claim は常に Postgres ロール（`authenticated`）になるため
`auth.jwt()->>'role'` では admin 判定が成立しない。既存 `product-images` /
`avatars` RLS も `(auth.jwt() -> 'app_metadata' ->> 'role')` を使っている（ADR-0007 §1）。
本 ADR でも同式に揃える。

**AAL2 の出典**: Supabase JWT の `aal` claim を `(auth.jwt() ->> 'aal') = 'aal2'` で判定する。
ADR-0012 §2.2 で admin は全アクセス AAL2 必須としたため、Storage 書き込み（第二防御）でも
AAL2 を強制し、AAL1 admin トークンでのアップロードを RLS 層で拒否する。

### 2.3 Path 規約

```
articles-hero/{article_id}/{uuid}.{ext}
```

- 第 1 階層 = `article_id`（記事と画像の対応を path で表現、孤児画像の特定を容易にする）
- ファイル名 = `crypto.randomUUID()` + 元拡張子（衝突回避・元ファイル名リークの防止）
- `product-images` / `avatars` は第 1 階層に `auth.uid()` を強制していたが、本バケットは
  **admin（3 名）の共同所有**であり個人スコープではない。owner = uid 強制は admin 間の相互編集を
  妨げるため採用せず、role + AAL2 のみで書き込みを絞る（新規作成時は article_id 未確定なので
  §2.5 の暫定 path 規約で吸収する）

### 2.4 削除時の挙動

- **DELETE 時に Storage オブジェクトは連動削除しない**（バケットに残す）。理由:
  1. backend の記事 DELETE（service_role）は DB 行のみ削除する責務に閉じ、Storage を触らない
     ことで責務分離（BFF 第一防御 / Storage は frontend ↔ Supabase 直、ADR-0007 §2）を保つ
  2. 孤児画像は public バケットに残るが、参照する記事が消えれば実害は無い（容量も hero 数枚分で軽微）
  3. 孤児画像の一括 GC は v1.5+ の運用バッチ（Follow-up）に push
- hero を**差し替え**た場合も旧オブジェクトは残す（同上）。差し替え UI は新 path を `hero_image_url`
  に上書きするだけで、旧 path の `storage.remove()` は呼ばない

### 2.5 新規作成時の path（article_id 未確定問題）

新規作成フォームでは画像アップロード時点で `article_id` が未発番。暫定で
`articles-hero/_new/{uuid}.{ext}` に置き、作成 API 成功後の移動はしない（v1.5+ で
「作成後に正規 path へ rename」を検討）。`_new/` 配下も同 RLS（admin + AAL2）で保護されるため
セキュリティ差は無い。編集画面では確定済 `article_id` を第 1 階層に使う。

なお、hero を選択後に**作成を中断**（キャンセル / バリデーション離脱）した場合、アップロード済の
`_new/{uuid}` は確実に孤児化する。§2.4 の孤児 GC バッチ（v1.5+）は `{article_id}/` 孤児だけでなく
**`_new/` 孤児も対象に含める**（public バケットだが参照する記事が無いため実害は容量のみ）。

### 2.6 記事行の削除セマンティクス（hard delete）

記事行は **hard delete**。`articles` テーブルに `deleted_at` 列を持たない既存設計を踏襲する
（`user_reports` 等が soft delete を採るのと対照的だが、記事は監査ログ性が低く、**公開取り消しは
`published_at = NULL` で可逆**に行えるため、完全削除のみを hard とする）。削除 UI
（`article-delete-button.tsx`）は confirm で「公開ページから消え・復元不可」を明示。関連
`article_products` は FK CASCADE で連動削除（migration `20260502120000`）。soft delete 化が必要に
なった場合（v2 候補）は別 migration で `deleted_at` 列 + 公開読み経路のフィルタを追加する。

## 3. 採用しなかった代替案

### A. URL 直入力（却下）
- URL 切れリスクと next/image host allowlist 運用コストを admin に背負わせる
- 背景プランでは「まず A で MVP → B に格上げ」としていたが、決定（2026-06-02）でフル実装 = B 直行

### B-private. private バケット + 署名 URL（却下）
- 記事 hero は公開コンテンツで privacy 上の利得が無い一方、anon 表示経路に署名発行が必要になり複雑化

### C. owner = auth.uid() の path 強制（却下）
- admin は共同運用（3 名）であり、別 admin が作った記事の hero を編集できないと運用が破綻する

## 4. 帰結

### Positive
- admin が UI から hero を差し替え可能、URL 切れリスクを排除
- `next.config.ts` 変更不要（既存 `*.supabase.co` public allowlist でカバー）
- 既存 Storage RLS と同型でレビュー / 監査が容易（ADR-0007 §1 に追記する）

### Negative
- 孤児画像が public バケットに蓄積する（GC は v1.5+ Follow-up）
- バケットを migration で作るため、`storage.buckets` への INSERT 権限を持つ接続で適用する必要が
  ある（`supabase db push --linked` は service_role 相当で実行されるため問題なし）

### 中立
- bucket の `file_size_limit` / `allowed_mime_types` は migration で宣言するが、frontend でも
  先行検証する（クライアント UX、ADR-0007 の二重防御方針と整合）

## 5. 今後の手順（ADR-0007 §「今後 RLS を変更する際の手順」に準拠）

1. 新規 migration `supabase/migrations/<ts>_articles_hero_storage.sql` を追加（bucket + RLS）
2. `supabase db push --linked` で dev / prod に適用（Ryoga 直作業）
3. ADR-0007 §1 の RLS 一覧表に `articles-hero` 行を追記
4. `pnpm gen:types`（articles テーブル自体は不変なので型差分は小さい想定だが手順として実行）
