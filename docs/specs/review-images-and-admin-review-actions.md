# SPEC: レビュー画像の公開表示 + Admin レビュー削除/非公開化（stage1 軽微修正）

- 状態: Draft（2026-06-29 worker セッション）
- 対象フェーズ: v1 post-launch 軽微修正（stage1）
- biz 起点: 奥田さん（公開ロジック・UX）／ Ryoga 確定事項
- 関連: ADR-0003（レビュー画像は DB に保持せず Storage パス規約で管理）、レビュー承認フロー（2026-06-13 / migration `20260613000000_reviews_moderation_status.sql`）

## 0. スコープ（stage1 = 軽微なミスのまとめ直し）

| # | 項目 | 種別 |
|---|------|------|
| A | レビューに添付した画像（最大5枚）が公開レビュー一覧に**表示されない**問題の修正。複数枚をグリッド表示する。 | bug/表示 |
| B | Admin がレビューを**削除**できるようにする。「**ハード削除**（行+画像を物理削除）」と「**非公開化**（承認済→非公開に戻す）」の2アクション。 | feature |
| C | Admin 画面・公開画面の表示まわりの軽微なほつれの是正（実装着手時に punch-list 化）。 | 表示 |

**非スコープ（今 sprint では作らない）**
- レビュー画像メタデータの DB 永続化（`review_images` テーブル / `image_paths` カラム）。ADR-0003 の方針は据え置き。読み取り時 Storage list で対応し、N+1 最適化は v1.5 follow-up（§6）。
- レビュー本体の編集・通報導線の変更（既存のまま）。
- admin 2FA（AAL2）の挙動変更（既存 proxy を踏襲）。

## 1. 現状（As-Is）

### 1.1 レビュー画像
- 投稿時、`review-image-upload.tsx`（`MAX_FILES = 5`, JPEG/PNG/WebP, 1枚10MB）で複数枚アップロード可能。保存先は Storage バケット `review-images/{user_id}/{review_id}/`。
- **画像は DB に保持しない**（ADR-0003、`products.py:363` のコメントで明記）。`reviews` テーブルに画像カラムは無い。
- 現在 Storage を読んで画像を出しているのは「**本人が自分のレビューを編集モードに入ったとき**」（`my-review-row.tsx` の `startEditing`）だけ。
- 公開レビュー一覧（`products/[id]/page.tsx` L633–681）と、本人レビューの**表示モード**（`MyReviewRow` 非編集時）には画像が一切出ていない。→ これが「複数枚入れてもレビューに表示されない」事象の正体。

### 1.2 Admin レビュー操作
- `admin_reviews.py`: `GET /v1/admin/reviews`（status フィルタ）、`POST .../approve`、`POST .../reject`。
- `approve`/`reject` を担う `_set_status` は **`pending` 限定**（`approved`/`rejected` は 409 `already_moderated`）。→ **承認済みレビューを後から非公開に戻す導線が無い**。
- **削除エンドポイントが無い**（本人用 `DELETE /v1/reviews/{id}` は `reviews.py` に存在するが admin 用は無い）。
- admin UI（`admin/reviews/page.tsx`）は `pending` 行にのみ承認/却下ボタン、それ以外は処理結果テキストのみ。

## 2. 設計判断（DOA 最優先）

1. **画像は読み取り時に Storage list**（ADR-0003 準拠、DB スキーマ変更なし）。
   - backend `list_product_reviews` がレビューごとに `review-images/{user_id}/{review_id}/` を list し、public URL 配列 `images: string[]` を付与して返す。これにより frontend からの直接 Storage 叩き（N+1 クライアント往復）を避け、**BFF 第一防御**を維持する。
2. **ハード削除はサーバー側で行 DELETE → Storage 回収（best-effort）**。
   - `reviews` の中間テーブル（`review_crops` / `review_benefit_relations` / `review_point_relations` / `review_period_relations`）は全て `ON DELETE CASCADE`。レビューに紐づく**監査ログ（user_reports）は存在しない**（通報は user 単位）ため、CASCADE 破壊の懸念なし。
   - Storage 画像は `review-images/{user_id}/{review_id}/` を list → remove。失敗は best-effort（行削除は確定済みのため 200/204 を返す）。
3. **非公開化は status を `rejected` にする**（既存語彙を流用、migration 不要）。
   - 既存 `_set_status` は pending 限定なので、**承認済(approved)からも rejected にできる新エンドポイント**を足す（pending|approved → rejected）。
