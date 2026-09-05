"use client";

import { useActionState } from "react";

import { FileInput } from "@/components";
import { controlStyle, Field, FormMessage, formActionsStyle } from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import type { OwnProfile } from "@/server/queries/profiles";

import { updateProfileAction } from "./actions";

type ProfileEditFormProps = {
  profile: OwnProfile;
};

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <Field
        error={fieldErrors.avatar}
        guide="JPEG / PNG / WebP・2MBまで"
        htmlFor="avatar"
        label="アバター"
        requirement="optional"
      >
        <FileInput accept="image/jpeg,image/png,image/webp" id="avatar" name="avatar" />
      </Field>

      <Field
        error={fieldErrors.handle}
        guide="本名でなくてOKです"
        htmlFor="handle"
        label="ハンドルネーム"
        requirement="required"
      >
        <input
          autoComplete="nickname"
          className={controlStyle}
          defaultValue={values.handle ?? profile.handle}
          id="handle"
          maxLength={HANDLE_MAX_LENGTH}
          name="handle"
          required
          type="text"
        />
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="保存する" pendingLabel="保存中…" />
      </div>
    </form>
  );
}
