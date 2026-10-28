"use server";

import * as v from "valibot";
import { redirect } from "next/navigation";

import type { AuthFormState, AuthFormValues } from "@/lib/auth/form-state";
import { formDataString } from "@/lib/validation";
import { emailAddressSchema } from "@/lib/auth/registration-schema";
import { safeNextPath } from "@/lib/auth/safe-next";
import {
  getRegistrationIdentity,
  requestRegistrationEmail,
  registerGeneralUser,
  validateGeneralSignup,
} from "@/server/accounts/general";
import { isRegistrationHandleTaken } from "@/server/accounts/handle-availability";
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
    "cityStreet",
    "buildingName",
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
  const next = safeNextPath(formData.get("next"));
  const identity = await getRegistrationIdentity();
  if (!identity.ok) {
    if (identity.error === "internal")
      return { status: "error", message: errorMessageJa[identity.error] };
    const destination = `/signup/general?error=${identity.error}`;
    redirect(next ? `${destination}&next=${encodeURIComponent(next)}` : destination);
  }
  const validation = validateGeneralSignup({
    handle: formData.get("handle"),
    email: identity.data.email,
    password: formData.get("password"),
    standpoint: formData.get("standpoint"),
    familyName: formData.get("familyName"),
    givenName: formData.get("givenName"),
    phone: formData.get("phone"),
    postalCode: formData.get("postalCode"),
    prefectureCode: formData.get("prefectureCode"),
    cityStreet: formData.get("cityStreet"),
    buildingName: formData.get("buildingName"),
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

  redirect(next ? `/signup/done?next=${encodeURIComponent(next)}` : "/signup/done");
}

/** 欄を離れたときの確認。ニックネームが使われていれば、送信時と同じ文言を返す。 */
export async function registrationHandleCheckAction(handle: string): Promise<string | null> {
  const taken = await isRegistrationHandleTaken(handle);
  return taken.ok && taken.data ? errorMessageJa.handle_taken : null;
}

export async function registrationEmailAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = v.safeParse(emailAddressSchema, formData.get("email"));
  if (!parsed.success)
    return {
      status: "error",
      message: errorMessageJa.invalid_body,
      fieldErrors: { email: parsed.issues[0].message },
    };
  const result = await requestRegistrationEmail(parsed.output, safeNextPath(formData.get("next")));
  if (!result.ok) return { status: "error", message: errorMessageJa[result.error] };
  return {
    status: "done",
    message: `${parsed.output}に認証メールを送信しました。メール内のリンクから登録情報を入力してください。`,
  };
}
