"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormNotice, RequiredBadge } from "@/app/_site/FormParts";
import { FormSubmitButton } from "@/app/_site/FormSubmitButton";
import { sellerLoginAction } from "@/app/sellers/login/actions";
import { initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

import { css } from "../../../../styled-system/css";
import {
  greenTextLinkStyle,
  sellerActionsStyle,
  sellerFieldStyle,
  sellerGuideStyle,
  sellerInputStyle,
  sellerLabelStyle,
} from "../_components/form-styles";

export function SellerLoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(sellerLoginAction, initialAuthFormState);
  const values = submittedValuesOf(state);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}
      {next === null ? null : <input name="next" type="hidden" value={next} />}

      <div className={css({ mt: "4" })}>
        <label className={sellerLabelStyle} htmlFor="loginId">
          ログインID <RequiredBadge />
        </label>
        <input
          aria-describedby="loginId-guide"
          autoCapitalize="none"
          autoComplete="username"
          className={sellerInputStyle}
          defaultValue={values.loginId}
          id="loginId"
          name="loginId"
          placeholder="例）example-agri"
          required
          spellCheck={false}
          type="text"
        />
        <div className={sellerGuideStyle} id="loginId-guide">
          運営からの案内メールに記載されたID
        </div>
      </div>

      <div className={sellerFieldStyle}>
        <label className={sellerLabelStyle} htmlFor="password">
          パスワード <RequiredBadge />
        </label>
        <input
          autoComplete="current-password"
          className={sellerInputStyle}
          id="password"
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </div>

      <div className={sellerActionsStyle}>
        <FormSubmitButton label="ログインする" pendingLabel="ログイン中…" />
      </div>

      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "2",
          mt: "3.5",
          fontSize: "md",
        })}
      >
        <Link className={greenTextLinkStyle} href="/sellers/password-reset">
          パスワードをお忘れの方
        </Link>
        <Link className={greenTextLinkStyle} href="/sellers/apply">
          企業会員でない方（企業会員登録の申請へ）
        </Link>
        <Link className={greenTextLinkStyle} href="/login">
          一般ユーザーの方のログイン
        </Link>
        <Link className={greenTextLinkStyle} href="/signup">
          登録方法を選び直す
        </Link>
      </div>
    </form>
  );
}
