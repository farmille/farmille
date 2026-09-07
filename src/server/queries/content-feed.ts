import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_PER_PAGE, pageRange, type Paginated } from "@/server/pagination";
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
type ViewCountRow = Database["public"]["Views"]["view_counts_daily"]["Row"];

export type ContentFeedFilter = "all" | "report" | "article";

export type ContentFeedArticleItem = {
  kind: "article";
  id: string;
  title: string;
  publishedAt: string;
  helpfulCount: number;
  viewCount: number;
  coverUrl: string | null;
  organization: string;
};

export type ContentFeedReportItem = {
  kind: "report";
  id: string;
  title: string;
  publishedAt: string;
  helpfulCount: number;
  viewCount: number;
  coverUrl: string | null;
  authorHandle: string;
  cropName: string;
};

export type ContentFeedItem = ContentFeedArticleItem | ContentFeedReportItem;

type FeedKey = {
  kind: "article" | "report";
  id: string;
  publishedAt: string;
};

type ArticleFeedRow = Pick<ArticleRow, "id" | "title" | "hero_image_url" | "published_at"> & {
  seller: Pick<PublicSellerRow, "official_name"> | null;
};

type ReportFeedRow = Pick<UsageReportRow, "id" | "title" | "published_at" | "material_id"> & {
  author: Pick<PublicProfileRow, "handle"> | null;
  crop: Pick<CropRow, "name"> | null;
  material: { name: string } | null;
  media: Pick<UsageReportMediaRow, "url" | "media_type" | "sort_order">[];
};

