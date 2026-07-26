"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePasswordAction } from "@/app/password-reset/update/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  ghostButtonStyle,
  linkRowStyle,
  textLinkStyle,
} from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState } from "@/lib/auth/form-state";

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);

  if (state.status === "done") {
    return (
      <>
        <FormMessage tone="info">{state.message}</FormMessage>
        <div className={formActionsStyle}>
          <Link className={ghostButtonStyle} href="/">
            ホームへ
          </Link>
        </div>
      </>
    );
  }

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <Field
        error={fieldErrors.password}
        guide={`${PASSWORD_MIN_LENGTH}文字以上で設定してください`}
        htmlFor="password"
        label="新しいパスワード"
        requirement="required"
      >
        <input
          autoComplete="new-password"
          className={controlStyle}
          id="password"
          minLength={PASSWORD_MIN_LENGTH}
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </Field>

      <Field
        error={fieldErrors.passwordConfirmation}
        htmlFor="passwordConfirmation"
        label="新しいパスワード（確認）"
        requirement="required"
      >
        <input
          autoComplete="new-password"
          className={controlStyle}
          id="passwordConfirmation"
          minLength={PASSWORD_MIN_LENGTH}
          name="passwordConfirmation"
          placeholder="••••••••"
          required
          type="password"
        />
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="パスワードを変更する" pendingLabel="変更中…" />
      </div>

      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/login">
          ログイン画面へ戻る
        </Link>
      </div>
    </form>
  );
}
