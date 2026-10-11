"use client";

import Link from "next/link";
import { useActionState } from "react";

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
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { TextLink } from "@/components/TextLink";
import { HANDLE_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";

import { css, cx } from "../../../styled-system/css";
import { PostalAddressFields } from "./PostalAddressFields";

const introStyle = css({ mb: "3", textAlign: "center" });

const nameRowStyle = css({ display: "flex", gap: "2" });

const namePartStyle = css({ flex: "1" });

const noteStyle = css({
  mt: "1",
  mb: "2",
  fontSize: "sm",
  lineHeight: "normal",
  color: "text.muted",
});

export function SignupForm({ next = null }: { next?: string | null }) {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <Form action={formAction} errors={fieldErrorsOf(state)}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}

      <Notice
        className={introStyle}
        title="投稿と実証詳細レポートの閲覧には、会員登録が必要です"
        tone="info"
      >
        登録は無料・1分で完了します。
      </Notice>
      <p className={css({ mb: "4.5", textStyle: "supporting", color: "text.subtle" })}>
        ニックネームで参加できます。本名や連絡先が公開されることはありません。
      </p>

      <Field
        description="本名でなくてOKです"
        label="ニックネーム"
        name="handle"
        requirement="required"
        visibility="public"
      >
        <Input
          autoComplete="nickname"
          defaultValue={values.handle}
          maxLength={HANDLE_MAX_LENGTH}
          placeholder="例）農家の山田"
        />
      </Field>

      <Fieldset legend="本名" requirement="required" visibility="private">
        <div className={nameRowStyle}>
          <Field className={namePartStyle} hideLabel label="本名（姓）" name="familyName">
            <Input
              autoComplete="family-name"
              defaultValue={values.familyName}
              maxLength={80}
              placeholder="姓　例）山田"
            />
          </Field>
          <Field className={namePartStyle} hideLabel label="本名（名）" name="givenName">
            <Input
              autoComplete="given-name"
              defaultValue={values.givenName}
              maxLength={80}
              placeholder="名　例）太郎"
            />
          </Field>
        </div>
      </Fieldset>

      <Field label="メールアドレス" name="email" requirement="required" visibility="private">
        <Input
          autoComplete="email"
          defaultValue={values.email}
          placeholder="you@example.com"
          type="email"
        />
      </Field>

      <Field
        description="確認が必要な場合の連絡に使用します。公開されません。"
        label="電話番号"
        name="phone"
        requirement="optional"
        visibility="private"
      >
        <Input
          autoComplete="tel"
          defaultValue={values.phone}
          maxLength={20}
          placeholder="例）090-1234-5678"
          type="tel"
        />
      </Field>

      <Fieldset
        description="立場は、投稿やマイページで肩書きとして表示されます。"
        legend="あなたの立場"
        name="standpoint"
        requirement="required"
        visibility="public"
      >
        <RadioGroup<string>
          defaultValue={values.standpoint}
          options={STANDPOINTS}
          variant="cards"
        />
      </Fieldset>

      <PostalAddressFields values={values} />

      <Field
        description={`${PASSWORD_MIN_LENGTH}文字以上で設定してください`}
        label="パスワード"
        name="password"
        requirement="required"
      >
        <Input
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          placeholder="••••••••"
          type="password"
        />
      </Field>

      <Field
        description={
          <>
            規約・ガイドラインは別タブで開きます。個人情報の扱いは
            <TextLink
              href="/legal/privacy"
              rel="noopener noreferrer"
              target="_blank"
              variant="plain"
            >
              プライバシーポリシー（別タブ）
            </TextLink>
            をご確認ください。
          </>
        }
        name="terms"
        requirement="required"
      >
        <Checkbox defaultChecked={values.terms === "on"} variant="row">
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer">
            総合利用規約
          </Link>
          ・
          <Link href="/legal/posting" target="_blank" rel="noopener noreferrer">
            投稿ガイドライン
          </Link>
          に同意する
        </Checkbox>
      </Field>
      <p className={noteStyle}>
        アイコン・主な作目・所属などは、あとからマイページで設定できます。
      </p>

      <FormActions>
        <SubmitButton pendingLabel="登録中…">登録する</SubmitButton>
      </FormActions>
      <FormActions layout="links">
        <TextLink
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          variant="plain"
        >
          すでに一般ユーザーアカウントをお持ちの方はログイン
        </TextLink>
        <TextLink href="/signup" variant="plain">
          登録方法を選び直す
        </TextLink>
      </FormActions>

      <div
        className={cx(
          surfaceCardRecipe({ padding: "cozy" }),
          css({ mt: "3.5", textAlign: "center" }),
        )}
      >
        <div className={css({ textStyle: "supporting", color: "text.subtle" })}>
          メーカー様はこちら
        </div>
        <TextLink
          className={css({ mt: "1.5", whiteSpace: "nowrap" })}
          href="/sellers/apply"
          variant="plain"
        >
          企業会員登録申請へ →
        </TextLink>
      </div>
    </Form>
  );
}
