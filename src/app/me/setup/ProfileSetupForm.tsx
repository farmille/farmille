"use client";

import { useActionState } from "react";

import {
  Field,
  Fieldset,
  Form,
  FormActions,
  Input,
  Notice,
  RadioGroup,
  SubmitButton,
} from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";
import { setupProfileAction } from "./actions";

export function ProfileSetupForm() {
  const [state, formAction] = useActionState(setupProfileAction, initialAuthFormState);
  const values = submittedValuesOf(state);
  return (
    <Form action={formAction} errors={fieldErrorsOf(state)}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      <Field
        description="本名でなくても構いません。"
        label="ハンドルネーム"
        name="handle"
        requirement="required"
        visibility="public"
      >
        <Input autoComplete="nickname" defaultValue={values.handle} maxLength={HANDLE_MAX_LENGTH} />
      </Field>
      <Fieldset legend="あなたの立場" name="standpoint" requirement="required" visibility="public">
        <RadioGroup<string> defaultValue={values.standpoint} options={STANDPOINTS} />
      </Fieldset>
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
