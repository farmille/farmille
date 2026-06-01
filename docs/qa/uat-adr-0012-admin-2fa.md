# UAT チェックリスト: ADR-0012 Admin 2FA promotion to v1

**作成日**: 2026-05-19
**対象 ADR**: ADR-0012（Admin 2FA promotion to v1）
**対象 spec**: `docs/specs/maker-approval-admin.md` §1.1 / §6.5 / §10.1
**実行担当**: Ryoga
**実行環境**: localhost:3000 + dev Supabase
**前提**: PR #28 (ADR-0009 / admin panel) が main にマージ済。Supabase プロジェクトで Auth → MFA → TOTP が有効化されていること

---

## 0. 事前準備

### 0.1 dev サーバー起動

```bash
# Terminal 1 - backend
cd /Users/ryogasakai/dev/farmille/backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 - frontend
cd /Users/ryogasakai/dev/farmille/frontend
pnpm dev
```

### 0.2 Supabase MFA 有効化確認

Supabase Studio → Authentication → Providers → Multi-Factor Authentication:
- TOTP: **有効** であること
- Phone: 無効でよい（v1 対象外）

### 0.3 テストユーザー準備

| 役割 | email 例 | role | aal |
|---|---|---|---|
| admin（factor 未登録） | r.sakai@... | admin | aal1 |
| admin（factor 登録済） | 別 admin アカウント | admin | aal2（enroll 後） |
| farmer | farmer-test@... | farmer | aal1（MFA 不要） |

### 0.4 認証アプリ用意

スマートフォンに以下のいずれか:
- Google Authenticator
- 1Password / Bitwarden（TOTP 対応プラン）
- Authy
- Microsoft Authenticator

---

## 1. 初回 enrollment フロー（factor 未登録 admin）

### 1.1 login 後の自動誘導

| # | 操作 | 期待 |
|---|---|---|
| 1.1.1 | factor 未登録 admin で `/login` からログイン | 自動で `/mfa/setup?next=%2Fadmin` にリダイレクト |
| 1.1.2 | URL バー確認 | `/mfa/setup?next=%2Fadmin` になっている |
| 1.1.3 | 画面表示 | 「2段階認証の設定」見出し + QR コード + シークレット文字列 + コード入力欄 |

### 1.2 QR コード読み取り

| # | 操作 | 期待 |
|---|---|---|
| 1.2.1 | 認証アプリで QR コードをスキャン | 「Farmille」相当のエントリが追加され、6 桁コードが表示される |
| 1.2.2 | QR が読めない場合、シークレット文字列をコピー → 認証アプリに手動入力 | 同様にエントリが追加される |

### 1.3 verify

| # | 操作 | 期待 |
|---|---|---|
| 1.3.1 | 認証アプリの 6 桁コードを入力 → 「2段階認証を有効化」 | `/admin` にリダイレクト |
| 1.3.2 | `/admin` ダッシュボード表示 | 401 / リダイレクトされず、通常表示 |
| 1.3.3 | DevTools → Application → Cookies → `sb-*-auth-token` の payload を decode（jwt.io 等） | `aal: "aal2"` 含む |

### 1.4 誤コード入力

| # | 操作 | 期待 |
|---|---|---|
| 1.4.1 | 適当な 6 桁（例: `000000`）を入力 → 確認 | エラー「コードが正しくありません」表示、AAL1 のまま |
| 1.4.2 | 正しいコードを入力し直し | 1.3.1 と同じ成功動線 |

---

## 2. challenge フロー（factor 登録済 admin）

### 2.1 next login で challenge

| # | 操作 | 期待 |
|---|---|---|
| 2.1.1 | 1.3 完了済の admin でログアウト後、再 login | `/mfa/challenge?next=%2Fadmin` に自動リダイレクト |
| 2.1.2 | 画面表示 | 「2段階認証」見出し + コード入力欄（QR は表示されない） |
| 2.1.3 | 認証アプリの最新コード入力 → 「ログインを完了」 | `/admin` にリダイレクト、AAL2 |

### 2.2 challenge ページ直接アクセス

