"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { updatePasswordAction } from "@/app/password-reset/update/actions";
import { buttonRecipe } from "@/components/Button";
import { Form, FormActions, Input, Notice, OtpInput, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, type AuthFormState } from "@/lib/auth/form-state";

export function UpdatePasswordForm({ tokenHash }: { tokenHash: string }) {
  const form = useForm({ defaultValues: { password: "", passwordConfirmation: "" } });
  const values = useStore(form.store, (state) => state.values);

  const [state, formAction] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await updatePasswordAction(previous, data);
    form.reset();

    return result;
  }, initialAuthFormState);

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
        value={values.password}
        onChange={(event) => form.setFieldValue("password", event.target.value)}
        requirement="required"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        placeholder="••••••••"
        type="password"
      />

      <Input
        label="新しいパスワード（確認）"
        name="passwordConfirmation"
        value={values.passwordConfirmation}
        onChange={(event) => form.setFieldValue("passwordConfirmation", event.target.value)}
        requirement="required"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        placeholder="••••••••"
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
