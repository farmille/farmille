"use client";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { useActionState } from "react";

import { initialMfaEnrollState } from "@/app/admin/_lib/action-state";
import { startTotpEnrollmentAction, verifyTotpCodeAction } from "@/app/admin/mfa/actions";
import { adminCodeStyle, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { Form, FormActions, Notice, OtpInput, SubmitButton } from "@/components/form";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { css } from "../../../../styled-system/css";

const stepStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const qrStyle = css({
  w: "180px",
  aspectRatio: "image.square",
  display: "block",
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
    <Form action={formAction} className={stepStyle} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      <input name="factorId" type="hidden" value={factorId} />
      <input name="next" type="hidden" value={next} />
      <OtpInput
        description="認証アプリに表示されている6桁の数字を入力します。"
        label="認証コード"
        name="code"
        requirement="required"
      />
      <FormActions layout="row">
        <SubmitButton pendingLabel="確認中…">{label}</SubmitButton>
      </FormActions>
    </Form>
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
    <Form action={enrollAction} className={stepStyle} persist={false}>
      {enrollState.status === "error" ? <Notice tone="error">{enrollState.message}</Notice> : null}
      <p className={adminInlineNoteStyle}>
        運営アカウントは2要素認証（TOTP）が必須です。認証アプリを用意してから登録を始めてください。
      </p>
      <FormActions layout="row">
        <SubmitButton pendingLabel="準備中…" size="sm">
          登録を始める
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
