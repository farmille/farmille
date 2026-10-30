"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { Form, FormActions, Input, Notice, RadioGroup, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import {
  fieldErrorsOf,
  initialAuthFormState,
  submittedValuesOf,
  type AuthFormState,
} from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";
import { profileHandleCheckAction } from "../edit/actions";
import { setupProfileAction } from "./actions";

export function ProfileSetupForm() {
  const form = useForm({ defaultValues: { handle: "", standpoint: "" } });
  const values = useStore(form.store, (state) => state.values);
  const [state, formAction] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await setupProfileAction(previous, data);
    const submitted = submittedValuesOf(result);
    form.setFieldValue("handle", submitted.handle ?? "");
    form.setFieldValue("standpoint", submitted.standpoint ?? "");
    return result;
  }, initialAuthFormState);
  return (
    <Form
      action={formAction}
      errors={fieldErrorsOf(state)}
      persist="profile-setup"
      onRestore={(restored) => {
        form.setFieldValue("handle", restored.get("handle")?.[0] ?? "");
        form.setFieldValue("standpoint", restored.get("standpoint")?.[0] ?? "");
      }}
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      <Input
        check={profileHandleCheckAction}
        description="本名でなくても構いません。"
        label="ニックネーム"
        name="handle"
        requirement="required"
        visibility="public"
        autoComplete="nickname"
        value={values.handle}
        onChange={(event) => form.setFieldValue("handle", event.target.value)}
        maxLength={HANDLE_MAX_LENGTH}
      />
      <RadioGroup<string>
        label="あなたの属性"
        name="standpoint"
        requirement="required"
        visibility="public"
        value={values.standpoint}
        onValueChange={(value) => form.setFieldValue("standpoint", value)}
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
