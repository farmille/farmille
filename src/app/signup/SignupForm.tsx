"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction } from "@/app/signup/actions";
import {
  controlStyle,
  Field,
  FormMessage,
  formActionsStyle,
  HintBox,
  linkRowStyle,
  RadioCards,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { HANDLE_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";
import { PREFECTURES } from "@/lib/prefectures";

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <Field
        error={fieldErrors.handle}
        guide="公開されます。本名でなくてOKです"
        htmlFor="handle"
        label="ニックネーム"
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
          guide="公開されません"
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
        guide="公開されません"
        htmlFor="email"
        label="メールアドレス"
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
        guide="公開されません。確認が必要な場合の連絡に使用します。"
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
        guide="投稿や公開プロフィールに表示されます。"
        label="あなたの立場"
        requirement="required"
      >
        <RadioCards defaultValue={values.standpoint} name="standpoint" options={STANDPOINTS} />
      </Field>
      <Field
        error={fieldErrors.postalCode}
        htmlFor="postalCode"
        label="郵便番号"
        guide="公開されません"
        requirement="required"
      >
        <input
          className={controlStyle}
          id="postalCode"
          name="postalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          defaultValue={values.postalCode}
          placeholder="123-4567"
          maxLength={8}
          required
        />
      </Field>
      <Field
        error={fieldErrors.prefectureCode}
        htmlFor="prefectureCode"
        label="都道府県"
        guide="公開されます"
        requirement="required"
      >
        <select
          className={controlStyle}
          id="prefectureCode"
          name="prefectureCode"
          defaultValue={values.prefectureCode ?? ""}
          autoComplete="address-level1"
          required
        >
          <option value="" disabled>
            選択してください
          </option>
          {PREFECTURES.map((prefecture) => (
            <option key={prefecture.code} value={prefecture.code}>
              {prefecture.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        error={fieldErrors.city}
        htmlFor="city"
        label="市区町村"
        guide="公開されません"
        requirement="required"
      >
        <input
          className={controlStyle}
          id="city"
          name="city"
          autoComplete="address-level2"
          defaultValue={values.city}
          maxLength={100}
          required
        />
      </Field>

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
        label="利用規約・感想口コミガイドラインへの同意"
        requirement="required"
      >
        <label>
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            defaultChecked={values.terms === "on"}
          />{" "}
          利用規約・感想口コミガイドラインに同意する
        </label>
      </Field>

      <Field label="アイコン画像" requirement="optional">
        <HintBox>登録後にマイページで設定できます。</HintBox>
      </Field>

      <div className={formActionsStyle}>
        <SubmitButton label="登録する" pendingLabel="登録中…" />
      </div>

      <div className={linkRowStyle}>
        <Link className={textLinkStyle} href="/login">
          すでに一般ユーザーアカウントをお持ちの方はログイン
        </Link>
        <Link className={textLinkStyle} href="/signup">
          登録方法を選び直す
        </Link>
      </div>
    </form>
  );
}
