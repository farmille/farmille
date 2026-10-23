import type { SupabaseClient } from "@supabase/supabase-js";
import { prefectureName } from "@/lib/prefectures";
import { firstReportChart, type ReportChartPreview } from "@/lib/usage-report";

import { selectAllRows } from "@/server/pagination";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];
type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type PublicSellerRow = Database["public"]["Views"]["public_sellers"]["Row"];
type UsageReportMediaRow = Database["public"]["Tables"]["usage_report_media"]["Row"];
type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];
type ViewCountRow = Database["public"]["Views"]["view_counts_total"]["Row"];

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

type ArticleSeller = Pick<PublicSellerRow, "id" | "official_name">;

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
        .from("view_counts_total")
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

      viewsById.set(row.target_id, row.view_count);
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
    .rpc("list_usage_report_previews", undefined, { count: "exact" })
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
    reportQueryError("公開実証詳細レポートの取得に失敗", error);
    return fail("internal");
  }

  if (count === null) {
    reportQueryError("公開実証詳細レポートの総件数が返されなかった", { materialId });
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

const CARD_CHART_MEASUREMENT_LIMIT = 5;
const CARD_CHART_GRAPH_LIMIT = 3;

/** グラフにできる測定がないレポートでも、都道府県は出せるように分けて持つ。 */
export type UsageReportCardDetail = { chart: ReportChartPreview | null; prefecture: string | null };

function selectCardRows(supabase: SupabaseClient<Database>, reportIds: string[], bounded: boolean) {
  const query = supabase
    .from("usage_reports")
    .select(
      `id, prefecture_code,
      plots:usage_report_plots(id, name, sort_order),
      measurements:usage_report_measurements(kind, name, unit, sort_order,
        graphs:usage_report_graphs(heading, sort_order,
          rows:usage_report_graph_rows(id, plot_id, label, value_text, sort_order)))`,
    )
    .in("id", reportIds)
    .eq("form_version", 2)
    .eq("measurements.kind", "numeric");
  if (!bounded) return query;
  // 区（行）は全件取り、カードに出さなかった区の数を正しく数える（区は1レポートで最大20）。
  return query
    .order("sort_order", { referencedTable: "measurements" })
    .limit(CARD_CHART_MEASUREMENT_LIMIT, { referencedTable: "measurements" })
    .order("sort_order", { referencedTable: "measurements.graphs" })
    .limit(CARD_CHART_GRAPH_LIMIT, { referencedTable: "measurements.graphs" });
}

type CardRowsReport = NonNullable<Awaited<ReturnType<typeof selectCardRows>>["data"]>[number];

function cardChart(report: CardRowsReport) {
  const byOrder = (left: { sort_order: number }, right: { sort_order: number }) =>
    left.sort_order - right.sort_order;
  return firstReportChart(
    report.measurements.toSorted(byOrder).map((measurement) => ({
      ...measurement,
      graphs: measurement.graphs.toSorted(byOrder).map((graph) => ({
        heading: graph.heading,
        rows: graph.rows.toSorted(byOrder).map((row) => ({
          id: row.id,
          plotId: row.plot_id,
          label: row.label,
          value: row.value_text,
        })),
      })),
    })),
    report.plots.toSorted(byOrder),
  );
}

/** 上限まで取れていたら、その先に読めるグラフが残っているかもしれない。 */
function mayHaveMore(report: CardRowsReport) {
  return (
    report.measurements.length >= CARD_CHART_MEASUREMENT_LIMIT ||
    report.measurements.some((measurement) => measurement.graphs.length >= CARD_CHART_GRAPH_LIMIT)
  );
}

/**
 * 一覧カードに添えるグラフと都道府県。定量データと地域は会員だけが読めるので、
 * ログインしていない閲覧者からは呼ばない（RLS でも返らない）。構造化前のレポートは対象外。
 * カードに出すのは最初に読めた1枚だけなので、先頭の測定とグラフだけを取る。
 * その範囲に読めるグラフがなく、上限まで取れていたレポートだけを、上限なしで取り直す。
 */
export async function listUsageReportCardDetails(
  reportIds: string[],
): Promise<Result<Map<string, UsageReportCardDetail>>> {
  if (reportIds.length === 0) return succeed(new Map());
  const supabase = await createServerSupabase();
  const first = await selectCardRows(supabase, reportIds, true);
  if (first.error !== null) {
    reportQueryError("レポートのグラフの取得に失敗", first.error);
    return fail("internal");
  }

  const details = new Map<string, UsageReportCardDetail>();
  const retry: string[] = [];
  for (const report of first.data) {
    const chart = cardChart(report);
    if (chart === null && mayHaveMore(report)) retry.push(report.id);
    details.set(report.id, {
      chart,
      prefecture: report.prefecture_code === null ? null : prefectureName(report.prefecture_code),
    });
  }
  if (retry.length === 0) return succeed(details);

  const full = await selectCardRows(supabase, retry, false);
  if (full.error !== null) {
    reportQueryError("レポートのグラフの取得に失敗", full.error);
    return fail("internal");
  }
  for (const report of full.data) {
    const detail = details.get(report.id);
    if (detail === undefined) continue;
    details.set(report.id, { ...detail, chart: cardChart(report) });
  }
  return succeed(details);
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
            official_name
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
  const { data, error } = await selectAllRows((from, to) =>
    supabase
      .from("reviews")
      .select("rating")
      .eq("material_id", materialId)
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(from, to),
  );

  if (error !== null) {
    reportQueryError("星分布用感想口コミの取得に失敗", error);
    return fail("internal");
  }

  const counts = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);

  for (const row of data) {
    counts.set(row.rating, (counts.get(row.rating) ?? 0) + 1);
  }

  return succeed({
    total: data.length,
    stars: [
      { rating: 5, count: counts.get(5) ?? 0 },
      { rating: 4, count: counts.get(4) ?? 0 },
      { rating: 3, count: counts.get(3) ?? 0 },
      { rating: 2, count: counts.get(2) ?? 0 },
      { rating: 1, count: counts.get(1) ?? 0 },
    ],
  });
}