4. **migration は不要**。status は既に `pending/approved/rejected` を許容、cascade も既存。
5. **可逆性のため display フラグ**を1つ追加：`REVIEW_IMAGES_ENABLED`（既定 true）。商品画像（`PRODUCT_IMAGES_ENABLED`）と同様、コンプラ判断で即伏せられるキルスイッチ。レビュー画像は生産者自身の UGC でリスクは低いが対称性のため設置。

## 3. 変更点

### 3.1 Backend
- `products.py / list_product_reviews`
  - レビューごとに `_list_review_images(admin, user_id, review_id) -> list[str]` で Storage list → public URL 配列を付与。
  - レスポンス: `{ reviews: [{ id, user_id, user_name, rating, body, created_at, images: string[] }] }`。
  - 凍結/ソフト削除ユーザー除外ロジックは現状維持。
- `admin_reviews.py`
  - `DELETE /v1/admin/reviews/{review_id}` … 行を取得（user_id 取得用）→ 行 DELETE → `review-images/{user_id}/{review_id}/` を list+remove（best-effort）。204。
  - `POST /v1/admin/reviews/{review_id}/unpublish` … status が `pending`|`approved` のものを `rejected` に。`approved_by`=actor / `approved_at`=now / `rejection_reason`（任意、既定「管理者により非公開化」）。既に `rejected` は 409 `already_rejected`（冪等寄り）。

### 3.2 Frontend
- `lib/flags.ts`: `export const REVIEW_IMAGES_ENABLED = true;`（コメントで経緯）。
- `products/[id]/page.tsx`
  - `type Review` に `images?: string[]` 追加。
  - 公開 `<li>` に画像グリッド（`REVIEW_IMAGES_ENABLED && r.images?.length`）。`next/image` で `aspect-square` のサムネ、3〜5列。
  - `MyReviewRow` に `images` を prop で渡す。
- `my-review-row.tsx`: `Review` に `images?: string[]`、**表示モード**でも画像グリッドを描画。
- admin: レビュー行の「処理」セルに削除/非公開化アクションを追加（新 client component）。
  - `pending`: 既存の承認/却下 + ハード削除。
  - `approved`: 非公開化 + ハード削除。
  - `rejected`: ハード削除のみ。
  - ハード削除は `window.confirm` で確認（`MyReviewRow` の既存パターンに合わせる）。
- API routes（proxy）: `app/api/admin/reviews/[id]/route.ts`（DELETE）、`app/api/admin/reviews/[id]/unpublish/route.ts`（POST）。いずれも `proxyToBackend`（admin+AAL2 を BFF で再検証）。

### 3.3 Migration / Types
- migration: **なし**。
- types: `database.ts` 再生成不要（スキーマ不変）。frontend の手書き `Review` 型のみ更新。

## 4. 受け入れ基準（falsifiable）

- [ ] A1: 画像を2枚以上添付したレビューが承認後、公開製品ページのレビュー一覧で**全枚数**サムネ表示される。
- [ ] A2: 画像0枚のレビューは画像領域を描画しない（空枠が出ない）。
- [ ] A3: 本人が自分のレビューを見たとき（編集前の表示モード）も画像が出る。
- [ ] A4: `REVIEW_IMAGES_ENABLED=false` にすると公開ページの画像が消え、本文・評価は残る。
- [ ] B1: admin が承認済みレビューを「非公開化」すると公開ページから消え、admin 一覧で status=rejected になる。
- [ ] B2: admin が「ハード削除」するとレビュー行が消え、再取得で一覧から消える。Storage の画像フォルダも消える（best-effort、残存しても 200）。
- [ ] B3: 削除/非公開化は admin（AAL2）以外には 403。
- [ ] B4: ハード削除後、同一 user×product で新規レビュー投稿が可能（UNIQUE 制約に引っかからない）。
- [ ] C: punch-list 化した表示崩れが解消（着手時に列挙）。

## 5. テスト
- 手動テスト手順書（メーカー側 / 農家側 / アドミン）を別ドキュメント `docs/qa/manual-test-stage1-*.md` に用意（stage1 修正後・stage2 着手前に実施）。

## 6. Follow-up / 技術的負債（v1.5）
- 読み取り時 Storage list は製品あたりレビュー数が増えると N+1。`reviews` に `image_paths text[]` を持たせるか `review_images` テーブル化を検討（ADR-0003 の見直し）。既存 prod 画像のバックフィルが必要。
- ハード削除の Storage 回収を確実化（現状 best-effort）。孤児画像の定期 GC。
- admin 操作の監査ログ（誰がいつ削除したか）。現状 `approved_by/at` のみ。
