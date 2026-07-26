import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_PER_PAGE, pageRange, type Paginated } from "@/server/pagination";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewPhotoRow = Database["public"]["Tables"]["review_photos"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];

type ReviewFields = Pick<
  ReviewRow,
  | "id"
  | "material_id"
  | "rating"
  | "body"
  | "crop_id"
  | "has_control_plot"
  | "is_provided_sample"
  | "created_at"
>;

export type ReviewAuthor = Pick<PublicProfileRow, "user_id" | "handle" | "avatar_url">;

export type ReviewCrop = Pick<CropRow, "id" | "name">;

export type ReviewPhoto = Pick<ReviewPhotoRow, "id" | "url" | "caption" | "sort_order">;

export type ReviewListItem = ReviewFields & {
  author: ReviewAuthor | null;
  crop: ReviewCrop | null;
  photos: ReviewPhoto[];
  helpfulCount: number;
};

export type ReviewSort = "newest" | "helpful" | "rating";

type ReviewQueryRow = ReviewFields & {
  author: ReviewAuthor | null;
  crop: ReviewCrop | null;
  photos: ReviewPhoto[];
};

type ReviewOrderRow = Pick<ReviewRow, "id" | "created_at">;

const REVIEW_SELECT = `
  id,
  material_id,
  rating,
  body,
  crop_id,
  has_control_plot,
  is_provided_sample,
  created_at,
  author:public_profiles!reviews_author_user_id_fkey (
    user_id,
    handle,
    avatar_url
  ),
  crop:crops!reviews_crop_id_fkey (
    id,
    name
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

function reportQueryError(operation: string, error: unknown): void {
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
): ReviewListItem {
  return {
    ...review,
    photos: review.photos.toSorted(byPhotoOrder),
    helpfulCount: helpfulCounts.get(review.id) ?? 0,
  };
}

async function listByHelpfulCount(
  supabase: SupabaseClient<Database>,
  materialId: string,
  page: number,
  range: { from: number; to: number },
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
  const items: ReviewListItem[] = [];

  for (const reviewId of pageReviewIds) {
    const review = reviewById.get(reviewId);

    if (review === undefined) {
      reportQueryError("参考順レビューの詳細が取得結果にない", { reviewId });
      return fail("internal");
    }

    items.push(toReviewListItem(review, helpfulCounts.data));
  }

  return succeed({
    items,
    page,
    perPage: DEFAULT_PER_PAGE,
    total,
    totalPages: Math.ceil(total / DEFAULT_PER_PAGE),
  });
}

export async function listReviewsByMaterial(
  materialId: string,
  {
    sort,
    page,
  }: {
    sort: ReviewSort;
    page: number;
  },
): Promise<Result<Paginated<ReviewListItem>>> {
  const { from, to } = pageRange(page);
  const supabase = await createServerSupabase();

  if (sort === "helpful") {
    return listByHelpfulCount(supabase, materialId, page, { from, to });
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

  return succeed({
    items: reviews.map((review) => toReviewListItem(review, helpfulCounts.data)),
    page,
    perPage: DEFAULT_PER_PAGE,
    total: count,
    totalPages: Math.ceil(count / DEFAULT_PER_PAGE),
  });
}
