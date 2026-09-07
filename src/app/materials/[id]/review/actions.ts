"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";

import { formDataString } from "@/lib/validation";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import {
  createReview,
  deleteReview,
  type ExistingReviewPhotoInput,
  NewReviewPhotoSchema,
  removeReviewPhotoUploads,
  updateReview,
  validateReviewFormData,
  type ReviewFieldErrors,
} from "@/server/mutations/reviews";
import { findOwnReviewIdByMaterial } from "@/server/queries/reviews";

export type ReviewActionState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: ReviewFieldErrors;
      cleanupPaths?: string[];
    };

function uploadedPhotoPaths(formData: FormData): string[] {
  const value = formDataString(formData.get("newPhotos"));
  if (value === null || value.length === 0) return [];

  try {
    const result = v.safeParse(v.array(NewReviewPhotoSchema), JSON.parse(value));
    return result.success ? result.output.map((photo) => photo.path) : [];
  } catch {
    return [];
  }
}

function existingPhotoInputs(formData: FormData): ExistingReviewPhotoInput[] | null {
  const idsResult = v.safeParse(v.array(v.string()), formData.getAll("existingPhotoId"));
  const removedIdsResult = v.safeParse(v.array(v.string()), formData.getAll("removePhotoId"));
  if (!idsResult.success || !removedIdsResult.success) return null;

  const removedIds = new Set(removedIdsResult.output);
  const photos: ExistingReviewPhotoInput[] = [];

  for (const value of idsResult.output) {
    const caption = formDataString(formData.get(`existingPhotoCaption-${value}`));
    if (caption === null) return null;

    const trimmedCaption = caption.trim();
    photos.push({
      id: value,
      caption: trimmedCaption.length === 0 ? null : trimmedCaption,
      remove: removedIds.has(value),
    });
  }

  return photos;
}

function errorState(
  message: string,
  cleanupPaths: string[],
  fieldErrors?: ReviewFieldErrors,
): ReviewActionState {
  const state: Extract<ReviewActionState, { status: "error" }> = {
    status: "error",
    message,
  };
  if (fieldErrors !== undefined) state.fieldErrors = fieldErrors;
  if (cleanupPaths.length > 0) state.cleanupPaths = cleanupPaths;
  return state;
}

export async function createReviewAction(
  materialId: string,
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const cleanupPaths = uploadedPhotoPaths(formData);
  const validation = validateReviewFormData(formData);

  if (!validation.ok) {
    return errorState(errorMessageJa.invalid_body, cleanupPaths, validation.fieldErrors);
  }

  const result = await createReview({ materialId, ...validation.input });

  if (!result.ok) {
    if (result.error === "conflict") {
      const session = await requireGeneralUser();

      if (session.ok) {
        const existing = await findOwnReviewIdByMaterial(materialId, session.data.userId);

        if (existing.ok && existing.data !== null) {
          await removeReviewPhotoUploads(cleanupPaths);
          redirect(`/materials/${materialId}/review/${existing.data}/edit?existing=1`);
        }
      }
    }

    return errorState(errorMessageJa[result.error], cleanupPaths);
  }

  const materialPath = `/materials/${materialId}`;
  revalidatePath(materialPath);
  revalidatePath(`${materialPath}/reviews`);
  redirect(`${materialPath}?review=posted#reviews-heading`);
}

export async function updateReviewAction(
  materialId: string,
  reviewId: string,
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const cleanupPaths = uploadedPhotoPaths(formData);
  const validation = validateReviewFormData(formData);
  const currentPhotos = existingPhotoInputs(formData);

  if (!validation.ok || currentPhotos === null) {
    return errorState(
      errorMessageJa.invalid_body,
      cleanupPaths,
      validation.ok
        ? { photos: "既存の写真情報が正しくありません。画面を再読み込みしてください。" }
        : validation.fieldErrors,
    );
  }

  const result = await updateReview(reviewId, { materialId, ...validation.input }, currentPhotos);

  if (!result.ok) {
    return errorState(errorMessageJa[result.error], cleanupPaths);
  }

  const materialPath = `/materials/${materialId}`;
  revalidatePath(materialPath);
  revalidatePath(`${materialPath}/reviews`);
  redirect(`${materialPath}?review=updated#review-${reviewId}`);
}

export async function deleteReviewAction(
  materialId: string,
  reviewId: string,
  _formData: FormData,
): Promise<void> {
  const result = await deleteReview(materialId, reviewId);
  const materialPath = `/materials/${materialId}`;

  if (!result.ok) {
    if (result.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(materialPath)}`);
    }

    throw new Error(errorMessageJa[result.error]);
  }

  revalidatePath(materialPath);
  revalidatePath(`${materialPath}/reviews`);
  redirect(`${materialPath}?review=deleted#reviews-heading`);
}
