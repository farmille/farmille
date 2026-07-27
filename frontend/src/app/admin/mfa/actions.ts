"use server";

import { redirect } from "next/navigation";

import type { MfaEnrollState } from "@/app/admin/_lib/action-state";
import type { AuthFormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/auth/safe-next";
import { startAdminTotpEnrollment, verifyAdminTotpCode } from "@/server/admin/mfa";
import { errorMessageJa, type ErrorCode } from "@/server/errors";

/**
 * MFA 画面の文言。共通辞書のコードのままでは原因が伝わらない2件だけ、
 * この画面の言い回しに寄せる（辞書そのものは共有のまま触らない）。
 */
function mfaErrorMessage(code: ErrorCode): string {
  if (code === "invalid_body") {
    return "認証コードが正しくありません。認証アプリに表示された6桁を入れ直してください。";
  }
  if (code === "forbidden") {
    return "Supabase 側で TOTP が有効になっていません。プロジェクトの MFA 設定を確認してください。";
  }

  return errorMessageJa[code];
}

export async function startTotpEnrollmentAction(
  _previousState: MfaEnrollState,
  _formData: FormData,
): Promise<MfaEnrollState> {
  const result = await startAdminTotpEnrollment();

  if (!result.ok) {
    return { status: "error", message: mfaErrorMessage(result.error) };
  }

  return { status: "ready", enrollment: result.data };
}

export async function verifyTotpCodeAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const factorId = formData.get("factorId");
  const code = formData.get("code");

  if (typeof factorId !== "string" || factorId.length === 0) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const result = await verifyAdminTotpCode(factorId, typeof code === "string" ? code : "");

  if (!result.ok) {
    return { status: "error", message: mfaErrorMessage(result.error) };
  }

  redirect(safeNextPath(formData.get("next")) ?? "/admin");
}
