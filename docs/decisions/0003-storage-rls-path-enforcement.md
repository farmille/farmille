# ADR-0003: Storage `review-images` バケットで reviewer ロール許可 + パス命名を RLS 強制する

**ステータス**: Accepted
**決定日**: 2026-04-20
**決定者**: 酒井涼雅（CTO）

## コンテキスト
Farmille v1 の写真アップロードは、`docs/architecture.md` の例外方針に基づき、フロントエンドが Supabase Storage に直接アップロードする（BFF を経由しない）。このため **Storage RLS が唯一の書き込み制御レイヤー** となる。

当初案では Storage RLS を「reviewer ロール判定」+「`owner = auth.uid()` 制約」のみで構成していた。しかしこの構成では:

- 他ユーザーの `review_id` を含むパス（例: `<他人のuid>/<review_id>/<file>.jpg`）に、自分の `owner` で画像をアップロードできる。
- Storage を Public バケットとして運用しているため、URL が予測可能な命名規則で配布されると、意図しない見た目の関連付けが発生しうる。
- DB 側に `review_images` 中間テーブルが存在せず（`20260415000000_farmille_init.sql` 時点）、レビューと画像の対応は **Storage パスに依存** している。パスの正当性が RLS で保証されていない場合、BFF 側でパスを後付検証する必要が生じ、二重実装になる。

また、ADR-0002 で DB 側の `reviews_insert_farmer` を `reviews_insert_reviewer` に修正して 3ロール対応（farmer / ja_staff / researcher）に統一した。Storage RLS も同じ論理ロール名で揃える必要がある。

## 決定
`review-images` バケットに対する Storage RLS を、`supabase/migrations/20260420000000_review_images_rls.sql` として以下の4ポリシーで固定する:

1. **INSERT (`review_images_insert_reviewer`)**
   - `bucket_id = 'review-images'`
   - `app_metadata.role IN ('farmer', 'ja_staff', 'researcher')`
   - **`(storage.foldername(name))[1] = auth.uid()::text`** （パス先頭が自分のUID）
2. **SELECT (`review_images_select_all`)**: `anon` + `authenticated` に `bucket_id` 一致で許可（Public バケット運用の冗長ポリシー）
3. **UPDATE (`review_images_update_owner`)**
   - `USING`: `bucket_id` 一致 かつ `owner = auth.uid()`
   - `WITH CHECK`: `USING` と同条件 + **パス先頭UID制約を再適用**（owner 書き換え対策）
4. **DELETE (`review_images_delete_owner`)**: `bucket_id` 一致 かつ `owner = auth.uid()`

**パス命名規約**: `{auth.uid}/{review_id}/{filename}` を v1 標準とする。フロントエンド (Next.js) のアップロード実装はこの形式を生成する責務を負う。

## 理由
1. **BFF を経由しない経路でも「他人領域への書き込み」を root で防げる**: `owner` は Supabase が自動設定するが、`name` (パス) は任意に指定可能。パス先頭UID制約が無いと、アクセス制御の重心が BFF と Storage に分散し二重実装になる。RLS 一箇所で閉じることで DOA 方針（データ層で正を保証）に沿う。
2. **DB の `review_images` 中間テーブルを作らない設計判断を可能にする**: v1 スコープでは画像メタデータを別テーブルに切り出す必要がない。パス命名が RLS で担保されている限り、`reviews.id` から画像URLを算出できる。将来メタデータ（並び順、キャプション等）が必要になった時点で中間テーブルを追加する（ADR を別途起票）。
3. **ADR-0002 との命名一貫性**: DB `reviews_insert_reviewer` と Storage `review_images_insert_reviewer` で「レビュー投稿可能ロール」を同じ論理名 `reviewer` で表現。将来ロール集合が変わっても命名は据え置き。
4. **既にリモート (farmille-dev) に適用済の定義と完全一致**: `supabase db dump --linked --schema storage` の出力をそのまま migration に採用したため、`supabase db diff --linked` で差分ゼロになる（v1 ローンチ後の db reset 時にも再現性を保証）。

## 既知のリスクと対策
| リスク | 対策 |
|---|---|
| フロント実装がパス命名規約を守らずアップロードに失敗 | アップロード SDK 呼び出しをラップする関数を 1箇所に集約し、`uid/review_id/file` のパス生成をそこで強制。テストで先頭セグメント一致を検証 |
| `review_id` がクライアント側で確定する前にアップロードしたい UX ニーズ | v1 スコープ外。必要になった時点で `{uid}/draft/{uuid}` を許可する第2INSERTポリシーを ADR で追加検討 |
| Public バケット運用のため URL 流出リスクがある | v1 方針として容認（レビュー画像は公開前提）。機密化要件が出た時点で Private 化 + signed URL 発行に移行。SELECT RLS は既に書いてあるため移行コストは低い |
| Storage の `foldername()` 関数仕様変更 | Supabase 公式関数で安定。バージョン固定は不要 |
| MIME / サイズ上限の制約が SQL に無く Dashboard 設定に依存（IaC化できていない） | v1 は許容。バケット作成手順を `docs/setup-log.md` に記録済。v2 で `storage.buckets` への設定を migration 化検討 |

## 次回見直しタイミング
- `review_images` 中間テーブルを追加する判断をした時（画像メタデータが必要になった時点）
- Storage を Private 化する判断をした時
- v1 ローンチから3ヶ月後の初回レトロ（2026年8〜9月想定）でパス命名規約の実運用コストを再評価
