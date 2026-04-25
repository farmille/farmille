# Farmille v1 ローンチ後 セキュリティ + Storage RLS 監査 仕様 (Phase 12a)

**作成日**: 2026-04-25
**対象**: `getSession()` → `getUser()` 置換による JWT 署名検証の徹底 + Storage RLS 監査の文書化
**作業ブランチ**: `feat/post-launch-hardening-1-security`（派生元: `main`）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`launch-polish.md` と同水準）
**前提 Phase**: Phase 11（launch polish）完了

> **実装ステータス（2026-04-25）**: **保留中**。Q1 / Q6 と独立しているため、Phase 12 全体保留が解除されれば 12b / 12c より先に着手可能。

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール

**必達**:
- frontend BFF / Server Component で `getSession()` を `getUser()` に置換し、JWT 署名検証を徹底（backend には `get_session` 不在のため対象外）
- Storage RLS ポリシー（`review-images` / `product-images`）を再監査し、欠漏が無いことを確認 + ドキュメント化
- Phase 10 review で指摘された **`my-review-row.tsx` の `supabase.storage.list` 直叩き**（`launch-polish.md` §10.4 BFF 原則からの deviation）を spec 例外として明文化（Q5=B）

### 0.2 縮退ライン（落ちても v1.5 送り可）

- **Storage RLS の自動 E2E テスト**（pytest + pgTAP 等）: 監査 + ドキュメント化のみで必達とし、自動テストは v1.5 送り可

### 0.3 翌日送り（本 Phase 対象外）

- `/me/reviews` ページ / 画像 10MB 化 / drag & drop（Phase 12b）
- farmer プロフィール必須化（Phase 12c、Q6=A 採用時のみ）

---

## 1. 画面一覧

UI 変更なし。本 Phase は frontend / backend の auth 層 refactor + docs のみ。

---

## 2. データ書き込み方針（skill §1.3 厳守）

新規データ経路は発生しない。`getSession()` → `getUser()` は検証ロジックの強化のみで永続化は無い。

---

## 3. DB スキーマ変更

**なし**。

---

## 4. `getSession()` → `getUser()` 置換（frontend のみ）

### 4.1 対象スコープ

- frontend BFF proxy（`frontend/src/app/api/**/route.ts`）= **8 箇所**
- frontend Server Component（auth gate 用途）= **5 箇所**:
  - `products/new/page.tsx`
  - `products/[id]/edit/page.tsx`
  - `maker/products/page.tsx`
  - `onboarding/farmer/page.tsx`
  - `onboarding/maker/page.tsx`
- wrapper: `frontend/src/lib/auth/server.ts` の `getSession()` 自体は **削除**（呼び出し元が無くなれば不要）
- backend: **対象外**（grep 結果 0 件、認証は `Depends(get_current_user)` で JWT 直接検証している、ADR-0005 参照）

### 4.2 背景

`getSession()` は localStorage / cookie の cached session を返すだけで JWT 署名検証をしない。`getUser()` は Supabase Auth Server に問い合わせて署名検証する。BFF の owner check / Server Component の auth gate は後者でないと成り立たない。

### 4.3 置換ルール（Q3 確定: 全箇所統一）

- BFF proxy: `getSession()` → `getUser()` に置換、access_token は `session?.access_token` ではなく `(await supabase.auth.getSession()).data.session?.access_token` で別途取得（getUser は token を返さないため、token 取得用に getSession を 1 回呼ぶ二重コール構造になる）
- Server Component: `getSession()` → `getUser()` に置換（auth gate 用途のみ）
- 表示用途で残ってしまう場合（token が必要なケースのみ）: コメントで理由明記

### 4.4 注意

`getUser()` は HTTP 往復が増えるが、**Phase 11b の hotfix（PR #10）で React `cache()` による memoize 済**。同一リクエスト内では HTTP 往復は 1 回に圧縮されるため、置換による遅延悪化は軽微。

Phase 11b の session expire 検知 (`/login?expired=1`) と整合させる（getUser が 401 を返したら expired 扱い、現状の form `mapStatus` で吸収済）。

---

## 5. Storage RLS 再監査

### 5.1 監査方針

既存 migration を読み直し、以下を確認:
- `supabase/migrations/20260420000000_review_images_rls.sql`
- `supabase/migrations/20260423000000_product_images_storage_rls.sql`

**チェック項目**:
- [ ] INSERT: owner（`auth.uid()` = path 第 1 階層）のみ許可
- [ ] SELECT: 全員許可（public bucket）
- [ ] UPDATE: 必要なら owner のみ許可（通常は不要、v1 では検証のみ）
- [ ] DELETE: owner のみ許可（BFF は service_role で bypass、フロントは呼ばない）

### 5.2 Phase 10 review 指摘の解消（Q5=B 確定）

Phase 10 PR #4 review で指摘された `frontend/src/app/products/[id]/_components/my-review-row.tsx:53` の `supabase.storage.from("review-images").list()` 直叩きが、`launch-polish.md`（Phase 11）§10.4 の BFF 原則「frontend の storage 操作は upload / getPublicUrl のみ」と矛盾している件:

**Q5 確定（worker 判断 default）**: **B（spec 例外明文化、実装変更なし）** を採用。
- `launch-polish.md` §10.4 を更新し、`storage.list()` も「ADR-0003 で `review_images` テーブル不在のため例外的に許容」と明文化
- 対象は `my-review-row.tsx` の `list()` のみ。他で `storage.list()` を呼ばない
- BFF endpoint 化（案 A）は Phase 12.5 / v1.5 で再考、`review_images` テーブル化（案 C）は v2.0 候補

