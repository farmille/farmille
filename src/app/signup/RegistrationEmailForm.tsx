"use client";

import { useForm, useStore } from "@tanstack/react-form";

import { useActionState, useReducer } from "react";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, fieldErrorsOf, type AuthFormState } from "@/lib/auth/form-state";

import { css } from "../../../styled-system/css";

const loginLinkStyle = css({ display: "block", w: "[fit-content]", mt: "2" });

export function RegistrationEmailForm({
  action,
  next = null,
  error,
}: {
  /** 認証メールを送る server action。 */
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string | null;
  /** メールのリンクを開けなかった理由。どの理由でも、登録を済ませた人にはログインを案内する。 */
  error?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialAuthFormState);
  const form = useForm({ defaultValues: { email: "" } });
  const email = useStore(form.store, (state) => state.values.email);
  // 欄を直したら、直す前の送信の結果（エラーも送信済みの案内も）は今の入力に当てはまらないので出さない
  const [editedState, setEditedState] = useReducer(
    (_state: AuthFormState | null, next: AuthFormState | null) => next,
    null,
  );
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const linkError = state.status === "idle" && !pending ? error : undefined;
  const current = state !== editedState && !pending;
  const fieldErrors = fieldErrorsOf(state);
  // 欄のエラーは欄の下にだけ出し、上の帯は欄に結び付かないエラー（通信の失敗など）に使う
  const submitError =
    state.status === "error" && current && Object.keys(fieldErrors).length === 0
      ? state.message
      : null;
  const sentMessage = state.status === "done" && current ? state.message : null;
  return (
    <Form
      action={formAction}
      errors={fieldErrors}
      onRestore={(restored) => form.setFieldValue("email", restored.get("email")?.[0] ?? "")}
      persist="registration-email"
    >
      <FormActions layout="links">
        <TextLink href={loginHref} variant="plain">
          すでに登録済みの方はログイン
        </TextLink>
      </FormActions>
      {linkError ? (
        <Notice tone="error">
          {linkError}
          <TextLink className={loginLinkStyle} href={loginHref}>
            ログイン画面へ
          </TextLink>
        </Notice>
      ) : null}
      {submitError ? <Notice tone="error">{submitError}</Notice> : null}
      {sentMessage ? (
        <Notice tone="info" title="メールをご確認ください">
          {sentMessage}届かない場合は迷惑メールフォルダもご確認ください。
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
        onChange={(event) => {
          form.setFieldValue("email", event.target.value);
          setEditedState(state);
        }}
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
