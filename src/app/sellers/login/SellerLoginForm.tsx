"use client";

import Link from "next/link";
import { useActionState } from "react";

import { sellerLoginAction } from "@/app/sellers/login/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  linkRowStyle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

export function SellerLoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(sellerLoginAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <Field
        guide="審査の完了メールに記載されたIDです"
        htmlFor="loginId"
        label="ログインID"
        requirement="required"
      >
        <input
          autoCapitalize="none"
          autoComplete="username"
          className={controlStyle}
          defaultValue={values.loginId}
          id="loginId"
          name="loginId"
          placeholder="例）example-agri"
          required
          spellCheck={false}
          type="text"
        />
      </Field>

      <Field htmlFor="password" label="パスワード" requirement="required">
        <input
          autoComplete="current-password"
          className={controlStyle}
          id="password"
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="ログインする" pendingLabel="ログイン中…" />
      </div>

      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/login">
          一般ユーザーの方のログイン
        </Link>
      </div>
    </form>
  );
}
