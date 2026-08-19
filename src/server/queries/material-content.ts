import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];
type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type PublicSellerRow = Database["public"]["Views"]["public_sellers"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type UsageReportMediaRow = Database["public"]["Tables"]["usage_report_media"]["Row"];
type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];
type ViewCountRow = Database["public"]["Views"]["view_counts_daily"]["Row"];

type ContentType = "article" | "usage_report";

type ContentCounts = {
  helpfulById: Map<string, number>;
  viewsById: Map<string, number>;
};

type UsageReportFields = Pick<
  UsageReportRow,
  "id" | "material_id" | "title" | "summary" | "published_at"
>;

type UsageReportAuthor = Pick<PublicProfileRow, "user_id" | "handle" | "avatar_url">;
type UsageReportCrop = Pick<CropRow, "id" | "name">;
type UsageReportMedia = Pick<UsageReportMediaRow, "id" | "url" | "media_type" | "sort_order">;

type UsageReportQueryRow = UsageReportFields & {
  author: UsageReportAuthor | null;
  crop: UsageReportCrop | null;
  media: UsageReportMedia[];
};

export type PublishedUsageReport = UsageReportFields & {
  author: UsageReportAuthor | null;
  crop: UsageReportCrop | null;
  coverImage: UsageReportMedia | null;
  helpfulCount: number;
  viewCount: number;
};

type ArticleFields = Pick<
  ArticleRow,
  "id" | "title" | "hero_image_url" | "published_at" | "seller_id"
>;

type ArticleSeller = Pick<PublicSellerRow, "id" | "official_name" | "seller_type">;

type ArticleQueryRow = ArticleFields & {
  seller: ArticleSeller | null;
};

type ArticleMaterialQueryRow = {
  article_id: string;
  articles: ArticleQueryRow | null;
};

export type PublishedMaterialArticle = ArticleFields & {
  seller: ArticleSeller | null;
  helpfulCount: number;
  viewCount: number;
};

export type MaterialContentList<T> = {
  items: T[];
  total: number;
};

export type ReviewRatingDistribution = {
  total: number;
  stars: ReadonlyArray<{
    rating: 1 | 2 | 3 | 4 | 5;
    count: number;
  }>;
};

const IN_FILTER_CHUNK_SIZE = 100;
const POSTGREST_PAGE_SIZE = 1_000;

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/material-content] ${operation}`, error);
}

function byMediaOrder(left: UsageReportMedia, right: UsageReportMedia): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

function byPublishedAtDesc(left: ArticleQueryRow, right: ArticleQueryRow): number {
  const dateOrder = (right.published_at ?? "").localeCompare(left.published_at ?? "");

  return dateOrder || left.id.localeCompare(right.id);
}

async function getContentCounts(
  supabase: SupabaseClient<Database>,
  targetType: ContentType,
  targetIds: string[],
): Promise<Result<ContentCounts>> {
  const helpfulById = new Map<string, number>();
  const viewsById = new Map<string, number>();

  for (let start = 0; start < targetIds.length; start += IN_FILTER_CHUNK_SIZE) {
    const ids = targetIds.slice(start, start + IN_FILTER_CHUNK_SIZE);
    const [helpfulResult, viewResult] = await Promise.all([
      supabase
        .from("helpful_counts")
        .select("target_id, helpful_count")
        .eq("target_type", targetType)
        .in("target_id", ids),
      supabase
        .from("view_counts_daily")
        .select("target_id, view_count")
        .eq("target_type", targetType)
        .in("target_id", ids),
    ]);

    if (helpfulResult.error !== null) {
      reportQueryError("参考になった件数の取得に失敗", helpfulResult.error);
      return fail("internal");
    }

    if (viewResult.error !== null) {
      reportQueryError("閲覧数の取得に失敗", viewResult.error);
      return fail("internal");
    }

    const helpfulRows: Pick<HelpfulCountRow, "target_id" | "helpful_count">[] = helpfulResult.data;
    const viewRows: Pick<ViewCountRow, "target_id" | "view_count">[] = viewResult.data;

    for (const row of helpfulRows) {
      if (row.target_id === null || row.helpful_count === null) {
        reportQueryError("参考になった件数にNULLが含まれる", row);
        return fail("internal");
      }

      helpfulById.set(row.target_id, row.helpful_count);
    }

    for (const row of viewRows) {
      if (row.target_id === null || row.view_count === null) {
        reportQueryError("閲覧数にNULLが含まれる", row);
        return fail("internal");
      }

      viewsById.set(row.target_id, (viewsById.get(row.target_id) ?? 0) + row.view_count);
    }
  }

  return succeed({ helpfulById, viewsById });
}

export type PublishedUsageReportOptions = { limit?: number };

export async function listPublishedUsageReportsByMaterial(
  materialId: string,
  options: PublishedUsageReportOptions = {},
): Promise<Result<MaterialContentList<PublishedUsageReport>>> {
  const supabase = await createServerSupabase();
  return listPublishedUsageReportsByMaterialWithSupabase(supabase, materialId, options);
}

export async function listPublishedUsageReportsByMaterialWithSupabase(
  supabase: SupabaseClient<Database>,
  materialId: string,
  options: PublishedUsageReportOptions = {},
): Promise<Result<MaterialContentList<PublishedUsageReport>>> {
  const { limit } = options;

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new RangeError("limit は1以上の整数で指定してください。");
  }

  let query = supabase
    .from("usage_reports")
    .select(
      `
        id,
        material_id,
        title,
        summary,
        published_at,
        author:public_profiles!usage_reports_author_user_id_fkey (
          user_id,
          handle,
          avatar_url
        ),
        crop:crops!usage_reports_crop_id_fkey (
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
      { count: "exact" },
    )
    .eq("material_id", materialId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: true });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error, count } = await query;

  if (error !== null) {
    reportQueryError("公開使用レポートの取得に失敗", error);
    return fail("internal");
  }

  if (count === null) {
    reportQueryError("公開使用レポートの総件数が返されなかった", { materialId });
    return fail("internal");
  }

  const rows: UsageReportQueryRow[] = data;
  const counts = await getContentCounts(
    supabase,
    "usage_report",
    rows.map(({ id }) => id),
  );

  if (!counts.ok) {
    return counts;
  }

  return succeed({
    total: count,
    items: rows.map(({ media, ...report }) => {
      const sortedMedia = media.toSorted(byMediaOrder);
      const coverImage = sortedMedia.find(({ media_type }) => media_type === "photo") ?? null;

      return {
        ...report,
        coverImage,
        helpfulCount: counts.data.helpfulById.get(report.id) ?? 0,
        viewCount: counts.data.viewsById.get(report.id) ?? 0,
      };
    }),
  });
}

