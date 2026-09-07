import type { SupabaseClient } from "@supabase/supabase-js";

import { getViewerHelpfulVotes } from "@/server/queries/helpful";
import { DEFAULT_PER_PAGE, pageRange, type Paginated } from "@/server/pagination";
import { fail, succeed, type Result } from "@/server/result";
import { orderedReviewCrops, type ReviewCropRelation } from "@/server/reviews/crop-relations";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewPhotoRow = Database["public"]["Tables"]["review_photos"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type CropGroupRow = Database["public"]["Tables"]["crop_groups"]["Row"];
type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];

type ReviewFields = Pick<
  ReviewRow,
  | "id"
  | "material_id"
  | "author_user_id"
  | "rating"
  | "body"
  | "has_control_plot"
  | "is_provided_sample"
  | "created_at"
>;

export type ReviewAuthor = Pick<PublicProfileRow, "user_id" | "handle" | "avatar_url">;

export type ReviewCrop = Pick<CropRow, "id" | "name">;

export type ReviewPhoto = Pick<ReviewPhotoRow, "id" | "url" | "caption" | "sort_order">;

export type ReviewListItem = ReviewFields & {
  author: ReviewAuthor | null;
  crops: ReviewCrop[];
  photos: ReviewPhoto[];
  helpfulCount: number;
  /** 閲覧者（ログイン中の一般ユーザー）がこのレビューに「参考になった」を押しているか。 */
  helpfulVotedByViewer: boolean;
};

export type ReviewCropOption = Pick<CropRow, "id" | "name" | "aliases"> & {
  groupName: string;
};

export type ReviewEditorData = Pick<
  ReviewRow,
  | "id"
  | "material_id"
  | "author_user_id"
  | "rating"
  | "body"
  | "has_control_plot"
  | "purchase_channel"
  | "pesticide_ack"
  | "status"
> & {
  cropIds: string[];
  photos: ReviewPhoto[];
};

export type ReviewSort = "newest" | "helpful" | "rating";

type ReviewQueryRow = ReviewFields & {
  author: ReviewAuthor | null;
  cropRelations: ReviewCropRelation | null;
  photos: ReviewPhoto[];
};

type ReviewCropOptionQueryRow = Pick<CropRow, "id" | "name" | "aliases" | "sort_order"> & {
  group: Pick<CropGroupRow, "name" | "sort_order"> | null;
};

type ReviewOrderRow = Pick<ReviewRow, "id" | "created_at">;

const REVIEW_SELECT = `
  id,
  material_id,
  author_user_id,
  rating,
  body,
  has_control_plot,
  is_provided_sample,
  created_at,
  author:public_profiles!reviews_author_user_id_fkey (
    user_id,
    handle,
    avatar_url
  ),
  cropRelations:review_crops (
    sort_order,
    crop:crops!review_crops_crop_id_fkey (
      id,
      name
    )
  ),
  photos:review_photos (
    id,
    url,
    caption,
    sort_order
  )
` as const;

