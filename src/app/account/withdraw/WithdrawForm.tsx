"use client";

import { useActionState } from "react";

import { withdrawAction } from "@/app/account/withdraw/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { fieldErrorsOf, initialAuthFormState } from "@/lib/auth/form-state";

export function WithdrawForm() {
  const [state, action] = useActionState(withdrawAction, initialAuthFormState);
  return (
    <Form action={action} errors={fieldErrorsOf(state)} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      <Input
        description="本人の確認のため、ログインに使っているパスワードを入力してください。"
        label="今のパスワード"
        name="password"
        requirement="required"
        autoComplete="current-password"
        revealable
        type="password"
      />
      <FormActions>
        <SubmitButton pendingLabel="退会の手続き中…" variant="danger">
          退会する
        </SubmitButton>
      </FormActions>
      <FormActions layout="links">
        <TextLink href="/password-reset" variant="plain">
          パスワードをお忘れの方
        </TextLink>
        <TextLink href="/me" variant="plain">
          退会せずにマイページに戻る
        </TextLink>
      </FormActions>
    </Form>
  );
}
