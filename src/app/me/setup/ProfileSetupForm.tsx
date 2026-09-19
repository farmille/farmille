"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  linkRowStyle,
  RadioCards,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";
import { setupProfileAction } from "./actions";

export function ProfileSetupForm() {
  const [state, formAction] = useActionState(setupProfileAction, initialAuthFormState);
  const fields = fieldErrorsOf(state);
  const values = submittedValuesOf(state);
  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <Field
        error={fields.handle}
        htmlFor="handle"
        label="ハンドルネーム"
        visibility="public"
        requirement="required"
        guide="投稿に表示されます。本名でなくても構いません。"
      >
        <input
          id="handle"
          name="handle"
          type="text"
          autoComplete="nickname"
          className={controlStyle}
          maxLength={HANDLE_MAX_LENGTH}
          defaultValue={values.handle}
          required
        />
      </Field>
      <Field
        error={fields.standpoint}
        label="あなたの立場"
        visibility="public"
        requirement="required"
        guide="公開プロフィールや投稿に表示されます。"
      >
        <RadioCards name="standpoint" options={STANDPOINTS} defaultValue={values.standpoint} />
      </Field>
      <div className={formActionsStyle}>
        <SubmitButton label="設定してマイページへ" pendingLabel="設定中…" />
      </div>
      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/admin">
          運営管理へ戻る
        </Link>
        <Link className={textLinkStyle} href="/">
          ホームへ戻る
        </Link>
      </div>
    </form>
  );
}
