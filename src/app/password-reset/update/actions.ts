"use server";

import { PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import type { AuthFormState } from "@/lib/auth/form-state";
import { formDataString } from "@/lib/validation";
import { updatePassword } from "@/server/accounts/session";
import { errorMessageJa } from "@/server/errors";

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = formDataString(formData.get("password"));
  const confirmation = formDataString(formData.get("passwordConfirmation"));

  if (password === null || confirmation === null) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      status: "error",
      message: errorMessageJa.weak_password,
      fieldErrors: { password: errorMessageJa.weak_password },
    };
  }

  if (password !== confirmation) {
    return {
      status: "error",
      message: "確認用のパスワードが一致しません。",
      fieldErrors: { passwordConfirmation: "確認用のパスワードが一致しません。" },
    };
  }

  const result = await updatePassword(
    password,
    formDataString(formData.get("tokenHash")) ?? "",
    formDataString(formData.get("code")) ?? "",
  );

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.error === "aal2_required"
          ? "認証アプリに表示された最新の6桁のコードを入力して、もう一度送信してください。"
          : errorMessageJa[result.error],
    };
  }

  return { status: "done", message: "パスワードを変更しました。" };
}
