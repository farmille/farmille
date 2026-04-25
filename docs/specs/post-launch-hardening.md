# Farmille v1 ローンチ後 UX + セキュリティ強化 仕様 (Phase 12)

**作成日**: 2026-04-25
**対象**: farmer の「自分のレビュー一覧」ページ + 画像 UX 強化 + 認証/セキュリティ強化
**作業ブランチ**: 12a/12b/12c 別ブランチ（§12 参照、派生元: Phase 11 merge 後の `main`）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`launch-polish.md` と同水準）
**前提 Phase**: Phase 11（launch polish）完了。v1 launch 後 or 並行実装も可

> **実装ステータス（2026-04-25）**: **保留中**。Ryoga 判断により Phase 12 の実装は v1 ローンチ後の優先度判定まで未着手。本 spec は将来再開時の参照用としてアップデート済（Q3/Q4/Q5 は worker 判断 default 確定、Q1/Q6 は再開時に Ryoga 判断、§12 で 12a/12b/12c 分割案を確定）。

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール

**必達**:
- farmer（reviewer 系ロール）が自分の投稿済レビュー一覧を `/me/reviews` で閲覧でき、各レビューから編集へ遷移できる
- 画像アップロードの最大サイズが 5MB → **10MB** に拡張（Supabase バケット設定 + frontend validation 両方）
- maker の資材登録/編集で画像順序を **drag & drop** で変更できる（Phase 10 縮退分 ↑↓ ボタンの置換）
- frontend BFF / Server Component で `getSession()` を `getUser()` に置換し、JWT 署名検証を徹底（backend には `get_session` 不在のため対象外）
- Storage RLS ポリシー（review-images / product-images）を再監査し、欠漏がないことを確認 + ドキュメント化
- Phase 10 review で指摘された **`my-review-row.tsx` の `supabase.storage.list` 直叩き**（spec §10.4 BFF 原則からの deviation）の解消方針を確定（BFF endpoint 化 or 仕様明文化）

### 0.2 縮退ライン（落ちても v1.5 送り可）

- **drag & drop の accessibility**（キーボード操作対応）: v1 は mouse / touch のみ縮退可
- **Storage RLS の E2E テスト**: 監査 + ドキュメントのみで必達とし、自動テストは v1.5 送り可

### 0.3 翌日送り（本 Phase 対象外）

- progressive onboarding（Phase 13）
- モバイル対応確認（Phase 13 / v1.5）
- レビュー平均値の SQL view 化（v1.5）
- `product_images.storage_path` カラム追加（v1.5、spec `image-edit-and-launch-ready.md` §11.3）

---

## 1. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/me/reviews` | Server + Client（新規） | 自分の投稿レビュー一覧。各カードに [編集] ボタン → `/products/[id]#review-{id}` | reviewer 系ロール（farmer/researcher/ja_staff）|
| `/products/new` / `/products/[id]/edit` | Server + Client | 画像アップロードの drag & drop sort UI 導入 | maker |
| **導線追加箇所** | - | reviewer 系ロールでログイン済の場合、以下 2 箇所から `/me/reviews` への Link を追加: ① `/products` ページの右上ヘッダー領域、② `/home`（薄ラッパ Phase 11b で実装済前提）の reviewer 系着地点 = `/products` のヘッダーで吸収。**Phase 12 では header 共通化はしない**（Phase 12 触らないファイル §7、Phase 13 以降で対応） | reviewer 系ロール |

---

## 2. データ書き込み方針（skill §1.3 厳守）

本 Phase は基本的に「既存機能の UX/セキュリティ強化」であり、新規データ経路は発生しない。`getSession()` → `getUser()` は検証ロジックの強化のみで、永続化は無い。

---

## 3. DB スキーマ変更

**なし**。本 Phase は migration ゼロ。

### 3.1 Supabase Storage バケット設定変更（Ryoga 直作業 or CLI）

- `review-images` バケットの file size limit: 5MB → **10MB**
- `product-images` バケットの file size limit: 5MB → **10MB**

**方法の選択**（Ryoga 判断 Q1）:
- A: Supabase Dashboard > Storage > Bucket settings で手動変更（簡単だが dev/prod で二重作業）
- B: `supabase/config.toml` に bucket 設定を書いて `supabase db push --linked`（migration と同じノリで再現性 ◎）

