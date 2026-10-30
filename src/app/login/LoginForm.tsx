"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { loginAction } from "@/app/login/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, submittedValuesOf, type AuthFormState } from "@/lib/auth/form-state";

export function LoginForm({ next }: { next: string | null }) {
  const form = useForm({ defaultValues: { email: "", password: "" } });
  const values = useStore(form.store, (state) => state.values);

  const [state, formAction] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await loginAction(previous, data);
    form.setFieldValue("email", submittedValuesOf(result).email ?? "");
    form.setFieldValue("password", "");

    return result;
  }, initialAuthFormState);

  return (
    <Form action={formAction} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <Input
        label="メールアドレス"
        name="email"
        requirement="required"
        autoComplete="email"
        value={values.email}
        onChange={(event) => form.setFieldValue("email", event.target.value)}
        placeholder="you@example.com"
        type="email"
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
        <TextLink href="/password-reset" variant="plain">
          パスワードをお忘れの方
        </TextLink>
        <TextLink
          href={next ? `/signup/general?next=${encodeURIComponent(next)}` : "/signup"}
          variant="plain"
        >
          アカウントをお持ちでない方は会員登録
        </TextLink>
        <TextLink
          href={next ? `/sellers/login?next=${encodeURIComponent(next)}` : "/sellers/login"}
          variant="plain"
        >
          メーカーの方のログイン
        </TextLink>
      </FormActions>
    </Form>
  );
}
