"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction } from "@/app/signup/actions";
import {
  describedBy,
  FieldError,
  FormNotice,
  OptionalBadge,
  RequiredBadge,
  VisibilityTag,
} from "@/app/_mock/FormParts";
import { MockSubmitButton } from "@/app/_mock/MockSubmitButton";
import { HANDLE_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";
import { STANDPOINTS } from "@/lib/standpoints";
import { formActionsStyle, RadioCards } from "@/components/auth/Fields";
import { Icon } from "@/components/Icon";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css, cx } from "../../../styled-system/css";
import {
  fieldInputStyle,
  fieldLabelStyle,
  fieldStyle,
  guideStyle,
  softCardStyle,
  textLinkStyle,
} from "./form-styles";
import { PostalAddressFields } from "./PostalAddressFields";

const termsToggleStyle = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  mt: "2.5",
  px: "3",
  py: "3",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  fontSize: "md",
  fontWeight: "bold",
  cursor: "pointer",
  "&:has(input:focus-visible)": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
  "& a": { color: "inherit", textDecoration: "underline" },
});

const coverInputStyle = css({
  position: "absolute",
  inset: "0",
  w: "full",
  h: "full",
  m: "0",
  opacity: "0",
  cursor: "pointer",
});

const checkBoxStyle = css({
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  w: "5",
  h: "5",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "mark",
  color: "transparent",
  "input:checked + &": { bg: "primary.700", borderColor: "primary.700", color: "text.inverse" },
});

const inputGuideStyle = cx(guideStyle, css({ mt: "1.5" }));

