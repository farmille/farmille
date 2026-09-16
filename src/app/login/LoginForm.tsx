"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/login/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  linkRowStyle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

export function LoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(loginAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <Field htmlFor="email" label="メールアドレス" requirement="required">
        <input
          autoComplete="email"
          className={controlStyle}
          defaultValue={values.email}
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </Field>

      <Field htmlFor="password" label="パスワード" requirement="required">
        <input
          autoComplete="current-password"
          className={controlStyle}
          id="password"
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="ログインする" pendingLabel="ログイン中…" />
      </div>

      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/password-reset">
          パスワードをお忘れの方
        </Link>
        <Link
          className={textLinkStyle}
          href={next ? `/signup/general?next=${encodeURIComponent(next)}` : "/signup"}
        >
          アカウントをお持ちでない方は登録方法を選ぶ
        </Link>
        <Link
          className={textLinkStyle}
          href={next ? `/sellers/login?next=${encodeURIComponent(next)}` : "/sellers/login"}
        >
          メーカーの方のログイン
        </Link>
      </div>
    </form>
  );
}
