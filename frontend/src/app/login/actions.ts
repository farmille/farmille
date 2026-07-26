"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/auth/safe-next";
import { signInWithEmail } from "@/server/accounts/session";
import { errorMessageJa } from "@/server/errors";

function toTrimmedString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = toTrimmedString(formData.get("email"));
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";

  const result = await signInWithEmail(email, password);

  if (!result.ok) {
    return { status: "error", message: errorMessageJa[result.error], values: { email } };
  }

  // 細工された ?next= は捨ててホームへ落とす（CWE-601）。
  redirect(safeNextPath(formData.get("next")) ?? "/");
}
