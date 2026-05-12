# ADR-0007: Storage RLS 監査と二重防御構造の確認

**作成日**: 2026-04-25
**ステータス**: Accepted
**関連 Phase**: Phase 12a（post-launch hardening security refactor）
**関連 ADR**:
- ADR-0003 storage-rls-path-enforcement（既存 Storage RLS 設計）
- ADR-0005 jwt-verification-strategy（JWT 検証方針）
- ADR-0006 url-namespace-policy

## コンテキスト

Phase 12a で `getSession()` → `getUser()` 置換による JWT 署名検証を徹底するにあたり、Storage 層の RLS ポリシーを再監査し、frontend / BFF / RLS の三層構造で欠漏が無いことを確認する。Phase 10 review で指摘された `my-review-row.tsx` の `supabase.storage.list()` 直叩きの扱いも本 ADR で確定する。

## 決定

### 1. RLS ポリシー一覧（現状）

#### 1.1 `review-images` バケット（migration `20260420000000`）

| 操作 | ポリシー名 | 対象 role | 条件 |
|---|---|---|---|
| INSERT | `review_images_insert_reviewer` | authenticated | bucket = `review-images` AND `app_metadata.role` ∈ {farmer, ja_staff, researcher} AND path 第 1 階層 = `auth.uid()` |
| SELECT | `review_images_select_all` | authenticated, anon | bucket = `review-images` |
| UPDATE | `review_images_update_owner` | authenticated | bucket = `review-images` AND owner = `auth.uid()` AND path 第 1 階層 = `auth.uid()` |
| DELETE | `review_images_delete_owner` | authenticated | bucket = `review-images` AND owner = `auth.uid()` |

#### 1.2 `product-images` バケット（migration `20260423000000`）

| 操作 | ポリシー名 | 対象 role | 条件 |
|---|---|---|---|
| INSERT | `product_images_insert_maker` | authenticated | bucket = `product-images` AND `app_metadata.role` = `maker` AND path 第 1 階層 = `auth.uid()` |
| SELECT | `product_images_select_all` | authenticated, anon | bucket = `product-images` |
| UPDATE | `product_images_update_owner` | authenticated | bucket = `product-images` AND owner = `auth.uid()` AND path 第 1 階層 = `auth.uid()` |
| DELETE | `product_images_delete_owner` | authenticated | bucket = `product-images` AND owner = `auth.uid()` |

#### 1.3 `avatars` バケット（migration `20260502150001`、Phase 19）

| 操作 | ポリシー名 | 対象 role | 条件 |
|---|---|---|---|
| INSERT | `avatars_insert_farmer` | authenticated | bucket = `avatars` AND `app_metadata.role` = `farmer` AND path 第 1 階層 = `auth.uid()` AND path 第 2 階層 = `'avatar'` |
| SELECT | `avatars_select_all` | authenticated, anon | bucket = `avatars` |
| UPDATE | `avatars_update_owner` | authenticated | bucket = `avatars` AND owner = `auth.uid()` AND path 第 1 階層 = `auth.uid()` AND path 第 2 階層 = `'avatar'` |
| DELETE | `avatars_delete_owner` | authenticated | bucket = `avatars` AND owner = `auth.uid()` |

**バケット運用（Ryoga が Supabase Studio で事前作成）**:
- public read / file_size_limit `2MB`（プロフィール写真は軽量で十分）/ MIME `image/jpeg, image/png, image/webp`
- INSERT は **farmer ロール限定**（ja_staff / researcher / maker は本機能対象外、Phase 19 §1.1 / §13）
- path 強制: `{auth.uid}/avatar/{filename}`（第 2 階層 `'avatar'` 固定で、別 path への混在を防ぐ）
- BFF が旧 avatar の `storage.remove()` を担当（フロントから remove は呼ばない、Phase 10 既存方針踏襲）

