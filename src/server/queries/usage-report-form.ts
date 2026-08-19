import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import {
  applyApplicationDetail,
  cultivationTypeFromLabel,
  parseGrowthStage,
} from "@/server/usage-reports/application-detail";
import {
  PURPOSE_OPTIONS,
  createBlankCropReport,
  type CropReportInput,
  type ReportMediaInput,
} from "@/server/usage-reports/model";
import type { Database } from "@/types/database.types";

type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type CropGroupRow = Database["public"]["Tables"]["crop_groups"]["Row"];
type UsageReportRow = Database["public"]["Tables"]["usage_reports"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["usage_report_applications"]["Row"];
type MediaRow = Database["public"]["Tables"]["usage_report_media"]["Row"];
type MetricRow = Database["public"]["Tables"]["usage_report_metrics"]["Row"];

const PURPOSE_OPTION_SET: ReadonlySet<string> = new Set(PURPOSE_OPTIONS);

type CropQueryRow = Pick<CropRow, "id" | "name" | "aliases" | "sort_order"> & {
  crop_groups: Pick<CropGroupRow, "name" | "sort_order"> | null;
};

type DraftReportQueryRow = UsageReportRow & {
  crop: CropQueryRow | null;
  applications: ApplicationRow[];
  media: MediaRow[];
  metrics: MetricRow[];
};

export type CropOption = {
  id: string;
  name: string;
  aliases: string[];
  groupName: string;
};

export type SubmittedUsageReport = {
  id: string;
  cropName: string;
  status: "pending";
  updatedAt: string;
};

export type UsageReportDraft = {
  cropReports: CropReportInput[];
  media: ReportMediaInput[];
  summary: string;
};

export type UsageReportFormData = {
  crops: CropOption[];
  draft: UsageReportDraft | null;
  submitted: SubmittedUsageReport[];
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/usage-report-form] ${operation}`, error);
}

function bySortOrder<T extends { id: string; sort_order: number }>(left: T, right: T): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

function toCropOption(row: CropQueryRow): CropOption | null {
  if (row.crop_groups === null) return null;
  return {
    id: row.id,
    name: row.name,
    aliases: row.aliases,
    groupName: row.crop_groups.name,
  };
}

function toMediaInput(row: MediaRow): ReportMediaInput | null {
  if (row.media_type !== "photo" && row.media_type !== "video") return null;
  if (
    row.placement !== "observation" &&
    row.placement !== "cover" &&
    row.placement !== "method" &&
    row.placement !== "harvest" &&
    row.placement !== "summary"
  ) {
    return null;
  }

  return {
    key: row.id,
    url: row.url,
    mediaType: row.media_type,
    placement: row.placement,
    caption: row.caption ?? "",
  };
}

function toCropReport(row: DraftReportQueryRow): CropReportInput | null {
  if (row.crop === null) return null;
  const applications = row.applications.toSorted(bySortOrder);
  const firstApplication = applications[0] ?? null;
  const input = applyApplicationDetail(
    row.crop_id,
    firstApplication?.method ?? null,
    firstApplication?.detail ?? null,
  );
  const growthStage = parseGrowthStage(row.growth_stage);

  input.observedChange = row.observed_change;
  input.negativeNote = row.negative_note ?? "";
  input.purposeTags = row.purpose_tags.filter((tag) => PURPOSE_OPTION_SET.has(tag));
  input.purposeNote = row.purpose_note ?? "";
  input.prefectureCode = row.prefecture_code?.toString() ?? "";
  input.fieldName = row.field_name ?? "";
  input.variety = row.variety ?? "";
  input.plantingDate = row.planting_date ?? "";
  input.cultivationType = cultivationTypeFromLabel(row.cultivation_type);
  input.cultivationTags = row.cultivation_tags;
  input.growthStage = growthStage.growthStage;
  input.growthStageNote = growthStage.growthStageNote;
  input.climateEnabled = (row.climate_note?.length ?? 0) > 0;
  input.climateNote = row.climate_note ?? "";
  input.applicationDates = applications.flatMap(({ applied_on }) =>
    applied_on === null ? [] : [applied_on],
  );
  input.metrics = row.metrics.toSorted(bySortOrder).map((metric) => ({
    key: metric.id,
    metricName: metric.metric_name,
    untreatedValue: metric.untreated_value?.toString() ?? "",
    treatedValue: metric.treated_value?.toString() ?? "",
    unit: metric.unit ?? "",
  }));
  input.metricsEnabled = input.metrics.length > 0;

  if (input.metrics.length === 0) {
    input.metrics = createBlankCropReport(row.crop_id).metrics;
  }

  return input;
}

export async function getUsageReportFormData(
  materialId: string,
  userId: string,
): Promise<Result<UsageReportFormData>> {
  const supabase = await createServerSupabase();
  const [cropsResult, reportsResult] = await Promise.all([
    supabase
      .from("crops")
      .select(
        `
          id,
          name,
          aliases,
          sort_order,
          crop_groups!crops_group_id_fkey (
            name,
            sort_order
          )
        `,
      )
      .order("sort_order", { referencedTable: "crop_groups", ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("usage_reports")
      .select(
        `
          *,
          crop:crops!usage_reports_crop_id_fkey (
            id,
            name,
            aliases,
            sort_order,
            crop_groups!crops_group_id_fkey (
              name,
              sort_order
            )
          ),
          applications:usage_report_applications (*),
          media:usage_report_media (*),
          metrics:usage_report_metrics (*)
        `,
      )
      .eq("material_id", materialId)
      .eq("author_user_id", userId)
      .in("status", ["draft", "pending"])
      .order("updated_at", { ascending: true }),
  ]);

  if (cropsResult.error !== null) {
    reportQueryError("作物マスタの取得に失敗", cropsResult.error);
    return fail("internal");
  }
  if (reportsResult.error !== null) {
    reportQueryError("使用レポート入力データの取得に失敗", reportsResult.error);
    return fail("internal");
  }

  const cropRows: CropQueryRow[] = cropsResult.data;
  const reportRows: DraftReportQueryRow[] = reportsResult.data;
  const crops = cropRows.map(toCropOption);
  if (crops.some((crop) => crop === null)) {
    reportQueryError("作物の作物群が欠落", cropsResult.data);
    return fail("internal");
  }

  const draftRows = reportRows.filter((row) => row.status === "draft");
  const pendingRows = reportRows.filter((row) => row.status === "pending");

  if (draftRows.length > 0 && pendingRows.length > 0) {
    reportQueryError("同じ資材に draft と pending が混在", { materialId, userId });
    return fail("conflict");
  }

  const submitted: SubmittedUsageReport[] = [];
  for (const row of pendingRows) {
    if (row.crop === null) {
      reportQueryError("pending 使用レポートの作物が欠落", row.id);
      return fail("internal");
    }
    submitted.push({
      id: row.id,
      cropName: row.crop.name,
      status: "pending",
      updatedAt: row.updated_at,
    });
  }

  if (draftRows.length === 0) {
    return succeed({
      crops: crops.filter((crop): crop is CropOption => crop !== null),
      draft: null,
      submitted,
    });
  }

  const cropIds = new Set<string>();
  const cropReports: CropReportInput[] = [];
  for (const row of draftRows) {
    if (cropIds.has(row.crop_id)) {
      reportQueryError("同じ作物の draft が重複", { materialId, cropId: row.crop_id });
      return fail("conflict");
    }
    cropIds.add(row.crop_id);
    const cropReport = toCropReport(row);
    if (cropReport === null) {
      reportQueryError("draft 使用レポートの関連データが欠落", row.id);
      return fail("internal");
    }
    cropReports.push(cropReport);
  }

  const firstDraft = draftRows[0];
  const media = firstDraft.media.toSorted(bySortOrder).map(toMediaInput);
  if (media.some((item) => item === null)) {
    reportQueryError("draft 使用レポートに未知のメディア値", firstDraft.id);
    return fail("internal");
  }

  return succeed({
    crops: crops.filter((crop): crop is CropOption => crop !== null),
    draft: {
      cropReports,
      media: media.filter((item): item is ReportMediaInput => item !== null),
      summary: firstDraft.summary,
    },
    submitted: [],
  });
}
