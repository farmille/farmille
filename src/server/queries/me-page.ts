import type { SupabaseClient } from "@supabase/supabase-js";

import { getOwnProfile, type OwnProfile } from "@/server/queries/profiles";
import { listSavedMaterials, type SavedMaterialItem } from "@/server/queries/saved-materials";
import { fail, succeed, type Result } from "@/server/result";
import { reviewCropLabel, type ReviewCropRelation } from "@/server/reviews/crop-relations";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];
type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];

type OwnReviewQueryRow = Pick<
  ReviewRow,
  "id" | "material_id" | "rating" | "body" | "created_at"
> & {
  cropRelations: ReviewCropRelation[];
  material: Pick<MaterialRow, "id" | "name"> | null;
};

type OwnReportQueryRow = Pick<
  UsageReportRow,
  "id" | "material_id" | "title" | "status" | "created_at" | "published_at"
> & {
  crop: Pick<CropRow, "id" | "name"> | null;
  material: Pick<MaterialRow, "id" | "name"> | null;
};

type HelpfulVoteRow = {
  target_type: string;
  target_id: string;
  created_at: string;
};

type HelpfulReviewDetail = {
  id: string;
  material_id: string;
  rating: number;
  body: string;
  cropRelations: ReviewCropRelation[];
  material: Pick<MaterialRow, "id" | "name"> | null;
  author: Pick<PublicProfileRow, "user_id" | "handle"> | null;
};

type HelpfulReportDetail = {
  id: string;
  title: string | null;
  crop: Pick<CropRow, "id" | "name"> | null;
  material: Pick<MaterialRow, "id" | "name"> | null;
  author: Pick<PublicProfileRow, "user_id" | "handle"> | null;
};

export type OwnPostItem =
  | {
      kind: "review";
      id: string;
      createdAt: string;
      materialId: string;
      materialName: string;
      cropName: string;
      rating: number;
      body: string;
      helpfulCount: number;
    }
  | {
      kind: "usage_report";
      id: string;
      createdAt: string;
      materialId: string;
      title: string;
      cropName: string;
      status: "draft" | "pending" | "published" | "declined";
      helpfulCount: number;
    };

export type HelpfulItem =
  | {
      kind: "review";
      id: string;
      materialId: string;
      materialName: string;
      cropName: string;
      rating: number;
      body: string;
      authorHandle: string;
      authorUserId: string | null;
      helpfulCount: number;
      votedAt: string;
    }
  | {
      kind: "usage_report";
      id: string;
      title: string;
      cropName: string;
      authorHandle: string;
      authorUserId: string | null;
      helpfulCount: number;
      votedAt: string;
    };

export type MyPageData = {
  profile: OwnProfile;
  reviewCount: number;
  helpfulReceivedCount: number;
  posts: readonly OwnPostItem[];
  savedMaterials: readonly SavedMaterialItem[];
  helpfulItems: readonly HelpfulItem[];
};

