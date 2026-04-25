# Farmille v1 ローンチ後 UX 機能追加 仕様 (Phase 12b)

**作成日**: 2026-04-25
**対象**: farmer の「自分のレビュー一覧」ページ + 画像アップロード 10MB 化 + 画像 drag & drop sort
**作業ブランチ**: `feat/post-launch-hardening-2-features`（派生元: 12a merge 後の `main`）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`launch-polish.md` と同水準）
**前提 Phase**: Phase 11（launch polish）+ Phase 12a（auth refactor）完了

> **実装ステータス（2026-04-25）**: **保留中**。Q1（bucket 設定方法）の Ryoga 判断が必要。12a と独立だが auth 周辺の `getSession→getUser` 置換と衝突するため 12a merge 後の派生を推奨。

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール

**必達**:
- farmer（reviewer 系ロール）が自分の投稿済レビュー一覧を `/me/reviews` で閲覧でき、各レビューから編集へ遷移できる
- 画像アップロードの最大サイズが 5MB → **10MB** に拡張（Supabase バケット設定 + frontend validation 両方）
- maker の資材登録/編集で画像順序を **drag & drop** で変更できる（Phase 10 縮退分 ↑↓ ボタンの置換）

### 0.2 縮退ライン（落ちても v1.5 送り可）

- **drag & drop の accessibility**（キーボード操作対応）: v1 は mouse / touch のみ縮退可（Q4=v1.5 送り確定）

### 0.3 翌日送り（本 Phase 対象外）

- `getSession` → `getUser` 置換（Phase 12a で実施）
- Storage RLS 監査 / ADR-0007（Phase 12a で実施）
- farmer プロフィール必須化（Phase 12c、Q6=A 採用時のみ）
- レビュー平均値の SQL view 化（v1.5）
- `product_images.storage_path` カラム追加（v1.5、`image-edit-and-launch-ready.md` §11.3）
- モバイル対応確認（Phase 13 / v1.5）

---

## 1. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/me/reviews` | Server + Client（新規） | 自分の投稿レビュー一覧。各カードに [編集] ボタン → `/products/[id]#review-{id}` | reviewer 系ロール（farmer/researcher/ja_staff）|
| `/products/new` / `/products/[id]/edit` | Server + Client | 画像アップロードの drag & drop sort UI 導入 | maker |
| **導線追加箇所** | - | reviewer 系ロールでログイン済の場合、`/products` ページの右上ヘッダー領域から `/me/reviews` への Link を追加。**header 共通化はしない**（§6 触らないファイル、Phase 13 以降で対応） | reviewer 系ロール |

---

## 2. データ書き込み方針（skill §1.3 厳守）

`/me/reviews` 表示は read-only（既存 reviews テーブルの SELECT のみ）。画像 10MB / drag & drop は Phase 10 で確立した「フロントから Storage upload、BFF が DB メタデータ管理」パターン踏襲。

---

## 3. DB スキーマ変更

**migration なし**。

### 3.1 Supabase Storage バケット設定変更（Q1 確定後）

- `review-images` バケットの file size limit: 5MB → **10MB**
- `product-images` バケットの file size limit: 5MB → **10MB**

**方法の選択**（Ryoga 判断 Q1）:
- A: Supabase Dashboard > Storage > Bucket settings で手動変更（簡単だが dev/prod で二重作業）
- B: `supabase/config.toml` に bucket 設定を書いて `supabase db push --linked`（migration と同じノリで再現性 ◎）

**B 推奨**だが現状の確認結果 + 注意点:
- `supabase/config.toml` は **現状リポジトリに不在**（`supabase init` 未実行 or 削除済）
- B を採用する場合、worker は `supabase init` を一度実行 → 生成された `config.toml` のうち `[storage.buckets]` セクションのみ commit、その他の不要セクション（auth / db / api 等の dev 用デフォルト）は commit しないか `.gitignore` で除外する判断が必要
- Ryoga が dev でも `supabase start` をローカル使用していない前提なら、B はリポジトリ汚染なしで進められる
- 不安なら A 採用（Ryoga 直作業として両環境で手動）も妥当

