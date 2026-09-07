"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/auth/safe-next";
import { formDataString } from "@/lib/validation";
import { signInSellerWithLoginId } from "@/server/accounts/seller";
import { errorMessageJa } from "@/server/errors";

export async function sellerLoginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const submittedLoginId = formDataString(formData.get("loginId")) ?? "";
  const result = await signInSellerWithLoginId(
    submittedLoginId,
    formDataString(formData.get("password")) ?? "",
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
