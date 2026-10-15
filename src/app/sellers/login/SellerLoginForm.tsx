"use client";

import { useActionState } from "react";

import { sellerLoginAction } from "@/app/sellers/login/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

export function SellerLoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(sellerLoginAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <Form action={formAction} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <Input
        description="運営からの案内メールに記載されたID"
        label="ログインID"
        name="loginId"
        requirement="required"
        autoCapitalize="none"
        autoComplete="username"
        defaultValue={values.loginId}
        placeholder="example-agri"
        spellCheck={false}
        type="text"
      />

      <Input
        label="パスワード"
        name="password"
        requirement="required"
        autoComplete="current-password"
        placeholder="••••••••"
        type="password"
      />

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