### 2. 二重防御構造

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Server / Client Component)                         │
│   - upload: supabase.storage.from(bucket).upload(...)        │
│   - getPublicUrl: supabase.storage.from(bucket).getPublicUrl │
│   - list: §3 例外 (my-review-row.tsx のみ)                    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ FastAPI BFF (auth check 第一防御)                            │
│   - JWT 検証 (Depends(get_current_user), ADR-0005)           │
│   - role check (auth.roles)                                  │
│   - path validation (backend/app/routers/_image_path.py)     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase Storage RLS (第二防御)                              │
│   - INSERT: role + path 第 1 階層 = auth.uid()               │
│   - UPDATE/DELETE: owner = auth.uid()                        │
│   - SELECT: 全員許可 (public bucket)                          │
└─────────────────────────────────────────────────────────────┘
```

第一防御（BFF）が破られても、第二防御（RLS）が unauth ユーザの書き込み・他人の resource 操作を阻止する。Phase 10 で導入した `_image_path.py` の path validation は第一防御の一部として動作。

### 3. `my-review-row.tsx` の `storage.list()` 直叩き（Phase 10 review で発覚）

#### 3.1 問題

`frontend/src/app/products/[id]/_components/my-review-row.tsx:53` で `supabase.storage.from("review-images").list("{uid}/{review_id}/")` を呼び、レビュー編集時の既存画像一覧を取得している。これは `launch-polish.md` §11.7 の BFF 原則「frontend の storage 操作は upload / getPublicUrl のみ」と矛盾する。

#### 3.2 解消方針（Phase 12a で確定: Q5=B 採用）

**B 案（spec 例外明文化、実装変更なし）** を採用。理由:

1. `review_images` テーブルが ADR-0003 で意図的に未導入（画像メタデータは Storage path のみで表現）。BFF endpoint 化（A 案）すると Storage list ↔ DB メタデータの二重管理が発生し、ADR-0003 の方針に反する
2. RLS `review_images_select_all` で SELECT は全員許可。frontend 直叩きでもセキュリティ差は無い
3. 対象は `my-review-row.tsx` の **1 箇所のみ**。横展開しないことを `launch-polish.md` §11.7.1 で明文化
4. 実装変更なしで完了する（コスト最小）

将来 `review_images` テーブルを新設する場合（v2.0 候補）は本例外を撤廃し、A 案（BFF endpoint 化）に移行する。

### 4. Phase 12a で実施した監査結果

| チェック項目 | 結果 |
|---|---|
| INSERT: owner（`auth.uid()` = path 第 1 階層）のみ許可 | ✅ 確認 |
| SELECT: 全員許可（public bucket） | ✅ 確認 |
| UPDATE: owner のみ許可 + path 第 1 階層強制 | ✅ 確認 |
| DELETE: owner のみ許可 | ✅ 確認 |
| BFF の path validation（`_image_path.py`）と RLS の path 制約が整合 | ✅ 確認（両者とも path 第 1 階層 = `auth.uid()` 想定） |
| `my-review-row.tsx` の `storage.list` 例外が `launch-polish.md` §11.7.1 に明文化 | ✅ 完了 |

## 結果

- 既存 RLS ポリシー（review-images / product-images バケット）は v1 ローンチに必要な制約を満たす
- BFF（第一防御）が JWT 検証 + path validation を担い、RLS（第二防御）が owner / role check を担う構造で運用する
- `my-review-row.tsx` の `storage.list` 直叩きは `launch-polish.md` §11.7.1 の例外条項として許容
- 自動 E2E テスト（pytest + pgTAP 等）は v1.5 送り

## 今後 RLS を変更する際の手順

1. 既存 migration 直編集ではなく、新規 migration ファイルを `supabase/migrations/` 配下に追加
2. `CREATE POLICY` の前に必要なら `DROP POLICY IF EXISTS` を発行
3. 本 ADR §1 の表を更新する（追加 / 変更 / 削除した項目を明記）
4. `supabase db push --linked` で dev / prod 両方に適用（Ryoga 直作業）
5. 変更後に「skill アンチパターン #4: RLS スキップ」が誘発されていないか self-review
