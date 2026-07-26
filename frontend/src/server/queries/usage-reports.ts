import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];
type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MediaRow = Database["public"]["Tables"]["usage_report_media"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];

export type RecentUsageReportItem = {
  id: string;
  title: string;
  publishedAt: string;
  helpfulCount: number;
  coverUrl: string | null;
  authorHandle: string;
  cropName: string;
  materialName: string;
};

type RecentReportQueryRow = Pick<
  UsageReportRow,
  "id" | "title" | "published_at" | "material_id"
> & {
  author: Pick<PublicProfileRow, "handle"> | null;
  crop: Pick<CropRow, "name"> | null;
  material: Pick<MaterialRow, "name"> | null;
  media: Pick<MediaRow, "url" | "media_type" | "sort_order">[];
};

function reportQueryError(operation: string, error: unknown): void {
  console.error(`[server/queries/usage-reports] ${operation}`, error);
}

/** ホームの新着使用レポート。published のみ。0件なら空配列。 */
export async function listRecentUsageReports({
  limit,
}: {
  limit: number;
}): Promise<Result<RecentUsageReportItem[]>> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit は1以上の整数で指定してください。");
  }

  const supabase = await createServerSupabase();
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
      material:materials!usage_reports_material_id_fkey (
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
    .limit(limit);

  if (error !== null) {
    reportQueryError("新着使用レポートの取得に失敗", error);
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
      reportQueryError("使用レポートの参考になった件数の取得に失敗", helpfulError);
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
      reportQueryError("使用レポートの関連データが欠落", { id: row.id });
      return fail("internal");
    }

    const cover = row.media
      .filter((m) => m.media_type === "photo")
      .toSorted((a, b) => a.sort_order - b.sort_order)[0];

    items.push({
      id: row.id,
      title: row.title ?? `${row.material.name} 使用結果レポート`,
      publishedAt: row.published_at,
      helpfulCount: helpfulById.get(row.id) ?? 0,
      coverUrl: cover?.url ?? null,
      authorHandle: row.author.handle,
      cropName: row.crop.name,
      materialName: row.material.name,
    });
  }

  return succeed(items);
}
