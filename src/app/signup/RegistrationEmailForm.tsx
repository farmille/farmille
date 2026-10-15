"use client";

import { useActionState, useState } from "react";
import { registrationEmailAction } from "./actions";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, fieldErrorsOf } from "@/lib/auth/form-state";

export function RegistrationEmailForm({
  next = null,
  error,
}: {
  next?: string | null;
  error?: string;
}) {
  const [state, action] = useActionState(registrationEmailAction, initialAuthFormState);
  const [email, setEmail] = useState("");
  return (
    <Form
      action={action}
      errors={fieldErrorsOf(state)}
      onRestore={(restored) => setEmail(restored.get("email")?.[0] ?? "")}
      persist="registration-email"
    >
      <FormActions layout="links">
        <TextLink
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          variant="plain"
        >
          すでに登録済みの方はログイン
        </TextLink>
      </FormActions>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? (
        <Notice tone="info" title="メールをご確認ください">
          {state.message}届かない場合は迷惑メールフォルダもご確認ください。
        </Notice>
      ) : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Input
        label="メールアドレス"
        name="email"
        requirement="required"
        visibility="private"
        autoComplete="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <FormActions>
        <SubmitButton pendingLabel="送信中…">
          {state.status === "done" ? "認証メールを再送" : "認証メールを送信"}
        </SubmitButton>
      </FormActions>
      <FormActions layout="links">
        <TextLink href="/sellers/apply" variant="plain">
          メーカーの方はこちら
        </TextLink>
      </FormActions>
    </Form>
  );
}
