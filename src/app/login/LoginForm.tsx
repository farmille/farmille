"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/login/actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

export function LoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(loginAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <Form action={formAction} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <Input
        label="メールアドレス"
        name="email"
        requirement="required"
        autoComplete="email"
        defaultValue={values.email}
        placeholder="you@example.com"
        type="email"
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
