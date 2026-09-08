"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sellerPasswordResetAction } from "@/app/sellers/password-reset/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { initialAuthFormState } from "@/lib/auth/form-state";

export function SellerPasswordResetForm() {
  const [state, action] = useActionState(sellerPasswordResetAction, initialAuthFormState);
  return (
    <form action={action} noValidate>
      {state.status === "done" ? (
        <FormMessage tone="info">{state.message}</FormMessage>
      ) : (
        <>
          {state.status === "error" ? (
            <FormMessage tone="error">{state.message}</FormMessage>
          ) : null}
          <Field htmlFor="loginId" label="ログインID" requirement="required">
            <input
              className={controlStyle}
              id="loginId"
              name="loginId"
              autoComplete="username"
              required
            />
          </Field>
          <Field htmlFor="email" label="登録済みの連絡先メールアドレス" requirement="required">
            <input
              className={controlStyle}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <div className={formActionsStyle}>
            <SubmitButton label="再設定メールを送信" pendingLabel="送信中…" />
          </div>
        </>
      )}
      <Link className={textLinkStyle} href="/sellers/login">
        メーカーログインへ戻る
      </Link>
    </form>
  );
}
