"use server";

import { redirect } from "next/navigation";
import * as v from "valibot";

import { PASSWORD_MAX_LENGTH } from "@/lib/auth/account-rules";
import type { AuthFormState } from "@/lib/auth/form-state";
import { withdrawOwnAccount } from "@/server/accounts/general";
import { errorMessageJa } from "@/server/errors";

const PASSWORD_REQUIRED = "今のパスワードを入力してください。";
const PASSWORD_WRONG = "パスワードが正しくありません。退会していません。";
const UNFINISHED =
  "退会の手続きを最後まで進められませんでした。時間をおいて、もう一度パスワードを入力して「退会する」を押してください。";

const CurrentPasswordSchema = v.pipe(
  v.string(PASSWORD_REQUIRED),
  v.minLength(1, PASSWORD_REQUIRED),
  v.maxLength(PASSWORD_MAX_LENGTH, PASSWORD_WRONG),
);

export async function withdrawAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = v.safeParse(CurrentPasswordSchema, formData.get("password"));
  if (!password.success) {
    const message = password.issues[0].message;
    return { status: "error", message, fieldErrors: { password: message } };
  }
  const result = await withdrawOwnAccount(password.output);
  if (!result.ok) {
    if (result.error === "invalid_credentials")
      return {
        status: "error",
        message: PASSWORD_WRONG,
        fieldErrors: { password: PASSWORD_WRONG },
      };
    if (result.error === "unauthorized") redirect("/login?next=%2Faccount%2Fwithdraw");
    if (result.error === "rate_limited")
      return { status: "error", message: errorMessageJa.rate_limited };
    return { status: "error", message: UNFINISHED };
  }
  redirect("/account/withdrawn");
}
