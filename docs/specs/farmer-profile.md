# Farmille v1 農家プロフィール拡張 仕様 (Phase 19)

**作成日**: 2026-05-01
**対象 Phase**: Phase 19
**作業ブランチ**: `feat/phase-19-farmer-profile`（仮）
**実装担当**: worker
**位置づけ**: 既存 `farmer_profiles`（Phase 4 onboarding / Phase 12c）に表示名・自己紹介・アバターを追加し、本人ビューのプロフィール表示・編集を提供。公開プロフページ `/u/{username}` は v1.5+

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` の以下に準拠する。

- **§1.1 DOA 優先**: 既存 `farmer_profiles` に **3 列のみ ALTER ADD COLUMN**（`display_name` / `bio` / `avatar_url`）。新テーブル追加 / `users` 直カラム追加は採用しない。デフォルト値あり追加のため軽微 ALTER として許容（generator 指示 §10、SKILL §1.1 の「ALTER より新テーブル + 移行優先だが軽微 ADD COLUMN は許容」に整合）
- **§1.2 ポータビリティ予算**: Supabase Edge Functions / Realtime 不使用。アバター画像は Storage 直 upload + RLS path 強制（ADR-0003 踏襲）
- **§1.3 責務分離**: プロフィール GET / PUT は FastAPI `/v1/me/profile` 経由。アバター upload のみ Storage 直叩き（§1.3 例外 2）。フロントから `supabase.from()` / `supabase.rpc()` を呼ばない
- **§1.4 v1 スコープ厳守**: 「やる」内の §3.6「農家プロフ画面」のうち**本人ビューのみ**。**公開プロフページ `/u/{username}`（要件 §3.6.7 / §5.2.11 / §5.2.12）は画面・API・カラムを一切作らない**（§13）
- **§3.1 / §3.2 レビュー軸**: RLS 全テーブル維持、JWT 検証 + role 判定、Pydantic バリデーション、統一エラー、PUT 冪等
- **ADR-0003 整合**: アバター Storage パス `{auth.uid}/avatar/{filename}` 強制、RLS で第 1 / 第 2 階層検証

§3 の共通既定値は **Phase 15 §3 と同じ**（参照）。§13 で本 Phase が踏み込まない領域を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達

- **farmer ロール**が `/me/profile` で自身のプロフィール（既存 prefecture / city / field_size / note + 新規 display_name / bio / avatar_url）を表示できる
- `/me/profile/edit` で上記項目 + アバター画像をアップロード・編集できる
- 既存 `/me/reviews`（Phase 12c）は変更せず**並列配置**、上位ナビ（`/me/profile` / `/me/reviews` / `/me/materials`）で切り替え可能
- ja_staff / researcher は `/me/profile` にアクセスすると **403 + 案内メッセージ**（「v1 では farmer ロールのみ対応」）。`ja_profiles` / `researcher_profiles` 拡張は要件 §5.3.1 / §5.3.2 確定後の別 phase
- maker は `/me/profile` にアクセスしても本機能を使えず、`/maker/profile` を案内（Phase 17 で実装済）

### 1.2 縮退ライン（落ちても v1.5 送り可）

- アバターのクライアント側リサイズ / トリミング UI（v1 は素の upload + サイズ上限のみ）
- bio の markdown 対応（v1 は plain text）

### 1.3 翌日送り（本 Phase 対象外、§13 と一体）

- 公開プロフィールページ `/u/{username}`（要件 §3.6.7、v1.5+）— 画面・API・カラム一切なし
- 公開項目選択（要件 §5.2.11）/ 公開範囲設定（要件 §5.2.12）— v1 は本人のみ閲覧で固定
- フォロー / フォロワー機能（要件 §3.6.7）
- 信頼度バッジ・実績バッジ（要件 §3.6.7、インセンティブ設計）

---

## 2. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/me/profile` | Server + Client（新規） | プロフィール表示 + 編集導線 + マイ資材 / レビュー一覧へのリンク | farmer ロールのみ |
| `/me/profile/edit` | Server + Client（新規） | プロフィール編集フォーム + アバターアップロード | farmer ロールのみ |
| `/me/reviews` | 既存（Phase 12c） | **変更なし**。上位ナビから到達できるよう導線追加のみ | reviewer 系ロール |

