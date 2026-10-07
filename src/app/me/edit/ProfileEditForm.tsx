"use client";

import Link from "next/link";
import { useActionState } from "react";

import { formActionsStyle } from "@/components/auth/Fields";
import {
  describedBy,
  FieldError,
  formFieldStyle,
  formGuideRecipe,
  formInputStyle,
  formLabelStyle,
  FormNotice,
  formSecondaryLinkStyle,
  formTextareaStyle,
  OptionalBadge,
  RequiredBadge,
} from "@/app/_site/FormParts";
import { FormSubmitButton } from "@/app/_site/FormSubmitButton";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import type { OwnProfile } from "@/server/queries/profiles";

import { css } from "../../../../styled-system/css";

import { updateProfileAction } from "./actions";
import { ProfileTagsEditor } from "./ProfileTagsEditor";

const slots = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "2.5",
  mb: "3",
  tab: { gridTemplateColumns: "1fr 1fr" },
});

const slot = css({
  p: "3.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
});

const avatarDrop = css({
  position: "relative",
  display: "block",
  p: "5.5",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "border.strong",
  borderRadius: "input",
  color: "text.subtle",
  fontSize: "sm",
  lineHeight: "prose",
  textAlign: "center",
  cursor: "pointer",
  _hover: { borderColor: "primary.700", color: "primary.800" },
  "&:has(input:focus-visible)": {
    borderColor: "primary.700",
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
  "& input": {
    position: "absolute",
    inset: "0",
    w: "100%",
    h: "100%",
    opacity: "0",
    cursor: "pointer",
  },
});

const avatarRequirement = css({ mt: "2", color: "text.muted", fontSize: "xs" });

const avatarCurrent = css({
  mt: "1",
  color: "text.subtle",
  fontSize: "xs",
  "& img": {
    display: "inline-block",
    w: "7",
    h: "7",
    mr: "1.5",
    borderRadius: "pill",
    objectFit: "cover",
    verticalAlign: "middle",
  },
});

const srOnly = css({ srOnly: true });

const checkRow = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  mb: "1.5",
  px: "3",
  py: "3",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  fontSize: "md",
  fontWeight: "bold",
  cursor: "pointer",
  "&:has(input:focus-visible)": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
  "& input": {
    position: "absolute",
    inset: "0",
    w: "100%",
    h: "100%",
    m: "0",
    opacity: "0",
    cursor: "pointer",
  },
});

const checkBox = css({
  position: "relative",
  flex: "0 0 auto",
  w: "4.5",
  h: "4.5",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "mark",
  "input:checked + &": {
    bg: "primary.700",
    borderColor: "primary.700",
    _after: {
      content: '""',
      position: "absolute",
      left: "1",
      top: "0",
      w: "1.5",
      h: "2.5",
      borderStyle: "solid",
      borderColor: "text.inverse",
      borderWidth: "0 2px 2px 0",
      transform: "rotate(45deg)",
    },
  },
});

const checkNote = css({ ml: "auto", color: "text.subtle", fontSize: "xs", fontWeight: "normal" });

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
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}

      <div className={slots}>
        <div className={slot}>
          <label className={avatarDrop} htmlFor="avatar">
            ＋<br />
            アイコンを変更<span className={srOnly}>（アバター）</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              aria-describedby={describedBy("avatar-req", fieldErrors.avatar && "avatar-error")}
              aria-invalid={fieldErrors.avatar ? true : undefined}
              id="avatar"
              name="avatar"
              type="file"
            />
          </label>
          <div className={avatarRequirement} id="avatar-req">
            JPEG / PNG / WebP ・ 2MBまで
          </div>
          <div className={avatarCurrent}>
            {profile.avatarUrl ? (
              <>
                <Image alt="" src={profile.avatarUrl} width={28} height={28} sizes="28px" />
                現在：設定した画像を表示中
              </>
            ) : (
              `現在：頭文字「${profile.handle.trim().slice(0, 1)}」を表示中`
            )}
          </div>
          <FieldError id="avatar-error" message={fieldErrors.avatar} />
        </div>
      </div>

      <div className={formFieldStyle}>
        <label className={formLabelStyle} htmlFor="handle">
          ニックネーム<span className={srOnly}>（ハンドルネーム）</span>
          <RequiredBadge />
        </label>
        <input
          aria-describedby={describedBy("handle-guide", fieldErrors.handle && "handle-error")}
          aria-invalid={fieldErrors.handle ? true : undefined}
          autoComplete="nickname"
          className={formInputStyle}
          defaultValue={values.handle ?? profile.handle}
          id="handle"
          maxLength={HANDLE_MAX_LENGTH}
          name="handle"
          required
          type="text"
        />
        <div className={formGuideRecipe({ placement: "below" })} id="handle-guide">
          本名でなくてOKです
        </div>
        <FieldError id="handle-error" message={fieldErrors.handle} />
      </div>

      <div className={formFieldStyle}>
        <label className={formLabelStyle} htmlFor="bio">
          自己紹介
          <OptionalBadge />
        </label>
        <textarea
          aria-describedby="bio-guide"
          className={formTextareaStyle}
          defaultValue={values.bio ?? details.bio ?? ""}
          id="bio"
          maxLength={2000}
          name="bio"
          rows={5}
        />
        <div className={formGuideRecipe({ placement: "below" })} id="bio-guide">
          2000文字以内。公開されます。
        </div>
      </div>

      <ProfileTagsEditor details={details} options={options} />

      <div className={formFieldStyle}>
        <label className={formLabelStyle} htmlFor="links">
          リンク
          <OptionalBadge />
        </label>
        <div className={formGuideRecipe()} id="links-guide">
          自己紹介に表示するリンクを、1行に1件入力してください（10件まで）。公開されます。
        </div>
        <textarea
          aria-describedby="links-guide"
          className={formTextareaStyle}
          defaultValue={values.links ?? details.links.join("\n")}
          id="links"
          name="links"
          placeholder="https://"
          rows={3}
        />
      </div>

      <div className={formFieldStyle}>
        <div className={formLabelStyle}>地域の公開範囲</div>
        <label className={checkRow}>
          <input
            aria-describedby="cityPublic-guide"
            defaultChecked={
              values.cityPublic === undefined ? details.cityPublic : values.cityPublic === "on"
            }
            id="cityPublic"
            name="cityPublic"
            type="checkbox"
          />
          <span className={checkBox} aria-hidden="true" /> 市区町村も表示する
          <span className={checkNote} id="cityPublic-guide">
            チェックなしの場合は都道府県まで表示します
          </span>
        </label>
        <div className={formGuideRecipe({ placement: "below" })}>
          本名・電話番号・郵便番号は公開されません。
        </div>
      </div>

      <div className={formActionsStyle}>
        <FormSubmitButton label="保存する" pendingLabel="保存中…" />
        <Link className={formSecondaryLinkStyle} href="/me">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
