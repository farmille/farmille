"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePasswordAction } from "@/app/password-reset/update/actions";
import { buttonRecipe } from "@/components/Button";
import { Form, FormActions, Input, Notice, OtpInput, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState } from "@/lib/auth/form-state";

export function UpdatePasswordForm({ tokenHash }: { tokenHash: string }) {
  const [state, formAction] = useActionState(updatePasswordAction, initialAuthFormState);

  if (state.status === "done") {
    return (
      <>
        <Notice tone="success">{state.message}</Notice>
        <FormActions>
          <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/login">
            一般・運営のログインへ
          </Link>
          <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/sellers/login">
            メーカーのログインへ
          </Link>
        </FormActions>
      </>
    );
  }

  return (
    <Form action={formAction} errors={fieldErrorsOf(state)} persist={false}>
      <input type="hidden" name="tokenHash" value={tokenHash} />
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}

      <Input
        description={`${PASSWORD_MIN_LENGTH}文字以上で設定してください。`}
        label="新しいパスワード"
        name="password"
        requirement="required"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        placeholder={`${PASSWORD_MIN_LENGTH}文字以上`}
        type="password"
      />

      <Input
        label="新しいパスワード（確認）"
        name="passwordConfirmation"
        requirement="required"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        placeholder={`${PASSWORD_MIN_LENGTH}文字以上`}
        type="password"
      />

      <OtpInput
        description="運営など、2要素認証を設定している方は、認証アプリの6桁のコードを入力してください。"
        label="2要素認証コード"
        name="code"
      />

      <FormActions>
        <SubmitButton pendingLabel="変更中…">パスワードを変更する</SubmitButton>
      </FormActions>

      <FormActions layout="links">
        <TextLink href="/login" variant="plain">
          一般・運営のログインへ
        </TextLink>
        <TextLink href="/sellers/login" variant="plain">
          メーカーのログインへ
        </TextLink>
      </FormActions>
    </Form>
  );
}
