"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { errorMessageJa, type ErrorCode } from "@/server/errors";
import { requireGeneralUser } from "@/server/auth";
import { PROFILE_FIELD_LIMITS } from "@/lib/profile-field-limits";
import {
  updateOwnProfile,
  uploadOwnAvatar,
  validateProfileUpdate,
} from "@/server/queries/profiles";

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

function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const name of [
    "handle",
    "prefectureCode",
    "prefecturePublic",
    "bio",
    "affiliation",
    "websiteUrl",
    "snsUrl",
  ]) {
    const value = formData.get(name);
    if (typeof value === "string") values[name] = value;
  }

  const cropIds = formData
    .getAll("cropIds")
    .filter((value): value is string => typeof value === "string");
  if (cropIds.length > 0) {
    values.cropIds = cropIds.join(",");
  }

  const styles = formData
    .getAll("cultivationStyles")
    .filter((value): value is string => typeof value === "string");
  if (styles.length > 0) {
    values.cultivationStyles = styles.join(",");
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

  const validation = validateProfileUpdate({
    handle: formData.get("handle"),
    prefectureCode: formData.get("prefectureCode"),
    prefecturePublic: formData.get("prefecturePublic"),
    bio: formData.get("bio"),
    cultivationStyles: formData.getAll("cultivationStyles"),
    affiliation: formData.get("affiliation"),
    websiteUrl: formData.get("websiteUrl"),
    snsUrl: formData.get("snsUrl"),
    cropIds: formData.getAll("cropIds"),
  });

  if (!validation.ok) {
    return {
      status: "error",
      message: errorMessageJa.invalid_body,
      fieldErrors: validation.fieldErrors,
      values: submittedValues(formData),
    };
  }

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > PROFILE_FIELD_LIMITS.avatarMaxBytes) {
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

  const result = await updateOwnProfile(session.data.userId, validation.input);

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
