"use server";

import * as v from "valibot";
import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { changePassword, PasswordChangeSchema } from "@/server/accounts/password";
import { errorMessageJa } from "@/server/errors";
import { getSessionUser } from "@/server/auth";

export async function changePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const input = v.safeParse(PasswordChangeSchema, {
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!input.success)
    return {
      status: "error",
      message:
        "現在のパスワードと、8〜128文字の新しいパスワードを入力してください。新しいパスワードは確認欄と一致し、現在のものと異なる必要があります。",
    };
  const user = await getSessionUser();
  const result = await changePassword(input.output);

  if (!result.ok)
    return {
      status: "error",
      message:
        result.error === "invalid_credentials"
          ? "現在のパスワードが正しくありません。"
          : errorMessageJa[result.error],
    };
  redirect(`${user?.accountType === "seller" ? "/sellers/login" : "/login"}?password=changed`);
}