const FEED_FETCH_LIMIT = 1_000;

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/content-feed] ${operation}`, error);
}

function byPublishedAtDesc(left: FeedKey, right: FeedKey): number {
  const dateOrder = right.publishedAt.localeCompare(left.publishedAt);
  if (dateOrder !== 0) return dateOrder;
  const kindOrder = left.kind.localeCompare(right.kind);
  if (kindOrder !== 0) return kindOrder;
  return left.id.localeCompare(right.id);
}

function matchesSearch(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

async function loadCounts(
  supabase: SupabaseClient<Database>,
  targetType: "article" | "usage_report",
  targetIds: string[],
): Promise<Result<{ helpfulById: Map<string, number>; viewsById: Map<string, number> }>> {
  const helpfulById = new Map<string, number>();
  const viewsById = new Map<string, number>();

  if (targetIds.length === 0) {
    return succeed({ helpfulById, viewsById });
  }

  const [helpfulResult, viewResult] = await Promise.all([
    supabase
      .from("helpful_counts")
      .select("target_id, helpful_count")
      .eq("target_type", targetType)
      .in("target_id", targetIds),
    supabase
      .from("view_counts_daily")
      .select("target_id, view_count")
      .eq("target_type", targetType)
      .in("target_id", targetIds),
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

  return succeed({ helpfulById, viewsById });
}

async function fetchPublishedArticles(
  supabase: SupabaseClient<Database>,
  q: string | undefined,
): Promise<Result<ArticleFeedRow[]>> {
  let query = supabase
    .from("articles")
    .select(
      `
      id,
      title,
      hero_image_url,
      published_at,
      seller:public_sellers!articles_seller_id_fkey (
        official_name
      )
    `,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(FEED_FETCH_LIMIT);

  // 記事はタイトル列があるため DB 側で部分一致する。
  if (q !== undefined) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data, error } = await query;

  if (error !== null) {
    reportQueryError("公開記事一覧の取得に失敗", error);
    return fail("internal");
  }

  return succeed(data);
}

async function fetchPublishedReports(
  supabase: SupabaseClient<Database>,
): Promise<Result<ReportFeedRow[]>> {
  // タイトル NULL 行もあるため、絞り込みは取得後にタイトル／表示タイトルで行う。
  const { data, error } = await supabase
    .from("usage_reports")
    .select(
      `
      id,
      title,
      published_at,
      material_id,
      author:public_profiles!usage_reports_author_user_id_fkey (
        handle
      ),
      crop:crops!usage_reports_crop_id_fkey (
        name
      ),
      material:materials!usage_reports_material_id_fkey!inner (
        name
      ),
      media:usage_report_media (
        url,
        media_type,
        sort_order
      )
    `,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(FEED_FETCH_LIMIT);

  if (error !== null) {
    reportQueryError("公開使用レポート一覧の取得に失敗", error);
    return fail("internal");
  }

  return succeed(data);
}

function toArticleItem(
  row: ArticleFeedRow,
  helpfulCount: number,
  viewCount: number,
): Result<ContentFeedArticleItem> {
  if (row.published_at === null) {
    reportQueryError("published なのに published_at が無い", { id: row.id });
    return fail("internal");
  }

  if (row.seller?.official_name == null) {
    reportQueryError("記事のメーカー情報が欠落", { id: row.id });
    return fail("internal");
  }

  return succeed({
    kind: "article",
    id: row.id,
    title: row.title,
    publishedAt: row.published_at,
    helpfulCount,
    viewCount,
    coverUrl: row.hero_image_url,
    organization: row.seller.official_name,
  });
}

function toReportItem(
  row: ReportFeedRow,
  helpfulCount: number,
  viewCount: number,
): Result<ContentFeedReportItem> {
  if (row.published_at === null) {
    reportQueryError("published なのに published_at が無い", { id: row.id });
    return fail("internal");
  }

  if (row.author?.handle == null || row.crop === null || row.material === null) {
    reportQueryError("使用レポートの関連データが欠落", { id: row.id });
    return fail("internal");
  }

  const cover = row.media
    .filter((m) => m.media_type === "photo")
    .toSorted((a, b) => a.sort_order - b.sort_order)[0];

  return succeed({
    kind: "report",
    id: row.id,
    title: row.title ?? `${row.material.name} 使用レポート`,
    publishedAt: row.published_at,
    helpfulCount,
    viewCount,
    coverUrl: cover?.url ?? null,
    authorHandle: row.author.handle,
    cropName: row.crop.name,
  });
}

/**
 * 記事一覧（/articles）用。使用レポートと記事を published_at 降順で混載する。
 * タイトル部分一致検索・種別フィルタ・ページネーション対応。
 */
export async function listContentFeed({
  filter = "all",
  q,
  page = 1,
  perPage = DEFAULT_PER_PAGE,
}: {
  filter?: ContentFeedFilter;
  q?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<Result<Paginated<ContentFeedItem>>> {
  const trimmedQ = q?.trim();
  const searchQ = trimmedQ !== undefined && trimmedQ.length > 0 ? trimmedQ : undefined;
  const { from, to } = pageRange(page, perPage);
  const supabase = await createServerSupabase();

  const [articlesResult, reportsResult] = await Promise.all([
    filter === "report" ? succeed([]) : fetchPublishedArticles(supabase, searchQ),
    filter === "article" ? succeed([]) : fetchPublishedReports(supabase),
  ]);

  if (!articlesResult.ok) return articlesResult;
  if (!reportsResult.ok) return reportsResult;

  const keys: FeedKey[] = [];

  for (const row of articlesResult.data) {
    if (row.published_at === null) {
      reportQueryError("published なのに published_at が無い", { id: row.id });
      return fail("internal");
    }
    keys.push({ kind: "article", id: row.id, publishedAt: row.published_at });
  }

  for (const row of reportsResult.data) {
    if (row.published_at === null) {
      reportQueryError("published なのに published_at が無い", { id: row.id });
      return fail("internal");
    }

    if (row.material === null) {
      reportQueryError("使用レポートの資材が欠落", { id: row.id });
      return fail("internal");
    }

    const displayTitle = row.title ?? `${row.material.name} 使用レポート`;

    if (searchQ !== undefined && !matchesSearch(displayTitle, searchQ)) {
      continue;
    }

    keys.push({ kind: "report", id: row.id, publishedAt: row.published_at });
  }

  keys.sort(byPublishedAtDesc);

  const total = keys.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  const pageKeys = keys.slice(from, to + 1);

  const articleIds = pageKeys.filter((k) => k.kind === "article").map((k) => k.id);
  const reportIds = pageKeys.filter((k) => k.kind === "report").map((k) => k.id);

  const articleById = new Map(articlesResult.data.map((row) => [row.id, row]));
  const reportById = new Map(reportsResult.data.map((row) => [row.id, row]));

  const [articleCounts, reportCounts] = await Promise.all([
    loadCounts(supabase, "article", articleIds),
    loadCounts(supabase, "usage_report", reportIds),
  ]);

  if (!articleCounts.ok) return articleCounts;
  if (!reportCounts.ok) return reportCounts;

  const items: ContentFeedItem[] = [];

  for (const key of pageKeys) {
    if (key.kind === "article") {
      const row = articleById.get(key.id);
      if (row === undefined) {
        reportQueryError("ページ内の記事が見つからない", key);
        return fail("internal");
      }
      const item = toArticleItem(
        row,
        articleCounts.data.helpfulById.get(key.id) ?? 0,
        articleCounts.data.viewsById.get(key.id) ?? 0,
      );
      if (!item.ok) return item;
      items.push(item.data);
      continue;
    }

    const row = reportById.get(key.id);
    if (row === undefined) {
      reportQueryError("ページ内の使用レポートが見つからない", key);
      return fail("internal");
    }
    const item = toReportItem(
      row,
      reportCounts.data.helpfulById.get(key.id) ?? 0,
      reportCounts.data.viewsById.get(key.id) ?? 0,
    );
    if (!item.ok) return item;
    items.push(item.data);
  }

  return succeed({
    items,
    page,
    perPage,
    total,
    totalPages,
  });
}