新規ページ 2 枚。`/me/reviews` は触らない。

---

## 3. データ書き込み方針

**Phase 15 §3 と同じ**（共通プリアンブル参照）。本 Phase で追加で意識する点:

- プロフィール CRUD は `/v1/me/profile` 経由（GET / PUT）
- アバター画像 upload はフロント Storage 直叩き（§1.3 例外 2）。**path: `{auth.uid}/avatar/{filename}`** 強制（ADR-0003 同パターン）
- avatar_url は upload 完了後にフロントが PUT payload に含めて送る
- 旧アバターの Storage 削除は BFF が PUT 時に `supabase.storage.remove()` 経由で実施（Phase 10 既存パターン踏襲）

---

## 4. DB スキーマ変更

migration 2 本（テーブル ALTER + Storage RLS）を新規追加。

### 4.1 既存 `farmer_profiles` への列追加（migration 1: `20260502150000_phase19_farmer_profile_columns.sql`）

```sql
-- Phase 19: farmer_profiles に表示名・自己紹介・アバターを追加
-- 新テーブル分離は v1 規模では過剰のため、デフォルト値あり ADD COLUMN で対応
ALTER TABLE farmer_profiles
  ADD COLUMN display_name text     CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 50),
  ADD COLUMN bio          text     CHECK (bio IS NULL OR length(bio) <= 500),
  ADD COLUMN avatar_url   text     CHECK (avatar_url IS NULL OR length(avatar_url) <= 2000),
  ADD COLUMN updated_at   timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER trg_farmer_profiles_updated_at
  BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

`display_name` / `bio` / `avatar_url` は全て NULL 許容（既存ユーザーへの後方互換）。CHECK 制約で長さを業務ルール化。

> **DOA 注**: `display_name` を `users` 直に持たせる案も検討したが、`users` は認証コアの最小構造を保つ方針（既存 `name` は氏名、`display_name` は SNS 表示名で意味が異なる）。`farmer_profiles` 拡張のほうが意味的に整合する（generator 指示 §3 確定）。

### 4.2 既存 RLS（変更なし）

`farmer_profiles_select_self` / `farmer_profiles_insert_self` / `farmer_profiles_update_self` / `farmer_profiles_delete_self` の 4 ポリシーが既存（init RLS）。本人のみ SELECT 可は維持（公開プロフィールは v1 アウト、§13）。

### 4.3 アバター用 Storage RLS（migration 2: `20260502150001_phase19_avatars_storage_rls.sql`）

`avatars` バケットを Supabase Studio で事前作成（public read、MIME: `image/jpeg, image/png, image/webp`、サイズ上限 2MB）。RLS は ADR-0003 / Phase 8 product-images RLS と同パターン:

```sql
-- avatars バケット RLS
-- パス命名規約: {auth.uid}/avatar/{filename}

CREATE POLICY "avatars_select_all" ON "storage"."objects"
  FOR SELECT TO "anon", "authenticated"
  USING ("bucket_id" = 'avatars');

CREATE POLICY "avatars_insert_farmer" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "bucket_id" = 'avatars'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'farmer'
    AND (storage.foldername("name"))[1] = (auth.uid())::text
    AND (storage.foldername("name"))[2] = 'avatar'
  );

CREATE POLICY "avatars_update_owner" ON "storage"."objects"
  FOR UPDATE TO "authenticated"
  USING (("bucket_id" = 'avatars' AND "owner" = auth.uid()))
  WITH CHECK (
    "bucket_id" = 'avatars'
    AND "owner" = auth.uid()
    AND (storage.foldername("name"))[1] = (auth.uid())::text
    AND (storage.foldername("name"))[2] = 'avatar'
  );

CREATE POLICY "avatars_delete_owner" ON "storage"."objects"
  FOR DELETE TO "authenticated"
  USING (("bucket_id" = 'avatars' AND "owner" = auth.uid()));
