"use client";

import { Checkbox } from "@/components/Checkbox";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction } from "@/app/signup/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  NoteBox,
  linkRowStyle,
  RadioCards,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { HANDLE_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";
import { PostalAddressFields } from "./PostalAddressFields";

export function SignupForm({ next = null }: { next?: string | null }) {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <NoteBox>
        ニックネーム・あなたの立場・都道府県は、投稿や公開プロフィールに表示されます。本名・メールアドレス・電話番号・郵便番号・番地・建物名は公開されません。市区町村は初期設定では非公開です。
      </NoteBox>

      <Field
        error={fieldErrors.handle}
        guide="本名でなくてOKです"
        htmlFor="handle"
        label="ニックネーム"
        visibility="public"
        requirement="required"
      >
        <input
          autoComplete="nickname"
          className={controlStyle}
          defaultValue={values.handle}
          id="handle"
          maxLength={HANDLE_MAX_LENGTH}
          name="handle"
          placeholder="例）農家の山田"
          required
          type="text"
        />
      </Field>

      {[
        { name: "familyName", label: "本名（姓）", autoComplete: "family-name" },
        { name: "givenName", label: "本名（名）", autoComplete: "given-name" },
      ].map((field) => (
        <Field
          key={field.name}
          error={fieldErrors[field.name]}
          htmlFor={field.name}
          label={field.label}
          visibility="private"
          requirement="required"
        >
          <input
            className={controlStyle}
            id={field.name}
            name={field.name}
            autoComplete={field.autoComplete}
            defaultValue={values[field.name]}
            required
            maxLength={80}
          />
        </Field>
      ))}

      <Field
        error={fieldErrors.email}
        htmlFor="email"
        label="メールアドレス"
        visibility="private"
        requirement="required"
      >
        <input
          autoComplete="email"
          className={controlStyle}
          defaultValue={values.email}
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </Field>

      <Field
        error={fieldErrors.phone}
        htmlFor="phone"
        label="電話番号"
        visibility="private"
        guide="確認が必要な場合の連絡に使用します。"
        requirement="optional"
      >
        <input
          className={controlStyle}
          id="phone"
          name="phone"
          autoComplete="tel"
          type="tel"
          defaultValue={values.phone}
          maxLength={20}
        />
      </Field>

      <Field
        error={fieldErrors.standpoint}
        label="あなたの立場"
        visibility="public"
        requirement="required"
      >
        <RadioCards defaultValue={values.standpoint} name="standpoint" options={STANDPOINTS} />
      </Field>
      <PostalAddressFields values={values} fieldErrors={fieldErrors} />

      <Field
        error={fieldErrors.password}
        guide={`${PASSWORD_MIN_LENGTH}文字以上で設定してください`}
        htmlFor="password"
        label="パスワード"
        requirement="required"
      >
        <input
          autoComplete="new-password"
          className={controlStyle}
          id="password"
          minLength={PASSWORD_MIN_LENGTH}
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </Field>

      <Field
        error={fieldErrors.terms}
        htmlFor="terms"
        label="総合利用規約・投稿ガイドラインへの同意"
        requirement="required"
      >
        <label>
          <Checkbox
            id="terms"
            name="terms"

            required
            defaultChecked={values.terms === "on"}
          />{" "}
          総合利用規約・投稿ガイドラインに同意する
        </label>
        <p>
          <Link
            className={textLinkStyle}
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            総合利用規約（別タブ）
          </Link>
          {" ／ "}
          <Link
            className={textLinkStyle}
            href="/legal/posting"
            target="_blank"
            rel="noopener noreferrer"
          >
            投稿ガイドライン（別タブ）
          </Link>
        </p>
        <p>
          <Link
            className={textLinkStyle}
            href="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            プライバシーポリシー（別タブ）
          </Link>
        </p>
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="登録する" pendingLabel="登録中…" />
      </div>

      <div className={linkRowStyle}>
        <Link
          className={textLinkStyle}
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        >
          すでに一般ユーザーアカウントをお持ちの方はログイン
        </Link>
        <Link className={textLinkStyle} href="/signup">
          登録方法を選び直す
        </Link>
        <Link className={textLinkStyle} href="/sellers/apply">
          メーカー様はこちら → 企業会員登録の申請へ
        </Link>
      </div>
    </form>
  );
}