export function SignupForm({ next = null }: { next?: string | null }) {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}

      <div className={cx(softCardStyle, css({ mb: "3", textAlign: "center" }))}>
        <div className={css({ fontSize: "md", fontWeight: "bold" })}>
          投稿と実証詳細レポートの閲覧には、会員登録が必要です
        </div>
        <div className={css({ mt: "1", fontSize: "sm", fontWeight: "bold", color: "primary.800" })}>
          登録は無料・1分で完了します。
        </div>
      </div>
      <p className={css({ mb: "4.5", fontSize: "sm", color: "text.subtle" })}>
        ニックネームで参加できます。本名や連絡先が公開されることはありません。
      </p>

      <div className={fieldStyle}>
        <label className={fieldLabelStyle} htmlFor="handle">
          ニックネーム
          <RequiredBadge />
          <VisibilityTag visibility="public" />
        </label>
        <input
          aria-describedby={describedBy("handle-guide", fieldErrors.handle && "handle-error")}
          aria-invalid={fieldErrors.handle ? true : undefined}
          autoComplete="nickname"
          className={fieldInputStyle}
          defaultValue={values.handle}
          id="handle"
          maxLength={HANDLE_MAX_LENGTH}
          name="handle"
          placeholder="例）農家の山田"
          required
          type="text"
        />
        <div className={inputGuideStyle} id="handle-guide">
          本名でなくてOKです
        </div>
        <FieldError id="handle-error" message={fieldErrors.handle} />
      </div>

      <fieldset className={fieldStyle}>
        <legend className={fieldLabelStyle}>
          本名
          <RequiredBadge />
          <VisibilityTag visibility="private" />
        </legend>
        <div className={css({ display: "flex", gap: "2" })}>
          <input
            aria-describedby={describedBy(fieldErrors.familyName && "familyName-error")}
            aria-invalid={fieldErrors.familyName ? true : undefined}
            aria-label="本名（姓）"
            autoComplete="family-name"
            className={fieldInputStyle}
            defaultValue={values.familyName}
            id="familyName"
            maxLength={80}
            name="familyName"
            placeholder="姓　例）山田"
            required
          />
          <input
            aria-describedby={describedBy(fieldErrors.givenName && "givenName-error")}
            aria-invalid={fieldErrors.givenName ? true : undefined}
            aria-label="本名（名）"
            autoComplete="given-name"
            className={fieldInputStyle}
            defaultValue={values.givenName}
            id="givenName"
            maxLength={80}
            name="givenName"
            placeholder="名　例）太郎"
            required
          />
        </div>
        <FieldError id="familyName-error" message={fieldErrors.familyName} />
        <FieldError id="givenName-error" message={fieldErrors.givenName} />
      </fieldset>

      <div className={fieldStyle}>
        <label className={fieldLabelStyle} htmlFor="email">
          メールアドレス
          <RequiredBadge />
          <VisibilityTag visibility="private" />
        </label>
        <input
          aria-describedby={describedBy(fieldErrors.email && "email-error")}
          aria-invalid={fieldErrors.email ? true : undefined}
          autoComplete="email"
          className={fieldInputStyle}
          defaultValue={values.email}
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <FieldError id="email-error" message={fieldErrors.email} />
      </div>

      <div className={fieldStyle}>
        <label className={fieldLabelStyle} htmlFor="phone">
          電話番号
          <OptionalBadge />
          <VisibilityTag visibility="private" />
        </label>
        <input
          aria-describedby={describedBy("phone-guide", fieldErrors.phone && "phone-error")}
          aria-invalid={fieldErrors.phone ? true : undefined}
          autoComplete="tel"
          className={fieldInputStyle}
          defaultValue={values.phone}
          id="phone"
          maxLength={20}
          name="phone"
          placeholder="例）090-1234-5678"
          type="tel"
        />
        <div className={inputGuideStyle} id="phone-guide">
          確認が必要な場合の連絡に使用します。公開されません。
        </div>
        <FieldError id="phone-error" message={fieldErrors.phone} />
      </div>

      <fieldset
        className={fieldStyle}
        aria-describedby={describedBy(
          "standpoint-guide",
          fieldErrors.standpoint && "standpoint-error",
        )}
      >
        <legend className={fieldLabelStyle}>
          あなたの立場
          <RequiredBadge />
          <VisibilityTag visibility="public" />
        </legend>
        <RadioCards name="standpoint" options={STANDPOINTS} defaultValue={values.standpoint} />
        <div className={inputGuideStyle} id="standpoint-guide">
          立場は、投稿やマイページで肩書きとして表示されます。
        </div>
        <FieldError id="standpoint-error" message={fieldErrors.standpoint} />
      </fieldset>

      <PostalAddressFields values={values} fieldErrors={fieldErrors} />

      <div className={fieldStyle}>
        <label className={fieldLabelStyle} htmlFor="password">
          パスワード
          <RequiredBadge />
        </label>
        <input
          aria-describedby={describedBy("password-guide", fieldErrors.password && "password-error")}
          aria-invalid={fieldErrors.password ? true : undefined}
          autoComplete="new-password"
          className={fieldInputStyle}
          id="password"
          minLength={PASSWORD_MIN_LENGTH}
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
        <div className={inputGuideStyle} id="password-guide">
          {PASSWORD_MIN_LENGTH}文字以上で設定してください
        </div>
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>

      <label className={termsToggleStyle}>
        <input
          className={coverInputStyle}
          aria-describedby={describedBy(fieldErrors.terms && "terms-error")}
          aria-invalid={fieldErrors.terms ? true : undefined}
          defaultChecked={values.terms === "on"}
          id="terms"
          name="terms"
          required
          type="checkbox"
        />
        <span className={checkBoxStyle} aria-hidden="true">
          <Icon name="check" size="xs" />
        </span>{" "}
        <span>
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer">
            総合利用規約
          </Link>
          ・
          <Link href="/legal/posting" target="_blank" rel="noopener noreferrer">
            投稿ガイドライン
          </Link>
          に同意する <RequiredBadge />
        </span>
      </label>
      <FieldError id="terms-error" message={fieldErrors.terms} />
      <div className={cx(guideStyle, css({ mt: "1", mb: "2" }))}>
        規約・ガイドラインは別タブで開きます。個人情報の扱いは
        <Link
          className={textLinkStyle}
          href="/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          プライバシーポリシー（別タブ）
        </Link>
        をご確認ください。
      </div>
      <div className={cx(guideStyle, css({ mt: "1", mb: "2" }))}>
        アイコン・主な作目・所属などは、あとからマイページで設定できます。
      </div>

      <div className={formActionsStyle}>
        <MockSubmitButton label="登録する" pendingLabel="登録中…" />
      </div>
      <div className={cx(guideStyle, css({ mb: "2", textAlign: "center" }))}>
        <Link
          className={textLinkStyle}
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        >
          すでに一般ユーザーアカウントをお持ちの方はログイン
        </Link>
        <br />
        <Link className={textLinkStyle} href="/signup">
          登録方法を選び直す
        </Link>
      </div>

      <div
        className={cx(
          surfaceCardRecipe({ padding: "cozy" }),
          css({ mt: "3.5", textAlign: "center" }),
        )}
      >
        <div className={css({ fontSize: "sm", color: "text.subtle" })}>メーカー様はこちら</div>
        <Link
          className={css({
            display: "inline-block",
            mt: "1.5",
            fontSize: "sm",
            color: "primary.700",
            textDecoration: "none",
            whiteSpace: "nowrap",
          })}
          href="/sellers/apply"
        >
          企業会員登録申請へ →
        </Link>
      </div>
    </form>
  );
}
