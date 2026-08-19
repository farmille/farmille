import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import { formDataString, trimmedFormDataString } from "@/lib/validation";
import { requireGeneralUser } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewPhotoRow = Database["public"]["Tables"]["review_photos"]["Row"];
type ReviewPhotoInsert = Database["public"]["Tables"]["review_photos"]["Insert"];

export const PURCHASE_CHANNELS = ["ja", "home_center", "ec", "direct", "other"] as const;
export type PurchaseChannel = (typeof PURCHASE_CHANNELS)[number];

const PurchaseChannelSchema = v.picklist(PURCHASE_CHANNELS);

export function purchaseChannelFromDatabase(value: string | null): PurchaseChannel | null {
  const result = v.safeParse(PurchaseChannelSchema, value);
  return result.success ? result.output : null;
}

export type ExistingReviewPhotoInput = {
  id: string;
  caption: string | null;
  remove: boolean;
};

export type ReviewMutationInput = {
  materialId: string;
  cropId: string;
  rating: number;
  body: string;
  purchaseChannel: PurchaseChannel | null;
  hasControlPlot: boolean;
  pesticideAck: true;
  newPhotos: NewReviewPhoto[];
};

export type ReviewFieldErrors = Partial<
  Record<"cropId" | "rating" | "body" | "purchaseChannel" | "pesticideAck" | "photos", string>
>;

export type ReviewValidation =
  | { ok: true; input: Omit<ReviewMutationInput, "materialId"> }
  | { ok: false; fieldErrors: ReviewFieldErrors };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REVIEW_PHOTO_PATH_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f-]+\.(?:jpg|png|webp)$/i;
const REVIEW_PHOTO_PUBLIC_MARKER = "/storage/v1/object/public/review-photos/";

export const NewReviewPhotoSchema = v.strictObject({
  path: v.pipe(v.string(), v.regex(REVIEW_PHOTO_PATH_PATTERN)),
  caption: v.pipe(
    v.nullable(v.string()),
    v.transform((caption) => {
      if (caption === null) return null;
      const trimmed = caption.trim();
      return trimmed.length === 0 ? null : trimmed;
    }),
  ),
});
export type NewReviewPhoto = v.InferOutput<typeof NewReviewPhotoSchema>;

