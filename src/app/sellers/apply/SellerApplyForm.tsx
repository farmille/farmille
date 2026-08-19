"use client";

import { useActionState, useState } from "react";

import { sellerApplyAction } from "@/app/sellers/apply/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  HintBox,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { PREFECTURES } from "@/lib/prefectures";
import { REGION_BLOCKS } from "@/lib/region-scopes";
import { SELLER_TYPES } from "@/lib/seller-types";
import { css } from "../../../../styled-system/css";

const inviteToggleRow = css({
  textAlign: "center",
  color: "text.subtle",
  fontSize: "sm",
  py: "1.5",
});

const inviteToggleButton = css({
  all: "unset",
  cursor: "pointer",
  color: "text.subtle",
  fontSize: "sm",
  textAlign: "center",
  _hover: { textDecoration: "underline" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    outlineOffset: "2px",
  },
});

export function SellerApplyForm() {
  const [state, formAction] = useActionState(sellerApplyAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);
  const hadInvite =
    state.status === "error" &&
    typeof values.inviteCode === "string" &&
    values.inviteCode.length > 0;
  const [inviteOpen, setInviteOpen] = useState(hadInvite);

  // エラー後の再表示で select の defaultValue を効かせるため、送信値ごとに form を載せ替える。
  const formKey =
    state.status === "error" ? `error:${values.loginId ?? ""}:${values.sellerType ?? ""}` : "idle";

  return (
    <form action={formAction} key={formKey} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <Field
        error={fieldErrors.officialName}
        htmlFor="officialName"
        label="正式名称（法人名・組織名）"
        requirement="required"
      >
        <input
          autoComplete="organization"
          className={controlStyle}
          defaultValue={values.officialName}
          id="officialName"
          name="officialName"
          placeholder="〇〇株式会社"
          required
          type="text"
        />
      </Field>

      <Field
        error={fieldErrors.sellerType}
        htmlFor="sellerType"
        label="種別"
        requirement="required"
      >
        <select
          className={controlStyle}
          defaultValue={values.sellerType ?? ""}
          id="sellerType"
          name="sellerType"
          required
        >
          <option disabled value="">
            選択してください
          </option>
          {SELLER_TYPES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        error={fieldErrors.loginId}
        guide="半角英小文字・数字と . _ - のみ（3〜31文字）"
        htmlFor="loginId"
        label="ご希望のログインID"
        requirement="required"
      >
        <input
          autoCapitalize="none"
          autoComplete="username"
          className={controlStyle}
          defaultValue={values.loginId}
          id="loginId"
          name="loginId"
          placeholder="login_id"
          required
          spellCheck={false}
          type="text"
        />
      </Field>

      <HintBox>パスワードは申請時には受け付けません。承認時にログイン情報をご連絡します。</HintBox>

      <Field
        error={fieldErrors.contactEmail}
        guide="公開されません"
        htmlFor="contactEmail"
        label="連絡先メールアドレス"
        requirement="required"
      >
        <input
          autoComplete="email"
          className={controlStyle}
          defaultValue={values.contactEmail}
          id="contactEmail"
          name="contactEmail"
          placeholder="contact@example.com"
          required
          type="email"
        />
      </Field>

      <Field
        error={fieldErrors.contactName}
        guide="公開されません"
        htmlFor="contactName"
        label="ご担当者名"
        requirement="required"
      >
        <input
          autoComplete="name"
          className={controlStyle}
          defaultValue={values.contactName}
          id="contactName"
          name="contactName"
          placeholder="担当 太郎"
          required
          type="text"
        />
      </Field>

      <Field
        error={fieldErrors.location}
        htmlFor="location"
        label="本社・主な拠点の所在地"
        requirement="required"
      >
        <input
          autoComplete="street-address"
          className={controlStyle}
          defaultValue={values.location}
          id="location"
          name="location"
          placeholder="東京都〇〇区…"
          required
          type="text"
        />
      </Field>

      <Field
        error={fieldErrors.regionScope}
        guide="公開プロフィールに表示されます"
        htmlFor="regionScope"
        label="主な地域"
        requirement="required"
      >
        <select
          className={controlStyle}
          defaultValue={values.regionScope ?? ""}
          id="regionScope"
          name="regionScope"
          required
        >
          <option disabled value="">
            選択してください
          </option>
          <optgroup label="全国">
            <option value="全国">全国</option>
          </optgroup>
          <optgroup label="地方ブロック">
            {REGION_BLOCKS.map((block) => (
              <option key={block} value={block}>
                {block}
              </option>
            ))}
          </optgroup>
          <optgroup label="都道府県">
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture.code} value={prefecture.name}>
                {prefecture.name}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>

      <Field
        error={fieldErrors.websiteUrl}
        guide="審査の参考にさせていただきます"
        htmlFor="websiteUrl"
        label="公式サイトURL"
        requirement="optional"
      >
        <input
          autoComplete="url"
          className={controlStyle}
          defaultValue={values.websiteUrl}
          id="websiteUrl"
          name="websiteUrl"
          placeholder="https://…"
          type="url"
        />
      </Field>

      {inviteOpen ? (
        <Field
          error={fieldErrors.inviteCode}
          htmlFor="inviteCode"
          label="招待コード"
          requirement="optional"
        >
          <input
            autoCapitalize="none"
            autoComplete="off"
            className={controlStyle}
            defaultValue={values.inviteCode}
            id="inviteCode"
            name="inviteCode"
            placeholder="案内に記載のコード"
            spellCheck={false}
            type="text"
          />
        </Field>
      ) : null}

      <div className={formActionsStyle}>
        <SubmitButton label="申請する" pendingLabel="申請中…" />
        <div className={inviteToggleRow}>
          {inviteOpen ? (
            <button
              className={inviteToggleButton}
              onClick={() => setInviteOpen(false)}
              type="button"
            >
              招待コード入力を閉じる
            </button>
          ) : (
            <button
              className={inviteToggleButton}
              onClick={() => setInviteOpen(true)}
              type="button"
            >
              Farmilleからのご案内で登録される方はこちら（招待コード入力）
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