```

第 1 階層 UID + 第 2 階層 `'avatar'` 強制で、他人の領域や別 path への混在を防ぐ。INSERT は **farmer ロールのみ**（ja_staff / researcher / maker は本機能対象外、§1.4 / §13）。

> **ADR-0007 §1 の RLS 表に `avatars` バケット行を追記する作業を本 Phase の作業範囲に含める**（ADR-0007 §「今後 RLS を変更する際の手順」§3 に従う）。新 ADR は不要（Storage RLS 監査 ADR の射程内）。

---

## 5. FastAPI エンドポイント

新規ルーター `backend/app/routers/me_profile.py`（or 既存 `me.py` に追記）。`backend/app/main.py` で `/v1/me` 配下に include。

### 5.1 `GET /v1/me/profile`

```
GET /v1/me/profile
認証: Bearer JWT 必須
権限: **farmer ロール限定**（ja_staff / researcher / maker は 403）
Response 200:
  {
    "user_id": uuid,
    "name": str,                   # users.name（氏名）
    "display_name": str | None,    # 新規: SNS 表示名
    "bio": str | None,             # 新規
    "avatar_url": str | None,      # 新規
    "prefecture": str,
    "city": str,
    "field_size": float | None,    # アール単位
    "note": str | None
  }
Response 404: { "detail": "profile_not_found", "code": "profile_not_found" }
  // farmer_profiles 行が存在しない（onboarding 未完了等）
Response 403: maker / unassigned
Response 401: 未ログイン
```

処理:
1. JWT 検証 + role 判定（farmer のみ通過、それ以外は 403）
2. service_role で `farmer_profiles` を `user_id = auth.uid()` で取得（404 判定）
3. `users.name` を join

### 5.2 `PUT /v1/me/profile`

```
PUT /v1/me/profile
認証: Bearer JWT 必須
権限: farmer ロール限定
Payload:
  {
    "display_name": str | None (max 50),
    "bio": str | None (max 500),
    "avatar_url": str | None (max 2000),
    "prefecture": str (1-20, 必須),
    "city": str (1-50, 必須),
    "field_size": float | None (>=0),
    "note": str | None (max 1000)
  }
Response 200:
  { "ok": true }
Response 400: { "detail": "invalid_avatar_path", "code": "invalid_avatar_path" }
  // avatar_url が想定外形式（{auth.uid}/avatar/... 配下でない）
Response 404: profile_not_found（onboarding 未完了で行が存在しない場合）
Response 403 / 401 / 422: 共通形式
```

処理:
1. JWT 検証 + role 判定
2. avatar_url が指定されている場合、`publicUrlToPath()` で path 抽出 → §5.4 の path validation
3. 既存 avatar_url を取得（旧画像削除のため）
4. service_role で `farmer_profiles.update({...}).eq('user_id', auth.uid())` 実行
5. 旧 avatar_url が存在しかつ新しいものと異なる場合、Storage から旧画像を `admin.storage.from_('avatars').remove([old_path])` で削除（best-effort、失敗時は warning ログのみ）

### 5.3 user_id の書き換え攻撃防止

payload で `user_id` を受け取らない。`update().eq('user_id', auth.uid())` で強制（SKILL §3.2 / §4.2 / Phase 16 と同パターン）。

### 5.4 avatar path validation

Phase 10 の `_image_path.py` パターンを再利用し、新規 `validate_avatar_path` を追加:

```python
# backend/app/routers/_image_path.py（Phase 10 で新設済の前提、無ければ本 Phase で新設）

def validate_avatar_path(path: str, user_id: str) -> bool:
    """avatars バケットの path が {user_id}/avatar/... 配下かを検証。"""
    parts = path.split("/")
    return (
        len(parts) >= 3
        and parts[0] == user_id
        and parts[1] == "avatar"
        and ".." not in parts
    )
```

### 5.5 Pydantic スキーマ

```python
from typing import Annotated
from pydantic import BaseModel, Field
from uuid import UUID

class MeProfileResponse(BaseModel):
    user_id: UUID
    name: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    prefecture: str
    city: str
    field_size: float | None
    note: str | None

