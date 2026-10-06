"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  describedBy,
  FieldError,
  FormNotice,
  OptionalBadge,
  RequiredBadge,
} from "@/app/_mock/FormParts";
import { MockSubmitButton } from "@/app/_mock/MockSubmitButton";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import type { OwnProfile } from "@/server/queries/profiles";

import { updateProfileAction } from "./actions";
import { ProfileTagsEditor } from "./ProfileTagsEditor";

type ProfileEditFormProps = {
  profile: OwnProfile;
  details: ProfileDetails;
  options: ProfileOptions;
};

/** 見本 S.profileEdit の `.body` の中身。スタイルは src/app/_mock/mock.css・forms.css（.fm 配下）。 */
export function ProfileEditForm({ profile, details, options }: ProfileEditFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}

      <div className="md-slots" style={{ marginBottom: 12 }}>
        <div className="md-slot">
          <label className="ph" htmlFor="avatar">
            ＋<br />
            アイコンを変更<span className="sr-only">（アバター）</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              aria-describedby={describedBy("avatar-req", fieldErrors.avatar && "avatar-error")}
              aria-invalid={fieldErrors.avatar ? true : undefined}
              id="avatar"
              name="avatar"
              type="file"
            />
          </label>
          <div className="req" id="avatar-req">
            JPEG / PNG / WebP ・ 2MBまで
          </div>
          <div className="now muted">
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

      <div className="field">
        <label htmlFor="handle">
          ニックネーム<span className="sr-only">（ハンドルネーム）</span>
          <RequiredBadge />
        </label>
        <input
          aria-describedby={describedBy("handle-guide", fieldErrors.handle && "handle-error")}
          aria-invalid={fieldErrors.handle ? true : undefined}
          autoComplete="nickname"
          className="input"
          defaultValue={values.handle ?? profile.handle}
          id="handle"
          maxLength={HANDLE_MAX_LENGTH}
          name="handle"
          required
          type="text"
        />
        <div className="fguide" id="handle-guide" style={{ marginTop: 6, marginBottom: 0 }}>
          本名でなくてOKです
        </div>
        <FieldError id="handle-error" message={fieldErrors.handle} />
      </div>

      <div className="field">
        <label htmlFor="bio">
          自己紹介
          <OptionalBadge />
        </label>
        <textarea
          aria-describedby="bio-guide"
          className="textarea"
          defaultValue={values.bio ?? details.bio ?? ""}
          id="bio"
          maxLength={2000}
          name="bio"
          rows={5}
        />
        <div className="fguide" id="bio-guide" style={{ marginTop: 6, marginBottom: 0 }}>
          2000文字以内。公開されます。
        </div>
      </div>

      <ProfileTagsEditor details={details} options={options} />

      <div className="field">
        <label htmlFor="links">
          リンク
          <OptionalBadge />
        </label>
        <div className="fguide" id="links-guide">
          自己紹介に表示するリンクを、1行に1件入力してください（10件まで）。公開されます。
        </div>
        <textarea
          aria-describedby="links-guide"
          className="textarea"
          defaultValue={values.links ?? details.links.join("\n")}
          id="links"
          name="links"
          placeholder="https://"
          rows={3}
        />
      </div>

      <div className="field">
        <div className="field-label">地域の公開範囲</div>
        <label className="check-toggle">
          <input
            aria-describedby="cityPublic-guide"
            defaultChecked={
              values.cityPublic === undefined ? details.cityPublic : values.cityPublic === "on"
            }
            id="cityPublic"
            name="cityPublic"
            type="checkbox"
          />
          <span className="cbox" aria-hidden="true" /> 市区町村も表示する
          <span
            className="muted"
            id="cityPublic-guide"
            style={{ marginLeft: "auto", fontSize: 11, fontWeight: 400 }}
          >
            チェックなしの場合は都道府県まで表示します
          </span>
        </label>
        <div className="fguide" style={{ marginTop: 6, marginBottom: 0 }}>
          本名・電話番号・郵便番号は公開されません。
        </div>
      </div>

      <div className="form-actions">
        <MockSubmitButton label="保存する" pendingLabel="保存中…" />
        <Link className="draft" href="/me">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
