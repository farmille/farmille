"use server";

import type { AuthFormState } from "@/lib/auth/form-state";
import { requestPasswordReset } from "@/server/accounts/session";
import { errorMessageJa } from "@/server/errors";

export async function requestPasswordResetAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get("email");
  const result = await requestPasswordReset(typeof email === "string" ? email.trim() : "");

  if (!result.ok) {
    return { status: "error", message: errorMessageJa[result.error] };
  }

  return {
    status: "done",
    message:
      "再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。",
  };
}
