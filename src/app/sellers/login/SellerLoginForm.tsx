"use client";

import { useActionState } from "react";

import { sellerLoginAction } from "@/app/sellers/login/actions";
import { Field, Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

export function SellerLoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(sellerLoginAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <Form action={formAction}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <Field
        description="運営からの案内メールに記載されたID"
        label="ログインID"
        name="loginId"
        requirement="required"
      >
        <Input
          autoCapitalize="none"
          autoComplete="username"
          defaultValue={values.loginId}
          placeholder="例）example-agri"
          spellCheck={false}
          type="text"
        />
      </Field>

      <Field label="パスワード" name="password" requirement="required">
        <Input autoComplete="current-password" placeholder="••••••••" type="password" />
      </Field>

      <FormActions>
        <SubmitButton pendingLabel="ログイン中…">ログインする</SubmitButton>
      </FormActions>

      <FormActions layout="links">
        <TextLink href="/sellers/password-reset" variant="plain">
          パスワードをお忘れの方
        </TextLink>
        <TextLink href="/sellers/apply" variant="plain">
          企業会員でない方（企業会員登録の申請へ）
        </TextLink>
        <TextLink href="/login" variant="plain">
          一般ユーザーの方のログイン
        </TextLink>
        <TextLink href="/signup" variant="plain">
          登録方法を選び直す
        </TextLink>
      </FormActions>
    </Form>
  );
}
