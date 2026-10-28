"use client";

import { useActionState } from "react";

import { Form, FormActions, Input, Notice, RadioGroup, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";
import { profileHandleCheckAction } from "../edit/actions";
import { setupProfileAction } from "./actions";

export function ProfileSetupForm() {
  const [state, formAction] = useActionState(setupProfileAction, initialAuthFormState);
  const values = submittedValuesOf(state);
  return (
    <Form action={formAction} errors={fieldErrorsOf(state)} persist="profile-setup">
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      <Input
        check={profileHandleCheckAction}
        description="本名でなくても構いません。"
        label="ニックネーム"
        name="handle"
        requirement="required"
        visibility="public"
        autoComplete="nickname"
        defaultValue={values.handle}
        maxLength={HANDLE_MAX_LENGTH}
      />
      <RadioGroup<string>
        label="あなたの属性"
        name="standpoint"
        requirement="required"
        visibility="public"
        defaultValue={values.standpoint}
        options={STANDPOINTS}
      />
      <FormActions>
        <SubmitButton pendingLabel="設定中…">設定してマイページへ</SubmitButton>
      </FormActions>
      <FormActions layout="links">
        <TextLink href="/admin" variant="plain">
          運営管理へ戻る
        </TextLink>
        <TextLink href="/" variant="plain">
          ホームへ戻る
        </TextLink>
      </FormActions>
    </Form>
  );
}