export async function listPublishedArticlesByMaterial(
  materialId: string,
): Promise<Result<MaterialContentList<PublishedMaterialArticle>>> {
  const supabase = await createServerSupabase();
  return listPublishedArticlesByMaterialWithSupabase(supabase, materialId);
}

export async function listPublishedArticlesByMaterialWithSupabase(
  supabase: SupabaseClient<Database>,
  materialId: string,
): Promise<Result<MaterialContentList<PublishedMaterialArticle>>> {
  const { data, error, count } = await supabase
    .from("article_materials")
    .select(
      `
        article_id,
        articles!inner (
          id,
          title,
          hero_image_url,
          published_at,
          seller_id,
          seller:public_sellers!articles_seller_id_fkey (
            id,
            official_name,
            seller_type
          )
        )
      `,
      { count: "exact" },
    )
    .eq("material_id", materialId)
    .eq("articles.status", "published");

  if (error !== null) {
    reportQueryError("公開記事の取得に失敗", error);
    return fail("internal");
  }

  if (count === null) {
    reportQueryError("公開記事の総件数が返されなかった", { materialId });
    return fail("internal");
  }

  const relationRows: ArticleMaterialQueryRow[] = data;
  const articles: ArticleQueryRow[] = [];

  for (const relation of relationRows) {
    if (relation.articles === null) {
      reportQueryError("公開記事の内部結合結果がNULL", relation);
      return fail("internal");
    }

    articles.push(relation.articles);
  }

  articles.sort(byPublishedAtDesc);

  const counts = await getContentCounts(
    supabase,
    "article",
    articles.map(({ id }) => id),
  );

  if (!counts.ok) {
    return counts;
  }

  return succeed({
    total: count,
    items: articles.map((article) => ({
      ...article,
      helpfulCount: counts.data.helpfulById.get(article.id) ?? 0,
      viewCount: counts.data.viewsById.get(article.id) ?? 0,
    })),
  });
}

export async function getReviewRatingDistribution(
  materialId: string,
): Promise<Result<ReviewRatingDistribution>> {
  const supabase = await createServerSupabase();
  return getReviewRatingDistributionWithSupabase(supabase, materialId);
}

export async function getReviewRatingDistributionWithSupabase(
  supabase: SupabaseClient<Database>,
  materialId: string,
): Promise<Result<ReviewRatingDistribution>> {
  const counts = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);
  let total = 0;

  for (let from = 0; ; from += POSTGREST_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("material_id", materialId)
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(from, from + POSTGREST_PAGE_SIZE - 1);

    if (error !== null) {
      reportQueryError("星分布用レビューの取得に失敗", error);
      return fail("internal");
    }

    const rows: Pick<ReviewRow, "rating">[] = data;

    for (const row of rows) {
      counts.set(row.rating, (counts.get(row.rating) ?? 0) + 1);
      total += 1;
    }

    if (rows.length < POSTGREST_PAGE_SIZE) {
      break;
    }
  }

  return succeed({
    total,
    stars: [
      { rating: 5, count: counts.get(5) ?? 0 },
      { rating: 4, count: counts.get(4) ?? 0 },
      { rating: 3, count: counts.get(3) ?? 0 },
      { rating: 2, count: counts.get(2) ?? 0 },
      { rating: 1, count: counts.get(1) ?? 0 },
    ],
  });
}
