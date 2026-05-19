# ADR-0011: Admin 2FA を v1 必達に繰り上げ

**Status**: Accepted
**作成日**: 2026-05-19
**起草**: worker session（2026-05-19）
**決定者**: 酒井涼雅（CTO）
**関連**:
- ADR-0009（メーカー承認フロー + アドミン画面導入）— §2.3 / §1.3 を Supersede
- ADR-0002（reviews insert role scope、二層ロール構造）
- ADR-0005（JWT 検証戦略、JWKS / HS256 両対応）
- `docs/specs/maker-approval-admin.md` §1.1 / §1.3 / §10.1 を本 ADR と整合させる

---

## 1. コンテキスト

ADR-0009 §2.3 は「2FA 必須（Supabase Auth MFA）」と明記したが、その後 spec drafting（2026-05-14）で `docs/specs/maker-approval-admin.md` §1.3 が **「2FA は翼日送り（v1.5+）」** と書かれてマージされた。両者は矛盾している。

実装本格化を前に方針を確定する必要がある。今までの議論で明らかになっているのは:

1. **admin 3 名（共同創業者）は production DB を実質直接書き換えられる権限を持つ**
   - `POST /v1/admin/users/{user_id}/role` で任意ユーザーを `admin` 昇格可能
   - `POST /v1/admin/makers/{user_id}/approve` で任意メーカーを `active` 化可能
   - PR #28 で実装済の admin API は最強の特権
2. **共同創業者 1 名分の credential 漏洩でも全 DB 書換が可能**
   - パスワードリスト型攻撃 / phishing / device 紛失 のいずれでも accountable な防御層が無い
3. **v1 ローンチ後の追加導入は UX デグレを伴う**
   - 既存 admin に「次回ログインから 2FA 必須」を後から通知するより、初回 enrollment 時点で必須化する方が円滑

一方、2FA 導入の懸念として以下が挙げられた:

- **開発コスト**: Supabase Auth MFA TOTP の組み込み（enrollment + challenge UI + AAL2 enforcement）で約 1 sprint
- **運用コスト**: TOTP recovery（factor 紛失時の再 enrollment）は SQL 直対応で v1.5+ まで耐える前提

検討の結果、**「admin 3 名の credential 漏洩リスクは 1 sprint 投資で塞ぐ価値がある」** と判断し、2FA を v1 必達に繰り上げる。

## 2. 決定

### 2.1 ADR-0009 §2.3 / spec §1.3 を Supersede

- ADR-0009 §2.3「2FA 必須（Supabase Auth MFA）」は **本 ADR で詳細を確定**
- `docs/specs/maker-approval-admin.md` §1.3「翼日送り — 2FA」を **削除**、§1.1 必達に **2FA 行を追加**
- §10.1 を本 ADR の実装範囲に整合させる

### 2.2 2FA の適用範囲

- **対象ロール**: `admin` のみ
- **factor 種別**: **TOTP** のみ（Google Authenticator / 1Password / Authy 等で生成）
- **AAL 要件**: `/admin/*` 全アクセスで AAL2 を要求
- **enrollment 方針**: admin 昇格直後（factor 未登録）は `/mfa/setup` を強制、enrollment 完了で AAL2 昇格

### 2.3 認証フロー（v1）

```
[login form]
  ↓ supabase.auth.signInWithPassword (AAL1)
  ↓
[role 判定]
  - role !== 'admin' → 既存 landingPathForRole
  - role === 'admin':
      ↓ supabase.auth.mfa.getAuthenticatorAssuranceLevel
      ┌─ nextLevel === 'aal1' (factor 未登録) → /mfa/setup
      ├─ nextLevel === 'aal2' && currentLevel === 'aal1' → /mfa/challenge
      └─ currentLevel === 'aal2' → /admin
```

- `/mfa/setup`: `supabase.auth.mfa.enroll({factorType:'totp'})` → QR code + secret 表示 + verify code 入力。`mfa.verify` で factor 確定 + 同セッションを AAL2 化
- `/mfa/challenge`: `supabase.auth.mfa.challenge({factorId})` + `verify({code})` で AAL2 昇格
- `/admin/layout.tsx` Server Component で AAL2 判定、AAL1 admin は `/mfa/setup` or `/mfa/challenge` にリダイレクト

### 2.4 backend AAL2 enforcement

- `backend/app/dependencies.py` の `require_role("admin")` 配下で JWT `aal` claim を判定
- AAL1 admin の JWT は **401 `aal_insufficient`** で reject
- `app/auth/jwt.py` の `verify_jwt` は既に `aal` claim を payload に含めているため、専用 accessor `get_user_aal(payload)` を追加

### 2.5 v1 でやらないこと