const POSTGREST_PAGE_SIZE = 1_000;
const IN_FILTER_CHUNK_SIZE = 100;

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/reviews] ${operation}`, error);
}

function byPhotoOrder(left: ReviewPhoto, right: ReviewPhoto): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

async function listPublishedReviewOrder(
  supabase: SupabaseClient<Database>,
  materialId: string,
): Promise<Result<ReviewOrderRow[]>> {
  const rows: ReviewOrderRow[] = [];

  for (let from = 0; ; from += POSTGREST_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, created_at")
      .eq("material_id", materialId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + POSTGREST_PAGE_SIZE - 1);

    if (error !== null) {
      reportQueryError("参考順用のレビュー取得に失敗", error);
      return fail("internal");
    }

    rows.push(...data);

    if (data.length < POSTGREST_PAGE_SIZE) {
      return succeed(rows);
    }
  }
}

async function getHelpfulCounts(
  supabase: SupabaseClient<Database>,
  reviewIds: string[],
): Promise<Result<Map<string, number>>> {
  const counts = new Map<string, number>();

  for (let start = 0; start < reviewIds.length; start += IN_FILTER_CHUNK_SIZE) {
    const ids = reviewIds.slice(start, start + IN_FILTER_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("helpful_counts")
      .select("target_id, helpful_count")
      .eq("target_type", "review")
      .in("target_id", ids);

    if (error !== null) {
      reportQueryError("参考になった件数の取得に失敗", error);
      return fail("internal");
    }

    const helpfulRows: Pick<HelpfulCountRow, "target_id" | "helpful_count">[] = data;

    for (const row of helpfulRows) {
      if (row.target_id === null || row.helpful_count === null) {
        reportQueryError("参考になった件数にNULLが含まれる", row);
        return fail("internal");
      }

      counts.set(row.target_id, row.helpful_count);
    }
  }

  return succeed(counts);
}

function toReviewListItem(
  review: ReviewQueryRow,
  helpfulCounts: Map<string, number>,
  votedIds: ReadonlySet<string>,
): ReviewListItem | null {
  const { cropRelations, photos, ...fields } = review;
  const crops = orderedReviewCrops(cropRelations);

  if (crops === null) {
    reportQueryError("レビューの作目関連が欠落", { reviewId: review.id });
    return null;
  }

  return {
    ...fields,
    crops,
    photos: photos.toSorted(byPhotoOrder),
    helpfulCount: helpfulCounts.get(review.id) ?? 0,
    helpfulVotedByViewer: votedIds.has(review.id),
  };
}

async function listByHelpfulCount(
  supabase: SupabaseClient<Database>,
  materialId: string,
  page: number,
  range: { from: number; to: number },
  viewerUserId: string | null,
): Promise<Result<Paginated<ReviewListItem>>> {
  const reviewOrder = await listPublishedReviewOrder(supabase, materialId);

  if (!reviewOrder.ok) {
    return reviewOrder;
  }

  const helpfulCounts = await getHelpfulCounts(
    supabase,
    reviewOrder.data.map(({ id }) => id),
  );

  if (!helpfulCounts.ok) {
    return helpfulCounts;
  }

  const sortedReviewIds = reviewOrder.data
    .toSorted(
      (left, right) =>
        (helpfulCounts.data.get(right.id) ?? 0) - (helpfulCounts.data.get(left.id) ?? 0) ||
        right.created_at.localeCompare(left.created_at) ||
        left.id.localeCompare(right.id),
    )
    .map(({ id }) => id);
  const pageReviewIds = sortedReviewIds.slice(range.from, range.to + 1);
  const total = sortedReviewIds.length;

  if (pageReviewIds.length === 0) {
    return succeed({
      items: [],
      page,
      perPage: DEFAULT_PER_PAGE,
      total,
      totalPages: Math.ceil(total / DEFAULT_PER_PAGE),
    });
  }

  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("material_id", materialId)
    .eq("status", "published")
    .in("id", pageReviewIds);

  if (error !== null) {
    reportQueryError("参考順レビュー詳細の取得に失敗", error);
    return fail("internal");
  }

  const reviews: ReviewQueryRow[] = data;
  const reviewById = new Map(reviews.map((review) => [review.id, review]));
  const votedIds = await getViewerHelpfulVotes(viewerUserId, "review", pageReviewIds);

  if (!votedIds.ok) {
    return votedIds;
  }

  const items: ReviewListItem[] = [];

  for (const reviewId of pageReviewIds) {
    const review = reviewById.get(reviewId);

    if (review === undefined) {
      reportQueryError("参考順レビューの詳細が取得結果にない", { reviewId });
      return fail("internal");
    }

    const item = toReviewListItem(review, helpfulCounts.data, votedIds.data);
    if (item === null) return fail("internal");
    items.push(item);
  }

  return succeed({
    items,
    page,
    perPage: DEFAULT_PER_PAGE,
    total,
    totalPages: Math.ceil(total / DEFAULT_PER_PAGE),
  });
}

export type RecentReviewItem = ReviewListItem & {
  materialName: string;
};

/** ホームの新着レビュー。published のみ・新しい順。 */
export async function listRecentReviews({
  limit,
}: {
  limit: number;
}): Promise<Result<RecentReviewItem[]>> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit は1以上の整数で指定してください。");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      ${REVIEW_SELECT},
      material:materials!reviews_material_id_fkey!inner (
        name
      )
    `,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);

  if (error !== null) {
    reportQueryError("新着レビューの取得に失敗", error);
    return fail("internal");
  }

  type RecentRow = ReviewQueryRow & { material: { name: string } | null };
  const rows: RecentRow[] = data;
  const helpfulCounts = await getHelpfulCounts(
    supabase,
    rows.map(({ id }) => id),
  );

  if (!helpfulCounts.ok) {
    return helpfulCounts;
  }

  const items: RecentReviewItem[] = [];

  for (const row of rows) {
    if (row.material === null) {
      reportQueryError("新着レビューに資材名が無い", { reviewId: row.id });
      return fail("internal");
    }

    const { material, ...review } = row;
    const item = toReviewListItem(review, helpfulCounts.data, new Set());
    if (item === null) return fail("internal");

    items.push({
      ...item,
      materialName: material.name,
    });
  }

  return succeed(items);
}

