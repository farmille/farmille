"use client";

import Link from "next/link";
import { type ReactNode, useActionState, useState } from "react";

import {
  describedBy,
  FieldError,
  FormNotice,
  OptionalBadge,
  RequiredBadge,
} from "@/app/_mock/FormParts";
import { MockSubmitButton } from "@/app/_mock/MockSubmitButton";
import { sellerApplyAction } from "@/app/sellers/apply/actions";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

import { css, cx } from "../../../../styled-system/css";
import {
  sellerActionsStyle,
  sellerFieldStyle,
  sellerGuideStyle,
  sellerInputStyle,
  sellerLabelStyle,
  sellerLeadStyle,
  sellerTextareaStyle,
} from "../_components/form-styles";

type ApplyFieldProps = {
  name: string;
  label: string;
  required: boolean;
  guide?: string;
  error?: string;
  children: (describedById: string | undefined) => ReactNode;
};

function ApplyField({ name, label, required, guide, error, children }: ApplyFieldProps) {
  const guideId = guide === undefined ? undefined : `${name}-guide`;
  return (
    <div className={sellerFieldStyle}>
      <label className={sellerLabelStyle} htmlFor={name}>
        {label} {required ? <RequiredBadge /> : <OptionalBadge />}
      </label>
      {children(describedBy(guideId, error && `${name}-error`))}
      {guide === undefined ? null : (
        <div className={sellerGuideStyle} id={guideId}>
          {guide}
        </div>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

export function SellerApplyForm() {
  const [state, formAction] = useActionState(sellerApplyAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);
  const hadInvite =
    state.status === "error" && values.inviteCode !== undefined && values.inviteCode.length > 0;
  const [inviteOpen, setInviteOpen] = useState(hadInvite);

  // エラー後の再表示で defaultValue を効かせるため、送信値ごとに form を載せ替える。
  const formKey = state.status === "error" ? `error:${values.officialName ?? ""}` : "idle";
  const invalid = (name: string) => (fieldErrors[name] ? true : undefined);

  return (
    <form action={formAction} key={formKey} noValidate>
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}

      <ApplyField name="officialName" label="法人名" required error={fieldErrors.officialName}>
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("officialName")}
            autoComplete="organization"
            className={sellerInputStyle}
            defaultValue={values.officialName}
            id="officialName"
            name="officialName"
            placeholder="〇〇株式会社"
            required
            type="text"
          />
        )}
      </ApplyField>

      <div className={sellerFieldStyle}>
        <label className={sellerLabelStyle} htmlFor="corporateNumber">
          法人番号 <RequiredBadge />
        </label>
        <input
          aria-describedby={describedBy(
            "corporateNumber-guide",
            fieldErrors.corporateNumber && "corporateNumber-error",
          )}
          aria-invalid={invalid("corporateNumber")}
          className={sellerInputStyle}
          defaultValue={values.corporateNumber}
          id="corporateNumber"
          inputMode="numeric"
          maxLength={13}
          name="corporateNumber"
          required
        />
        <div className={sellerGuideStyle} id="corporateNumber-guide">
          13桁の法人番号を入力してください。
        </div>
        <FieldError id="corporateNumber-error" message={fieldErrors.corporateNumber} />
        <div
          className={css({
            mt: "2",
            bg: "surface.page",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: "input",
            px: "3",
            py: "2",
            fontSize: "xs",
            lineHeight: "prose",
            color: "text.muted",
          })}
        >
          ログインIDは運営が発行します。パスワードは、ご案内する設定用ページで設定してください。
        </div>
      </div>

      <ApplyField
        name="contactEmail"
        label="連絡先メールアドレス"
        required
        guide="ご担当者のメールアドレスを入力してください。公開されません。確認後、このアドレスにログインIDとパスワード設定用のご案内をお送りします。"
        error={fieldErrors.contactEmail}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("contactEmail")}
            autoComplete="email"
            className={sellerInputStyle}
            defaultValue={values.contactEmail}
            id="contactEmail"
            name="contactEmail"
            placeholder="contact@example.com"
            required
            type="email"
          />
        )}
      </ApplyField>

      <ApplyField
        name="contactName"
        label="ご担当者名・部署"
        required
        guide="公開されません"
        error={fieldErrors.contactName}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("contactName")}
            autoComplete="name"
            className={sellerInputStyle}
            defaultValue={values.contactName}
            id="contactName"
            name="contactName"
            placeholder="担当 太郎"
            required
            type="text"
          />
        )}
      </ApplyField>

      <ApplyField
        name="location"
        label="本社・主な拠点の所在地"
        required={false}
        error={fieldErrors.location}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("location")}
            autoComplete="street-address"
            className={sellerInputStyle}
            defaultValue={values.location}
            id="location"
            name="location"
            placeholder="東京都〇〇区…"
            type="text"
          />
        )}
      </ApplyField>

      <ApplyField
        name="contactPhone"
        label="ご担当者電話番号"
        required
        guide="公開されません。確認が必要な場合の連絡に使用します。"
        error={fieldErrors.contactPhone}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("contactPhone")}
            autoComplete="tel"
            className={sellerInputStyle}
            defaultValue={values.contactPhone}
            id="contactPhone"
            maxLength={20}
            name="contactPhone"
            required
            type="tel"
          />
        )}
      </ApplyField>

      <ApplyField
        name="materialRequestNotes"
        label="備考：掲載・編集を希望する資材"
        required={false}
        guide="掲載済みで編集したい資材、またはこれから掲載したい資材の正式名称を記入してください。"
        error={fieldErrors.materialRequestNotes}
      >
        {(described) => (
          <textarea
            aria-describedby={described}
            aria-invalid={invalid("materialRequestNotes")}
            className={sellerTextareaStyle}
            defaultValue={values.materialRequestNotes}
            id="materialRequestNotes"
            maxLength={2000}
            name="materialRequestNotes"
          />
        )}
      </ApplyField>

      <ApplyField
        name="websiteUrl"
        label="公式サイトURL"
        required={false}
        error={fieldErrors.websiteUrl}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("websiteUrl")}
            autoComplete="url"
            className={sellerInputStyle}
            defaultValue={values.websiteUrl}
            id="websiteUrl"
            name="websiteUrl"
            placeholder="https://…"
            type="url"
          />
        )}
      </ApplyField>

      {inviteOpen ? (
        <ApplyField
          name="inviteCode"
          label="招待コード"
          required={false}
          error={fieldErrors.inviteCode}
        >
          {(described) => (
            <input
              aria-describedby={described}
              aria-invalid={invalid("inviteCode")}
              autoCapitalize="none"
              autoComplete="off"
              className={sellerInputStyle}
              defaultValue={values.inviteCode}
              id="inviteCode"
              name="inviteCode"
              placeholder="案内に記載のコード"
              spellCheck={false}
              type="text"
            />
          )}
        </ApplyField>
      ) : null}

      <p className={cx(sellerLeadStyle, css({ lineHeight: "prose", mt: "1.5", mb: "3.5" }))}>
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
      <div className={sellerActionsStyle}>
        <MockSubmitButton label="申請する" pendingLabel="申請中…" />
        <button
          aria-expanded={inviteOpen}
          className={css({
            w: "full",
            p: "1",
            borderWidth: "0",
            bg: "transparent",
            color: "text.subtle",
            fontSize: "sm",
            textAlign: "center",
            _focusVisible: {
              outlineWidth: "2px",
              outlineStyle: "solid",
              outlineColor: "primary.700",
              outlineOffset: "2px",
            },
          })}
          onClick={() => setInviteOpen((open) => !open)}
          type="button"
        >
          {inviteOpen
            ? "招待コード入力を閉じる"
            : "Farmilleからのご案内で登録される方はこちら（招待コード入力）"}
        </button>
      </div>
    </form>
  );
}