---

## 4. FastAPI エンドポイント

### 4.1 新規: `/v1/me/reviews`

配置: `backend/app/routers/me.py`（**本 Phase で新設**）。router include を `backend/app/main.py` に追加する必要あり。

```
GET /v1/me/reviews
認証: Bearer JWT 必須
権限: reviewer 系ロールのみ（farmer / researcher / ja_staff）
Query: ?page=1&limit=20（任意、default 20、Q2=20件固定で確定）
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
- 親 component（`product-form.tsx`）に `items: Array<{ id, url, kind: "existing" | "new", file?: File, path?: string }>` という統合 state を持たせる
- `ProductImageUpload` は `items` + `onItemsChange` を Props で受ける形に refactor
- 既存の `existingOrder` / `files` / `removedPaths` の 3 state は廃止し `items` に集約（remove は items から filter で除外）
- 送信時 payload は Phase 10 と同じ `order: [{ url, existing }]` 形式に変換

### 5.3 縮退の扱い（Q4=v1.5 確定）

キーボード操作での並び替えは `@dnd-kit` が標準サポート（Space で pickup、矢印で移動）だが、v1 は mouse / touch のみで OK。a11y 完全対応は v1.5 送り。

---

## 6. 触らないファイル

- `supabase/migrations/*`（本 Phase で migration は `config.toml` 経由のみ、既存 SQL は触らない）
- `backend/app/routers/{auth,onboarding,crops,product_types,product_benefits,certifications,maker}.py`
- `frontend/src/app/onboarding/*`
- `frontend/src/app/(auth)/*`
- `frontend/src/lib/auth/server.ts`（Phase 12a で触る、本 Phase は触らない）
- `docs/specs/phase-12a-security-refactor.md` / `phase-12c-farmer-profile.md`
- `.claude/`

---

## 7. 触るファイル（予想）

### 新規

- `backend/app/routers/me.py`（§4.1 reviews endpoint、本 Phase で新設）
- `frontend/src/app/me/reviews/page.tsx`（§1）
- `frontend/src/app/me/reviews/_components/review-card.tsx`
- `frontend/src/app/api/me/reviews/route.ts`（BFF proxy）
- `supabase/config.toml`（§3.1 B 採用時のみ、`supabase init` で生成して `[storage.buckets]` のみ commit）

### 既存修正

- `backend/app/main.py`（me router include）
- `frontend/src/app/products/new/_components/product-image-upload.tsx`（§5 drag & drop 置換、`/products/[id]/edit` は本コンポーネント共有のため別途修正不要）
- `frontend/src/app/products/new/_components/product-form.tsx`（§5.2 統合 state `items` への refactor）
- `frontend/package.json`（`@dnd-kit/core` + `@dnd-kit/sortable` 追加）
- `frontend/src/app/products/new/_components/product-image-upload.tsx` / `frontend/src/app/products/[id]/_components/review-image-upload.tsx`（`MAX_SIZE_BYTES` 定数を 5MB → 10MB に更新）
- `frontend/src/app/products/page.tsx`（§1 導線追加: reviewer 系ログイン済時に `/me/reviews` への Link）

---

## 8. 受け入れ条件

### 8.1 `/me/reviews`

- [ ] ログイン済 farmer が `/me/reviews` で自分のレビュー一覧を見られる
- [ ] 各カードの [編集] ボタン → `/products/{id}` のレビュー編集に遷移
- [ ] 未ログインで `/me/reviews` → `/login` にリダイレクト
- [ ] ロールが maker だけの場合、`/me/reviews` → 404 or 適切な案内（reviewer 系ロールではないため）
- [ ] 20 件以上のレビューがあるユーザは page=2 で次の 20 件が見られる

### 8.2 画像サイズ拡張

- [ ] 5MB 超過 10MB 以下の画像がアップロードできる
- [ ] 10MB 超過で frontend 側 validation エラー
- [ ] Supabase Storage bucket の `file_size_limit` が `10485760` (10 * 1024 * 1024) に設定されている

### 8.3 画像 drag & drop

- [ ] 資材登録 / 編集で thumbnail を drag して順序変更できる
- [ ] 保存後、表示順が drag で決めた通りになる
- [ ] ↑↓ ボタンは削除されている（drag & drop に一本化）
- [ ] 既存画像 + 新規追加画像が同リスト内で混在 drag できる

### 8.4 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] E2E 手動確認: `/me/reviews` 表示 → 編集遷移 → 10MB 画像アップロード → drag & drop 並び替え

---

## 9. 設計上の注意

### 9.1 drag & drop と既存画像の混在

- 編集時は既存画像 + 新規追加画像が同リストに並ぶ
- 保存時の payload は Phase 10 `order: [{ url, existing }]` 形式なので、UI 側で `items.map(item => ({ url, existing: item.kind === "existing" }))` で組み立てる
- drag & drop ライブラリは id で要素を識別するため、既存画像は URL、新規追加は tmp ID（`nanoid()` 等）で id を付ける

### 9.2 10MB 拡張と BFF upload タイムアウト

- Railway のデフォルト HTTP タイムアウトは 300s、10MB アップロードなら通常十分
- ただし農家が 4G 経由で上げる場合は低速になる可能性あり、Phase 13 でモバイル対応と合わせて進捗 UI を検討

### 9.3 me router の汎用性

- `me.py` は本 Phase で新設するが、将来的に `/v1/me/profile` / `/v1/me/products`（maker 用）等を追加する受け皿として汎用的に作る
- ただし本 Phase は `/v1/me/reviews` のみで他は追加しない（YAGNI）

---

## 10. Ryoga 判断

凡例: ✅ 確定 / ⏸ 実装保留中 / ❓ 再開時に Ryoga 判断

- **Q1** ❓: Storage バケット設定変更は Dashboard 手動（A）or `supabase/config.toml` 経由（B）？
  - 推奨: B、ただし現状 `config.toml` 不在のため `supabase init` 必要（§3.1 注意点参照）。リポジトリ汚染を避けたいなら A も妥当
  - **再開時 Ryoga 判断**（本 Phase 着手前に必要）
- **Q2** ✅: `/me/reviews` のページネーション → **20 件固定**（v1.5 で infinite 化）
- **Q4** ✅: drag & drop の a11y 対応 → **v1.5 送り**（v1 は mouse / touch のみ）

Q3 / Q5 は Phase 12a 範囲、Q6 は Phase 12c 範囲。

---

## 11. 作業スケジュール + commit 方針

### 11.1 作業スケジュール

| Step | 内容 | 見込み |
|---|---|---|
| 1 | Q1 確定（Ryoga） | Ryoga 側 |
| 2 | `/me/reviews` BFF endpoint + UI（`me.py` 新設込み） | 1 日 |
| 3 | 画像バケット 10MB 化（Q1 結果に応じて Dashboard or `config.toml`、+ frontend validation） | 半日 |
| 4 | drag & drop 導入（`@dnd-kit` + `product-form.tsx` の state refactor） | 1-1.5 日 |
| 5 | 検証（`pnpm tsc/lint/build`、E2E） | 半日 |
| 合計 | | **約 2.5-3 日** |

### 11.2 commit 構成（4 commits）

```
1. feat(backend): add /v1/me router with /v1/me/reviews endpoint
2. feat(frontend): /me/reviews page and navigation links
3. chore(storage): raise bucket size limits to 10MB and update frontend validation
4. feat(frontend): drag-and-drop image sort via @dnd-kit (state refactor included)
```

---

## 12. 関連 spec / ADR

- `docs/specs/phase-12a-security-refactor.md`: 12a の security/refactor（先行必須）
- `docs/specs/phase-12c-farmer-profile.md`: farmer プロフィール必須化（Q6=A 採用時のみ起票）
- `docs/specs/image-edit-and-launch-ready.md`: Phase 10 の画像編集仕様（drag & drop の前提）
- `docs/decisions/0003-storage-rls-path-enforcement.md`: Storage RLS 設計

---

**以上**
