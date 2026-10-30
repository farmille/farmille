"use client";

import { useActionState, type ReactNode } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import {
  FileInput,
  Form,
  FormActions,
  Input,
  Notice,
  SubmitButton,
  Textarea,
} from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, type AuthFormState } from "@/lib/auth/form-state";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import type { OwnProfile } from "@/server/queries/profiles";

import { css } from "../../../../styled-system/css";

import { profileHandleCheckAction, updateProfileAction } from "./actions";
import { ProfileTagsEditor } from "./ProfileTagsEditor";
import { shrinkAvatarIn } from "./shrink-avatar";

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
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  color: "text.subtle",
  textStyle: "note",
});

const srOnly = css({ srOnly: true });

type ProfileEditFormProps = {
  /** 現在のアイコン。Avatar は絵柄のデータが大きいため、サーバー側で描いて受け取る。 */
  avatar: ReactNode;
  profile: OwnProfile;
  details: ProfileDetails;
  options: ProfileOptions;
};

type ProfileInputs = {
  avatar: File | null;
  handle: string;
  bio: string;
  links: string;
};

export function ProfileEditForm({ avatar, profile, details, options }: ProfileEditFormProps) {
  const defaults: ProfileInputs = {
    avatar: null,
    handle: profile.handle,
    bio: details.bio ?? "",
    links: details.links.join("\n"),
  };

  const form = useForm({ defaultValues: defaults });
  const values = useStore(form.store, (state) => state.values);

  const [state, formAction] = useActionState(
    async (previous: AuthFormState, formData: FormData) => {
      const avatar = form.state.values.avatar;

      if (avatar === null) formData.delete("avatar");
      else formData.set("avatar", avatar);
      await shrinkAvatarIn(formData);

      return updateProfileAction(previous, formData);
    },
    initialAuthFormState,
  );

  return (
    <Form
      action={formAction}
      errors={fieldErrorsOf(state)}
      persist="profile"
      onReset={() => {
        if (state.status === "error") form.setFieldValue("avatar", null);
        else form.reset(defaults);
      }}
      onRestore={(restored) => {
        for (const name of ["handle", "bio", "links"] as const) {
          const value = restored.get(name)?.[0];

          if (value !== undefined) form.setFieldValue(name, value);
        }
      }}
      data-tour="profile-form"
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}

      <div className={slots}>
        <div className={slot}>
          <FileInput
            description="JPEG / PNG / WebP ・ 2MBまで"
            label={
              <>
                アイコンを変更<span className={srOnly}>（アバター）</span>
              </>
            }
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => form.setFieldValue("avatar", event.target.files?.[0] ?? null)}
          />
          <div className={avatarCurrent}>
            {avatar}
            {profile.avatarUrl
              ? "現在：設定した画像を表示中"
              : "現在：自動で選ばれたイラストを表示中"}
          </div>
        </div>
      </div>

      <Input
        check={profileHandleCheckAction}
        description="本名でなくてOKです"
        label={<>ニックネーム</>}
        name="handle"
        requirement="required"
        autoComplete="nickname"
        value={values.handle}
        onChange={(event) => form.setFieldValue("handle", event.target.value)}
        maxLength={HANDLE_MAX_LENGTH}
      />

      <Textarea
        description="2000文字以内。公開されます。"
        label="自己紹介"
        name="bio"
        requirement="optional"
        value={values.bio}
        onChange={(event) => form.setFieldValue("bio", event.target.value)}
        maxLength={2000}
        rows={5}
      />

      <ProfileTagsEditor details={details} options={options} />

      <Textarea
        label="リンク"
        lead="自己紹介に表示するリンクを、1行に1件入力してください（10件まで）。公開されます。"
        name="links"
        requirement="optional"
        value={values.links}
        onChange={(event) => form.setFieldValue("links", event.target.value)}
        placeholder="https://"
        rows={3}
      />

      <FormActions>
        <SubmitButton pendingLabel="保存中…">保存する</SubmitButton>
        <TextLink href="/me" variant="subtle">
          キャンセル
        </TextLink>
      </FormActions>
    </Form>
  );
}
