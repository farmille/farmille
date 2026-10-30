"use server";

import { revalidatePath } from "next/cache";

import type { AuthFormState, AuthFormValues } from "@/lib/auth/form-state";
import { formDataString } from "@/lib/validation";
import { saveOwnRegisteredDetails } from "@/server/accounts/general";
import { validateRegisteredDetails } from "@/server/accounts/registered-details";
import { errorMessageJa } from "@/server/errors";

const FIELDS = [
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

  for (const name of FIELDS) {
    const value = formDataString(formData.get(name));

    if (value !== null) values[name] = value;
  }

  return values;
}

export async function saveRegisteredDetailsAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validation = validateRegisteredDetails({
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
  const saved = await saveOwnRegisteredDetails(validation.input);

  if (!saved.ok)
    return {
      status: "error",
      message: errorMessageJa[saved.error],
      values: submittedValues(formData),
    };
  revalidatePath("/account/details");
  // 都道府県は公開プロフィールと投稿者の肩書きに出る。
  revalidatePath("/me");
  revalidatePath(`/users/${saved.data.userId}`);

  return { status: "done", message: "登録情報を保存しました" };
}
