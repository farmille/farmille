"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

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
    state.status === "error" && values.inviteCode !== undefined && values.inviteCode.length > 0;
  const [inviteOpen, setInviteOpen] = useState(hadInvite);

  // エラー後の再表示で select の defaultValue を効かせるため、送信値ごとに form を載せ替える。
  const formKey = state.status === "error" ? `error:${values.officialName ?? ""}` : "idle";

  return (
    <form action={formAction} key={formKey} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <Field
        error={fieldErrors.officialName}
        htmlFor="officialName"
        label="法人名"
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
        error={fieldErrors.corporateNumber}
        htmlFor="corporateNumber"
        label="法人番号"
        requirement="required"
        guide="13桁の法人番号を入力してください。"
      >
        <input
          className={controlStyle}
          defaultValue={values.corporateNumber}
          id="corporateNumber"
          name="corporateNumber"
          required
          inputMode="numeric"
          maxLength={13}
        />
      </Field>

      <HintBox>
        ログインIDは運営が発行します。パスワードは、ご案内する設定用ページで設定してください。
      </HintBox>

      <Field
        error={fieldErrors.contactEmail}
        guide="ご担当者のメールアドレスを入力してください。公開されません。確認後、このアドレスにログインIDとパスワード設定用のご案内をお送りします。"
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
        label="ご担当者名・部署"
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
        requirement="optional"
      >
        <input
          autoComplete="street-address"
          className={controlStyle}
          defaultValue={values.location}
          id="location"
          name="location"
          placeholder="東京都〇〇区…"
          type="text"
        />
      </Field>

      <Field
        error={fieldErrors.contactPhone}
        htmlFor="contactPhone"
        label="ご担当者電話番号"
        requirement="required"
        guide="公開されません。確認が必要な場合の連絡に使用します。"
      >
        <input
          className={controlStyle}
          defaultValue={values.contactPhone}
          id="contactPhone"
          name="contactPhone"
          required
          type="tel"
          autoComplete="tel"
          maxLength={20}
        />
      </Field>
      <Field
        error={fieldErrors.materialRequestNotes}
        htmlFor="materialRequestNotes"
        label="備考：掲載・編集を希望する資材"
        requirement="optional"
        guide="掲載済みで編集したい資材、またはこれから掲載したい資材の正式名称を記入してください。"
      >
        <textarea
          className={controlStyle}
          defaultValue={values.materialRequestNotes}
          id="materialRequestNotes"
          name="materialRequestNotes"
          maxLength={2000}
          rows={4}
        />
      </Field>

      <Field
        error={fieldErrors.websiteUrl}
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
        <p className={css({ fontSize: "md", lineHeight: "relaxed" })}>
          申請前に
          <Link href="/legal/manufacturer" target="_blank" rel="noopener noreferrer">
            Farmille企業向けサービス利用規約（別タブ）
          </Link>
          と
          <Link href="/legal" target="_blank" rel="noopener noreferrer">
            各規約・ガイドライン（別タブ）
          </Link>
          をご確認ください。
        </p>
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
