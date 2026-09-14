"use server";

import { redirect } from "next/navigation";

import type { AuthFormState, AuthFormValues } from "@/lib/auth/form-state";
import { formDataString } from "@/lib/validation";
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
function submittedValues(formData: FormData): AuthFormValues {
  const values: AuthFormValues = {};

  for (const name of [
    "handle",
    "email",
    "standpoint",
    "familyName",
    "givenName",
    "phone",
    "postalCode",
    "prefectureCode",
    "city",
    "terms",
  ]) {
    const value = formDataString(formData.get(name));
    if (value !== null) values[name] = value;
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
    standpoint: formData.get("standpoint"),
    familyName: formData.get("familyName"),
    givenName: formData.get("givenName"),
    phone: formData.get("phone"),
    postalCode: formData.get("postalCode"),
    prefectureCode: formData.get("prefectureCode"),
    city: formData.get("city"),
    terms: formData.get("terms"),
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
