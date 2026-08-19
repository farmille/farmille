"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { registerGeneralUser, validateGeneralSignup } from "@/server/accounts/general";
import { errorMessageJa, type ErrorCode } from "@/server/errors";

function fieldErrorsFor(code: ErrorCode, message: string): Record<string, string> | undefined {
  switch (code) {
    case "handle_taken":
      return { handle: message };
    case "email_unavailable":
      return { email: message };
    case "weak_password":
      return { password: message };
    default:
      return undefined;
  }
}

/** 再入力の手間を減らすため、パスワード以外の入力値を返す。 */
function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const name of ["handle", "email", "prefectureCode", "prefecturePublic", "standpoint"]) {
    const value = formData.get(name);
    if (typeof value === "string") values[name] = value;
  }

  return values;
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validation = validateGeneralSignup({
    handle: formData.get("handle"),
    email: formData.get("email"),
    password: formData.get("password"),
    prefectureCode: formData.get("prefectureCode"),
    prefecturePublic: formData.get("prefecturePublic"),
    standpoint: formData.get("standpoint"),
  });

  if (!validation.ok) {
    return {
      status: "error",
      message: errorMessageJa.invalid_body,
      fieldErrors: validation.fieldErrors,
      values: submittedValues(formData),
    };
  }

  const result = await registerGeneralUser(validation.input);

  if (!result.ok) {
    const message = errorMessageJa[result.error];

    return {
      status: "error",
      message,
      fieldErrors: fieldErrorsFor(result.error, message),
      values: submittedValues(formData),
    };
  }

  redirect(result.data.signedIn ? "/signup/done" : "/signup/done?confirm=1");
}
