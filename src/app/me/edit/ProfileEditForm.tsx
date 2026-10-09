"use client";

import { useActionState } from "react";

import {
  Checkbox,
  Field,
  FileInput,
  Form,
  FormActions,
  Input,
  Notice,
  SubmitButton,
  Textarea,
} from "@/components/form";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { TextLink } from "@/components/TextLink";
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

type ProfileEditFormProps = {
  profile: OwnProfile;
  details: ProfileDetails;
  options: ProfileOptions;
};

export function ProfileEditForm({ profile, details, options }: ProfileEditFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialAuthFormState);
  const values = submittedValuesOf(state);
  const cityPublic =
    values.cityPublic === undefined ? details.cityPublic : values.cityPublic === "on";

  return (
    <Form action={formAction} errors={fieldErrorsOf(state)}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}

      <div className={slots}>
        <div className={slot}>
          <Field
            description="JPEG / PNG / WebP ・ 2MBまで"
            label={
              <>
                アイコンを変更<span className={srOnly}>（アバター）</span>
              </>
            }
            name="avatar"
          >
            <FileInput accept="image/jpeg,image/png,image/webp" />
          </Field>
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
        </div>
      </div>

      <Field
        description="本名でなくてOKです"
        label={
          <>
            ニックネーム<span className={srOnly}>（ハンドルネーム）</span>
          </>
        }
        name="handle"
        requirement="required"
      >
        <Input
          autoComplete="nickname"
          defaultValue={values.handle ?? profile.handle}
          maxLength={HANDLE_MAX_LENGTH}
        />
      </Field>

      <Field
        description="2000文字以内。公開されます。"
        label="自己紹介"
        name="bio"
        requirement="optional"
      >
        <Textarea defaultValue={values.bio ?? details.bio ?? ""} maxLength={2000} rows={5} />
      </Field>

      <ProfileTagsEditor details={details} options={options} />

      <Field
        label="リンク"
        lead="自己紹介に表示するリンクを、1行に1件入力してください（10件まで）。公開されます。"
        name="links"
        requirement="optional"
      >
        <Textarea
          defaultValue={values.links ?? details.links.join("\n")}
          placeholder="https://"
          rows={3}
        />
      </Field>

      <Field
        description="本名・電話番号・郵便番号は公開されません。"
        label="地域の公開範囲"
        name="cityPublic"
      >
        {/* 送信後のフォームのリセットでチェックが外れないよう、再表示の値ごとに載せ替える */}
        <Checkbox
          defaultChecked={cityPublic}
          description="チェックなしの場合は都道府県まで表示します"
          variant="row"
        >
          市区町村も表示する
        </Checkbox>
      </Field>

      <FormActions>
        <SubmitButton pendingLabel="保存中…">保存する</SubmitButton>
        <TextLink href="/me" variant="subtle">
          キャンセル
        </TextLink>
      </FormActions>
    </Form>
  );
}
