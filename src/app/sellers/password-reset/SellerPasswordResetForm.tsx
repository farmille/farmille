"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { sellerPasswordResetAction } from "@/app/sellers/password-reset/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, type AuthFormState } from "@/lib/auth/form-state";

export function SellerPasswordResetForm() {
  const form = useForm({ defaultValues: { loginId: "", email: "" } });
  const values = useStore(form.store, (state) => state.values);
  const [state, action] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await sellerPasswordResetAction(previous, data);
    form.reset();
    return result;
  }, initialAuthFormState);
  return (
    <Form action={action} persist={false}>
      {state.status === "done" ? (
        <Notice tone="success">{state.message}</Notice>
      ) : (
        <>
          {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
          <Input
            label="Farmille企業会員ID"
            name="loginId"
            value={values.loginId}
            onChange={(event) => form.setFieldValue("loginId", event.target.value)}
            requirement="required"
            autoComplete="username"
          />
          <Input
            label="登録済みの連絡先メールアドレス"
            name="email"
            value={values.email}
            onChange={(event) => form.setFieldValue("email", event.target.value)}
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
