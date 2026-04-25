# Farmille 認証フロー仕様書 v2 (v1 4/30 スプリント版)

**作成日**: 2026-04-21
**最終更新**: 2026-04-21 (v2: DB二重チェック反映)
**対象スプリント**: 4/21-4/30
**実装担当**: Claude Code
**レビュー担当**: 酒井涼雅 (CTO)

---

## 0. このドキュメントの扱い方

- Claude Code はこのドキュメントを**実装の唯一の正**として扱う
- 曖昧な箇所・矛盾を発見したら**実装を止めて質問**する(勝手に推測しない)
- 本仕様書の範囲外のファイルは触らない
- 完了判定は Section 11「受け入れ条件」で行う

## 0.1 v2での変更点(v1からの差分)

DBの既存RLSを確認した結果、以下を反映:

| 項目 | v1記述 | v2修正後 | 理由 |
| --- | --- | --- | --- |
| レビュー投稿権限 | farmer のみ | **farmer / ja_staff / researcher** | 既存RLS `reviews_insert_reviewer` が3ロール対応済み |
| middleware の `/reviews/new` 権限チェック | `role === 'farmer'` | **`role in ['farmer', 'ja_staff', 'researcher']`** | 同上 |
| Storage画像投稿権限(参考) | farmer のみ | 3ロール対応済 | 既存RLS `review_images_insert_reviewer` の確認結果 |
| 資材登録権限 | maker のみ | maker のみ (変更なし) | 既存RLSと一致 |

---

## 1. 対象範囲

### 実装する
- サインアップ (farmer / maker のみUI実装)
- ログイン (全ロール共通、DBには ja_staff / researcher のデータも入りうる)
- ログアウト
- 認証必須ページの保護 (middleware)
- `unassigned` ロールの自動オンボーディング誘導

### 実装しない (スコープ外)
- Google ログイン
- パスワードリセット
- ja_staff / researcher のサインアップUI (将来実装、DBは対応済)
- ソーシャルログイン全般
- 2FA
- アカウント削除
- 画像アップロード機能 (RLSは対応済、UI実装は v1.5 へ)

---

## 2. 全体アーキテクチャ方針

### 2.1 BFFパターンの原則

**ビジネスロジックは全て FastAPI に置く。**
`register-role` は「Supabase Auth の `app_metadata.role` 更新 + `public.users.role` 更新」という DB 整合性責務を持つため、将来モバイルアプリからも使える FastAPI に配置する。

```
Next.js (フロント)   … UI・フォーム状態・Cookie管理・BFFオーケストレーション
  ↓
FastAPI (BFF)        … JWT検証・ビジネスロジック・DB整合性
  ↓
Supabase             … Auth・DB・RLS(第二防御)
```

### 2.2 例外的に Supabase に直接アクセスする箇所

| 箇所 | 理由 |
| --- | --- |
| サインアップ (Supabase Auth の signUp) | 認証は Supabase の責務。JWT発行は Supabase にしかできない |
| ログイン (Supabase Auth の signInWithPassword) | 同上 |
| セッション取得 (middleware・Server Component) | `@supabase/ssr` が Cookie を読む必要がある |

### 2.3 `register-role` の呼び出しタイミング

**Supabase サインアップ成功直後に、Next.js API Route (BFF) が FastAPI を呼ぶ。**

理由:
- ユーザーが属性を選んだ直後に `role` を確定させるのが自然
- メール確認を待つと「role未確定」状態が長期化する
- 失敗時の回収はサーバー側でリトライ処理に任せる(後述)

### 2.4 `/api/auth/complete-signup` の設計根拠 (v2で明記)

Next.js の API Route を経由する理由(直接 FastAPI を叩かない理由):
- **JWT をクライアントに露出しない**: Server-side で Cookie から JWT を取り出し、Authorization Header で FastAPI に渡せる
- **CORS 回避**: Vercel(Next.js) と Railway(FastAPI) は別ドメインなので、クライアント直アクセスは CORS 設定が必要。Next.js 内部なら不要
- **ログ集約**: Next.js 側で構造化ログが残せる(将来の監視に有利)

Claude Code はこの API Route を「単なるプロキシ」と判断して削除しないこと。

---

## 3. 画面一覧 (app router)

### 3.1 v1 スプリントで実装するパス