**B 推奨**だが現状の確認結果 + 注意点:
- `supabase/config.toml` は **現状リポジトリに不在**（`supabase init` 未実行 or 削除済）
- B を採用する場合、worker は `supabase init` を一度実行 → 生成された `config.toml` のうち `[storage.buckets]` セクションのみ commit、その他の不要セクション（auth / db / api 等の dev 用デフォルト）は commit しないか .gitignore で除外する判断が必要
- Ryoga が dev でも `supabase start` をローカル使用していない前提なら、B はリポジトリ汚染なしで進められる
- 不安なら A 採用（spec §3.1 の Ryoga 直作業として両環境で手動）も妥当

---

## 4. FastAPI エンドポイント

### 4.1 新規: `/v1/me/reviews`

配置: `backend/app/routers/me.py`（**本 Phase で新設**。Phase 11 から profile-status を削除したため、`me.py` 自体が現状不在）

router include を `backend/app/main.py` に追加する必要あり。

```
GET /v1/me/reviews
認証: Bearer JWT 必須
権限: reviewer 系ロールのみ（farmer / researcher / ja_staff）
Query: ?page=1&limit=20（任意、default 20）
Response 200:
  {
    "reviews": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product_name": str,
        "product_maker_name": str,
        "product_image_url": str | null,  // 代表画像
        "rating": int,
        "body": str,
        "created_at": "ISO 8601",
        "updated_at": "ISO 8601"
      }
    ],
    "total": int
  }
```

処理:
- JWT sub → `reviews.user_id = sub` で絞り込み、`products` を JOIN
- 投稿日時 desc
- 本人のもののみ（他人のレビューは一切混ざらない）

### 4.2 既存修正: `getSession()` → `getUser()`（frontend のみ）

**対象スコープ**:
- frontend BFF proxy（`frontend/src/app/api/**/route.ts`）= **8 箇所**
- frontend Server Component（auth gate 用途）= **5 箇所**（`products/new/page.tsx`、`products/[id]/edit/page.tsx`、`maker/products/page.tsx`、`onboarding/farmer/page.tsx`、`onboarding/maker/page.tsx`）
- wrapper: `frontend/src/lib/auth/server.ts` の `getSession()` 自体は **削除**（呼び出し元が無くなれば不要）
- backend: **対象外**（grep 結果 0 件、認証は `Depends(get_current_user)` で JWT 直接検証している、ADR-0005 参照）

**背景**: `getSession()` は localStorage / cookie の cached session を返すだけで JWT 署名検証をしない。`getUser()` は Supabase Auth Server に問い合わせて署名検証する。BFF の owner check / Server Component の auth gate は後者でないと成り立たない。

**置換ルール**（Q3 推奨案 = 全箇所統一、worker 判断負荷の最小化）:
- BFF proxy: `getSession()` → `getUser()` に置換、access_token は `session?.access_token` ではなく `(await supabase.auth.getSession()).data.session?.access_token` で別途取得（getUser は token を返さないため、token 取得用に getSession を 1 回呼ぶ二重コール構造になる）
- Server Component: `getSession()` → `getUser()` に置換（auth gate 用途のみ）
- 表示用途で残ってしまう場合（token が必要なケースのみ）: コメントで理由明記

**注意**: getUser() は HTTP 往復が増えるため、BFF proxy で「getUser → token のために getSession」の二重コールが発生。Phase 11b の session expire 検知 (`/login?expired=1`) と整合させる（getUser が 401 を返したら expired 扱い）。

---

## 5. 画像 drag & drop sort

### 5.1 ライブラリ選定

**推奨: `@dnd-kit/core` + `@dnd-kit/sortable`**
- React 向け、accessibility 配慮、軽量
- `react-dnd` より API がシンプル

### 5.2 UI

Phase 10 の `frontend/src/app/products/new/_components/product-image-upload.tsx` の ↑↓ ボタンを置換（編集ページ `/products/[id]/edit` も同一コンポーネント `ProductForm` 経由で `ProductImageUpload` を使用）:
- thumbnail grid を `<SortableContext>` で wrap
- 各 thumbnail が drag handle（全体 drag 可）
- drop 時に順序確定 → callback で親に通知

**state 設計（確定）**:
- 既存画像（編集時）と新規追加画像を **同一リストで管理**
- 親 component (`product-form.tsx`) に `items: Array<{ id, url, kind: "existing" | "new", file?: File, path?: string }>` という統合 state を持たせる
- `ProductImageUpload` は `items` + `onItemsChange` を Props で受ける形に refactor
- 既存の `existingOrder` / `files` / `removedPaths` の 3 state は廃止し `items` に集約（remove は items から filter で除外）
- 送信時 payload は Phase 10 と同じ `order: [{ url, existing }]` 形式に変換

### 5.3 縮退の扱い

キーボード操作での並び替えは `@dnd-kit` が標準サポート（Space で pickup、矢印で移動）だが、v1 は mouse/touch のみで OK とし、a11y 完全対応は v1.5 送り可（§0.2）。

