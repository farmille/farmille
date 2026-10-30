"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { saveRegisteredDetailsAction } from "@/app/account/details/actions";
import { PostalAddressFields } from "@/app/signup/PostalAddressFields";
import { Fieldset, Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { fieldErrorsOf, initialAuthFormState } from "@/lib/auth/form-state";
import type { RegisteredDetails } from "@/server/accounts/registered-details";

import { css } from "../../../../styled-system/css";

const nameRowStyle = css({ display: "flex", gap: "2" });

const namePartStyle = css({ flex: "1" });

const savedNoticeStyle = css({ mt: "6" });

const CONTACT_EMAIL = "contact@farmille.com";

/** 画面の欄に入れる文字列。郵便番号は登録時の画面と同じく 123-4567 で出す。 */
function formValues(details: RegisteredDetails) {
  return {
    familyName: details.familyName,
    givenName: details.givenName,
    phone: details.phone,
    postalCode:
      details.postalCode === ""
        ? ""
        : `${details.postalCode.slice(0, 3)}-${details.postalCode.slice(3)}`,
    prefectureCode: details.prefectureCode === null ? "" : String(details.prefectureCode),
    cityStreet: details.cityStreet,
    buildingName: details.buildingName,
  };
}

export function RegisteredDetailsForm({ details }: { details: RegisteredDetails }) {
  const [state, action] = useActionState(saveRegisteredDetailsAction, initialAuthFormState);

  // 送信後の reset で欄が戻る先。エラーのときは送った値、保存できたときは保存した値（再取得した props）。
  const values =
    state.status === "error" && state.values !== undefined ? state.values : formValues(details);

  const defaults = {
    familyName: values.familyName ?? "",
    givenName: values.givenName ?? "",
    phone: values.phone ?? "",
  };

  const form = useForm({ defaultValues: defaults });
  const input = useStore(form.store, (state) => state.values);

  return (
    <Form
      action={action}
      errors={fieldErrorsOf(state)}
      persist={false}
      onReset={() => form.reset(defaults)}
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}

      <Input
        description={
          <>
            メールアドレスを変更したいときは、
            <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>
            にお問い合わせください。
          </>
        }
        label="メールアドレス"
        visibility="private"
        autoComplete="email"
        readOnly
        type="email"
        value={details.email}
      />

      <Fieldset legend="本名" requirement="required" visibility="private">
        <div className={nameRowStyle}>
          <Input
            fieldClassName={namePartStyle}
            hideLabel
            label="本名（姓）"
            name="familyName"
            autoComplete="family-name"
            value={input.familyName}
            onChange={(event) => form.setFieldValue("familyName", event.target.value)}
            maxLength={80}
            placeholder="姓"
          />
          <Input
            fieldClassName={namePartStyle}
            hideLabel
            label="本名（名）"
            name="givenName"
            autoComplete="given-name"
            value={input.givenName}
            onChange={(event) => form.setFieldValue("givenName", event.target.value)}
            maxLength={80}
            placeholder="名"
          />
        </div>
      </Fieldset>

      <Input
        description="確認が必要な場合の連絡に使用します。公開されません。"
        label="電話番号"
        name="phone"
        requirement="optional"
        visibility="private"
        autoComplete="tel"
        value={input.phone}
        onChange={(event) => form.setFieldValue("phone", event.target.value)}
        inputMode="tel"
        maxLength={20}
        placeholder="090-1234-5678"
        type="tel"
      />

      <PostalAddressFields values={values} />

      {/* 押したボタンのそばに出し、375px の画面でも見える位置に置く */}
      {state.status === "done" ? (
        <Notice className={savedNoticeStyle} tone="success">
          {state.message}
        </Notice>
      ) : null}
      <FormActions>
        <SubmitButton pendingLabel="保存中…">登録情報を保存する</SubmitButton>
      </FormActions>
    </Form>
  );
}
