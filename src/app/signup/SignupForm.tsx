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
import { PostalAddressFields } from "./PostalAddressFields";

/** 見本 S.signup の `.body` の中身。スタイルは src/app/_mock/mock.css・forms.css（.fm 配下）。 */
export function SignupForm({ next = null }: { next?: string | null }) {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}

      <div
        className="card pad"
        style={{
          background: "var(--green-soft-2)",
          border: "1px solid color-mix(in srgb, var(--green) 22%, var(--line))",
          marginBottom: 12,
          textAlign: "center",
          padding: 15,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          投稿と実証詳細レポートの閲覧には、会員登録が必要です
        </div>
        <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--green-deep)", fontWeight: 700 }}>
          登録は無料・1分で完了します。
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12.5, marginBottom: 18 }}>
        ニックネームで参加できます。本名や連絡先が公開されることはありません。
      </p>

      <div className="field">
        <label htmlFor="handle">
          ニックネーム
          <RequiredBadge />
          <VisibilityTag visibility="public" />
        </label>
        <input
          aria-describedby={describedBy("handle-guide", fieldErrors.handle && "handle-error")}
          aria-invalid={fieldErrors.handle ? true : undefined}
          autoComplete="nickname"
          className="input"
          defaultValue={values.handle}
          id="handle"
          maxLength={HANDLE_MAX_LENGTH}
          name="handle"
          placeholder="例）農家の山田"
          required
          type="text"
        />
        <div className="fguide" id="handle-guide" style={{ marginTop: 6, marginBottom: 0 }}>
          本名でなくてOKです
        </div>
        <FieldError id="handle-error" message={fieldErrors.handle} />
      </div>

      <fieldset className="field">
        <legend className="field-label">
          本名
          <RequiredBadge />
          <VisibilityTag visibility="private" />
        </legend>
        <div className="amount-row">
          <input
            aria-describedby={describedBy(fieldErrors.familyName && "familyName-error")}
            aria-invalid={fieldErrors.familyName ? true : undefined}
            aria-label="本名（姓）"
            autoComplete="family-name"
            className="input"
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
            className="input"
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

      <div className="field">
        <label htmlFor="email">
          メールアドレス
          <RequiredBadge />
          <VisibilityTag visibility="private" />
        </label>
        <input
          aria-describedby={describedBy(fieldErrors.email && "email-error")}
          aria-invalid={fieldErrors.email ? true : undefined}
          autoComplete="email"
          className="input"
          defaultValue={values.email}
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <FieldError id="email-error" message={fieldErrors.email} />
      </div>

      <div className="field">
        <label htmlFor="phone">
          電話番号
          <OptionalBadge />
          <VisibilityTag visibility="private" />
        </label>
        <input
          aria-describedby={describedBy("phone-guide", fieldErrors.phone && "phone-error")}
          aria-invalid={fieldErrors.phone ? true : undefined}
          autoComplete="tel"
          className="input"
          defaultValue={values.phone}
          id="phone"
          maxLength={20}
          name="phone"
          placeholder="例）090-1234-5678"
          type="tel"
        />
        <div className="fguide" id="phone-guide" style={{ marginTop: 6, marginBottom: 0 }}>
          確認が必要な場合の連絡に使用します。公開されません。
        </div>
        <FieldError id="phone-error" message={fieldErrors.phone} />
      </div>

      <fieldset
        className="field"
        aria-describedby={describedBy(
          "standpoint-guide",
          fieldErrors.standpoint && "standpoint-error",
        )}
      >
        <legend className="field-label">
          あなたの立場
          <RequiredBadge />
          <VisibilityTag visibility="public" />
        </legend>
        <div className="radios">
          {STANDPOINTS.map((option) => (
            <label className="radio" key={option.value}>
              <input
                defaultChecked={option.value === values.standpoint}
                name="standpoint"
                type="radio"
                value={option.value}
              />
              <span className="ring" aria-hidden="true" />
              {option.label}
            </label>
          ))}
        </div>
        <div className="fguide" id="standpoint-guide" style={{ marginTop: 8, marginBottom: 0 }}>
          立場は、投稿やマイページで肩書きとして表示されます。
        </div>
        <FieldError id="standpoint-error" message={fieldErrors.standpoint} />
      </fieldset>

      <PostalAddressFields values={values} fieldErrors={fieldErrors} />

      <div className="field">
        <label htmlFor="password">
          パスワード
          <RequiredBadge />
        </label>
        <input
          aria-describedby={describedBy("password-guide", fieldErrors.password && "password-error")}
          aria-invalid={fieldErrors.password ? true : undefined}
          autoComplete="new-password"
          className="input"
          id="password"
          minLength={PASSWORD_MIN_LENGTH}
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
        <div className="fguide" id="password-guide" style={{ marginTop: 6, marginBottom: 0 }}>
          {PASSWORD_MIN_LENGTH}文字以上で設定してください
        </div>
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>

      <label className="check-toggle" style={{ marginTop: 10 }}>
        <input
          aria-describedby={describedBy(fieldErrors.terms && "terms-error")}
          aria-invalid={fieldErrors.terms ? true : undefined}
          defaultChecked={values.terms === "on"}
          id="terms"
          name="terms"
          required
          type="checkbox"
        />
        <span className="cbox" aria-hidden="true" />{" "}
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
      <div className="fguide" style={{ marginTop: 4 }}>
        規約・ガイドラインは別タブで開きます。個人情報の扱いは
        <Link className="text-link" href="/legal/privacy" target="_blank" rel="noopener noreferrer">
          プライバシーポリシー（別タブ）
        </Link>
        をご確認ください。
      </div>
      <div className="fguide" style={{ marginTop: 4 }}>
        アイコン・主な作目・所属などは、あとからマイページで設定できます。
      </div>

      <div className="form-actions">
        <MockSubmitButton label="登録する" pendingLabel="登録中…" />
      </div>
      <div className="fguide" style={{ textAlign: "center" }}>
        <Link
          className="text-link"
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        >
          すでに一般ユーザーアカウントをお持ちの方はログイン
        </Link>
        <br />
        <Link className="text-link" href="/signup">
          登録方法を選び直す
        </Link>
      </div>

      <div className="card pad" style={{ marginTop: 14, textAlign: "center" }}>
        <div className="muted" style={{ fontSize: 12.5 }}>
          メーカー様はこちら
        </div>
        <Link
          className="link-more"
          href="/sellers/apply"
          style={{ display: "inline-block", marginTop: 6 }}
        >
          企業会員登録申請へ →
        </Link>
      </div>
    </form>
  );
}