---

## 6. Storage RLS 再監査

### 6.1 監査方針

既存 migration を読み直し、以下を確認:
- `supabase/migrations/20260420000000_review_images_rls.sql`
- `supabase/migrations/20260423000000_product_images_storage_rls.sql`

**チェック項目**:
- [ ] INSERT: owner（`auth.uid()` = path 第 1 階層）のみ許可
- [ ] SELECT: 全員許可（public bucket）
- [ ] UPDATE: 必要なら owner のみ許可（通常は不要、v1 では検証のみ）
- [ ] DELETE: owner のみ許可（BFF は service_role で bypass、フロントは呼ばない）

### 6.2 Phase 10 review 指摘の解消

Phase 10 PR #4 review で指摘された `frontend/src/app/products/[id]/_components/my-review-row.tsx:53` の `supabase.storage.from("review-images").list()` 直叩きが、`launch-polish.md`（Phase 11）§10.4 の BFF 原則「frontend の storage 操作は upload / getPublicUrl のみ」と矛盾している件を本 Phase で解消する。

**解消方針**:
- 案 A: BFF endpoint `GET /v1/me/reviews/{review_id}/images` を新設し、フロントは `list()` を呼ばず BFF 経由で path 一覧取得
- 案 B: `launch-polish.md` §10.4 を更新し、`storage.list()` も「ADR-0003 で review_images テーブル不在のため例外的に許容」と明文化（実装変更なし、ドキュメント変更のみ）
- 案 C: ADR-0003 を見直し、`review_images` テーブルを追加してメタデータを DB 管理（最も DOA 準拠だがスキーマ変更 + Phase 7 移行が重い）

**Q5 確定（2026-04-25、worker 判断 default 採用）**: **B**（最も軽量、Phase 12 のスケジュール内）。A は Phase 12.5 / v1.5 で再考可、C は v2.0 候補。

### 6.3 成果物

`docs/decisions/0007-storage-rls-audit.md`（新規 ADR、ADR-0006 は `url-namespace-policy` で取得済のため 0007 にずらす）:
- 各バケットの RLS ポリシー一覧
- BFF と RLS の二重防御構造の図解
- Phase 10 の path validation（`_image_path.py`）との整合確認
- §6.2 で確定した解消方針の記録
- 今後 RLS を変更する際の手順

---

## 7. 触らないファイル

- `supabase/migrations/*`（本 Phase で migration は `config.toml` 経由のみ、既存 SQL は触らない）
- `backend/app/routers/{auth,onboarding,crops,product_types,product_benefits,certifications,maker}.py`
- `frontend/src/app/onboarding/*`
- `frontend/src/app/(auth)/*`
- `docs/specs/*`（本 Phase 作成以外）
- `.claude/`

---

## 8. 触るファイル（予想）

### 新規

- `backend/app/routers/me.py`（§4.1 reviews endpoint、本 Phase で新設）
- `frontend/src/app/me/reviews/page.tsx`（§1）
- `frontend/src/app/me/reviews/_components/review-card.tsx`
- `frontend/src/app/api/me/reviews/route.ts`（BFF proxy）
- `docs/decisions/0007-storage-rls-audit.md`（§6.3、ADR-0006 は url-namespace-policy で取得済のため 0007）
- `supabase/config.toml`（§3.1 B 採用時のみ、`supabase init` で生成して `[storage.buckets]` のみ commit）

### 既存修正

- `backend/app/main.py`（me router include）
- `frontend/src/lib/auth/server.ts`（`getSession()` 関数を削除、呼び出し元を `getUser()` 経由に統一）
- `frontend/src/app/api/**/route.ts`（**8 箇所**、`getSession()` → `getUser()` + token 取得用 getSession の二重コール構造）
- `frontend/src/app/{products/new,products/[id]/edit,maker/products,onboarding/farmer,onboarding/maker}/page.tsx`（**5 箇所**、Server Component の auth gate を `getUser()` に置換）
- `frontend/src/app/products/new/_components/product-image-upload.tsx`（§5 drag & drop 置換、`/products/[id]/edit` は本コンポーネント共有のため別途修正不要）
- `frontend/src/app/products/new/_components/product-form.tsx`（§5.2 統合 state `items` への refactor）
- `frontend/package.json`（`@dnd-kit/core` + `@dnd-kit/sortable` 追加）
- `frontend/src/lib/specs.ts`（仮: 画像 size 上限定数を 10MB に変更。実際は `product-image-upload.tsx` / `review-image-upload.tsx` の `MAX_SIZE_BYTES` 定数を 5 → 10 に更新）
- `docs/specs/launch-polish.md` §10.4（§6.2 案 B 採用時のみ、storage.list 例外化を明文化）

