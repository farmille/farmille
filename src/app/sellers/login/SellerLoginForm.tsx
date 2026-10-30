"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { sellerLoginAction } from "@/app/sellers/login/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, submittedValuesOf, type AuthFormState } from "@/lib/auth/form-state";

export function SellerLoginForm({ next }: { next: string | null }) {
  const form = useForm({ defaultValues: { loginId: "", password: "" } });
  const values = useStore(form.store, (state) => state.values);

  const [state, formAction] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await sellerLoginAction(previous, data);
    form.setFieldValue("loginId", submittedValuesOf(result).loginId ?? "");
    form.setFieldValue("password", "");

    return result;
  }, initialAuthFormState);

  return (
    <Form action={formAction} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <Input
        description="運営からの案内メールに記載されたID"
        label="Farmille企業会員ID"
        name="loginId"
        requirement="required"
        autoCapitalize="none"
        autoComplete="username"
        value={values.loginId}
        onChange={(event) => form.setFieldValue("loginId", event.target.value)}
        placeholder="example-agri"
        spellCheck={false}
        type="text"
      />

      <Input
        label="パスワード"
        name="password"
        value={values.password}
        onChange={(event) => form.setFieldValue("password", event.target.value)}
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
