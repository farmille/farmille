"use client";

import { useActionState, useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { sellerApplyAction } from "@/app/sellers/apply/actions";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import { Form, FormActions, Input, Notice, SubmitButton, Textarea } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import {
  fieldErrorsOf,
  initialAuthFormState,
  submittedValuesOf,
  type AuthFormState,
} from "@/lib/auth/form-state";

import { css } from "../../../../styled-system/css";

const noteStyle = css({ mt: "2" });

const inviteStyle = css({ mt: "5" });

const invitePanelBodyStyle = css({ pt: "3" });

const applicationFields = [
  "officialName",
  "corporateNumber",
  "contactEmail",
  "contactName",
  "location",
  "contactPhone",
  "materialRequestNotes",
  "websiteUrl",
  "inviteCode",
] as const;

export function SellerApplyForm() {
  const form = useForm({
    defaultValues: {
      officialName: "",
      corporateNumber: "",
      contactEmail: "",
      contactName: "",
      location: "",
      contactPhone: "",
      materialRequestNotes: "",
      websiteUrl: "",
      inviteCode: "",
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const [state, formAction] = useActionState(async (previous: AuthFormState, data: FormData) => {
    const result = await sellerApplyAction(previous, data);
    const submitted = submittedValuesOf(result);
    for (const name of applicationFields) form.setFieldValue(name, submitted[name] ?? "");
    return result;
  }, initialAuthFormState);
  const [inviteOpen, setInviteOpen] = useReducer((_state: boolean, next: boolean) => next, false);

  return (
    <Form
      action={formAction}
      errors={fieldErrorsOf(state)}
      persist="seller-apply"
      onRestore={(restored) => {
        for (const name of applicationFields)
          form.setFieldValue(name, restored.get(name)?.[0] ?? "");
        if (restored.get("inviteCode")?.[0]) setInviteOpen(true);
      }}
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}

      <Input
        label="法人名"
        name="officialName"
        requirement="required"
        autoComplete="organization"
        value={values.officialName}
        onChange={(event) => form.setFieldValue("officialName", event.target.value)}
        placeholder="〇〇株式会社"
      />

      <Input
        description="13桁の法人番号を入力してください。"
        label="法人番号"
        name="corporateNumber"
        requirement="required"
        value={values.corporateNumber}
        onChange={(event) => form.setFieldValue("corporateNumber", event.target.value)}
        inputMode="numeric"
        maxLength={13}
      />

      <Notice className={noteStyle} tone="neutral">
        Farmille企業会員IDは運営が発行します。パスワードは、ご案内する設定用ページで設定してください。
      </Notice>

      <Input
        description="ご担当者のメールアドレスを入力してください。公開されません。確認後、このアドレスにFarmille企業会員IDとパスワード設定用のご案内をお送りします。"
        label="連絡先メールアドレス"
        name="contactEmail"
        requirement="required"
        autoComplete="email"
        value={values.contactEmail}
        onChange={(event) => form.setFieldValue("contactEmail", event.target.value)}
        placeholder="contact@example.com"
        type="email"
      />

      <Input
        description="公開されません"
        label="ご担当者名・部署"
        name="contactName"
        requirement="required"
        autoComplete="name"
        value={values.contactName}
        onChange={(event) => form.setFieldValue("contactName", event.target.value)}
        placeholder="担当 太郎"
      />

      <Input
        label="本社・主な拠点の所在地"
        name="location"
        requirement="optional"
        autoComplete="street-address"
        value={values.location}
        onChange={(event) => form.setFieldValue("location", event.target.value)}
        placeholder="東京都〇〇区…"
      />

      <Input
        description="公開されません。確認が必要な場合の連絡に使用します。"
        label="ご担当者電話番号"
        name="contactPhone"
        requirement="required"
        autoComplete="tel"
        value={values.contactPhone}
        onChange={(event) => form.setFieldValue("contactPhone", event.target.value)}
        maxLength={20}
        type="tel"
      />

      <Textarea
        description="掲載済みで編集したい資材、またはこれから掲載したい資材の正式名称を記入してください。"
        label="備考：掲載・編集を希望する資材"
        name="materialRequestNotes"
        requirement="optional"
        value={values.materialRequestNotes}
        onChange={(event) => form.setFieldValue("materialRequestNotes", event.target.value)}
        maxLength={2000}
        rows={4}
      />

      <Input
        label="公式サイトURL"
        name="websiteUrl"
        requirement="optional"
        autoComplete="url"
        value={values.websiteUrl}
        onChange={(event) => form.setFieldValue("websiteUrl", event.target.value)}
        placeholder="https://…"
        type="url"
      />

      <Collapsible className={inviteStyle} onOpenChange={setInviteOpen} open={inviteOpen}>
        <CollapsibleTrigger variant="link">
          {inviteOpen
            ? "招待コード入力を閉じる"
            : "Farmilleからのご案内で登録される方はこちら（招待コード入力）"}
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className={invitePanelBodyStyle}>
            <Input
              label="招待コード"
              name="inviteCode"
              requirement="optional"
              autoCapitalize="none"
              autoComplete="off"
              value={values.inviteCode}
              onChange={(event) => form.setFieldValue("inviteCode", event.target.value)}
              placeholder="案内に記載のコード"
              spellCheck={false}
            />
          </div>
        </CollapsiblePanel>
      </Collapsible>

      <Notice className={noteStyle} tone="neutral">
        申請前に
        <TextLink href="/legal/manufacturer" rel="noopener noreferrer" target="_blank">
          Farmille企業向けサービス利用規約（別タブ）
        </TextLink>
        と
        <TextLink href="/legal" rel="noopener noreferrer" target="_blank">
          各規約・ガイドライン（別タブ）
        </TextLink>
        をご確認ください。
      </Notice>
      <FormActions>
        <SubmitButton pendingLabel="申請中…">申請する</SubmitButton>
      </FormActions>
    </Form>
  );
}