| パス | 役割 | 保護 |
| --- | --- | --- |
| `/login` | ログイン | 未ログインのみ |
| `/signup` | サインアップ(属性選択含む) | 未ログインのみ |
| `/auth/callback` | メール確認後のコールバック | 公開 |
| `/onboarding` | 初回オンボーディング(最小実装) | `unassigned` のみ |
| `/home` | ログイン後トップ (role共通、中身はrole分岐の最小実装) | 認証済みのみ |

### 3.2 URL設計原則

- role別URL (`/farmer/*`) は原則採用しない → 将来 ja_staff / researcher 追加時にURL変更が不要
- ただし**メーカー専用機能**(`/maker/dashboard` 等)は v2 PRD に合わせて role別URLを採用する想定(今回スプリントでは未実装)
- レビュー投稿は将来的に `/materials/[id]/review/new` に配置予定(今回スプリントでは未実装)

---

## 4. サインアップフロー

### 4.1 画面構成 (1画面に統合)

```
[Farmille ロゴ]

新規登録

属性 *  [ ○ 農家   ○ 資材メーカー ]  ← 最初に選ばせる

氏名 *        [例: 田中 太郎                    ]
メールアドレス *  [例: tanaka@example.com           ]
パスワード *     [6文字以上                        ]

[登録する]

すでにアカウントをお持ちの方は ログイン
```

- 属性選択を**最初**に置く(視線誘導)
- 氏名は必須(Supabase Authの `user_metadata.name` に格納、`handle_new_user` トリガーで `public.users.name` に同期)
- 電話番号・ニックネーム・プロフィール詳細は**このフォームでは取らない** (オンボーディングで)

### 4.2 処理シーケンス

```
1. ユーザーが [登録する] をクリック
2. Next.js クライアント:
   supabase.auth.signUp({
     email, password,
     options: {
       data: { name, intended_role: 'farmer' | 'maker' },
       emailRedirectTo: `${origin}/auth/callback`
     }
   })

   ※ options.data は auth.users.raw_user_meta_data に格納される
   ※ name は handle_new_user トリガーで public.users.name に同期される
   ※ intended_role はトリガーでは使われない(register-role APIで別途取得)

3. Supabase:
   - auth.users に INSERT
   - トリガー handle_new_user が public.users に role='unassigned' で INSERT
     (ON CONFLICT DO NOTHING で冪等性担保済み)
   - メール確認メールを送信

4. Next.js: サインアップ成功画面を表示
   「○○@example.com に確認メールを送信しました。
    メール内のリンクをクリックしてください」

5. ユーザーがメール内リンクをクリック
   → /auth/callback にリダイレクト

6. /auth/callback (route handler):
   - Supabase セッション確立 (exchangeCodeForSession)
   - Next.js API Route /api/auth/complete-signup を呼ぶ
     payload: { role: user.user_metadata.intended_role }

7. /api/auth/complete-signup (BFF, Next.js Server-side):
   - Cookie から JWT を取得
   - FastAPI の POST /v1/auth/register-role を呼ぶ
     headers: { Authorization: Bearer <JWT> }
     body: { role: 'farmer' | 'maker' }

8. FastAPI:
   - JWT検証
   - Supabase Admin クライアントで auth.users.app_metadata.role を更新
   - public.users.role を更新
   - 2つが原子的に成功することを保証(失敗時は手動ロールバック)

9. 成功 → /onboarding に遷移
   失敗 → /onboarding に遷移し、冒頭で再選択UI表示 (後述 Section 9)
```

### 4.3 バリデーション

| フィールド | ルール | エラーメッセージ |
| --- | --- | --- |
| 属性 | farmer または maker | 属性を選択してください |
| 氏名 | 必須、1-50文字 | 氏名を入力してください |
| メール | RFC 5322形式 | 正しいメールアドレスを入力してください |
| パスワード | 6文字以上 (Supabase デフォルト) | パスワードは6文字以上で入力してください |

---

## 5. ログインフロー

### 5.1 画面構成

```
[Farmille ロゴ]

ログイン

メールアドレス *  [                                 ]
パスワード *     [                                 ]

[ログイン]

アカウントをお持ちでない方は 新規登録
```

- 「ログイン状態を保持」チェックボックスは v1 では置かない
  (Supabase のデフォルト挙動で Cookie が 1週間維持される)

### 5.2 処理シーケンス

```
1. ユーザーが [ログイン] をクリック
2. Next.js クライアント:
   supabase.auth.signInWithPassword({ email, password })
3. Supabase: JWT発行 + Cookie設定 (@supabase/ssr経由)
4. ログイン成功後、role別に遷移:
   - role === 'unassigned' → /onboarding
   - role in ['farmer', 'maker', 'ja_staff', 'researcher'] → /home
```

