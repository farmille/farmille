"use client";

import Link from "next/link";
import { useActionState } from "react";

import { changePasswordAction } from "@/app/account/password/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  ghostButtonStyle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { initialAuthFormState } from "@/lib/auth/form-state";

export function ChangePasswordForm({
  loginHref,
  resetHref,
}: {
  loginHref: string;
  resetHref: string;
}) {
  const [state, action] = useActionState(changePasswordAction, initialAuthFormState);
  if (state.status === "done")
    return (
      <>
        <FormMessage tone="info">{state.message}</FormMessage>
        <Link className={ghostButtonStyle} href={loginHref}>
          ログイン画面へ
        </Link>
      </>
    );
  return (
    <form action={action} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <Field htmlFor="currentPassword" label="現在のパスワード" requirement="required">
        <input
          className={controlStyle}
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field
        htmlFor="password"
        label="新しいパスワード"
        requirement="required"
        guide="8〜128文字で、現在と異なるパスワードを設定してください。"
      >
        <input
          className={controlStyle}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
      </Field>
      <Field htmlFor="passwordConfirmation" label="新しいパスワード（確認）" requirement="required">
        <input
          className={controlStyle}
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <p>変更すると、ログイン中の他の端末も順次ログアウトします。</p>
      <div className={formActionsStyle}>
        <SubmitButton label="パスワードを変更する" pendingLabel="変更中…" />
      </div>
      <Link className={textLinkStyle} href={resetHref}>
        現在のパスワードをお忘れの方
      </Link>
    </form>
  );
}
