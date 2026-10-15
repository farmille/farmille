"use client";

import Link from "next/link";
import { useActionState } from "react";

import { changePasswordAction } from "@/app/account/password/actions";
import { buttonRecipe } from "@/components/Button";
import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { initialAuthFormState } from "@/lib/auth/form-state";

import { css } from "../../../../styled-system/css";

const logoutNote = css({ textStyle: "supporting", color: "text.muted" });

export function ChangePasswordForm({
  loginHref,
  resetHref,
}: {
  loginHref: string;
  resetHref: string;
}) {
  const [state, action] = useActionState(changePasswordAction, initialAuthFormState);
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
        requirement="required"
        autoComplete="current-password"
        type="password"
      />
      <Input
        description="8〜128文字で、現在と異なるパスワードを設定してください。"
        label="新しいパスワード"
        name="password"
        requirement="required"
        autoComplete="new-password"
        maxLength={128}
        minLength={8}
        type="password"
      />
      <Input
        label="新しいパスワード（確認）"
        name="passwordConfirmation"
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
