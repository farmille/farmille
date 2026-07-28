"use client";

import { OptimizedImage as Image } from "@/components/optimized-image";
import { useActionState } from "react";

import { initialMfaEnrollState } from "@/app/admin/_lib/action-state";
import { startTotpEnrollmentAction, verifyTotpCodeAction } from "@/app/admin/mfa/actions";
import {
  adminActionsStyle,
  adminCodeStyle,
  adminInlineNoteStyle,
} from "@/app/admin/_components/admin-ui";
import { controlStyle, Field, FormMessage } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { css } from "../../../../styled-system/css";

const stepStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const qrStyle = css({
  w: "180px",
  h: "180px",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  p: "2",
});

/** 認証コードの入力（登録の確定と、登録済み admin の AAL2 昇格の両方に使う）。 */
function VerifyForm({ factorId, next, label }: { factorId: string; next: string; label: string }) {
  const [state, formAction] = useActionState(verifyTotpCodeAction, initialAuthFormState);

  return (
    <form action={formAction} className={stepStyle} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <input name="factorId" type="hidden" value={factorId} />
      <input name="next" type="hidden" value={next} />
      <Field
        guide="認証アプリに表示されている6桁の数字を入力します。"
        htmlFor="code"
        label="認証コード"
        requirement="required"
      >
        <input
          autoComplete="one-time-code"
          className={controlStyle}
          id="code"
          inputMode="numeric"
          maxLength={6}
          name="code"
          pattern="[0-9]{6}"
          placeholder="123456"
          required
          type="text"
        />
      </Field>
      <div className={adminActionsStyle}>
        <SubmitButton label={label} pendingLabel="確認中…" />
      </div>
    </form>
  );
}

export function AdminMfaForms({
  verifiedFactorId,
  next,
}: {
  verifiedFactorId: string | null;
  next: string;
}) {
  const [enrollState, enrollAction] = useActionState(
    startTotpEnrollmentAction,
    initialMfaEnrollState,
  );

  if (verifiedFactorId !== null) {
    return <VerifyForm factorId={verifiedFactorId} label="2要素認証を完了する" next={next} />;
  }

  if (enrollState.status === "ready") {
    return (
      <div className={stepStyle}>
        <p className={adminInlineNoteStyle}>
          認証アプリで次の QR コードを読み取り、表示された6桁を入力してください。
        </p>
        {/* Supabase が返す SVG の data URI は、画像最適化を通さずに描画する。 */}
        <Image
          alt="TOTP 登録用の QR コード"
          className={qrStyle}
          height={180}
          src={enrollState.enrollment.qrCode}
          unoptimized
          width={180}
        />
        <p className={adminInlineNoteStyle}>QR を読み取れない場合は次のキーを手入力します。</p>
        <span className={adminCodeStyle}>{enrollState.enrollment.secret}</span>
        <VerifyForm factorId={enrollState.enrollment.factorId} label="登録を完了する" next={next} />
      </div>
    );
  }

  return (
    <form action={enrollAction} className={stepStyle}>
      {enrollState.status === "error" ? (
        <FormMessage tone="error">{enrollState.message}</FormMessage>
      ) : null}
      <p className={adminInlineNoteStyle}>
        運営アカウントは2要素認証（TOTP）が必須です。認証アプリを用意してから登録を始めてください。
      </p>
      <div className={adminActionsStyle}>
        <Button size="sm" type="submit">
          登録を始める
        </Button>
      </div>
    </form>
  );
}
