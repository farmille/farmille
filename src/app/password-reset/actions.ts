"use server";

import type { AuthFormState } from "@/lib/auth/form-state";
import { trimmedFormDataString } from "@/lib/validation";
import { requestPasswordReset } from "@/server/accounts/session";
import { errorMessageJa } from "@/server/errors";

export async function requestPasswordResetAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await requestPasswordReset(trimmedFormDataString(formData.get("email")));

  if (!result.ok) {
    return { status: "error", message: errorMessageJa[result.error] };
  }

  return {
    status: "done",
    message:
      "登録情報が一致する場合、再設定用のメールが届きます。メール内のリンクから新しいパスワードを設定してください。",
  };
}