### 5.3 ADR-0007 起票

`docs/decisions/0007-storage-rls-audit.md`（新規 ADR、ADR-0006 は `url-namespace-policy` で取得済のため 0007 にずらす）:
- 各バケットの RLS ポリシー一覧
- BFF と RLS の二重防御構造の図解
- Phase 10 の path validation（`backend/app/routers/_image_path.py`）との整合確認
- §5.2 の Q5=B 解消方針の記録
- 今後 RLS を変更する際の手順

---

## 6. 触らないファイル

- `supabase/migrations/*`（既存 SQL は触らない）
- `backend/`（getSession 不在、対象外）
- `frontend/src/app/onboarding/*`（auth gate 部分のみ §4.1 対象、form 内部は触らない）
- `frontend/src/app/(auth)/*`
- `docs/specs/launch-polish.md` の §10.4 以外
- `docs/specs/phase-12b-features.md` / `phase-12c-farmer-profile.md`
- `.claude/`

---

## 7. 触るファイル（予想）

### 新規

- `docs/decisions/0007-storage-rls-audit.md`（§5.3）

### 既存修正

- `frontend/src/lib/auth/server.ts`（`getSession()` 関数を削除、呼び出し元を `getUser()` 経由に統一）
- `frontend/src/app/api/**/route.ts`（**8 箇所**、`getSession()` → `getUser()` + token 取得用 getSession の二重コール構造）
- `frontend/src/app/{products/new,products/[id]/edit,maker/products,onboarding/farmer,onboarding/maker}/page.tsx`（**5 箇所**、Server Component の auth gate を `getUser()` に置換）
- `docs/specs/launch-polish.md` §10.4（storage.list 例外化を明文化、Q5=B）

---

## 8. 受け入れ条件

### 8.1 認証セキュリティ

- [ ] `grep -rn "getSession\|get_session" backend/ frontend/src/app/api/` の結果が owner check / 認証に関わる箇所でゼロ（token 取得用の二重コールはコメント明記で OK）
- [ ] 置換後も既存 E2E（signup / login / post review / create product / レビュー編集 / 資材編集）が動く
- [ ] Phase 11b の session expire 検知が `getUser` 経由でも機能する（`/login?expired=1` への遷移確認）

### 8.2 Storage RLS

- [ ] ADR-0007 が `docs/decisions/` に存在し、ポリシー一覧が記載される
- [ ] 各バケットのポリシー名と対象操作がドキュメントに揃う
- [ ] skill §1.3 / §1.1 との整合が取れている

### 8.3 ドキュメント

- [ ] `launch-polish.md` §10.4 に `storage.list` 例外明文化が追記され、`my-review-row.tsx` での使用が許容される根拠が示されている

### 8.4 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功

---

## 9. 設計上の注意

### 9.1 `getSession` → `getUser` のパフォーマンス影響

- `getUser()` は毎回 Supabase Auth Server への HTTP 往復
- **Phase 11b の hotfix（PR #10）で React `cache()` による memoize 済**。同一リクエスト内では HTTP 往復は 1 回に圧縮されるため、置換による遅延悪化は軽微
- BFF から JWT 署名検証を自前で行う方式もあるが（ADR-0005）、v1 は `getUser()` で十分
- v1.5 で pain を感じたら自前検証に切替

### 9.2 RLS 監査の粒度

- v1 は「既存ポリシーが想定通り動く」ことの確認が目的
- 自動テスト（pytest + pgTAP 等）は v1.5 送り

---

## 10. Ryoga 判断

凡例: ✅ 確定 / ⏸ 実装保留中 / ❓ 再開時に Ryoga 判断

- **Q3** ✅: `getSession` → `getUser` 置換のスコープ → **全箇所統一**（worker 判断 default 採用）
- **Q5** ✅: `my-review-row.tsx` の `storage.list` 直叩き解消方針 → **B**（`launch-polish.md` §10.4 で例外明文化、実装変更なし）

Q1 / Q2 / Q4 / Q6 は本 Phase 範囲外（12b / 12c 側で扱う）。

---

## 11. 作業スケジュール + commit 方針

### 11.1 作業スケジュール

| Step | 内容 | 見込み |
|---|---|---|
| 1 | `getSession` → `getUser` 置換（frontend BFF 8 箇所 + Server Component 5 箇所、wrapper 削除） | 半日 |
| 2 | Storage RLS 監査 + ADR-0007 起票 + `launch-polish.md` §10.4 文言更新 | 半日 |
| 3 | 検証（`pnpm tsc/lint/build`、E2E） | （含む）|
| 合計 | | **約 1 日** |

### 11.2 commit 構成（2 commits）

```
1. refactor(auth): replace getSession with getUser across BFF and Server Components
2. docs: ADR-0007 storage RLS audit + launch-polish.md §10.4 storage.list exception
```

---

## 12. 関連 spec / ADR

- `docs/specs/phase-12b-features.md`: `/me/reviews` + 10MB + drag-drop（12a merge 後着手）
- `docs/specs/phase-12c-farmer-profile.md`: farmer プロフィール必須化（Q6=A 採用時のみ起票）
- `docs/specs/launch-polish.md` §10.4: storage 操作の BFF 原則（本 Phase で例外条項追加）
- `docs/decisions/0003-storage-rls-path-enforcement.md`: 既存 Storage RLS 設計
- `docs/decisions/0005-jwt-verification-strategy.md`: JWT 検証方針

---

**以上**
