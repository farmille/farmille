"use server";

import * as v from "valibot";
import type { AuthFormState } from "@/lib/auth/form-state";
import {
  requestSellerPasswordReset,
  SellerRecoverySchema,
} from "@/server/accounts/seller-password";
import { errorMessageJa } from "@/server/errors";

export async function sellerPasswordResetAction(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = v.safeParse(SellerRecoverySchema, {
    loginId: form.get("loginId"),
    email: form.get("email"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: "Farmille企業会員IDと連絡先メールアドレスを確認してください。",
    };
  const result = await requestSellerPasswordReset(parsed.output);
  if (!result.ok) return { status: "error", message: errorMessageJa[result.error] };
  return {
    status: "done",
    message: "登録情報が一致する場合、連絡先メールアドレスに再設定用のメールが届きます。",
  };
}