### 5.3 エラーハンドリング

| 状態 | 表示 |
| --- | --- |
| メール未確認 | 「メール確認が完了していません。登録メールのリンクをクリックしてください」 |
| パスワード不一致 | 「メールアドレスまたはパスワードが間違っています」 |
| その他 | 「ログインに失敗しました。時間をおいて再度お試しください」 |

---

## 6. ログアウトフロー

```
1. ユーザーが [ログアウト] をクリック (ヘッダー内)
2. Next.js: supabase.auth.signOut()
3. Cookie削除
4. /login にリダイレクト
```

---

## 7. Middleware (保護ルート)

> **Next.js 16 以降の読み替え (2026-04-21 追記)**
> Next.js 16 で `middleware.ts` → `proxy.ts` にリネームされ、エクスポート名も `middleware` → `proxy` に変更された。本章内の `middleware.ts` / `middleware()` は **Next.js 16 系では `proxy.ts` / `proxy()` として読み替える**。ロジック・挙動・`config.matcher` は従来と同一。判断経緯は `docs/discussions/001-nextjs16-proxy-rename.md` を参照。

### 7.1 保護対象

| パス | 条件 |
| --- | --- |
| `/home` | ログイン必須。`unassigned` は `/onboarding` にリダイレクト |
| `/onboarding` | ログイン必須。`unassigned` **以外**は `/home` にリダイレクト |
| `/login`, `/signup` | **未ログインのみ**。ログイン済みは `/home` or `/onboarding` にリダイレクト |

### 7.2 ロール定数定義 (重要 v2)

```typescript
// frontend/src/lib/auth/roles.ts
export const REVIEWER_ROLES = ['farmer', 'ja_staff', 'researcher'] as const
export const MAKER_ROLES = ['maker'] as const
export const ALL_ASSIGNED_ROLES = [...REVIEWER_ROLES, ...MAKER_ROLES] as const

export type Role = typeof ALL_ASSIGNED_ROLES[number] | 'unassigned'
```

- **ハードコードで `role === 'farmer'` と書かない**
- 全ての権限チェックは上記定数配列を使う
- 将来 ja_staff / researcher の UI を追加する際、この定数だけ触れば済むようにする

### 7.3 middleware.ts 骨格

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ALL_ASSIGNED_ROLES, type Role } from '@/lib/auth/roles'

const PROTECTED_PATHS = ['/home', '/onboarding']
const GUEST_ONLY_PATHS = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(/* ... */)

  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata?.role ?? null) as Role | null
  const pathname = request.nextUrl.pathname

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isGuestOnly = GUEST_ONLY_PATHS.some(p => pathname.startsWith(p))

  // 未ログインで保護ページにアクセス → /login
  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ログイン済みで /login /signup → 適切な遷移先へ
  if (user && isGuestOnly) {
    const dest = role === 'unassigned' ? '/onboarding' : '/home'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // unassigned が /home にアクセス → /onboarding
  if (role === 'unassigned' && pathname.startsWith('/home')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // assigned ロールが /onboarding にアクセス → /home
  if (user && role && role !== 'unassigned' && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron).*)']
}
```

### 7.4 今回スプリントで実装しない権限チェック (将来のために記載)

以下は今回スプリントではUIを作らないため middleware に含めないが、**将来実装時に参考にできるよう記載**:

```typescript
// 将来、/materials/[id]/review/new を実装する際の middleware 追加
if (pathname.match(/\/materials\/[^/]+\/review\/new/)) {
  if (!REVIEWER_ROLES.includes(role as any)) {
    return NextResponse.redirect(new URL('/home?error=forbidden', request.url))
  }
}

// 将来、/maker/* を実装する際の middleware 追加
if (pathname.startsWith('/maker/') && role !== 'maker') {
  return NextResponse.redirect(new URL('/home?error=forbidden', request.url))
}
```

---

## 8. FastAPI: `POST /v1/auth/register-role`

### 8.1 エンドポイント定義

```
POST /v1/auth/register-role
Headers:
  Authorization: Bearer <Supabase JWT>
  Content-Type: application/json
Body:
  { "role": "farmer" | "maker" }
Response 200:
  { "ok": true, "role": "farmer" }
Response 400:
  { "ok": false, "error": "invalid_role" }
Response 401:
  { "ok": false, "error": "unauthorized" }
Response 409:
  { "ok": false, "error": "role_already_assigned" }