| # | 操作 | 期待 |
|---|---|---|
| 2.2.1 | AAL1 状態で `/admin/makers` を URL バーに入力 | `/mfa/challenge?next=%2Fadmin` にリダイレクト（layout guard） |
| 2.2.2 | AAL2 状態で `/mfa/challenge` を直接開く | `next` 既定の `/admin` にリダイレクト（既に AAL2 のため不要） |

---

## 3. backend AAL2 enforcement

### 3.1 AAL1 admin の /v1/admin/* 全 endpoint で 401

事前: admin で login → MFA 未完了の状態を作る（factor unenroll → 再 enroll せず login）

```bash
# JWT を取得（DevTools → Application → Cookies → sb-*-auth-token から）
TOKEN="<AAL1 admin JWT>"

curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/admin/summary
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/admin/makers/pending
curl -i -H "Authorization: Bearer $TOKEN" -X POST \
  http://localhost:8000/v1/admin/makers/$MAKER_ID/approve
```

| # | 期待 |
|---|---|
| 3.1.1 | `/v1/admin/summary` GET → 401 `{"detail":"aal_insufficient"}` |
| 3.1.2 | `/v1/admin/makers/pending` GET → 401 `aal_insufficient` |
| 3.1.3 | `/v1/admin/makers/{id}/approve` POST → 401 `aal_insufficient` |
| 3.1.4 | `/v1/admin/users/{id}/role` POST → 401 `aal_insufficient` |

### 3.2 AAL2 admin の /v1/admin/* 通常動作

事前: 1.3 完了済 admin の JWT を使う（aal=aal2）。

| # | 期待 |
|---|---|
| 3.2.1 | `/v1/admin/summary` GET → 200、JSON 正常 |
| 3.2.2 | 既存 ADR-0009 UAT §2.1〜2.6 がそのまま通る |

### 3.3 非 admin は AAL に関係なく 403

事前: farmer の JWT（AAL1）を取得。

| # | 期待 |
|---|---|
| 3.3.1 | farmer JWT で `/v1/admin/summary` → 403（AAL チェックの前に role チェックで弾かれる） |

---

## 4. 非 admin への影響なし

| # | 操作 | 期待 |
|---|---|---|
| 4.1 | farmer で `/login` から login | `/`（既存 landing）にリダイレクト、MFA 画面は出ない |
| 4.2 | maker で login | `/maker/profile` にリダイレクト、MFA 画面は出ない |
| 4.3 | farmer の `/v1/me/profile` PUT 等の既存 API | 200 動作（MFA 影響なし） |

---

## 5. v1 アウト（このフェーズで実装されていないこと）

以下が **無い** ことを確認:

- recovery UI（factor 紛失時の再 enrollment 専用画面）→ v1 は Supabase ダッシュボード SQL 対応
- backup codes 生成
- WebAuthn / Passkey factor
- SMS / Phone factor
- 全 role への MFA 強制（farmer 等で MFA 強制画面が出ないこと）

`grep -rn "webauthn\|passkey\|backup_code\|sms_factor" frontend/src backend/app` で 0 件（または無関係な hit のみ）。

---

## 6. trouble shoot

### 6.1 QR が表示されない

- ブラウザ Console を確認。`mfa.enroll` の error メッセージを貼る
- Supabase Studio → Authentication → MFA で TOTP が有効か再確認

### 6.2 factor の手動削除（recovery 運用）

admin が認証アプリを失った場合:

```sql
-- Supabase Studio → SQL Editor
SELECT id, user_id, factor_type, status, friendly_name, created_at
  FROM auth.mfa_factors
 WHERE user_id = '【紛失 admin の user_id】';

DELETE FROM auth.mfa_factors WHERE id = '【factor id】';
```

紛失 admin は次回 login 時に `/mfa/setup` に自動誘導され、再 enroll できる。

### 6.3 AAL がアップグレードされない

- `mfa.challengeAndVerify` の return が success でも、`getAuthenticatorAssuranceLevel` が aal1 のままの場合は、`auth.users.factors_status` 等に異常がないか Supabase ダッシュボードで確認
- ローカル開発で再現する場合は、`pnpm dev` を再起動して cookie をクリア（古い AAL1 JWT が残っていることがある）

---

## 7. 完了基準

- §1〜§4 全項目が ✓
- §5 の v1 アウト項目が確認できる（実装されていないこと）
- 既存 ADR-0009 UAT §2 が引き続き通る（regression なし）
