"use server";

import { redirect } from "next/navigation";

import type { AuthFormState, AuthFormValues } from "@/lib/auth/form-state";
import { formDataString } from "@/lib/validation";
import { applySellerAccount, validateSellerApply } from "@/server/accounts/seller";
import { errorMessageJa, type ErrorCode } from "@/server/errors";

function fieldErrorsFor(code: ErrorCode, message: string): Record<string, string> | undefined {
  switch (code) {
    case "login_id_taken":
      return { loginId: message };
    case "invalid_invite_code":
      return { inviteCode: message };
    default:
      return undefined;
  }
}

/** 再入力用。パスワード欄は無いので全項目を返す。 */
function submittedValues(formData: FormData): AuthFormValues {
  const values: AuthFormValues = {};
  const names = [
    "officialName",
    "corporateNumber",
    "contactEmail",
    "contactName",
    "location",
    "contactPhone",
    "materialRequestNotes",
    "websiteUrl",
    "inviteCode",
  ] as const;

  for (const name of names) {
    const value = formDataString(formData.get(name));
    if (value !== null) values[name] = value;
  }

  return values;
}

export async function sellerApplyAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validation = validateSellerApply({
    officialName: formData.get("officialName"),
    corporateNumber: formData.get("corporateNumber"),
    contactEmail: formData.get("contactEmail"),
    contactName: formData.get("contactName"),
    location: formData.get("location"),
    contactPhone: formData.get("contactPhone"),
    materialRequestNotes: formData.get("materialRequestNotes"),
    websiteUrl: formData.get("websiteUrl"),
    inviteCode: formData.get("inviteCode") ?? "",
  });

  if (!validation.ok) {
    return {
      status: "error",
      message: errorMessageJa.invalid_body,
      fieldErrors: validation.fieldErrors,
      values: submittedValues(formData),
    };
  }

  const result = await applySellerAccount(validation.input);

  if (!result.ok) {
    const message = errorMessageJa[result.error];

    return {
      status: "error",
      message,
      fieldErrors: fieldErrorsFor(result.error, message),
      values: submittedValues(formData),
    };
  }

  redirect("/sellers/apply/done");
}