Response 500:
  { "ok": false, "error": "internal_error" }
```

### 8.2 処理ロジック

```python
# backend/app/routers/auth.py

ALLOWED_SIGNUP_ROLES = {"farmer", "maker"}

@router.post("/register-role")
async def register_role(
    payload: RegisterRolePayload,
    current_user: User = Depends(get_current_user),
):
    # 1. 既に role が割り当て済みかチェック
    existing_role = current_user.app_metadata.get("role")
    if existing_role and existing_role != "unassigned":
        raise HTTPException(409, "role_already_assigned")

    # 2. role の検証 (今回スプリントでは farmer / maker のみ許可)
    if payload.role not in ALLOWED_SIGNUP_ROLES:
        raise HTTPException(400, "invalid_role")

    # 3. Supabase Admin で app_metadata.role を更新
    admin = get_supabase_admin_client()
    try:
        admin.auth.admin.update_user_by_id(
            current_user.id,
            {"app_metadata": {"role": payload.role}}
        )
    except Exception as e:
        raise HTTPException(500, f"failed_to_update_auth_metadata: {e}")

    # 4. public.users.role を更新
    try:
        admin.table("users").update({"role": payload.role}).eq("id", current_user.id).execute()
    except Exception as e:
        # ロールバック: app_metadata.role を unassigned に戻す
        admin.auth.admin.update_user_by_id(
            current_user.id,
            {"app_metadata": {"role": "unassigned"}}
        )
        raise HTTPException(500, f"failed_to_update_users_table: {e}")

    return {"ok": True, "role": payload.role}
```

### 8.3 整合性担保方針

Supabase は「`auth.users` と `public.users` を跨ぐトランザクション」をサポートしない。そのため:

- 順序: `app_metadata.role` 更新 → `public.users.role` 更新
- 失敗時: `public.users.role` 更新失敗時は `app_metadata.role` を `unassigned` に戻す手動ロールバック
- 万一両方失敗した場合: `/onboarding` の冒頭で再選択UIに誘導

### 8.4 Pydanticスキーマ

```python
# backend/app/models/schemas.py

from pydantic import BaseModel
from typing import Literal

class RegisterRolePayload(BaseModel):
    role: Literal["farmer", "maker"]

class RegisterRoleResponse(BaseModel):
    ok: bool
    role: str | None = None
    error: str | None = None
```

---

## 9. 回収フロー (オンボーディング統合)

### 9.1 発生条件

`register-role` が失敗し、`app_metadata.role` が未設定または `unassigned` のまま残っているユーザー。

### 9.2 処理方針

`/auth/recovery` を単独画面として作らず、**`/onboarding` の冒頭で統合処理**する:

```
1. /onboarding に到達
2. サーバー側で role を取得
3. role === 'unassigned' なら属性再選択UIを表示:

   登録を完了させてください

   属性を選択してください
   [ ○ 農家   ○ 資材メーカー ]
   [登録を完了する]

4. [登録を完了する] クリック → /api/auth/complete-signup (再試行)
5. 成功 → role が更新される → 本来のオンボーディング項目へ
   (今回スプリントでは「ようこそ」画面のみで十分)
