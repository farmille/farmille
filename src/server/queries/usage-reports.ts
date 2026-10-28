import { materialIllustrationUrl } from "@/lib/material-illustration";
import { reportVarietyNames, type UsageReportInput } from "@/lib/usage-report";
import {
  getStructuredUsageReport,
  getReportDocumentUrls,
  reportMediaUrl,
} from "@/server/usage-reports/structured";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/server/auth";
import { pickReportCover } from "@/server/usage-reports/model";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];
type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MediaRow = Database["public"]["Tables"]["usage_report_media"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["usage_report_applications"]["Row"];
type MetricRow = Database["public"]["Tables"]["usage_report_metrics"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];
type ViewCountRow = Database["public"]["Views"]["view_counts_total"]["Row"];

export type RecentUsageReportItem = {
  id: string;
  title: string;
  publishedAt: string;
  helpfulCount: number;
  coverUrl: string | null;
  authorHandle: string;
  authorUserId: string;
  cropName: string;
  materialName: string;
  materialId: string;
  summary: string;
};

type RecentReportQueryRow = Pick<
  UsageReportRow,
  "id" | "title" | "published_at" | "material_id" | "summary" | "author_user_id" | "form_version"
> & {
  author: Pick<PublicProfileRow, "handle"> | null;
  crop: Pick<CropRow, "name"> | null;
  material: Pick<MaterialRow, "name"> | null;
  media: Pick<MediaRow, "id" | "url" | "media_type" | "sort_order" | "measurement_id">[];
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/usage-reports] ${operation}`, error);
}

/** ホームの新着実証詳細レポート。published のみ。0件なら空配列。 */
export async function listRecentUsageReports({
  limit,
  ids,
}: {
  limit: number;
  ids?: string[];
}): Promise<Result<RecentUsageReportItem[]>> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit は1以上の整数で指定してください。");
  }

  const supabase = await createServerSupabase();
  if (ids?.length === 0) return succeed([]);
  let query = supabase
    .rpc("list_usage_report_previews")
    .select(
      `
      id,
      title,
      published_at,
      material_id,
      summary,
      author_user_id,
      form_version,
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
        id,
        url,
        media_type,
        sort_order,
        measurement_id
      )
    `,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);

  if (ids !== undefined) query = query.in("id", ids);
  const { data, error } = await query;

  if (error !== null) {
    reportQueryError("新着実証詳細レポートの取得に失敗", error);
    return fail("internal");
  }

  const rows: RecentReportQueryRow[] = data;
  const reportIds = rows.map(({ id }) => id);
  const helpfulById = new Map<string, number>();

  if (reportIds.length > 0) {
    const { data: helpfulRows, error: helpfulError } = await supabase
      .from("helpful_counts")
      .select("target_id, helpful_count")
      .eq("target_type", "usage_report")
      .in("target_id", reportIds);

    if (helpfulError !== null) {
      reportQueryError("実証詳細レポートの参考になった件数の取得に失敗", helpfulError);
      return fail("internal");
    }

    const counts: Pick<HelpfulCountRow, "target_id" | "helpful_count">[] = helpfulRows;

    for (const row of counts) {
      if (row.target_id === null || row.helpful_count === null) {
        reportQueryError("参考になった件数にNULLが含まれる", row);
        return fail("internal");
      }
      helpfulById.set(row.target_id, row.helpful_count);
    }
  }

  const items: RecentUsageReportItem[] = [];

  for (const row of rows) {
    if (row.published_at === null) {
      reportQueryError("published なのに published_at が無い", { id: row.id });
      return fail("internal");
    }

    if (row.author?.handle == null || row.crop === null || row.material === null) {
      reportQueryError("実証詳細レポートの関連データが欠落", { id: row.id });
      return fail("internal");
    }

    const cover = pickReportCover(row.media);

    items.push({
      id: row.id,
      title: row.title ?? `${row.material.name} 使用結果レポート`,
      publishedAt: row.published_at,
      helpfulCount: helpfulById.get(row.id) ?? 0,
      coverUrl:
        cover === null
          ? null
          : row.form_version === 2
            ? reportMediaUrl(cover.url, row.author_user_id)
            : cover.url,
      authorHandle: row.author.handle,
      authorUserId: row.author_user_id,
      cropName: row.crop.name,
      materialName: row.material.name,
      materialId: row.material_id,
      summary: row.summary,
    });
  }

  return succeed(
    ids === undefined ? items : items.toSorted((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)),
  );
}

type UsageReportDetailQueryRow = Omit<UsageReportRow, "editor_note" | "pdf_values_checked"> & {
  author: Pick<PublicProfileRow, "user_id" | "handle" | "avatar_url" | "standpoint"> | null;
  crop: Pick<CropRow, "id" | "name"> | null;
  material: Pick<
    MaterialRow,
    | "id"
    | "name"
    | "manufacturer_name"
    | "manufacturer_verified_at"
    | "avg_rating"
    | "container_type_id"
  > | null;
  media: Pick<MediaRow, "id" | "url" | "media_type" | "caption" | "placement" | "sort_order">[];
  applications: Pick<ApplicationRow, "id" | "applied_on" | "method" | "detail" | "sort_order">[];
  metrics: Pick<
    MetricRow,
    "id" | "metric_name" | "treated_value" | "untreated_value" | "unit" | "sort_order"
  >[];
};

export type PublishedUsageReportDetail = {
  formVersion: number;
  structured: UsageReportInput | null;
  documentUrls: Array<{ id: string; url: string }>;
  id: string;
  title: string;
  publishedAt: string;
  purposeTags: string[];
  purposeNote: string | null;
  prefectureCode: number | null;
  fieldName: string | null;
  variety: string | null;
  plantingDate: string | null;
  cultivationType: string | null;
  cultivationTags: string[];
  growthStage: string | null;
  climateNote: string | null;
  observedChange: string;
  negativeNote: string | null;
  summary: string;
  author: {
    userId: string;
    handle: string;
    avatarUrl: string | null;
    standpoint: string | null;
  };
  crop: { id: string; name: string };
  material: {
    id: string;
    name: string;
    manufacturerName: string;
    isOfficial: boolean;
    avgRating: number | null;
    imageUrl: string | null;
  };
  media: Array<{
    id: string;
    url: string;
    mediaType: "photo" | "video";
    caption: string | null;
    placement: string | null;
    sortOrder: number;
  }>;
  applications: Array<{
    id: string;
    appliedOn: string | null;
    method: string | null;
    detail: string | null;
    sortOrder: number;
  }>;
  metrics: Array<{
    id: string;
    metricName: string;
    treatedValue: number | null;
    untreatedValue: number | null;
    unit: string | null;
    sortOrder: number;
  }>;
  helpfulCount: number;
  viewCount: number;
};

async function getReportCounts(
  supabase: SupabaseClient<Database>,
  reportId: string,
): Promise<Result<{ helpfulCount: number; viewCount: number }>> {
  const [helpfulResult, viewResult] = await Promise.all([
    supabase
      .from("helpful_counts")
      .select("target_id, helpful_count")
      .eq("target_type", "usage_report")
      .eq("target_id", reportId)
      .maybeSingle(),
    supabase
      .from("view_counts_total")
      .select("target_id, view_count")
      .eq("target_type", "usage_report")
      .eq("target_id", reportId)
      .maybeSingle(),
  ]);

  if (helpfulResult.error !== null) {
    reportQueryError("実証詳細レポートの参考になった件数の取得に失敗", helpfulResult.error);
    return fail("internal");
  }

  if (viewResult.error !== null) {
    reportQueryError("実証詳細レポートの閲覧数の取得に失敗", viewResult.error);
    return fail("internal");
  }

  const helpfulRow: Pick<HelpfulCountRow, "target_id" | "helpful_count"> | null =
    helpfulResult.data;
  let helpfulCount = 0;

  if (helpfulRow !== null) {
    if (helpfulRow.helpful_count === null) {
      reportQueryError("参考になった件数にNULLが含まれる", helpfulRow);
      return fail("internal");
    }
    helpfulCount = helpfulRow.helpful_count;
  }

  const viewRow: Pick<ViewCountRow, "target_id" | "view_count"> | null = viewResult.data;
  let viewCount = 0;

  if (viewRow !== null) {
    if (viewRow.view_count === null) {
      reportQueryError("閲覧数にNULLが含まれる", viewRow);
      return fail("internal");
    }
    viewCount = viewRow.view_count;
  }

  return succeed({ helpfulCount, viewCount });
}

function toMediaType(value: string): "photo" | "video" | null {
  if (value === "photo" || value === "video") return value;
  return null;
}

/** published の実証詳細レポート詳細。draft/pending 等は null。 */
export async function getPublishedUsageReport(
  reportId: string,
): Promise<Result<PublishedUsageReportDetail | null>> {
  if (reportId.length === 0) {
    throw new Error("reportId は空にできません。");
  }

  const supabase = await createServerSupabase();
  const session = await getSessionUser();
  // 未ログインではDB側で本文を切り落とした公開用データだけを取得する。
  const query =
    session === null ? supabase.rpc("list_usage_report_previews") : supabase.from("usage_reports");
  const { data, error } = await query
    .select(
      `
      id, material_id, author_user_id, title, status, crop_id, purpose_tags, purpose_note,
      prefecture_code, field_name, variety, planting_date, cultivation_type, cultivation_tags,
      growth_stage, climate_note, observed_change, negative_note, summary, pesticide_ack,
      is_provided_sample, published_at, created_at, updated_at, form_version, variety_unknown,
      publish_city, cultivation_environment, timing_note, method_details_ack, documents_ack,
      common_plot_description,
      author:public_profiles!usage_reports_author_user_id_fkey (
        user_id,
        handle,
        avatar_url,
        standpoint
      ),
      crop:crops!usage_reports_crop_id_fkey (
        id,
        name
      ),
      material:materials!usage_reports_material_id_fkey!inner (
        id,
        name,
        manufacturer_name,
        manufacturer_verified_at,
        avg_rating,
        container_type_id
      ),
      media:usage_report_media (
        id,
        url,
        media_type,
        caption,
        placement,
        sort_order
      ),
      applications:usage_report_applications (
        id,
        applied_on,
        method,
        detail,
        sort_order
      ),
      metrics:usage_report_metrics (
        id,
        metric_name,
        treated_value,
        untreated_value,
        unit,
        sort_order
      )
    `,
    )
    .eq("id", reportId)
    .eq("status", "published")
    .maybeSingle();

  if (error !== null) {
    reportQueryError("公開実証詳細レポートの取得に失敗", error);
    return fail("internal");
  }

  if (data === null) {
    return succeed(null);
  }

  const row: UsageReportDetailQueryRow = data;

  if (row.published_at === null) {
    reportQueryError("published なのに published_at が無い", { id: row.id });
    return fail("internal");
  }

  if (
    row.author?.user_id == null ||
    row.author.handle == null ||
    row.crop === null ||
    row.material === null
  ) {
    reportQueryError("実証詳細レポートの関連データが欠落", { id: row.id });
    return fail("internal");
  }

  const media: PublishedUsageReportDetail["media"] = [];

  for (const item of row.media.toSorted(
    (a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id),
  )) {
    const mediaType = toMediaType(item.media_type);
    if (mediaType === null) {
      reportQueryError("未知の media_type", item);
      return fail("internal");
    }
    media.push({
      id: item.id,
      url: row.form_version === 2 ? reportMediaUrl(item.url, row.author_user_id) : item.url,
      mediaType,
      caption: item.caption,
      placement: item.placement,
      sortOrder: item.sort_order,
    });
  }

  const counts = await getReportCounts(supabase, row.id);

  if (!counts.ok) {
    return counts;
  }

  const structured =
    row.form_version === 2 && session !== null
      ? await getStructuredUsageReport(row.id, supabase)
      : succeed(null);
  if (!structured.ok) return structured;
  if (structured.data !== null && !structured.data.showCity) structured.data.city = "";
  const documentUrls =
    structured.data === null ? succeed([]) : await getReportDocumentUrls(structured.data, supabase);
  if (!documentUrls.ok) return documentUrls;

  return succeed({
    formVersion: row.form_version,
    structured: structured.data,
    documentUrls: documentUrls.data,
    id: row.id,
    title: row.title ?? `${row.material.name} 実証詳細レポート｜${row.crop.name}`,
    publishedAt: row.published_at,
    purposeTags: row.purpose_tags,
    purposeNote: row.purpose_note,
    prefectureCode: row.prefecture_code,
    fieldName: row.field_name,
    variety: structured.data === null ? row.variety : reportVarietyNames(structured.data) || null,
    plantingDate: row.planting_date,
    cultivationType: row.cultivation_type,
    cultivationTags: row.cultivation_tags,
    growthStage: row.growth_stage,
    climateNote: row.climate_note,
    observedChange: row.observed_change,
    negativeNote: row.negative_note,
    summary: row.summary,
    author: {
      userId: row.author.user_id,
      handle: row.author.handle,
      avatarUrl: row.author.avatar_url,
      standpoint: row.author.standpoint,
    },
    crop: row.crop,
    material: {
      id: row.material.id,
      name: row.material.name,
      manufacturerName: row.material.manufacturer_name,
      isOfficial: row.material.manufacturer_verified_at !== null,
      avgRating: row.material.avg_rating,
      imageUrl: materialIllustrationUrl(row.material.container_type_id),
    },
    media,
    applications: row.applications
      .toSorted((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      .map((app) => ({
        id: app.id,
        appliedOn: app.applied_on,
        method: app.method,
        detail: app.detail,
        sortOrder: app.sort_order,
      })),
    metrics: row.metrics
      .toSorted((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      .map((metric) => ({
        id: metric.id,
        metricName: metric.metric_name,
        treatedValue: metric.treated_value === null ? null : Number(metric.treated_value),
        untreatedValue: metric.untreated_value === null ? null : Number(metric.untreated_value),
        unit: metric.unit,
        sortOrder: metric.sort_order,
      })),
    helpfulCount: counts.data.helpfulCount,
    viewCount: counts.data.viewCount,
  });
}
