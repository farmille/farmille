"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/auth/safe-next";
import { formDataString, trimmedFormDataString } from "@/lib/validation";
import { signInWithEmail } from "@/server/accounts/session";
import { errorMessageJa } from "@/server/errors";

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = trimmedFormDataString(formData.get("email"));
  const password = formDataString(formData.get("password")) ?? "";

  const result = await signInWithEmail(email, password);

  if (!result.ok) {
    return { status: "error", message: errorMessageJa[result.error], values: { email } };
  }

  // 細工された ?next= は捨ててホームへ落とす（CWE-601）。
  redirect(safeNextPath(formData.get("next")) ?? "/");
}
