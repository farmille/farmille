"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/password-reset/actions";
import { Field, Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState } from "@/lib/auth/form-state";

export function PasswordResetForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialAuthFormState);

  return (
    <Form action={formAction}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}

      <Field label="メールアドレス" name="email" requirement="required">
        <Input autoComplete="email" placeholder="you@example.com" type="email" />
      </Field>

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
