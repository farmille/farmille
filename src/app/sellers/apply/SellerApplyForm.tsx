"use client";

import { useActionState, useState } from "react";

import { sellerApplyAction } from "@/app/sellers/apply/actions";
import { Button } from "@/components/Button";
import { TextLink } from "@/components/TextLink";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  HintBox,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

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
          inputMode="numeric"
          maxLength={13}
          name="corporateNumber"
          required
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
        guide="公開されません。確認が必要な場合の連絡に使用します。"
        htmlFor="contactPhone"
        label="ご担当者電話番号"
        requirement="required"
      >
        <input
          autoComplete="tel"
          className={controlStyle}
          defaultValue={values.contactPhone}
          id="contactPhone"
          maxLength={20}
          name="contactPhone"
          required
          type="tel"
        />
      </Field>

      <Field
        error={fieldErrors.materialRequestNotes}
        guide="掲載済みで編集したい資材、またはこれから掲載したい資材の正式名称を記入してください。"
        htmlFor="materialRequestNotes"
        label="備考：掲載・編集を希望する資材"
        requirement="optional"
      >
        <textarea
          className={controlStyle}
          defaultValue={values.materialRequestNotes}
          id="materialRequestNotes"
          maxLength={2000}
          name="materialRequestNotes"
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

      <HintBox>
        申請前に
        <TextLink href="/legal/manufacturer" rel="noopener noreferrer" target="_blank">
          Farmille企業向けサービス利用規約（別タブ）
        </TextLink>
        と
        <TextLink href="/legal" rel="noopener noreferrer" target="_blank">
          各規約・ガイドライン（別タブ）
        </TextLink>
        をご確認ください。
      </HintBox>
      <div className={formActionsStyle}>
        <SubmitButton label="申請する" pendingLabel="申請中…" />
        <Button
          aria-expanded={inviteOpen}
          onClick={() => setInviteOpen((open) => !open)}
          variant="ghost"
        >
          {inviteOpen
            ? "招待コード入力を閉じる"
            : "Farmilleからのご案内で登録される方はこちら（招待コード入力）"}
        </Button>
      </div>
    </form>
  );
}