function reportMutationError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/mutations/reviews] ${operation}`, error);
}

function parseNewPhotos(value: FormDataEntryValue | null): NewReviewPhoto[] | null {
  const serialized = formDataString(value);
  if (serialized === null || serialized.length === 0) return [];

  try {
    const result = v.safeParse(v.array(NewReviewPhotoSchema), JSON.parse(serialized));
    return result.success ? result.output : null;
  } catch {
    return null;
  }
}

/** FormData を DB 型に変換する。必須同意は false を許容しない。 */
export function validateReviewFormData(formData: FormData): ReviewValidation {
  const fieldErrors: ReviewFieldErrors = {};
  const cropId = trimmedFormDataString(formData.get("cropId"));
  const ratingValue = trimmedFormDataString(formData.get("rating"));
  const rating = Number(ratingValue);
  const body = trimmedFormDataString(formData.get("body"));
  const purchaseChannelValue = trimmedFormDataString(formData.get("purchaseChannel"));
  const purchaseChannelResult = v.safeParse(PurchaseChannelSchema, purchaseChannelValue);
  const pesticideAck = formData.get("pesticideAck") === "on";
  const newPhotos = parseNewPhotos(formData.get("newPhotos"));

  if (!UUID_PATTERN.test(cropId)) {
    fieldErrors.cropId = "作目を選択してください。";
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fieldErrors.rating = "星を1〜5から選択してください。";
  }
  if (body.length === 0) {
    fieldErrors.body = "レビュー本文を入力してください。";
  }
  if (purchaseChannelValue.length > 0 && !purchaseChannelResult.success) {
    fieldErrors.purchaseChannel = "購入場所を選び直してください。";
  }
  if (!pesticideAck) {
    fieldErrors.pesticideAck = "内容を確認し、同意してください。";
  }
  if (newPhotos === null) {
    fieldErrors.photos = "写真情報が正しくありません。もう一度選択してください。";
  }

  if (Object.keys(fieldErrors).length > 0 || newPhotos === null) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      cropId,
      rating,
      body,
      purchaseChannel: purchaseChannelResult.success ? purchaseChannelResult.output : null,
      hasControlPlot: formData.get("hasControlPlot") === "on",
      pesticideAck: true,
      newPhotos,
    },
  };
}

function publicPhotoUrl(
  supabase: SupabaseClient<Database>,
  userId: string,
  photo: NewReviewPhoto,
): string | null {
  if (!photo.path.startsWith(`${userId}/`)) return null;

  return supabase.storage.from("review-photos").getPublicUrl(photo.path).data.publicUrl;
}

async function validateReferences(
  supabase: SupabaseClient<Database>,
  materialId: string,
  cropId: string,
): Promise<Result<null>> {
  const [materialResult, cropResult] = await Promise.all([
    supabase.from("materials").select("id").eq("id", materialId).maybeSingle(),
    supabase.from("crops").select("id").eq("id", cropId).maybeSingle(),
  ]);

  if (materialResult.error !== null || cropResult.error !== null) {
    reportMutationError("資材・作目の参照確認に失敗", {
      materialError: materialResult.error,
      cropError: cropResult.error,
    });
    return fail("internal");
  }

  if (materialResult.data === null) return fail("not_found");
  if (cropResult.data === null) return fail("invalid_body");

  return succeed(null);
}

function buildPhotoRows(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  userId: string,
  photos: NewReviewPhoto[],
  sortOffset = 0,
): Result<ReviewPhotoInsert[]> {
  const rows: ReviewPhotoInsert[] = [];

  for (const [index, photo] of photos.entries()) {
    const url = publicPhotoUrl(supabase, userId, photo);
    if (url === null) return fail("invalid_body");

    rows.push({
      id: crypto.randomUUID(),
      review_id: reviewId,
      url,
      caption: photo.caption,
      sort_order: sortOffset + index,
    });
  }

  return succeed(rows);
}

/** 投稿競合時などに、確定前に直接アップロードした写真だけを削除する。 */
export async function removeReviewPhotoUploads(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const session = await requireGeneralUser();
  if (!session.ok) {
    reportMutationError("未確定のレビュー写真を削除できません", session.error);
    return;
  }

  if (
    paths.some(
      (path) =>
        !REVIEW_PHOTO_PATH_PATTERN.test(path) || !path.startsWith(`${session.data.userId}/`),
    )
  ) {
    reportMutationError("未確定のレビュー写真パスが不正です", paths);
    return;
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.storage.from("review-photos").remove(paths);

  if (error !== null) {
    reportMutationError("未確定のレビュー写真を削除できません", error);
  }
}

export async function createReview(
  input: ReviewMutationInput,
): Promise<Result<{ reviewId: string }>> {
  return createReviewWithDependencies(input, requireGeneralUser, createServerSupabase);
}

export async function createReviewWithDependencies(
  input: ReviewMutationInput,
  authenticate: typeof requireGeneralUser,
  createSupabase: typeof createServerSupabase,
): Promise<Result<{ reviewId: string }>> {
  const session = await authenticate();
  if (!session.ok) return session;
  if (!UUID_PATTERN.test(input.materialId)) return fail("not_found");

  const supabase = await createSupabase();
  const references = await validateReferences(supabase, input.materialId, input.cropId);
  if (!references.ok) return references;

  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("material_id", input.materialId)
    .eq("author_user_id", session.data.userId)
    .limit(1)
    .maybeSingle();

  if (existingError !== null) {
    reportMutationError("重複レビューの確認に失敗", existingError);
    return fail("internal");
  }
  if (existing !== null) return fail("conflict");

  const reviewInsert: ReviewInsert = {
    material_id: input.materialId,
    author_user_id: session.data.userId,
    crop_id: input.cropId,
    rating: input.rating,
    body: input.body,
    purchase_channel: input.purchaseChannel,
    has_control_plot: input.hasControlPlot,
    pesticide_ack: input.pesticideAck,
    is_provided_sample: false,
    status: "published",
  };
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .insert(reviewInsert)
    .select("id")
    .single();

  if (reviewError !== null) {
    reportMutationError("レビューの作成に失敗", reviewError);
    return fail("internal");
  }

  const photoRows = buildPhotoRows(supabase, review.id, session.data.userId, input.newPhotos);

  if (!photoRows.ok) {
    await supabase.from("reviews").delete().eq("id", review.id);
    return photoRows;
  }

  if (photoRows.data.length > 0) {
    const { error: photoError } = await supabase.from("review_photos").insert(photoRows.data);

    if (photoError !== null) {
      reportMutationError("レビュー写真行の作成に失敗", photoError);
      const { error: rollbackError } = await supabase.from("reviews").delete().eq("id", review.id);
      if (rollbackError !== null) {
        reportMutationError("レビュー作成のロールバックに失敗", rollbackError);
      }
      return fail("internal");
    }
  }

  return succeed({ reviewId: review.id });
}

function storagePathFromPublicUrl(url: string, userId: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const markerIndex = pathname.indexOf(REVIEW_PHOTO_PUBLIC_MARKER);
    if (markerIndex < 0) return null;

    const path = decodeURIComponent(
      pathname.slice(markerIndex + REVIEW_PHOTO_PUBLIC_MARKER.length),
    );
    return path.startsWith(`${userId}/`) ? path : null;
  } catch {
    return null;
  }
}

async function removeStoragePhotos(
  supabase: SupabaseClient<Database>,
  userId: string,
  photos: Pick<ReviewPhotoRow, "url">[],
): Promise<void> {
  const paths = photos.flatMap(({ url }) => {
    const path = storagePathFromPublicUrl(url, userId);
    return path === null ? [] : [path];
  });

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from("review-photos").remove(paths);
  if (error !== null) {
    // DB 上の削除は完了済み。ユーザー操作を失敗扱いに戻さず、運用ログへ残す。
    reportMutationError("削除済みレビュー写真の Storage 清掃に失敗", error);
  }
}

export async function updateReview(
  reviewId: string,
  input: ReviewMutationInput,
  existingPhotoInputs: ExistingReviewPhotoInput[],
): Promise<Result<{ reviewId: string }>> {
  const session = await requireGeneralUser();
  if (!session.ok) return session;
  if (!UUID_PATTERN.test(input.materialId) || !UUID_PATTERN.test(reviewId)) {
    return fail("not_found");
  }

  const supabase = await createServerSupabase();
  const references = await validateReferences(supabase, input.materialId, input.cropId);
  if (!references.ok) return references;

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select(
      `
        id,
        material_id,
        author_user_id,
        status,
        photos:review_photos (
          id,
          review_id,
          url,
          caption,
          sort_order,
          created_at,
          updated_at
        )
      `,
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError !== null) {
    reportMutationError("編集対象レビューの確認に失敗", reviewError);
    return fail("internal");
  }
  if (review === null) return fail("not_found");
  if (review.author_user_id !== session.data.userId || review.material_id !== input.materialId) {
    return fail("forbidden");
  }
  if (review.status !== "published") return fail("forbidden");

  const currentPhotos: ReviewPhotoRow[] = review.photos;
  const currentPhotoIds = new Set(currentPhotos.map(({ id }) => id));
  const submittedPhotoIds = new Set(existingPhotoInputs.map(({ id }) => id));

  if (
    submittedPhotoIds.size !== existingPhotoInputs.length ||
    existingPhotoInputs.some(({ id }) => !currentPhotoIds.has(id))
  ) {
    return fail("invalid_body");
  }

  const inputByPhotoId = new Map(existingPhotoInputs.map((photo) => [photo.id, photo]));
  const removedPhotos = currentPhotos.filter(
    (photo) => inputByPhotoId.get(photo.id)?.remove === true,
  );
  const removedPhotoIds = new Set(removedPhotos.map(({ id }) => id));
  const keptPhotos = currentPhotos.filter((photo) => !removedPhotoIds.has(photo.id));
  const newPhotoRows = buildPhotoRows(
    supabase,
    reviewId,
    session.data.userId,
    input.newPhotos,
    keptPhotos.length,
  );
  if (!newPhotoRows.ok) return newPhotoRows;

  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      crop_id: input.cropId,
      rating: input.rating,
      body: input.body,
      purchase_channel: input.purchaseChannel,
      has_control_plot: input.hasControlPlot,
      pesticide_ack: input.pesticideAck,
    })
    .eq("id", reviewId)
    .eq("author_user_id", session.data.userId);

  if (updateError !== null) {
    reportMutationError("レビューの更新に失敗", updateError);
    return fail("internal");
  }

  const upsertRows: ReviewPhotoInsert[] = [
    ...keptPhotos.map((photo, index) => ({
      id: photo.id,
      review_id: reviewId,
      url: photo.url,
      caption: inputByPhotoId.has(photo.id)
        ? (inputByPhotoId.get(photo.id)?.caption ?? null)
        : photo.caption,
      sort_order: index,
    })),
    ...newPhotoRows.data,
  ];

  if (upsertRows.length > 0) {
    const { error: upsertError } = await supabase
      .from("review_photos")
      .upsert(upsertRows, { onConflict: "id" });

    if (upsertError !== null) {
      reportMutationError("レビュー写真行の更新に失敗", upsertError);
      return fail("internal");
    }
  }

  if (removedPhotos.length > 0) {
    const { error: deleteError } = await supabase
      .from("review_photos")
      .delete()
      .in(
        "id",
        removedPhotos.map(({ id }) => id),
      )
      .eq("review_id", reviewId);

    if (deleteError !== null) {
      reportMutationError("レビュー写真行の削除に失敗", deleteError);
      return fail("internal");
    }

    await removeStoragePhotos(supabase, session.data.userId, removedPhotos);
  }

  return succeed({ reviewId });
}

export async function deleteReview(materialId: string, reviewId: string): Promise<Result<null>> {
  const session = await requireGeneralUser();
  if (!session.ok) return session;
  if (!UUID_PATTERN.test(materialId) || !UUID_PATTERN.test(reviewId)) return fail("not_found");

  const supabase = await createServerSupabase();
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select(
      `
        id,
        material_id,
        author_user_id,
        photos:review_photos (
          url
        )
      `,
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError !== null) {
    reportMutationError("削除対象レビューの確認に失敗", reviewError);
    return fail("internal");
  }
  if (review === null) return fail("not_found");
  if (review.author_user_id !== session.data.userId || review.material_id !== materialId) {
    return fail("forbidden");
  }

  const { error: deleteError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("author_user_id", session.data.userId);

  if (deleteError !== null) {
    reportMutationError("レビューの削除に失敗", deleteError);
    return fail("internal");
  }

  await removeStoragePhotos(supabase, session.data.userId, review.photos);
  return succeed(null);
}
