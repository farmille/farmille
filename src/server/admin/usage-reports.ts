import { reportVarietyNames, type UsageReportInput } from "@/lib/usage-report";
import {
  getStructuredUsageReport,
  getReportDocumentUrls,
  reportMediaUrl,
} from "@/server/usage-reports/structured";
import { reportAdminError, withAdmin } from "@/server/admin/guard";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type ApplicationRow = Database["public"]["Tables"]["usage_report_applications"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MediaRow = Database["public"]["Tables"]["usage_report_media"]["Row"];
type MetricRow = Database["public"]["Tables"]["usage_report_metrics"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];

export const EDITORIAL_REPORT_STATUSES = ["pending", "published", "declined"] as const;
export type EditorialReportStatus = (typeof EDITORIAL_REPORT_STATUSES)[number];

export const EDITORIAL_REPORT_STATUS_LABELS = {
  pending: "確認待ち",
  published: "公開済み",
  declined: "差し戻し",
} satisfies Record<EditorialReportStatus, string>;

type PendingReportQueryRow = Pick<UsageReportRow, "id" | "title" | "status" | "created_at"> & {
  author: Pick<ProfileRow, "user_id" | "handle"> | null;
  crop: Pick<CropRow, "id" | "name"> | null;
  material: Pick<MaterialRow, "id" | "name"> | null;
};

type EditorialDetailQueryRow = UsageReportRow & {
  author: Pick<ProfileRow, "user_id" | "handle"> | null;
  crop: Pick<CropRow, "id" | "name"> | null;
  material: Pick<MaterialRow, "id" | "name"> | null;
  media: Pick<MediaRow, "id" | "url" | "media_type" | "caption" | "placement" | "sort_order">[];
  applications: Pick<ApplicationRow, "id" | "applied_on" | "method" | "detail" | "sort_order">[];
  metrics: Pick<
    MetricRow,
    "id" | "metric_name" | "treated_value" | "untreated_value" | "unit" | "sort_order"
  >[];
};

export type PendingUsageReportItem = {
  id: string;
  title: string;
  createdAt: string;
  author: { userId: string; handle: string };
  crop: { id: string; name: string };
  material: { id: string; name: string };
};

export type UsageReportEditorialDetail = {
  formVersion: number;
  structured: UsageReportInput | null;
  documentUrls: Array<{ id: string; url: string }>;
  id: string;
  title: string;
  status: EditorialReportStatus;
  createdAt: string;
  publishedAt: string | null;
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
  editorNote: string | null;
  author: { userId: string; handle: string };
  crop: { id: string; name: string };
  material: { id: string; name: string };
  applications: Array<{
    id: string;
    appliedOn: string | null;
    method: string | null;
    detail: string | null;
    sortOrder: number;
  }>;
  media: Array<{
    id: string;
    url: string;
    mediaType: "photo" | "video";
    caption: string | null;
    placement: string | null;
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
};

export type UsageReportEditorialInput = {
  title: string;
  observedChange: string;
  negativeNote: string;
  summary: string;
  editorNote: string;
};

export type UsageReportEditorialOperation = "save" | "publish" | "decline";

function reportError<ErrorValue>(operation: string, error: ErrorValue): void {
  reportAdminError("usage-reports", operation, error);
}

export function isUsageReportEditorialOperation(
  value: string | null,
): value is UsageReportEditorialOperation {
  return value === "save" || value === "publish" || value === "decline";
}

function isEditorialReportStatus(value: string): value is EditorialReportStatus {
  return EDITORIAL_REPORT_STATUSES.some((status) => status === value);
}

function optionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

/** draft を除外し、編集局が確認できる pending のみを一覧へ返す。 */
export async function listPendingUsageReports(): Promise<Result<PendingUsageReportItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("usage_reports")
      .select(
        `
          id,
          title,
          status,
          created_at,
          author:profiles!usage_reports_author_user_id_fkey (
            user_id,
            handle
          ),
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
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error !== null) {
      reportError("pending 一覧の取得に失敗", error);
      return fail("internal");
    }

    const rows: PendingReportQueryRow[] = data;
    const items: PendingUsageReportItem[] = [];

    for (const row of rows) {
      if (row.author === null || row.crop === null || row.material === null) {
        reportError("pending 実証詳細レポートの関連データが欠落", row);
        return fail("internal");
      }

      items.push({
        id: row.id,
        title: row.title ?? `${row.material.name} 実証詳細レポート｜${row.crop.name}`,
        createdAt: row.created_at,
        author: { userId: row.author.user_id, handle: row.author.handle },
        crop: row.crop,
        material: row.material,
      });
    }

    return succeed(items);
  });
}

/** pending／published／declined の編集局詳細。draft は編集局画面へ出さない。 */
export async function getUsageReportEditorialDetail(
  reportId: string,
): Promise<Result<UsageReportEditorialDetail>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("usage_reports")
      .select(
        `
          *,
          author:profiles!usage_reports_author_user_id_fkey (
            user_id,
            handle
          ),
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
      .in("status", [...EDITORIAL_REPORT_STATUSES])
      .maybeSingle();

    if (error !== null) {
      reportError("編集局詳細の取得に失敗", error);
      return fail("internal");
    }
    if (data === null) return fail("not_found");

    const row: EditorialDetailQueryRow = data;
    if (
      row.author === null ||
      row.crop === null ||
      row.material === null ||
      !isEditorialReportStatus(row.status)
    ) {
      reportError("編集局詳細の関連データまたは状態が不正", row);
      return fail("internal");
    }

    const media: UsageReportEditorialDetail["media"] = [];
    for (const item of row.media.toSorted(
      (left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id),
    )) {
      if (item.media_type !== "photo" && item.media_type !== "video") {
        reportError("未知の実証詳細レポート media_type", item);
        return fail("internal");
      }
      media.push({
        id: item.id,
        url: row.form_version === 2 ? reportMediaUrl(item.url, row.author_user_id) : item.url,
        mediaType: item.media_type,
        caption: item.caption,
        placement: item.placement,
        sortOrder: item.sort_order,
      });
    }

    const structured =
      row.form_version === 2 ? await getStructuredUsageReport(row.id, supabase) : succeed(null);
    if (!structured.ok) return structured;
    const documentUrls =
      structured.data === null
        ? succeed([])
        : await getReportDocumentUrls(structured.data, supabase);
    if (!documentUrls.ok) return documentUrls;

    return succeed({
      formVersion: row.form_version,
      structured: structured.data,
      documentUrls: documentUrls.data,
      id: row.id,
      title: row.title ?? `${row.material.name} 実証詳細レポート｜${row.crop.name}`,
      status: row.status,
      createdAt: row.created_at,
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
      editorNote: row.editor_note,
      author: { userId: row.author.user_id, handle: row.author.handle },
      crop: row.crop,
      material: row.material,
      applications: row.applications
        .toSorted(
          (left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id),
        )
        .map((item) => ({
          id: item.id,
          appliedOn: item.applied_on,
          method: item.method,
          detail: item.detail,
          sortOrder: item.sort_order,
        })),
      media,
      metrics: row.metrics
        .toSorted(
          (left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id),
        )
        .map((item) => ({
          id: item.id,
          metricName: item.metric_name,
          treatedValue: item.treated_value,
          untreatedValue: item.untreated_value,
          unit: item.unit,
          sortOrder: item.sort_order,
        })),
    });
  });
}

