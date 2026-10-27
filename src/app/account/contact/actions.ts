"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AuthFormState, AuthFormValues } from "@/lib/auth/form-state";
import { formDataString } from "@/lib/validation";
import {
  saveOwnRegisteredContact,
  validateRegisteredContact,
} from "@/server/accounts/registered-address";
import { errorMessageJa } from "@/server/errors";

const CONTACT_FIELDS = [
  "familyName",
  "givenName",
  "phone",
  "postalCode",
  "prefectureCode",
  "cityStreet",
  "buildingName",
] as const;

function submittedValues(formData: FormData): AuthFormValues {
  const values: AuthFormValues = {};
  for (const name of CONTACT_FIELDS) {
    const value = formDataString(formData.get(name));
    if (value !== null) values[name] = value;
  }
  return values;
}

export async function saveRegisteredContactAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validation = validateRegisteredContact({
    familyName: formData.get("familyName"),
    givenName: formData.get("givenName"),
    phone: formData.get("phone"),
    postalCode: formData.get("postalCode"),
    prefectureCode: formData.get("prefectureCode"),
    cityStreet: formData.get("cityStreet"),
    buildingName: formData.get("buildingName"),
  });
  if (!validation.ok)
    return {
      status: "error",
      message: errorMessageJa.invalid_body,
      fieldErrors: validation.fieldErrors,
      values: submittedValues(formData),
    };

  const result = await saveOwnRegisteredContact(validation.input);
  if (!result.ok) {
    if (result.error === "unauthorized") redirect("/login?next=%2Faccount%2Fcontact");
    return {
      status: "error",
      message: errorMessageJa[result.error],
      values: submittedValues(formData),
    };
  }

  revalidatePath("/account");
  revalidatePath("/account/contact");
  revalidatePath("/me");
  return { status: "done", message: "登録情報を保存しました。" };
}
