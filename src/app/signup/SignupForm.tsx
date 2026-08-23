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
  NoteBox,
  RadioCards,
  SwitchToggle,
  textLinkStyle,
} from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { HANDLE_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDPOINTS } from "@/lib/standpoints";

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <Field
        error={fieldErrors.handle}
        guide="本名でなくてOKです"
        htmlFor="handle"
        label="ハンドルネーム"
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

      <Field
        error={fieldErrors.email}
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
        error={fieldErrors.prefectureCode}
        htmlFor="prefectureCode"
        label="都道府県"
        requirement="required"
      >
        <select
          className={controlStyle}
          defaultValue={values.prefectureCode ?? ""}
          id="prefectureCode"
          name="prefectureCode"
          required
        >
          <option disabled value="">
            選択してください
          </option>
          {PREFECTURES.map((prefecture) => (
            <option key={prefecture.code} value={prefecture.code}>
              {prefecture.name}
            </option>
          ))}
        </select>
        <SwitchToggle
          defaultChecked={state.status === "error" ? values.prefecturePublic === "on" : true}
          label="プロフィールに公開する"
          name="prefecturePublic"
        />
      </Field>

      <Field error={fieldErrors.standpoint} label="あなたの立場" requirement="required">
        <RadioCards defaultValue={values.standpoint} name="standpoint" options={STANDPOINTS} />
        <NoteBox>
          この情報は公開されません。メーカー関係者を選んでも、作成されるのは個人用アカウントです。
          組織用アカウントは
          <Link className={textLinkStyle} href="/sellers/apply">
            メーカー・出品者申請
          </Link>
          をご利用ください。
        </NoteBox>
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
