"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePasswordAction } from "@/app/password-reset/update/actions";
import { buttonRecipe } from "@/components/Button";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  linkRowStyle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState } from "@/lib/auth/form-state";

export function UpdatePasswordForm({ tokenHash }: { tokenHash: string }) {
  const [state, formAction] = useActionState(updatePasswordAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);

  if (state.status === "done") {
    return (
      <>
        <FormMessage tone="info">{state.message}</FormMessage>
        <div className={formActionsStyle}>
          <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/login">
            一般・運営のログインへ
          </Link>
          <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/sellers/login">
            メーカーのログインへ
          </Link>
        </div>
      </>
    );
  }

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="tokenHash" value={tokenHash} />
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

      <Field
        htmlFor="code"
        label="2要素認証コード"
        guide="運営など、2要素認証を設定している方は、認証アプリの6桁のコードを入力してください。"
      >
        <input
          className={controlStyle}
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
        />
      </Field>
      <div className={formActionsStyle}>
        <SubmitButton label="パスワードを変更する" pendingLabel="変更中…" />
      </div>

      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/login">
          一般・運営のログインへ
        </Link>
        <Link className={textLinkStyle} href="/sellers/login">
          メーカーのログインへ
        </Link>
      </div>
    </form>
  );
}
