"use client";

import { useActionState } from "react";

import { FileInput } from "@/components";
import { controlStyle, Field, FormMessage, formActionsStyle } from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import type { OwnProfile } from "@/server/queries/profiles";

import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import { ProfileTagsEditor } from "./ProfileTagsEditor";

import { updateProfileAction } from "./actions";

type ProfileEditFormProps = {
  profile: OwnProfile;
  details: ProfileDetails;
  options: ProfileOptions;
};

export function ProfileEditForm({ profile, details, options }: ProfileEditFormProps) {
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

      <Field
        htmlFor="bio"
        label="自己紹介"
        requirement="optional"
        guide="2000文字以内。公開されます。"
      >
        <textarea
          className={controlStyle}
          id="bio"
          name="bio"
          rows={5}
          maxLength={2000}
          defaultValue={values.bio ?? details.bio ?? ""}
        />
      </Field>
      <ProfileTagsEditor details={details} options={options} />
      <Field
        htmlFor="links"
        label="リンク"
        requirement="optional"
        guide="自分のサイトやSNSのURLを1行に1件入力してください（10件まで）。公開されます。"
      >
        <textarea
          className={controlStyle}
          id="links"
          name="links"
          rows={3}
          defaultValue={values.links ?? details.links.join("\n")}
        />
      </Field>
      <Field
        htmlFor="cityPublic"
        label="地域の公開範囲"
        requirement="optional"
        guide="設定しない場合は都道府県まで公開します。本名・電話番号・郵便番号は公開されません。"
      >
        <label>
          <input
            id="cityPublic"
            name="cityPublic"
            type="checkbox"
            defaultChecked={
              values.cityPublic === undefined ? details.cityPublic : values.cityPublic === "on"
            }
          />
          市区町村も公開する
        </label>
      </Field>
      <div className={formActionsStyle}>
        <SubmitButton label="保存する" pendingLabel="保存中…" />
      </div>
    </form>
  );
}
