"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { requestPasswordResetAction } from "@/app/password-reset/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, type AuthFormState } from "@/lib/auth/form-state";

export function PasswordResetForm() {
  const form = useForm({ defaultValues: { email: "" } });
  const email = useStore(form.store, (state) => state.values.email);

  const [state, formAction] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await requestPasswordResetAction(previous, data);
    form.reset();

    return result;
  }, initialAuthFormState);

  return (
    <Form action={formAction} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}

      <Input
        label="メールアドレス"
        name="email"
        value={email}
        onChange={(event) => form.setFieldValue("email", event.target.value)}
        requirement="required"
        autoComplete="email"
        placeholder="you@example.com"
        type="email"
      />

      <FormActions>
        <SubmitButton pendingLabel="送信中…">再設定メールを送る</SubmitButton>
      </FormActions>

      <FormActions layout="links">
        <TextLink href="/login" variant="plain">
          ログイン画面へ戻る
        </TextLink>
      </FormActions>
    </Form>
  );
}