export async function listReviewsByMaterial(
  materialId: string,
  {
    sort,
    page,
    viewerUserId = null,
  }: {
    sort: ReviewSort;
    page: number;
    /** 「参考になった」の押下状態を出す一般ユーザーの user_id。未ログインは null。 */
    viewerUserId?: string | null;
  },
): Promise<Result<Paginated<ReviewListItem>>> {
  const { from, to } = pageRange(page);
  const supabase = await createServerSupabase();

  if (sort === "helpful") {
    return listByHelpfulCount(supabase, materialId, page, { from, to }, viewerUserId);
  }

  let query = supabase
    .from("reviews")
    .select(REVIEW_SELECT, { count: "exact" })
    .eq("material_id", materialId)
    .eq("status", "published");

  query =
    sort === "rating"
      ? query.order("rating", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data, error, count } = await query.order("id", { ascending: true }).range(from, to);

  if (error !== null) {
    reportQueryError("レビュー一覧の取得に失敗", error);
    return fail("internal");
  }

  if (count === null) {
    reportQueryError("レビュー一覧の総件数が返されなかった", {
      materialId,
      page,
      sort,
    });
    return fail("internal");
  }

  const reviews: ReviewQueryRow[] = data;
  const helpfulCounts = await getHelpfulCounts(
    supabase,
    reviews.map(({ id }) => id),
  );

  if (!helpfulCounts.ok) {
    return helpfulCounts;
  }

  const votedIds = await getViewerHelpfulVotes(
    viewerUserId,
    "review",
    reviews.map(({ id }) => id),
  );

  if (!votedIds.ok) {
    return votedIds;
  }

  const items: ReviewListItem[] = [];
  for (const review of reviews) {
    const item = toReviewListItem(review, helpfulCounts.data, votedIds.data);
    if (item === null) return fail("internal");
    items.push(item);
  }

  return succeed({
    items,
    page,
    perPage: DEFAULT_PER_PAGE,
    total: count,
    totalPages: Math.ceil(count / DEFAULT_PER_PAGE),
  });
}

/** レビュー作目候補を作物群・作物の表示順で返す。 */
export async function listReviewCropOptions(): Promise<Result<ReviewCropOption[]>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("crops")
    .select(
      `
        id,
        name,
        aliases,
        sort_order,
        group:crop_groups!crops_group_id_fkey (
          name,
          sort_order
        )
      `,
    )
    .order("sort_order")
    .order("name");

  if (error !== null) {
    reportQueryError("レビュー作目候補の取得に失敗", error);
    return fail("internal");
  }

  const rows: ReviewCropOptionQueryRow[] = data;

  if (rows.some(({ group }) => group === null)) {
    reportQueryError("レビュー作目候補の作物群が欠落", rows);
    return fail("internal");
  }

  return succeed(
    rows
      .flatMap((crop) =>
        crop.group === null
          ? []
          : [
              {
                id: crop.id,
                name: crop.name,
                aliases: crop.aliases,
                groupName: crop.group.name,
                groupSortOrder: crop.group.sort_order,
                cropSortOrder: crop.sort_order,
              },
            ],
      )
      .toSorted(
        (left, right) =>
          left.groupSortOrder - right.groupSortOrder ||
          left.cropSortOrder - right.cropSortOrder ||
          left.name.localeCompare(right.name, "ja") ||
          left.id.localeCompare(right.id),
      )
      .map(({ id, name, aliases, groupName }) => ({
        id,
        name,
        aliases,
        groupName,
      })),
  );
}

/** 同じ一般ユーザーが同一資材へ投稿済みかを確認する。 */
export async function findOwnReviewIdByMaterial(
  materialId: string,
  userId: string,
): Promise<Result<string | null>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("material_id", materialId)
    .eq("author_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error !== null) {
    reportQueryError("投稿済みレビューの確認に失敗", error);
    return fail("internal");
  }

  return succeed(data?.id ?? null);
}

/** 編集フォーム用。所有者と資材 ID を server 層で一致確認する。 */
export async function getReviewForEdit(
  materialId: string,
  reviewId: string,
  userId: string,
): Promise<Result<ReviewEditorData>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
        id,
        material_id,
        author_user_id,
        rating,
        body,
        has_control_plot,
        purchase_channel,
        pesticide_ack,
        status,
        cropRelations:review_crops (
          sort_order,
          crop:crops!review_crops_crop_id_fkey (
            id,
            name
          )
        ),
        photos:review_photos (
          id,
          url,
          caption,
          sort_order
        )
      `,
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (error !== null) {
    reportQueryError("編集対象レビューの取得に失敗", error);
    return fail("internal");
  }

  if (data === null) {
    return fail("not_found");
  }

  const { cropRelations, ...review } = data;
  const typedCropRelations: ReviewCropRelation | null = cropRelations;
  const crops = orderedReviewCrops(typedCropRelations);

  if (crops === null) {
    reportQueryError("編集対象レビューの作目関連が欠落", { reviewId });
    return fail("internal");
  }

  if (review.material_id !== materialId || review.author_user_id !== userId) {
    return fail("forbidden");
  }

  if (review.status !== "published") {
    return fail("forbidden");
  }

  return succeed({
    ...review,
    cropIds: crops.map(({ id: cropId }) => cropId),
    photos: review.photos.toSorted(byPhotoOrder),
  });
}
