"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/password-reset/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  linkRowStyle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { initialAuthFormState } from "@/lib/auth/form-state";

export function PasswordResetForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialAuthFormState);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}

      <Field htmlFor="email" label="メールアドレス" requirement="required">
        <input
          autoComplete="email"
          className={controlStyle}
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="再設定メールを送る" pendingLabel="送信中…" />
      </div>

      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/login">
          ログイン画面へ戻る
        </Link>
      </div>
    </form>
  );
}
