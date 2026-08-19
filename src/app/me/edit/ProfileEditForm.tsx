"use client";

import { useActionState } from "react";

import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  SwitchToggle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { CULTIVATION_STYLES } from "@/lib/cultivation-styles";
import { PREFECTURES } from "@/lib/prefectures";
import { PROFILE_FIELD_LIMITS } from "@/lib/profile-field-limits";
import type { CropOption } from "@/server/queries/crops";
import type { OwnProfile } from "@/server/queries/profiles";
import { css } from "../../../../styled-system/css";

import { updateProfileAction } from "./actions";

const chipGrid = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const chipLabel = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  px: "2.5",
  py: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "pill",
  bg: "surface.card",
  fontSize: "sm",
  cursor: "pointer",
  "&:has(input:checked)": {
    borderColor: "brand.primary",
    bg: "brand.soft",
    color: "brand.primaryDeep",
    fontWeight: "700",
  },
});

type ProfileEditFormProps = {
  profile: OwnProfile;
  crops: readonly CropOption[];
};

export function ProfileEditForm({ profile, crops }: ProfileEditFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  const selectedCropIds = new Set(
    values.cropIds !== undefined
      ? values.cropIds.split(",").filter((id) => id.length > 0)
      : profile.crops.map((crop) => crop.id),
  );
  const selectedStyles = new Set(
    values.cultivationStyles !== undefined
      ? values.cultivationStyles.split(",").filter((style) => style.length > 0)
      : profile.cultivationStyles,
  );

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
        <input
          accept="image/jpeg,image/png,image/webp"
          className={controlStyle}
          id="avatar"
          name="avatar"
          type="file"
        />
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
        error={fieldErrors.prefectureCode}
        htmlFor="prefectureCode"
        label="都道府県"
        requirement="required"
      >
        <select
          className={controlStyle}
          defaultValue={values.prefectureCode ?? String(profile.prefectureCode)}
          id="prefectureCode"
          name="prefectureCode"
          required
        >
          {PREFECTURES.map((prefecture) => (
            <option key={prefecture.code} value={prefecture.code}>
              {prefecture.name}
            </option>
          ))}
        </select>
        <SwitchToggle
          defaultChecked={
            values.prefecturePublic !== undefined
              ? values.prefecturePublic === "on"
              : profile.prefecturePublic
          }
          label="地域を公開する"
          name="prefecturePublic"
        />
      </Field>

      <Field error={fieldErrors.bio} htmlFor="bio" label="一言プロフィール" requirement="optional">
        <textarea
          className={controlStyle}
          defaultValue={values.bio ?? profile.bio ?? ""}
          id="bio"
          maxLength={PROFILE_FIELD_LIMITS.bio}
          name="bio"
          placeholder="栽培している作物や関心ごとを一言で"
          rows={4}
        />
      </Field>

      <Field error={fieldErrors.cropIds} label="主な作目" requirement="optional">
        <div className={chipGrid}>
          {crops.map((crop) => (
            <label key={crop.id} className={chipLabel}>
              <input
                defaultChecked={selectedCropIds.has(crop.id)}
                name="cropIds"
                type="checkbox"
                value={crop.id}
              />
              {crop.name}
            </label>
          ))}
        </div>
      </Field>

      <Field error={fieldErrors.cultivationStyles} label="栽培形態" requirement="optional">
        <div className={chipGrid}>
          {CULTIVATION_STYLES.map((style) => (
            <label key={style} className={chipLabel}>
              <input
                defaultChecked={selectedStyles.has(style)}
                name="cultivationStyles"
                type="checkbox"
                value={style}
              />
              {style}
            </label>
          ))}
        </div>
      </Field>

      <Field
        error={fieldErrors.affiliation}
        htmlFor="affiliation"
        label="所属"
        requirement="optional"
      >
        <input
          className={controlStyle}
          defaultValue={values.affiliation ?? profile.affiliation ?? ""}
          id="affiliation"
          maxLength={PROFILE_FIELD_LIMITS.affiliation}
          name="affiliation"
          placeholder="例）全青協"
          type="text"
        />
      </Field>

      <Field
        error={fieldErrors.websiteUrl}
        htmlFor="websiteUrl"
        label="ウェブサイト"
        requirement="optional"
      >
        <input
          className={controlStyle}
          defaultValue={values.websiteUrl ?? profile.websiteUrl ?? ""}
          id="websiteUrl"
          name="websiteUrl"
          placeholder="https://example.com"
          type="url"
        />
      </Field>

      <Field error={fieldErrors.snsUrl} htmlFor="snsUrl" label="SNS" requirement="optional">
        <input
          className={controlStyle}
          defaultValue={values.snsUrl ?? profile.snsUrl ?? ""}
          id="snsUrl"
          name="snsUrl"
          placeholder="https://..."
          type="url"
        />
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="保存する" pendingLabel="保存中…" />
      </div>
    </form>
  );
}