---

## 9. 受け入れ条件

### 9.1 `/me/reviews`

- [ ] ログイン済 farmer が `/me/reviews` で自分のレビュー一覧を見られる
- [ ] 各カードの [編集] ボタン → `/products/{id}` のレビュー編集に遷移
- [ ] 未ログインで `/me/reviews` → `/login` にリダイレクト
- [ ] ロールが maker だけの場合、`/me/reviews` → 404 or 適切な案内（reviewer 系ロールではないため）

### 9.2 画像サイズ拡張

- [ ] 5MB 超過 10MB 以下の画像がアップロードできる
- [ ] 10MB 超過で frontend 側 validation エラー
- [ ] Supabase Storage bucket の `file_size_limit` が `10485760` (10 * 1024 * 1024) に設定されている

### 9.3 画像 drag & drop

- [ ] 資材登録 / 編集で thumbnail を drag して順序変更できる
- [ ] 保存後、表示順が drag で決めた通りになる
- [ ] ↑↓ ボタンは削除されている（drag & drop に一本化）

### 9.4 認証セキュリティ

- [ ] `grep -rn "getSession\|get_session" backend/ frontend/src/app/api/` の結果が owner check / 認証に関わる箇所でゼロ
- [ ] 置換後も既存 E2E（signup / login / post review / create product）が動く

### 9.5 Storage RLS

- [ ] ADR-0007 が `docs/decisions/` に存在し、ポリシー一覧が記載される
- [ ] 各バケットのポリシー名と対象操作がドキュメントに揃う
- [ ] skill §1.3 / §1.1 との整合が取れている

### 9.6 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] E2E 手動確認: `/me/reviews` 表示 → 編集遷移 → 10MB 画像アップロード → drag & drop 並び替え

---

## 10. 設計上の注意

### 10.1 `getSession` → `getUser` のパフォーマンス影響

- `getUser()` は毎回 Supabase Auth Server への HTTP 往復
- **Phase 11b の hotfix（PR #10）で `getUser` / `getSession` を React `cache()` で memoize 済**。同一リクエスト内では HTTP 往復は 1 回に圧縮されるため、置換による遅延悪化は軽微
- BFF から JWT 署名検証を自前で行う方式もあるが（ADR-0005）、v1 は `getUser()` で十分
- v1.5 で pain を感じたら自前検証に切替

### 10.2 drag & drop と既存画像の混在

- 編集時は既存画像 + 新規追加画像が同リストに並ぶ
- 保存時の payload は Phase 10 `order: [{ url, existing }]` 形式なので、UI 側で `items.map(item => ({ url, existing: item.existing }))` で組み立てる
- drag & drop ライブラリは id で要素を識別するため、既存画像は URL、新規追加は tmp ID（`nanoid()` 等）で id を付ける

### 10.3 10MB 拡張と BFF upload タイムアウト

- Railway のデフォルト HTTP タイムアウトは 300s、10MB アップロードなら通常十分
- ただし農家が 4G 経由で上げる場合は低速になる可能性あり、Phase 13 でモバイル対応と合わせて進捗 UI を検討

### 10.4 RLS 監査の粒度

- v1 は「既存ポリシーが想定通り動く」ことの確認が目的
- 自動テスト（pytest + pgTAP 等）は v1.5 送り

---

## 11. Ryoga 判断

凡例: ✅ 確定 / ⏸ 実装保留中（Phase 12 全体保留に伴う）/ ❓ 再開時に Ryoga 判断

- **Q1** ❓: Storage バケット設定変更は Dashboard 手動（A）or `supabase/config.toml` 経由（B）？
  - 推奨: B、ただし現状 `config.toml` 不在のため `supabase init` 必要（§3.1 注意点参照）。リポジトリ汚染を避けたいなら A も妥当
  - **再開時 Ryoga 判断**（12b 着手前に必要）
- **Q2** ✅: `/me/reviews` のページネーション → **20 件固定**（v1.5 で infinite 化）
- **Q3** ✅: `getSession` → `getUser` 置換のスコープ → **全箇所統一**（worker 判断 default 採用）
  - 表示用途で getSession が必要なケースは別途コメント明記