class MeProfileUpdatePayload(BaseModel):
    display_name: Annotated[str | None, Field(default=None, max_length=50)]
    bio: Annotated[str | None, Field(default=None, max_length=500)]
    avatar_url: Annotated[str | None, Field(default=None, max_length=2000)]
    prefecture: Annotated[str, Field(min_length=1, max_length=20)]
    city: Annotated[str, Field(min_length=1, max_length=50)]
    field_size: Annotated[float | None, Field(default=None, ge=0)]
    note: Annotated[str | None, Field(default=None, max_length=1000)]
```

---

## 6. UI 仕様

### 6.1 `/me/profile`（プロフトップ）

**アクセス制御** (Server Component):
- 未ログイン → `/login?next=/me/profile`
- maker → `/maker/profile` redirect（既存 Phase 17 の編集ページへ案内）
- unassigned → `/onboarding`

**レイアウト**:
- 上部ナビゲーション: `/me/profile`（active）/ `/me/reviews` / `/me/materials` の 3 リンク
- プロフィールカード:
  - アバター（avatar_url、未設定時は placeholder アイコン）
  - 表示名 (display_name) または氏名 (users.name) — display_name 優先
  - 自己紹介 (bio)
  - 地域 (prefecture + city)
  - 圃場規模 (field_size、アール表示)
  - 備考 (note)
- 「プロフィールを編集」ボタン → `/me/profile/edit`
- profile_not_found（onboarding 未完了）の場合: 「まずはプロフィールを設定してください」プレースホルダ + onboarding への CTA

### 6.2 `/me/profile/edit`（編集）

**アクセス制御** (Server Component): `/me/profile` と同条件

**フォーム要素**:

| 項目 | 型 | 必須 | UI |
|---|---|---|---|
| display_name | text | | `<Input>` max 50 |
| bio | text | | `<Textarea>` rows=4, max 500 |
| avatar_url | image | | アバターアップロード UI（§6.3） |
| prefecture | text | ✅ | `<Input>` max 20（v1.5+ で都道府県プルダウン化検討） |
| city | text | ✅ | `<Input>` max 50 |
| field_size | number | | `<Input type="number">` 単位アール、min=0 |
| note | text | | `<Textarea>` rows=4, max 1000 |

**送信**:
- アバター変更があれば事前に Storage upload → 公開 URL 取得 → payload の avatar_url にセット
- ローディング中は input disabled
- 成功後 `/me/profile` に遷移
- 失敗時はフォーム上部にエラー

### 6.3 アバターアップロード UI

実装パターン（Phase 7 / Phase 8 既存パターン踏襲）:

1. ユーザーがファイル選択（jpg/png/webp、2MB 以下、クライアント側で弾く）
2. 任意で `nonce = crypto.randomUUID()` を付与してファイル名衝突回避
3. path: `${userId}/avatar/${nonce}_${filename}`（拡張子は元ファイル名から）
4. `supabase.storage.from('avatars').upload(path, file, { upsert: false })` を呼ぶ（フロント、§1.3 例外 2）
5. 戻った public URL を フォーム state の `avatar_url` にセット
6. 送信時、PUT payload の `avatar_url` として送る
7. BFF が DB 更新 + 旧 avatar の Storage remove を実行

**重要**:
- フロントから `supabase.storage.remove()` は**呼ばない**（remove は BFF 経由、Phase 10 既存方針）
- アップロードのみフロント直叩き
- アップロード成功後にフォーム送信せずに離脱した場合、Storage に orphan が残る（v1 許容、Phase 9/10 と同じ運用）

### 6.4 BFF proxy

- `frontend/src/app/api/me/profile/route.ts` (PUT)

GET は Server Component から `${API_URL}/v1/me/profile` を Bearer JWT 付きで直 fetch（既存パターン）。

### 6.5 デザイン

- 既存 `globals.css` 継続使用
- shadcn `Avatar` / `Card` / `Button` / `Input` / `Textarea` 再利用
- アバターのデフォルト placeholder: lucide-react の `<UserCircle />` 等
- 角丸 `rounded` / `rounded-md`、design-tokens 準拠

---

## 7. 触らないファイル

- `supabase/migrations/20260415*` / `20260420*` / `20260423*` / `20260424*` / `20260502120*` / `20260502130*` / `20260502140*`
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py` / `products.py` / `reviews.py` / `articles.py` / `me_favorites.py` / `manufacturers.py` / `maker_profile.py` / `home.py`
- `backend/app/routers/me.py` の既存 `/me/reviews` 関連処理（変更なし、Phase 12c で凍結）
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/products/*` / `frontend/src/app/maker/*` / `frontend/src/app/articles/*` / `frontend/src/app/manufacturers/*` / `frontend/src/app/me/reviews/*` / `frontend/src/app/me/materials/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec 全て

---

## 8. 触るファイル（予想）

### 新規
- `supabase/migrations/20260502150000_phase19_farmer_profile_columns.sql`
- `supabase/migrations/20260502150001_phase19_avatars_storage_rls.sql`
- `backend/app/routers/me_profile.py`（or `me.py` に追記）
- `frontend/src/app/me/profile/page.tsx`
- `frontend/src/app/me/profile/_components/profile-card.tsx`
- `frontend/src/app/me/profile/_components/me-nav.tsx`（`/me/*` 上位ナビ）
- `frontend/src/app/me/profile/edit/page.tsx`
- `frontend/src/app/me/profile/edit/_components/profile-form.tsx`
- `frontend/src/app/me/profile/edit/_components/avatar-upload.tsx`
- `frontend/src/app/api/me/profile/route.ts`（PUT proxy）

### 既存修正
- `backend/app/main.py`（`me_profile.router` の include）
- `backend/app/models/schemas.py`（§5.5 のモデル追加）
- `backend/app/routers/_image_path.py`（`validate_avatar_path` 追加、§5.4）
- `frontend/src/lib/supabase/paths.ts`（既存 `publicUrlToPath` を avatars にも対応、Phase 10 で新設済の想定）

---

## 9. 受け入れ条件

### 9.1 API 動作
- [ ] farmer で `GET /v1/me/profile` 200、自分のプロフィール返る
- [ ] maker / unassigned で `GET /v1/me/profile` → 403
- [ ] 未ログインで → 401
- [ ] onboarding 未完了 farmer で → 404 `profile_not_found`
- [ ] `PUT /v1/me/profile` を farmer で成功 → DB 更新
- [ ] display_name 51 文字で 422
- [ ] bio 501 文字で 422
- [ ] avatar_url が他ユーザーの uid 配下 → 400 `invalid_avatar_path`
- [ ] avatar_url が `{uid}/other/...` (第 2 階層が `avatar` 以外) → 400
- [ ] avatar_url に `..` を含む → 400（traversal 防止）
- [ ] 旧 avatar が新 avatar と異なる場合、Storage から旧画像が削除される
- [ ] 他人の `user_id` を payload に入れても無視される（BFF が `auth.uid()` 強制）

### 9.2 UI 動作
- [ ] reviewer で `/me/profile` にアクセス → 自分のプロフィール表示
- [ ] maker で `/me/profile` → `/maker/profile` redirect
- [ ] 未ログインで `/me/profile` → `/login?next=/me/profile` redirect
- [ ] 編集ページでアバターアップロード成功 → 公開 URL がフォームに反映
- [ ] アバター 2MB 超過 → クライアント側でエラー表示、upload しない
- [ ] PUT 成功後 `/me/profile` に遷移、新プロフィールが反映
- [ ] 上位ナビから `/me/reviews` / `/me/materials` へ遷移可能
- [ ] 公開プロフィールページ `/u/{username}` の URL が**存在しない**（§13 検証）

### 9.3 BFF 原則
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）
- [ ] `supabase.storage.upload` の利用はアバターアップロード箇所のみ（既存 Phase 7/8 + 本 Phase）
- [ ] `supabase.storage.remove` の呼び出しはフロントになし（BFF のみ）

### 9.4 ビルド / 検証
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] `supabase db push --linked` で dev 適用成功（既存 farmer_profiles データに NULL 値で列追加成功）

---

## 10. 設計上の注意

### 10.1 `farmer_profiles` ALTER の理由（DOA 整合性）

新テーブル `farmer_profile_extensions` 等を分離する案も検討したが、以下の理由で却下:
- `farmer_profiles` は user 1:1 の付帯情報を集約する責務であり、display_name / bio / avatar_url は同じ責務に属する
- 1:1 関係を 2 テーブルに分割すると JOIN コストが増えるだけで業務的価値なし
- v1 規模で ADD COLUMN（デフォルト NULL）は破壊的変更ではなく、後方互換 100%
- SKILL §1.1 の「ALTER より新テーブル + 移行優先」は**破壊的変更**の文脈であり、軽微な NULL 列追加は許容範囲（generator 指示 §10）

`users` 直カラム追加案は却下: `users` は認証コア（id / role / name / created_at）の最小構造を保つ方針で、SNS 表示名は farmer-only の付帯情報（maker は `maker_profiles.company_name` を使う）。

### 10.2 アバター旧画像の削除（best-effort）

PUT 時に旧 avatar_url が異なれば Storage remove を試みる。失敗時の挙動:
- DB 更新は成功 → 新 avatar_url が反映
- 旧画像は Storage に orphan として残る（v1 許容、Phase 10 と同方針）
- BFF はログのみ記録、ユーザーに警告は出さない

UX 観点では「アバター変更は成功する」が最優先で、orphan 整理は v1.5+ の cron に委ねる。

### 10.3 アンチパターン回避（SKILL §4）

| # | 回避内容 |
|---|---|
| 1 役割の二重管理 | 該当なし |
| 2 JSONB 濫用 | 全列素朴な型（text / float / timestamptz）、JSONB なし |
| 3 UI 都合で DB 捻じ曲げ | display_name / bio / avatar_url は業務要件として明確、UI 都合の冗長列なし |
| 4 user_metadata に role | 該当なし、`app_metadata.role` のみ参照 |
| 5 フロント直叩き | プロフィール CRUD は BFF 経由、Storage upload のみ §1.3 例外 |
| 6 RLS を第一防御 | BFF で role + owner 強制、RLS は第二防御 |
| 7 変更履歴を本文に | 「旧版では」等の時系列記述なし |
| 8 注釈メモ | TODO / FIXME 残置なし |
| 9 ついで実装 | 公開プロフページ / フォロー / バッジは §13 で明示除外、テーブル列も追加しない |
| 10 未採用技術前提 | Sentry / Realtime 等の前提コードなし |

### 10.4 maker のプロフ画面挙動（要件 §5.3.6 への対応）

maker は本機能の対象外。`/me/profile` にアクセスした場合の挙動を明示:
- Server Component で role 判定 → maker なら `/maker/profile` に redirect（既存 Phase 17）
- メーカー固有プロフィール（company_name 等）は `/maker/profile` で完結
- maker が `farmer_profiles` 行を持つことはない（`farmer_profiles_insert_self` RLS で `role='farmer'` 強制）

要件 §5.3.6 は biz 議論待ちだが、本 Phase の範囲では「maker は `/maker/profile` を使う」で確定し、設計上の曖昧さを残さない。

### 10.5 公開プロフィールページ `/u/{username}` を一切作らない理由

要件 §3.6.7 / §5.2.11 / §5.2.12 で公開プロフページは v1.5+ 確定、公開項目 / 公開範囲設定が biz 未確定。SKILL §4.4 #9 と §1.4 に従い:
- **`username` 列を `users` / `farmer_profiles` に追加しない**
- **`/u/[username]` ページを作らない**
- **公開用 GET API を作らない**
- **「公開する」「非公開」のフラグ列を追加しない**

display_name は本人ビューでの表示用途のみ、URL slug としては使わない。公開機能が biz 確定したら別 Phase で:
1. `farmer_profiles` に `username` 列追加（unique、ALTER ADD COLUMN）
2. 公開項目フラグ群追加 or 専用 view 設計
3. `/u/[username]` ページ実装

を一括投入。本 Phase は本人ビューのみで完結。

---

## 11. Ryoga 判断

### 11.1 確定済
- ファイル名 `farmer-profile.md`
- 既存 `farmer_profiles` 拡張で進める（新テーブル / `users` 直カラム不採用）
- 追加 3 列: `display_name` / `bio` / `avatar_url`（NULL 許容）+ `updated_at`
- アバター Storage パス `{auth.uid}/avatar/{filename}` 強制（ADR-0003 同パターン）
- 公開プロフページ `/u/{username}` は v1 で**ゼロ実装**（§13）
- maker は `/me/profile` にアクセス時 `/maker/profile` redirect
- `/me/reviews` 既存実装は変更せず並列配置

### 11.2 worker 判断可（Ryoga 確認不要）
- アバター placeholder アイコンの選定（lucide-react `<UserCircle />` 等）
- `me-nav` コンポーネントのデザイン
- 編集フォームの shadcn コンポーネント選定（既存パターン踏襲）
- PUT proxy の Cookie → Header 転送実装（既存パターン）

### 11.3 v1 ローンチまでに biz 確定する論点（本 Phase では実装しない）
- 要件 §3.6.7 公開プロフページ `/u/{username}` の v1.5+ 採否
- 要件 §5.2.11 公開項目（自己紹介 / 地域 / 作目 / 写真の必須・任意・公開可否）
- 要件 §5.2.12 公開範囲設定の粒度（公開 / 非公開 / 限定公開）
- 要件 §5.2.13 既存 `/me/reviews` と新規プロフ画面の URL 統合
- 要件 §5.3.6 メーカーロール `/me/profile` 挙動の最終確定（本 Phase の暫定: `/maker/profile` redirect）

---

## 12. 作業スケジュール（目安）

| Step | 内容 | 見込み |
|---|---|---|
| 1 | migration 2 本（ALTER + Storage RLS） | 1 時間 |
| 2 | backend: me_profile.py + schemas + path validation | 2 時間 |
| 3 | frontend: `/me/profile` 表示ページ + me-nav | 1.5 時間 |
| 4 | frontend: `/me/profile/edit` 編集ページ + avatar-upload | 2.5 時間 |
| 5 | frontend: BFF proxy + Storage remove (BFF) | 1 時間 |
| 6 | 検証（pnpm tsc/lint/build, supabase db push, 手動 E2E） | 1 時間 |
| 合計 | | **約 9 時間** |

---

## 13. §5 未確定領域との境界（やらないことの明示）

本 Phase で**実装しない**もの（要件 §3.6 / §5.2 / §5.3 / SKILL §1.4 と整合）:

- **公開プロフィールページ `/u/{username}` の画面・API・カラム・ルーティング**（要件 §3.6.7、v1.5+）
- **`username` 列の追加 / 予約**（v1.5+ で別 Phase）
- **公開項目フラグ群**（要件 §5.2.11、`bio_public boolean` 等の追加禁止）
- **公開範囲設定 enum**（要件 §5.2.12、`visibility text` 等の追加禁止）
- **フォロー / フォロワー機能**（要件 §3.6.7、コミュニティ機能と一体検討）
- **信頼度バッジ・実績バッジ**（要件 §3.6.7、インセンティブ設計、SKILL §1.4 やらない）
- **プロフィール画像の高度な編集 UI**（クロップ / リサイズ等、v1 は素 upload）
- **bio の markdown レンダリング**（v1 は plain text、`<p>` 改行のみ）
- **他ユーザーから参照可能なフィールドの「ロック」UI**
- **maker のプロフィール拡張**（既存 `/maker/profile` で完結、本 Phase で touch しない）
- **JA / 研究者のプロフィール画面**（要件 §5.3.1 / §5.3.2）— v1 では `/me/profile` を farmer 限定にするため、ja_staff / researcher は 403 で案内。`ja_profiles` / `researcher_profiles` 拡張は要件確定後の別 phase
- **既存 `/me/reviews` との URL 統合**（要件 §5.2.13、本 Phase は並列配置で確定）

---

**以上**
