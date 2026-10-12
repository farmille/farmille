"use server";

import * as v from "valibot";
import { ProfileDetailsInputSchema } from "@/lib/profile-details";
import { saveProfileDetails } from "@/server/queries/profile-details";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AuthFormState, AuthFormValues } from "@/lib/auth/form-state";
import { AVATAR_MAX_BYTES } from "@/lib/avatar-rules";
import { formDataString } from "@/lib/validation";
import { errorMessageJa, type ErrorCode } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { uploadOwnAvatar } from "@/server/queries/profiles";

function fieldErrorsFor(code: ErrorCode, message: string): Record<string, string> | undefined {
  switch (code) {
    case "handle_taken":
      return { handle: message };
    case "invalid_body":
      return undefined;
    default:
      return undefined;
  }
}

function submittedValues(formData: FormData): AuthFormValues {
  const values: AuthFormValues = {};

  for (const name of ["handle", "bio", "links"]) {
    const value = formDataString(formData.get(name));
    if (value !== null) values[name] = value;
  }

  return values;
}

export async function updateProfileAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent("/me/edit")}`);
    }

    return {
      status: "error",
      message: errorMessageJa[session.error],
      values: submittedValues(formData),
    };
  }

  const validation = v.safeParse(ProfileDetailsInputSchema, {
    handle: formData.get("handle"),
    bio: formData.get("bio"),
    affiliations: formData.getAll("affiliations"),
    cropIds: formData.getAll("cropIds"),
    links: (formDataString(formData.get("links")) ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  });

  if (!validation.success) {
    return {
      status: "error",
      message:
        "入力内容を確認してください。ハンドルネームは30文字、自己紹介は2000文字以内、リンクはhttps://またはhttp://で始まるURLを入力してください。",
      values: submittedValues(formData),
    };
  }

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > AVATAR_MAX_BYTES) {
      return {
        status: "error",
        message: errorMessageJa.invalid_body,
        fieldErrors: {
          avatar: "アバター画像は2MB以下のJPEG / PNG / WebPでアップロードしてください。",
        },
        values: submittedValues(formData),
      };
    }

    const uploadResult = await uploadOwnAvatar(session.data.userId, avatar);
    if (!uploadResult.ok) {
      return {
        status: "error",
        message: errorMessageJa[uploadResult.error],
        fieldErrors:
          uploadResult.error === "invalid_body"
            ? {
                avatar: "アバター画像は2MB以下のJPEG / PNG / WebPでアップロードしてください。",
              }
            : undefined,
        values: submittedValues(formData),
      };
    }
  }

  const result = await saveProfileDetails(validation.output);

  if (!result.ok) {
    const message = errorMessageJa[result.error];

    return {
      status: "error",
      message,
      fieldErrors: fieldErrorsFor(result.error, message),
      values: submittedValues(formData),
    };
  }

  revalidatePath("/me");
  revalidatePath("/me/edit");
  revalidatePath(`/users/${session.data.userId}`);
  redirect("/me");
}
