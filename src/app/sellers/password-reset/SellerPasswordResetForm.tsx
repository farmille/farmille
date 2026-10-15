"use client";

import { useActionState } from "react";

import { sellerPasswordResetAction } from "@/app/sellers/password-reset/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState } from "@/lib/auth/form-state";

export function SellerPasswordResetForm() {
  const [state, action] = useActionState(sellerPasswordResetAction, initialAuthFormState);
  return (
    <Form action={action}>
      {state.status === "done" ? (
        <Notice tone="success">{state.message}</Notice>
      ) : (
        <>
          {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
          <Input label="ログインID" name="loginId" requirement="required" autoComplete="username" />
          <Input
            label="登録済みの連絡先メールアドレス"
            name="email"
            requirement="required"
            autoComplete="email"
            type="email"
          />
          <FormActions>
            <SubmitButton pendingLabel="送信中…">再設定メールを送信</SubmitButton>
          </FormActions>
        </>
      )}
      <TextLink href="/sellers/login" variant="plain">
        メーカーログインへ戻る
      </TextLink>
    </Form>
  );
}