const IN_FILTER_CHUNK_SIZE = 100;
const SHELF_LIMIT = 8;

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/me-page] ${operation}`, error);
}

function isUsageReportStatus(
  value: string,
): value is "draft" | "pending" | "published" | "declined" {
  return value === "draft" || value === "pending" || value === "published" || value === "declined";
}

async function getHelpfulCounts(
  supabase: SupabaseClient<Database>,
  targetType: "review" | "usage_report",
  ids: string[],
): Promise<Result<Map<string, number>>> {
  const counts = new Map<string, number>();

  for (let start = 0; start < ids.length; start += IN_FILTER_CHUNK_SIZE) {
    const chunk = ids.slice(start, start + IN_FILTER_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("helpful_counts")
      .select("target_id, helpful_count")
      .eq("target_type", targetType)
      .in("target_id", chunk);

    if (error !== null) {
      reportQueryError("参考になった件数の取得に失敗", { targetType, error });
      return fail("internal");
    }

    const rows: Pick<HelpfulCountRow, "target_id" | "helpful_count">[] = data;

    for (const row of rows) {
      if (row.target_id === null || row.helpful_count === null) {
        reportQueryError("参考になった件数にNULLが含まれる", { targetType, row });
        return fail("internal");
      }

      counts.set(row.target_id, row.helpful_count);
    }
  }

  return succeed(counts);
}

async function listOwnPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Result<{ posts: OwnPostItem[]; reviewCount: number; helpfulReceivedCount: number }>> {
  const [reviewsResult, reportsResult] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        `
          id,
          material_id,
          rating,
          body,
          created_at,
          cropRelations:review_crops (
            sort_order,
            crop:crops!review_crops_crop_id_fkey (
              id,
              name
            )
          ),
          material:materials!reviews_material_id_fkey (
            id,
            name
          )
        `,
      )
      .eq("author_user_id", userId)
      .neq("status", "hidden")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true }),
    supabase
      .from("usage_reports")
      .select(
        `
          id,
          material_id,
          title,
          status,
          created_at,
          published_at,
          crop:crops!usage_reports_crop_id_fkey (
            id,
            name
          ),
          material:materials!usage_reports_material_id_fkey (
            id,
            name
          )
        `,
      )
      .eq("author_user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true }),
  ]);

  if (reviewsResult.error !== null) {
    reportQueryError("自分のレビュー取得に失敗", reviewsResult.error);
    return fail("internal");
  }

  if (reportsResult.error !== null) {
    reportQueryError("自分の使用レポート取得に失敗", reportsResult.error);
    return fail("internal");
  }

  const reviewRows: OwnReviewQueryRow[] = reviewsResult.data;
  const reportRows: OwnReportQueryRow[] = reportsResult.data;
  const [reviewHelpful, reportHelpful] = await Promise.all([
    getHelpfulCounts(
      supabase,
      "review",
      reviewRows.map(({ id }) => id),
    ),
    getHelpfulCounts(
      supabase,
      "usage_report",
      reportRows.map(({ id }) => id),
    ),
  ]);

  if (!reviewHelpful.ok) return reviewHelpful;
  if (!reportHelpful.ok) return reportHelpful;

  const posts: OwnPostItem[] = [];

  for (const review of reviewRows) {
    const cropName = reviewCropLabel(review.cropRelations);

    if (cropName === null || review.material === null) {
      reportQueryError("自分のレビューの関連データが欠落", { reviewId: review.id });
      return fail("internal");
    }

    posts.push({
      kind: "review",
      id: review.id,
      createdAt: review.created_at,
      materialId: review.material_id,
      materialName: review.material.name,
      cropName,
      rating: review.rating,
      body: review.body,
      helpfulCount: reviewHelpful.data.get(review.id) ?? 0,
    });
  }

  for (const report of reportRows) {
    if (report.crop === null || report.material === null || !isUsageReportStatus(report.status)) {
      reportQueryError("自分の使用レポートの関連データが欠落", { reportId: report.id });
      return fail("internal");
    }

    posts.push({
      kind: "usage_report",
      id: report.id,
      createdAt: report.published_at ?? report.created_at,
      materialId: report.material_id,
      title: report.title ?? `${report.material.name} 使用レポート`,
      cropName: report.crop.name,
      status: report.status,
      helpfulCount: reportHelpful.data.get(report.id) ?? 0,
    });
  }

  posts.sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id),
  );

  const helpfulReceivedCount = [
    ...reviewHelpful.data.values(),
    ...reportHelpful.data.values(),
  ].reduce((total, count) => total + count, 0);

  return succeed({
    posts: posts.slice(0, SHELF_LIMIT),
    reviewCount: reviewRows.length,
    helpfulReceivedCount,
  });
}

async function listHelpfulItems(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Result<HelpfulItem[]>> {
  const { data: votesData, error: votesError } = await supabase
    .from("helpful_votes")
    .select("target_type, target_id, created_at")
    .eq("user_id", userId)
    .in("target_type", ["review", "usage_report"])
    .order("created_at", { ascending: false })
    .order("target_id", { ascending: true })
    .limit(SHELF_LIMIT);

  if (votesError !== null) {
    reportQueryError("参考になった一覧の取得に失敗", votesError);
    return fail("internal");
  }

  const votes: HelpfulVoteRow[] = votesData;
  if (votes.length === 0) {
    return succeed([]);
  }

  const reviewIds = votes.filter((vote) => vote.target_type === "review").map((v) => v.target_id);
  const reportIds = votes
    .filter((vote) => vote.target_type === "usage_report")
    .map((v) => v.target_id);
  const emptyReviews: HelpfulReviewDetail[] = [];
  const emptyReports: HelpfulReportDetail[] = [];

  const [reviewsResult, reportsResult, reviewHelpful, reportHelpful] = await Promise.all([
    reviewIds.length === 0
      ? Promise.resolve({ data: emptyReviews, error: null })
      : supabase
          .from("reviews")
          .select(
            `
              id,
              material_id,
              rating,
              body,
              cropRelations:review_crops (
                sort_order,
                crop:crops!review_crops_crop_id_fkey ( id, name )
              ),
              material:materials!reviews_material_id_fkey ( id, name ),
              author:public_profiles!reviews_author_user_id_fkey (
                user_id,
                handle
              )
            `,
          )
          .in("id", reviewIds)
          .eq("status", "published"),
    reportIds.length === 0
      ? Promise.resolve({ data: emptyReports, error: null })
      : supabase
          .from("usage_reports")
          .select(
            `
              id,
              title,
              crop:crops!usage_reports_crop_id_fkey ( id, name ),
              material:materials!usage_reports_material_id_fkey ( id, name ),
              author:public_profiles!usage_reports_author_user_id_fkey (
                user_id,
                handle
              )
            `,
          )
          .in("id", reportIds)
          .eq("status", "published"),
    getHelpfulCounts(supabase, "review", reviewIds),
    getHelpfulCounts(supabase, "usage_report", reportIds),
  ]);

  if (reviewsResult.error !== null) {
    reportQueryError("参考になったレビュー詳細の取得に失敗", reviewsResult.error);
    return fail("internal");
  }

  if (reportsResult.error !== null) {
    reportQueryError("参考になった使用レポート詳細の取得に失敗", reportsResult.error);
    return fail("internal");
  }

  if (!reviewHelpful.ok) return reviewHelpful;
  if (!reportHelpful.ok) return reportHelpful;

  const reviewsById = new Map(reviewsResult.data.map((row) => [row.id, row]));
  const reportsById = new Map(reportsResult.data.map((row) => [row.id, row]));
  const items: HelpfulItem[] = [];

  for (const vote of votes) {
    if (vote.target_type === "review") {
      const review = reviewsById.get(vote.target_id);
      const cropName = review === undefined ? null : reviewCropLabel(review.cropRelations);
      if (review === undefined || cropName === null || review.material === null) {
        continue;
      }

      items.push({
        kind: "review",
        id: review.id,
        materialId: review.material_id,
        materialName: review.material.name,
        cropName,
        rating: review.rating,
        body: review.body,
        authorHandle: review.author?.handle ?? "不明な投稿者",
        authorUserId: review.author?.user_id ?? null,
        helpfulCount: reviewHelpful.data.get(review.id) ?? 0,
        votedAt: vote.created_at,
      });
      continue;
    }

    const report = reportsById.get(vote.target_id);
    if (report === undefined || report.crop === null || report.material === null) {
      continue;
    }

    items.push({
      kind: "usage_report",
      id: report.id,
      title: report.title ?? `${report.material.name} 使用レポート`,
      cropName: report.crop.name,
      authorHandle: report.author?.handle ?? "不明な投稿者",
      authorUserId: report.author?.user_id ?? null,
      helpfulCount: reportHelpful.data.get(report.id) ?? 0,
      votedAt: vote.created_at,
    });
  }

  return succeed(items);
}

/** マイページ `/me` 用の集約データ。 */
export async function getMyPageData(userId: string): Promise<Result<MyPageData>> {
  const supabase = await createServerSupabase();
  const [profileResult, postsResult, savedResult, helpfulResult] = await Promise.all([
    getOwnProfile(userId),
    listOwnPosts(supabase, userId),
    listSavedMaterials(userId, { limit: SHELF_LIMIT }),
    listHelpfulItems(supabase, userId),
  ]);

  if (!profileResult.ok) return profileResult;
  if (!postsResult.ok) return postsResult;
  if (!savedResult.ok) return savedResult;
  if (!helpfulResult.ok) return helpfulResult;

  return succeed({
    profile: profileResult.data,
    reviewCount: postsResult.data.reviewCount,
    helpfulReceivedCount: postsResult.data.helpfulReceivedCount,
    posts: postsResult.data.posts,
    savedMaterials: savedResult.data,
    helpfulItems: helpfulResult.data,
  });
}