/**
 * pending の調整内容を保存し、必要なら同じ更新で published／declined へ進める。
 * 差し戻し理由は投稿者対応に必要なため editor_note への入力を必須にする。
 */
export async function updateUsageReportEditorial(
  reportId: string,
  operation: UsageReportEditorialOperation,
  input: UsageReportEditorialInput,
): Promise<Result<null>> {
  const title = input.title.trim();
  const observedChange = input.observedChange.trim();
  const summary = input.summary.trim();
  const editorNote = optionalText(input.editorNote);

  if (title.length === 0 || observedChange.length === 0) {
    return fail("invalid_body");
  }
  if (operation === "decline" && editorNote === null) return fail("invalid_body");

  return withAdmin(async ({ supabase }) => {
    const current = await supabase
      .from("usage_reports")
      .select("form_version")
      .eq("id", reportId)
      .eq("status", "pending")
      .maybeSingle();
    if (current.error !== null) return fail("internal");
    if (current.data === null) return fail("conflict");
    if (current.data.form_version !== 2 && summary.length === 0) return fail("invalid_body");
    const update: Database["public"]["Tables"]["usage_reports"]["Update"] = {
      title,
      observed_change: observedChange,
      negative_note: optionalText(input.negativeNote),
      summary:
        current.data.form_version === 2
          ? Array.from(observedChange).slice(0, 120).join("")
          : summary,
      editor_note: editorNote,
    };
    if (operation === "publish") {
      update.status = "published";
      update.published_at = new Date().toISOString();
    }
    if (operation === "decline") {
      update.status = "declined";
      update.published_at = null;
    }

    const { data, error } = await supabase
      .from("usage_reports")
      .update(update)
      .eq("id", reportId)
      .eq("status", "pending")
      .select("id");

    if (error !== null) {
      reportError("編集局の調整内容の保存に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("conflict");

    return succeed(null);
  });
}