- **Q4** ✅: drag & drop の a11y 対応 → **v1.5 送り**（v1 は mouse / touch のみ）
- **Q5** ✅: `my-review-row.tsx` の `storage.list` 直叩き解消方針（§6.2 参照） → **B**（`launch-polish.md` §10.4 で例外明文化、実装変更なし）
- **Q6** ⏸: **farmer のレビュー投稿時プロフィール必須化**:
  - 案 A: 本 Phase 12 に追加（Phase 12c として、+0.5-1 日の工数増）
  - 案 B: Phase 13 progressive onboarding（動的 nudge）と統合
  - 案 C: 別 Phase 12.5 起票
  - 推奨: A（Phase 12 が「post-launch UX 強化」スコープに合致、Phase 13 まで先送りすると farmer のプロフィール 0 件問題がローンチ後しばらく続く）
  - **再開時 Ryoga 判断**（12c の起票要否を決める）。A 採用なら §1 / §4 / §8 を追加、B 採用なら Phase 13 spec 側に追記

---

## 12. 作業スケジュール + PR 分割方針

Phase 11 の a/b 分割と同じ運用感に揃え、Phase 12 は **12a / 12b / 12c の 3 PR 構成** とする。
Ryoga 判断 Q1（bucket）/ Q6（farmer プロフィール必須化）の結果に応じて 12b / 12c の着手可否が決まるため、12a を先行着手するのが最効率。

### 12.1 Phase 12a: security/refactor + docs（Q1 / Q6 と独立、先行可能）

**ブランチ**: `feat/post-launch-hardening-1-security`（11a merge 後の `main` から派生）
**目的**: 影響範囲が限定的で Q1/Q6 の判断を待たずに進められる security / docs を先行投入

**含む**:
- §4.2 `getSession()` → `getUser()` 置換（frontend BFF 8 箇所 + Server Component 5 箇所、wrapper 削除）
- §6 Storage RLS 監査 + ADR-0007 起票
- §6.2 Q5=B の `launch-polish.md` §10.4 文言更新（`storage.list` 例外明文化）

**commit 構成**（2 commits）:
```
1. refactor(auth): replace getSession with getUser across BFF and Server Components
2. docs: ADR-0007 storage RLS audit + launch-polish.md §10.4 storage.list exception
```

**工数目安**: 半日 + 半日 = **約 1 日**

### 12.2 Phase 12b: new features（Q1 確定後着手）

**ブランチ**: `feat/post-launch-hardening-2-features`（12a merge 後の `main` から派生）
**目的**: 既存 UX を改善する新機能 3 つ。bucket 設定方法（Q1）の確定が前提

**含む**:
- §1 `/me/reviews` ページ + §4.1 BFF endpoint（`me.py` 新設込み）
- §3.1 画像バケット 10MB 化（Q1 結果に応じて Dashboard or `config.toml`）+ frontend validation 5MB → 10MB
- §5 drag & drop sort（`@dnd-kit` + `product-form.tsx` の state refactor）

**commit 構成**（4 commits）:
```
1. feat(backend): add /v1/me router with /v1/me/reviews endpoint
2. feat(frontend): /me/reviews page and navigation links
3. chore(storage): raise bucket size limits to 10MB and update frontend validation
4. feat(frontend): drag-and-drop image sort via @dnd-kit (state refactor included)
```

**工数目安**: 1 日 + 半日 + 1-1.5 日 = **約 2.5-3 日**

### 12.3 Phase 12c: progressive farmer profile prompt（Q6=A 採用時のみ）

**ブランチ**: `feat/post-launch-hardening-3-farmer-onboarding`（12a or 12b merge 後の `main` から派生、独立着手可）
**目的**: farmer の初回レビュー投稿フローの手前にプロフィール（prefecture / city / 作目 1 件以上）入力 step を差し込み、プロフィール 0 件問題を即解消

**含む**（Q6=A 採用時に詳細化、本 spec §1 / §4 / §8 への追記が必要）:
- レビュー投稿フォーム手前のプロフィール step UI
- `farmer_profiles` 行が無いユーザを検出する BFF endpoint（or 既存 endpoint 拡張）
- profile 完了後にレビュー投稿フォームを表示する遷移ロジック

**commit 構成**（1 commit）:
```
1. feat(onboarding): progressive farmer profile prompt before first review submit
```

**工数目安**: **約 0.5-1 日**

### 12.4 全体工数

- Phase 12a: 約 1 日
- Phase 12b: 約 2.5-3 日
- Phase 12c（Q6=A 採用時のみ）: 約 0.5-1 日
- 検証 / Ryoga 手動: 各 PR で半日含む
- **合計: 約 3.5-5 日**（Q6 採否に依存）

12a / 12b / 12c の並列化は理論上可能だが、12b の `getSession→getUser` 置換は 12a と衝突する可能性が高いため **12a を先に merge してから 12b / 12c 派生** が安全。

---

**以上**
