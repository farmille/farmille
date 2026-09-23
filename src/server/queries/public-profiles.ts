import { reportMediaUrl } from "@/server/usage-reports/structured";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getViewerHelpfulVotes } from "@/server/queries/helpful";
import { fail, succeed, type Result } from "@/server/result";
import { reviewCropLabel, type ReviewCropRelation } from "@/server/reviews/crop-relations";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewPhotoRow = Database["public"]["Tables"]["review_photos"]["Row"];
type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];
type UsageReportMediaRow = Database["public"]["Tables"]["usage_report_media"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];

type ProfileReviewQueryRow = Pick<
  ReviewRow,
  "id" | "material_id" | "rating" | "body" | "created_at"
> & {
  cropRelations: ReviewCropRelation | null;
  material: Pick<MaterialRow, "id" | "name"> | null;
  photos: Pick<ReviewPhotoRow, "id" | "url" | "caption" | "sort_order">[];
};

type ProfileReportQueryRow = Pick<
  UsageReportRow,
  "id" | "material_id" | "title" | "published_at" | "form_version"
> & {
  crop: Pick<CropRow, "id" | "name"> | null;
  material: Pick<MaterialRow, "id" | "name"> | null;
  media: Pick<UsageReportMediaRow, "id" | "url" | "media_type" | "sort_order">[];
};

export type PublicProfilePost =
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
      /** 閲覧者がこの感想口コミに「参考になった」を押しているか。 */
      helpfulVotedByViewer: boolean;
      photos: ReadonlyArray<{
        id: string;
        url: string;
        alt: string;
      }>;
    }
  | {
      kind: "usage_report";
      id: string;
      createdAt: string;
      title: string;
      cropName: string;
      helpfulCount: number;
      coverUrl: string | null;
    };

export type PublicProfilePageData = {
  profile: {
    userId: string;
    handle: string;
    avatarUrl: string | null;
    standpoint: PublicProfileRow["standpoint"];
    prefectureCode: PublicProfileRow["prefecture_code"];
  };
  reviewCount: number;
  helpfulCount: number;
  posts: readonly PublicProfilePost[];
};

const IN_FILTER_CHUNK_SIZE = 100;

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/public-profiles] ${operation}`, error);
}

function bySortOrder(
  left: { id: string; sort_order: number },
  right: { id: string; sort_order: number },
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
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

/** 一般ユーザーの公開プロフィールと公開済み投稿だけを取得する。 */
export async function getPublicProfilePage(
  id: string,
  viewerUserId: string | null = null,
): Promise<Result<PublicProfilePageData>> {
  const supabase = await createServerSupabase();
  const { data: profileData, error: profileError } = await supabase
    .from("public_profiles")
    .select("user_id, handle, avatar_url, standpoint, prefecture_code")
    .eq("user_id", id)
    .maybeSingle();

  if (profileError !== null) {
    reportQueryError("公開プロフィールの取得に失敗", profileError);
    return fail("internal");
  }

  if (profileData === null) {
    return fail("not_found");
  }

  const profile = profileData;

  if (profile.user_id === null || profile.handle === null) {
    reportQueryError("公開プロフィールの必須項目が欠落", { id });
    return fail("internal");
  }

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
          ),
          photos:review_photos (
            id,
            url,
            caption,
            sort_order
          )
        `,
      )
      .eq("author_user_id", profile.user_id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true }),
    supabase
      .rpc("list_usage_report_previews")
      .select(
        `
          id,
          material_id,
          title,
          published_at,
          form_version,
          crop:crops!usage_reports_crop_id_fkey (
            id,
            name
          ),
          material:materials!usage_reports_material_id_fkey (
            id,
            name
          ),
          media:usage_report_media (
            id,
            url,
            media_type,
            sort_order
          )
        `,
      )
      .eq("author_user_id", profile.user_id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .order("id", { ascending: true }),
  ]);

  if (reviewsResult.error !== null) {
    reportQueryError("公開感想口コミの取得に失敗", reviewsResult.error);
    return fail("internal");
  }

  if (reportsResult.error !== null) {
    reportQueryError("公開実証詳細レポートの取得に失敗", reportsResult.error);
    return fail("internal");
  }

  const reviewRows: ProfileReviewQueryRow[] = reviewsResult.data;
  const reportRows: ProfileReportQueryRow[] = reportsResult.data;
  const [reviewHelpful, reportHelpful] = await Promise.all([
    getHelpfulCounts(
      supabase,
      "review",
      reviewRows.map(({ id: reviewId }) => reviewId),
    ),
    getHelpfulCounts(
      supabase,
      "usage_report",
      reportRows.map(({ id: reportId }) => reportId),
    ),
  ]);

  if (!reviewHelpful.ok) {
    return reviewHelpful;
  }

  if (!reportHelpful.ok) {
    return reportHelpful;
  }

  const votedReviewIds = await getViewerHelpfulVotes(
    viewerUserId,
    "review",
    reviewRows.map(({ id: reviewId }) => reviewId),
  );

  if (!votedReviewIds.ok) {
    return votedReviewIds;
  }

  const posts: PublicProfilePost[] = [];

  for (const review of reviewRows) {
    const cropName = reviewCropLabel(review.cropRelations);

    if (cropName === null || review.material === null) {
      reportQueryError("公開感想口コミの関連データが欠落", { reviewId: review.id });
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
      helpfulVotedByViewer: votedReviewIds.data.has(review.id),
      photos: review.photos.toSorted(bySortOrder).map((photo) => ({
        id: photo.id,
        url: photo.url,
        alt: photo.caption ?? "感想口コミ写真",
      })),
    });
  }

  for (const report of reportRows) {
    if (report.published_at === null || report.crop === null || report.material === null) {
      reportQueryError("公開実証詳細レポートの関連データが欠落", { reportId: report.id });
      return fail("internal");
    }

    const cover =
      report.media
        .toSorted(bySortOrder)
        .find(({ media_type: mediaType }) => mediaType === "photo") ?? null;

    posts.push({
      kind: "usage_report",
      id: report.id,
      createdAt: report.published_at,
      title: report.title ?? `${report.material.name} 実証詳細レポート`,
      cropName: report.crop.name,
      helpfulCount: reportHelpful.data.get(report.id) ?? 0,
      coverUrl:
        cover === null
          ? null
          : report.form_version === 2
            ? reportMediaUrl(cover.url, profile.user_id)
            : cover.url,
    });
  }

  posts.sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id),
  );

  const helpfulCount = [...reviewHelpful.data.values(), ...reportHelpful.data.values()].reduce(
    (total, count) => total + count,
    0,
  );

  return succeed({
    profile: {
      userId: profile.user_id,
      handle: profile.handle,
      avatarUrl: profile.avatar_url,
      standpoint: profile.standpoint,
      prefectureCode: profile.prefecture_code,
    },
    reviewCount: reviewRows.length,
    helpfulCount,
    posts,
  });
}
