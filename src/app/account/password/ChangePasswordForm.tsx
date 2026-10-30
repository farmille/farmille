"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { changePasswordAction } from "@/app/account/password/actions";
import { buttonRecipe } from "@/components/Button";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState, type AuthFormState } from "@/lib/auth/form-state";

import { css } from "../../../../styled-system/css";

const logoutNote = css({ textStyle: "supporting", color: "text.muted" });

export function ChangePasswordForm({
  loginHref,
  resetHref,
}: {
  loginHref: string;
  resetHref: string;
}) {
  const form = useForm({
    defaultValues: { currentPassword: "", password: "", passwordConfirmation: "" },
  });

  const values = useStore(form.store, (state) => state.values);

  const [state, action] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await changePasswordAction(previous, data);
    form.reset();

    return result;
  }, initialAuthFormState);

  if (state.status === "done")
    return (
      <>
        <Notice tone="success">{state.message}</Notice>
        <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href={loginHref}>
          ログイン画面へ
        </Link>
      </>
    );

  return (
    <Form action={action} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      <Input
        label="現在のパスワード"
        name="currentPassword"
        value={values.currentPassword}
        onChange={(event) => form.setFieldValue("currentPassword", event.target.value)}
        requirement="required"
        autoComplete="current-password"
        type="password"
      />
      <Input
        description="8〜128文字で、現在と異なるパスワードを設定してください。"
        label="新しいパスワード"
        name="password"
        value={values.password}
        onChange={(event) => form.setFieldValue("password", event.target.value)}
        requirement="required"
        autoComplete="new-password"
        maxLength={128}
        minLength={8}
        type="password"
      />
      <Input
        label="新しいパスワード（確認）"
        name="passwordConfirmation"
        value={values.passwordConfirmation}
        onChange={(event) => form.setFieldValue("passwordConfirmation", event.target.value)}
        requirement="required"
        autoComplete="new-password"
        type="password"
      />
      <p className={logoutNote}>変更すると、ログイン中の他の端末も順次ログアウトします。</p>
      <FormActions>
        <SubmitButton pendingLabel="変更中…">パスワードを変更する</SubmitButton>
      </FormActions>
      <TextLink href={resetHref} variant="plain">
        現在のパスワードをお忘れの方
      </TextLink>
    </Form>
  );
}
