"use client";

import { useForm, useStore } from "@tanstack/react-form";

import { useActionState, type ReactNode } from "react";

import { signupAction } from "@/app/signup/actions";
import {
  Checkbox,
  Field,
  Fieldset,
  Form,
  FormActions,
  Input,
  Notice,
  RadioGroup,
  SubmitButton,
} from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { HANDLE_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { generalRegistrationFieldErrors } from "@/lib/auth/registration-schema";
import { STANDPOINTS } from "@/lib/standpoints";

import { css } from "../../../styled-system/css";
import { PostalAddressFields } from "./PostalAddressFields";

const introStyle = css({ mt: "5", mb: "3", textAlign: "center" });

const nameRowStyle = css({ display: "flex", gap: "2" });

const namePartStyle = css({ flex: "1" });

const makerLinkStyle = css({
  mt: "3.5",
  textAlign: "center",
  textStyle: "supporting",
  color: "text.subtle",
});

const standpointGroupStyle = css({ mt: "4" });

export function SignupForm({
  email,
  termsContent,
  checkHandle,
  next = null,
}: {
  email: string;
  termsContent: ReactNode;
  /** ニックネームの欄を離れたときに、使われていないかを確かめる server action。 */
  checkHandle: (handle: string) => Promise<string | null>;
  next?: string | null;
}) {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);
  const values = submittedValuesOf(state);
  // パスワードはサーバーから返さず控えにも残さないので、送信後のフォームの reset で消えないよう画面で持つ
  const form = useForm({ defaultValues: { password: "" } });
  const password = useStore(form.store, (state) => state.values.password);

  return (
    <Form
      action={formAction}
      errors={fieldErrorsOf(state)}
      persist="signup"
      validate={generalRegistrationFieldErrors}
    >
      <FormActions layout="links">
        <TextLink
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          variant="plain"
        >
          すでに登録済みの方はログイン
        </TextLink>
      </FormActions>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}

      <Notice className={introStyle} title="メールアドレスを確認しました" tone="info">
        残りの登録情報を入力すると、会員登録が完了します。
      </Notice>
      <p className={css({ mb: "4.5", textStyle: "supporting", color: "text.subtle" })}>
        ニックネームで参加できます。本名や連絡先が公開されることはありません。
      </p>

      <Input
        label="メールアドレス"
        name="email"
        requirement="required"
        visibility="private"
        autoComplete="email"
        value={email}
        readOnly
        placeholder="you@example.com"
        type="email"
      />

      <Input
        check={checkHandle}
        description="本名でなくて構いません。"
        label="ニックネーム"
        name="handle"
        requirement="required"
        visibility="public"
        autoComplete="nickname"
        defaultValue={values.handle}
        maxLength={HANDLE_MAX_LENGTH}
        placeholder="農家の山田"
      />

      <Fieldset legend="本名" requirement="required" visibility="private">
        <div className={nameRowStyle}>
          <Input
            fieldClassName={namePartStyle}
            hideLabel
            label="本名（姓）"
            name="familyName"
            autoComplete="family-name"
            defaultValue={values.familyName}
            maxLength={80}
            placeholder="姓"
          />
          <Input
            fieldClassName={namePartStyle}
            hideLabel
            label="本名（名）"
            name="givenName"
            autoComplete="given-name"
            defaultValue={values.givenName}
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
        defaultValue={values.phone}
        inputMode="tel"
        maxLength={20}
        placeholder="090-1234-5678"
        type="tel"
      />

      <RadioGroup<string>
        description="選んだ属性は、投稿やマイページでニックネームの横に表示されます（例：生産者）。"
        label="あなたの属性"
        name="standpoint"
        requirement="required"
        visibility="public"
        className={standpointGroupStyle}
        defaultValue={values.standpoint}
        options={STANDPOINTS}
      />

      <PostalAddressFields values={values} />

      <Input
        description={`${PASSWORD_MIN_LENGTH}文字以上で設定してください。`}
        label="パスワード"
        name="password"
        requirement="required"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        onChange={(event) => form.setFieldValue("password", event.target.value)}
        placeholder="••••••••"
        revealable
        type="password"
        value={password}
      />

      <Field name="terms" requirement="required">
        <Checkbox defaultChecked={values.terms === "on"} variant="row">
          利用規約・プライバシーポリシーに同意する
        </Checkbox>
      </Field>
      {termsContent}

      <FormActions>
        <SubmitButton pendingLabel="登録中…">登録する</SubmitButton>
      </FormActions>
      <p className={makerLinkStyle}>
        メーカーの方は
        <TextLink href="/sellers/apply" variant="plain">
          企業会員登録の申請へ
        </TextLink>
      </p>
    </Form>
  );
}