- **TOTP recovery（factor 紛失時の再 enrollment）**: v1 は Supabase ダッシュボードから admin が直接 `auth.mfa_factors` を削除して再 enroll する運用。recovery 専用 UI は v1.5+
- **Backup codes**: TOTP のバックアップコード生成は Supabase Auth がまだ提供していない（2026-05 時点）。v1.5+ で再評価
- **WebAuthn / Passkey**: Supabase Auth の WebAuthn factor は preview 段階。v1 は TOTP のみ、v1.5+ で WebAuthn 追加検討
- **Phone (SMS) factor**: SIM swap 攻撃の懸念、SMS コスト、JP プロバイダ調整不要 → 非採用
- **admin 以外の MFA 強制**: farmer / maker / researcher / ja_staff は MFA 任意（enroll 可能だが強制しない）

## 3. 採用した代替案

### A. 2FA を v1.5+ に据え置き（却下）
- credential 漏洩時の被害が「v1 全 DB 書換可能」と最悪ケースで、保険として 1 sprint 投資する価値がある
- v1 ローンチ後の後付け導入は UX デグレ + 通知運用コストが大きい

### B. 全 role に MFA 強制（却下）
- farmer ユーザー数想定が v1 で数百〜数千、enrollment 強制で離脱率懸念
- attack surface は admin が桁違いに高い、admin だけで投資効果は十分
- 任意 enrollment は今後も全 role で可能

### C. TOTP + Backup codes 同時実装（却下）
- Supabase Auth の backup codes 公式サポートが未提供（独自実装は監査コストが見合わない）
- v1 は Supabase Admin SQL で factor 削除 + 再 enroll の運用で代替可能（admin 3 名のみ運用）

### D. WebAuthn / Passkey 単独（却下）
- Supabase Auth WebAuthn は 2026-05 時点で preview 段階、production 投入リスクあり
- TOTP は枯れた技術で監査負債が無い

### E. TOTP + admin のみ強制（採用）
- Supabase Auth MFA TOTP は GA、`@supabase/supabase-js` で API 完備
- 1 sprint 投資で admin の credential 漏洩リスクをカバー

## 4. 帰結

### Positive
- admin credential 漏洩時の二次被害が大幅に低減（factor device の物理所持が必須）
- v1 ローンチ時点で「production DB を最強権限で触れる admin は MFA 必須」が成立、監査向け説明が容易
- 既存 admin 3 名（共同創業者）の enrollment 強制で運用ルール定着

### Negative
- 開発コスト追加: 1 sprint（PR A）
- factor 紛失時の recovery 手順が SQL 直で v1.5+ まで運用
- Supabase Auth MFA の挙動変更（API breaking change）に追随する保守責任が発生

### 中立
- v1.5+ で WebAuthn / Phone / Backup codes / recovery UI / 他 role MFA 強制 を検討する余地が残る

## 5. 移行手順

1. **PR A: 本 ADR + spec §1.1/§1.3/§10.1 改訂 + 2FA 実装**
   - `docs/decisions/0011-admin-2fa-promotion-to-v1.md`（本書）追加
   - `docs/specs/maker-approval-admin.md` §1.1 / §1.3 / §10.1 改訂
   - frontend: `/mfa/setup` + `/mfa/challenge` ページ + `/admin/layout.tsx` AAL2 enforce
   - backend: `require_role("admin")` に AAL2 enforcement、`app/auth/jwt.py` に `get_user_aal`
   - tests: `test_admin_router.py` に AAL1 admin → 401 ケース
2. **初回 enrollment 運用（PR A merge 後）**:
   - 共同創業者 3 名は次回 `/admin/*` アクセス時に `/mfa/setup` へ自動誘導
   - enrollment 完了で AAL2 昇格、以降のセッションは login 後 `/mfa/challenge`
3. **factor 紛失時の recovery（v1 運用）**:
   - 紛失した admin は別の admin に依頼
   - 別 admin が Supabase ダッシュボードから `auth.mfa_factors` の該当行を SQL 削除
   - 紛失 admin は次回ログイン時に `/mfa/setup` から再 enrollment

## 6. 参考

- Supabase Auth MFA: https://supabase.com/docs/guides/auth/auth-mfa
- Supabase JS MFA API: https://supabase.com/docs/reference/javascript/auth-mfa-enroll
- RFC 6238（TOTP）: https://datatracker.ietf.org/doc/html/rfc6238
- `docs/decisions/0009-maker-approval-flow-and-admin-panel.md` §2.3
- `docs/specs/maker-approval-admin.md` §1.1 / §1.3 / §10.1
- `backend/app/auth/jwt.py`（既存 JWT 検証、`aal` claim は Supabase が emit 済）
- `backend/app/dependencies.py` / `backend/app/auth/roles.py`（`require_role` 拡張対象）