```

---

## 10. 関連ファイル一覧 (Claude Code が触るパス)

### 新規作成

```
frontend/src/app/(auth)/layout.tsx
frontend/src/app/(auth)/login/page.tsx
frontend/src/app/(auth)/signup/page.tsx
frontend/src/app/auth/callback/route.ts
frontend/src/app/api/auth/complete-signup/route.ts
frontend/src/app/home/page.tsx               (role分岐の最小実装。「ようこそ」程度でOK)
frontend/src/app/onboarding/page.tsx         (role未設定なら属性選択UI、設定済みなら「ようこそ」)
frontend/src/middleware.ts               (Next.js 16 系では `frontend/src/proxy.ts` に読み替え。§7冒頭の注記参照)
frontend/src/lib/auth/roles.ts               (ロール定数定義: REVIEWER_ROLES等)
frontend/src/lib/auth/server.ts              (getUser, getRoleのヘルパー)
frontend/src/lib/auth/actions.ts             (server actions: signIn, signOut, signUp)
```

### 既存ファイル修正

```
backend/app/routers/auth.py                  (register-role エンドポイント実装)
backend/app/services/supabase.py             (Admin クライアントの初期化確認)
backend/app/models/schemas.py                (RegisterRolePayload 追加)
frontend/src/lib/supabase/client.ts          (必要なら修正)
frontend/src/lib/supabase/server.ts          (必要なら修正)
```

### 触らないファイル

```
supabase/migrations/*                         (DB側は確認済み、正しい状態)
backend/app/routers/products.py
backend/app/routers/reviews.py
frontend/src/app/page.tsx                     (トップページは今回対象外)
docs/*
```

---

## 11. 受け入れ条件

Claude Code はこの11項目すべてがローカル環境で動作することを確認してから完了報告すること。

### 11.1 サインアップ (farmer)

- [ ] `/signup` で属性「農家」選択・氏名・メール・パスワード入力・送信
- [ ] Supabase auth.users に新規行が作成される
- [ ] public.users に `role='unassigned'` の行が作成される
- [ ] 確認メールが送信される
- [ ] 確認メールリンクをクリック → `/auth/callback` 経由で FastAPI `register-role` 呼び出し
- [ ] auth.users.app_metadata.role が `'farmer'` になる
- [ ] public.users.role が `'farmer'` になる
- [ ] `/onboarding` に遷移する

### 11.2 サインアップ (maker)

- [ ] 11.1と同様の流れで role が `'maker'` になる

### 11.3 ログイン

- [ ] `/login` でメール・パスワード入力・送信
- [ ] Cookie にセッションが設定される
- [ ] role が `'unassigned'` なら `/onboarding` に遷移
- [ ] role が farmer/maker/ja_staff/researcher なら `/home` に遷移

### 11.4 ログアウト

- [ ] ヘッダーのログアウトボタンでセッション消失
- [ ] `/login` に遷移

### 11.5 Middleware

- [ ] 未ログインで `/home` アクセス → `/login` にリダイレクト
- [ ] ログイン済みで `/login` アクセス → `/home` or `/onboarding` にリダイレクト
- [ ] `unassigned` で `/home` アクセス → `/onboarding` にリダイレクト
- [ ] `farmer` で `/onboarding` アクセス → `/home` にリダイレクト
- [ ] `ja_staff` や `researcher` でログイン時も `/home` に遷移する(将来のためのテスト、Supabase Studioで手動でロール変更して確認)

### 11.6 エラーハンドリング

- [ ] パスワード不一致時に適切なエラーメッセージ表示
- [ ] FastAPI 呼び出し失敗時に `/onboarding` 冒頭で再選択UIが出る

### 11.7 ロール定数の使用 (v2追加)

- [ ] `role === 'farmer'` のようなハードコードが middleware 以外にない
- [ ] `REVIEWER_ROLES` `MAKER_ROLES` 定数が `lib/auth/roles.ts` に定義されている

---

## 12. 未確定・Claude Code が判断してよい項目

以下は**実装上の好み**のため、Claude Code の判断で進めてよい:

- ボタン・フォームの shadcn/ui コンポーネント選定 (Button, Input, Label, Card等)
- エラーメッセージの表示方法 (toast / inline text / alert)
- Loading状態の表示方法 (disabled button / spinner)
- フォームライブラリ (react-hook-form + zod 推奨、なくてもOK)

---

## 13. 今回の判断の背景(Claude Code 向け補足)

- 本スプリント(4/21-4/30)は**綺麗さ > 機能網羅**
- デザインは別途 `docs/design-tokens.md` が用意される予定。shadcn/ui のデフォルトに従っておけば後から整合を取りやすい
- 農家ユーザーは40-60代中心の想定。**フォントは16px以上、余白は広め、エラー表示は親切に**
- `ja_staff` / `researcher` は今回のUIに出さないが、DB側は対応済のため、**将来のUI追加を阻害しない設計**にする(`REVIEWER_ROLES` 定数の使用を徹底)

---

## 14. DB側の確認済み事項 (v2で明記)

Claude Code が実装時に前提として扱える確定事項:

- `public.users.role` CHECK制約: `farmer / maker / ja_staff / researcher / unassigned`
- `handle_new_user` トリガー: `role='unassigned'` で INSERT、`ON CONFLICT DO NOTHING` で冪等性担保
- `reviews_insert_reviewer` RLS: `role IN (farmer, ja_staff, researcher) AND user_id = auth.uid()`
- `products_insert_maker` RLS: `role = maker AND maker_id = auth.uid()`
- Storage `review_images_insert_reviewer` RLS: 3ロール対応 + `auth.uid()` フォルダ強制

これらは**既に Supabase 本番環境に反映済み**。Claude Code は DB変更を伴う修正を一切行わないこと。

---

**以上**