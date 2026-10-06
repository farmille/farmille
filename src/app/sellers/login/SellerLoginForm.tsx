"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormNotice, RequiredBadge } from "@/app/_mock/FormParts";
import { MockSubmitButton } from "@/app/_mock/MockSubmitButton";
import { sellerLoginAction } from "@/app/sellers/login/actions";
import { initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

/** 見本 S.sellerLogin の入力欄・ボタン・リンク。ログインの処理は本番のまま。 */
export function SellerLoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(sellerLoginAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="loginId">
          ログインID <RequiredBadge />
        </label>
        <input
          aria-describedby="loginId-guide"
          autoCapitalize="none"
          autoComplete="username"
          className="input"
          defaultValue={values.loginId}
          id="loginId"
          name="loginId"
          placeholder="例）example-agri"
          required
          spellCheck={false}
          type="text"
        />
        <div className="fguide" id="loginId-guide" style={{ marginTop: 6, marginBottom: 0 }}>
          運営からの案内メールに記載されたID
        </div>
      </div>

      <div className="field">
        <label htmlFor="password">
          パスワード <RequiredBadge />
        </label>
        <input
          autoComplete="current-password"
          className="input"
          id="password"
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </div>

      <div className="form-actions">
        <MockSubmitButton label="ログインする" pendingLabel="ログイン中…" />
      </div>

      <div className="login-links">
        <Link href="/sellers/password-reset">パスワードをお忘れの方</Link>
        <Link href="/sellers/apply">企業会員でない方（企業会員登録の申請へ）</Link>
        <Link href="/login">一般ユーザーの方のログイン</Link>
        <Link href="/signup">登録方法を選び直す</Link>
      </div>
    </form>
  );
}
