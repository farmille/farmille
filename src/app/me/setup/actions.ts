"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import type { AuthFormState } from "@/lib/auth/form-state";
import { formDataString } from "@/lib/validation";
import { createPersonalProfile, PersonalProfileSchema } from "@/server/accounts/personal-profile";
import { errorMessageJa } from "@/server/errors";

export async function setupProfileAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    handle: formDataString(formData.get("handle")) ?? "",
    standpoint: formDataString(formData.get("standpoint")) ?? "",
  };
  const parsed = v.safeParse(PersonalProfileSchema, {
    handle: formData.get("handle"),
    standpoint: formData.get("standpoint"),
  });
  if (!parsed.success) {
    const fields = v.flatten(parsed.issues).nested;
    const fieldErrors: Record<string, string> = {};
    if (fields?.handle?.[0]) fieldErrors.handle = fields.handle[0];
    if (fields?.standpoint?.[0]) fieldErrors.standpoint = fields.standpoint[0];
    return { status: "error", message: errorMessageJa.invalid_body, fieldErrors, values };
  }
  const result = await createPersonalProfile(parsed.output);
  if (!result.ok) {
    if (result.error === "unauthorized") redirect("/login?next=%2Fme%2Fsetup");
    return {
      status: "error",
      message: errorMessageJa[result.error],
      values,
      fieldErrors:
        result.error === "handle_taken" ? { handle: errorMessageJa.handle_taken } : undefined,
    };
  }
  revalidatePath("/me");
  redirect("/me");
}
