"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/auth/safe-next";
import { signInSellerWithLoginId } from "@/server/accounts/seller";
import { errorMessageJa } from "@/server/errors";

export async function sellerLoginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const loginId = formData.get("loginId");
  const password = formData.get("password");

  const submittedLoginId = typeof loginId === "string" ? loginId : "";
  const result = await signInSellerWithLoginId(
    submittedLoginId,
    typeof password === "string" ? password : "",
  );

  if (!result.ok) {
    return {
      status: "error",
      message: errorMessageJa[result.error],
      values: { loginId: submittedLoginId },
    };
  }

  redirect(safeNextPath(formData.get("next")) ?? "/dashboard");
}
