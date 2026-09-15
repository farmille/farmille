import * as v from "valibot";

import { clientEnv } from "@/env";
import { createServerSupabase } from "@/server/supabase";
import {
  applicationMethodLabel,
  cultivationTypeLabel,
  growthStageValue,
  serializeApplicationDetail,
} from "@/server/usage-reports/application-detail";
import {
  APPLICATION_METHODS,
  CULTIVATION_FEATURES,
  CULTIVATION_TYPES,
  PURPOSE_OPTIONS,
  STAGE_SETS,
  stageSetForGroup,
  type CropReportInput,
  type ReportMediaInput,
  type UsageReportActionResult,
  type UsageReportFieldErrors,
  type UsageReportFormPayload,
  UsageReportFormPayloadSchema,
} from "@/server/usage-reports/model";
import type { Database } from "@/types/database.types";

type UsageReportInsert = Database["public"]["Tables"]["usage_reports"]["Insert"];
type ApplicationInsert = Database["public"]["Tables"]["usage_report_applications"]["Insert"];
type MediaInsert = Database["public"]["Tables"]["usage_report_media"]["Insert"];
type MetricInsert = Database["public"]["Tables"]["usage_report_metrics"]["Insert"];

type MutationMode = "draft" | "submit";

type ExistingReport = {
  id: string;
  crop_id: string;
  status: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALL_STAGES: ReadonlySet<string> = new Set(Object.values(STAGE_SETS).flat());
const ALL_CULTIVATION_FEATURES: ReadonlySet<string> = new Set(CULTIVATION_FEATURES.all);
const PURPOSE_OPTION_SET = new Set<string>(PURPOSE_OPTIONS);
const CULTIVATION_TYPE_SET: ReadonlySet<string> = new Set(
  CULTIVATION_TYPES.map(({ value }) => value),
);
const APPLICATION_METHOD_SET: ReadonlySet<string> = new Set(
  APPLICATION_METHODS.map(({ value }) => value),
);
function mutationError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/mutations/usage-reports] ${operation}`, error);
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isNumericInput(value: string): boolean {
  if (value.trim().length === 0) return false;
  return Number.isFinite(Number(value));
}

function validateSharedVocabulary(
  input: UsageReportFormPayload,
  errors: UsageReportFieldErrors,
): void {
  const cropIds = new Set<string>();

  for (const crop of input.cropReports) {
    const prefix = `${crop.cropId}.`;
    if (cropIds.has(crop.cropId)) {
      errors.crops = "同じ作物が重複しています。";
    }
    cropIds.add(crop.cropId);

    if (crop.purposeTags.some((tag) => !PURPOSE_OPTION_SET.has(tag))) {
      errors[`${prefix}purposeTags`] = "使用目的に選択できない値が含まれています。";
    }
    if (crop.cultivationTags.some((tag) => !ALL_CULTIVATION_FEATURES.has(tag))) {
      errors[`${prefix}cultivationTags`] = "栽培の特徴に選択できない値が含まれています。";
    }
    if (crop.cultivationType !== "" && !CULTIVATION_TYPE_SET.has(crop.cultivationType)) {
      errors[`${prefix}cultivationType`] = "栽培区分を選び直してください。";
    }
    if (crop.applicationMethod !== "" && !APPLICATION_METHOD_SET.has(crop.applicationMethod)) {
      errors[`${prefix}applicationMethod`] = "使用方法を選び直してください。";
    }
    if (crop.growthStage !== "" && !ALL_STAGES.has(crop.growthStage)) {
      errors[`${prefix}growthStage`] = "生育ステージを選び直してください。";
    }
    if (crop.plantingDate !== "" && !isValidDate(crop.plantingDate)) {
      errors[`${prefix}plantingDate`] = "定植時期の日付を選び直してください。";
    }
    if (crop.applicationDates.some((date) => !isValidDate(date))) {
      errors[`${prefix}applicationDates`] = "処理日の日付を選び直してください。";
    }
    if (
      crop.comparison.otherBsUse !== "" &&
      crop.comparison.otherBsUse !== "no" &&
      crop.comparison.otherBsUse !== "yes"
    ) {
      errors[`${prefix}comparison`] = "比較区の入力内容を確認してください。";
    }
  }

  const videoCount = input.media.filter(({ mediaType }) => mediaType === "video").length;
  if (videoCount > 1) {
    errors.media = "動画は1本まで追加できます。";
  }
}

export function validateUsageReportSubmission(
  input: UsageReportFormPayload,
): UsageReportFieldErrors {
  const errors: UsageReportFieldErrors = {};
  validateSharedVocabulary(input, errors);

  if (input.summary.trim().length === 0) {
    errors.summary = "まとめ・感想を入力してください。";
  }
  if (!input.pesticideAck) {
    errors.pesticideAck = "内容を確認し、同意にチェックを入れてください。";
  }

  for (const crop of input.cropReports) {
    const prefix = `${crop.cropId}.`;
    if (crop.observedChange.trim().length === 0) {
      errors[`${prefix}observedChange`] = "観察した変化を入力してください。";
    }
    if (crop.purposeTags.length === 0) {
      errors[`${prefix}purposeTags`] = "使用目的を1つ以上選択してください。";
    }
    const prefecture = Number(crop.prefectureCode);
    if (
      crop.prefectureCode === "" ||
      !Number.isInteger(prefecture) ||
      prefecture < 1 ||
      prefecture > 47
    ) {
      errors[`${prefix}prefectureCode`] = "地域を選択してください。";
    }
    if (crop.cultivationType === "") {
      errors[`${prefix}cultivationType`] = "栽培区分を選択してください。";
    }
    if (crop.growthStage === "") {
      errors[`${prefix}growthStage`] = "生育ステージを選択してください。";
    }
    if (crop.applicationDates.length === 0) {
      errors[`${prefix}applicationDates`] = "処理日を1日以上選択してください。";
    }
    if (crop.applicationMethod === "") {
      errors[`${prefix}applicationMethod`] = "使用方法を選択してください。";
    }
    if (crop.applicationMethod === "spray" && crop.sprayDilutionValue.trim() === "") {
      errors[`${prefix}methodDetail`] = "希釈倍率・濃度を入力してください。";
    }
    if (crop.applicationMethod === "soil" && crop.soilMethod.trim() === "") {
      errors[`${prefix}methodDetail`] = "施用方法を選択してください。";
    }
    if (crop.applicationMethod === "seed" && crop.seedMethod.trim() === "") {
      errors[`${prefix}methodDetail`] = "処理方法を選択してください。";
    }
    if (crop.applicationMethod === "other" && crop.otherMethodDetail.trim() === "") {
      errors[`${prefix}methodDetail`] = "処理した対象・方法・量を入力してください。";
    }
    if (crop.metricsEnabled) {
      if (crop.metrics.length === 0) {
        errors[`${prefix}metrics`] = "定量データを1件以上入力してください。";
      } else if (
        crop.metrics.some(
          (metric) =>
            metric.metricName.trim() === "" ||
            metric.unit.trim() === "" ||
            !isNumericInput(metric.untreatedValue) ||
            !isNumericInput(metric.treatedValue),
        )
      ) {
        errors[`${prefix}metrics`] = "指標名、対照区値、処理区値、単位をすべて入力してください。";
      }
    }
  }

  return errors;
}

function validationFailure(
  message: string,
  fieldErrors: UsageReportFieldErrors,
): UsageReportActionResult {
  return { ok: false, message, fieldErrors };
}

function internalFailure(): UsageReportActionResult {
  return {
    ok: false,
    message: "保存中に問題が発生しました。時間をおいて再度お試しください。",
    fieldErrors: {},
  };
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function ownedMediaUrl(urlValue: string, userId: string): boolean {
  try {
    const url = new URL(urlValue);
    const supabaseUrl = new URL(clientEnv.supabaseUrl);
    const expectedPrefix = `/storage/v1/object/public/report-media/${userId}/`;
    return url.origin === supabaseUrl.origin && url.pathname.startsWith(expectedPrefix);
  } catch {
    return false;
  }
}

function reportInsert(
  materialId: string,
  userId: string,
  input: CropReportInput,
  summary: string,
): UsageReportInsert {
  return {
    material_id: materialId,
    author_user_id: userId,
    status: "draft",
    crop_id: input.cropId,
    purpose_tags: [...new Set(input.purposeTags)],
    purpose_note: optionalText(input.purposeNote),
    prefecture_code: input.prefectureCode === "" ? null : Number(input.prefectureCode),
    field_name: optionalText(input.fieldName),
    variety: optionalText(input.variety),
    planting_date: input.plantingDate === "" ? null : input.plantingDate,
    cultivation_type: cultivationTypeLabel(input.cultivationType),
    cultivation_tags: [...new Set(input.cultivationTags)],
    growth_stage: growthStageValue(input.growthStage, input.growthStageNote),
    climate_note: input.climateEnabled ? optionalText(input.climateNote) : null,
    observed_change: input.observedChange.trim(),
    negative_note: optionalText(input.negativeNote),
    summary: summary.trim(),
    // DB 制約は draft にも true を要求する。提出時の同意有無は別途入力値で検証する。
    pesticide_ack: true,
    is_provided_sample: false,
    title: null,
    published_at: null,
  };
}

function applicationInserts(reportId: string, input: CropReportInput): ApplicationInsert[] {
  const method = applicationMethodLabel(input.applicationMethod);
  const detail = serializeApplicationDetail(input);
  const dates: Array<string | null> =
    input.applicationDates.length > 0 ? input.applicationDates : [null];

  if (method === null && detail === null && dates.every((date) => date === null)) {
    return [];
  }

  return dates.map((appliedOn, index) => ({
    usage_report_id: reportId,
    applied_on: appliedOn,
    method: index === 0 ? method : null,
    detail: index === 0 ? detail : null,
    sort_order: index,
  }));
}

function metricInserts(reportId: string, input: CropReportInput): MetricInsert[] {
  if (!input.metricsEnabled) return [];

  return input.metrics.map((metric, index) => ({
    usage_report_id: reportId,
    metric_name: metric.metricName.trim(),
    untreated_value:
      metric.untreatedValue.trim() === "" || !isNumericInput(metric.untreatedValue)
        ? null
        : Number(metric.untreatedValue),
    treated_value:
      metric.treatedValue.trim() === "" || !isNumericInput(metric.treatedValue)
        ? null
        : Number(metric.treatedValue),
    unit: optionalText(metric.unit),
    sort_order: index,
  }));
}

function mediaInserts(reportIds: string[], media: ReportMediaInput[]): MediaInsert[] {
  return reportIds.flatMap((reportId) =>
    media.map((item, index) => ({
      usage_report_id: reportId,
      media_type: item.mediaType,
      url: item.url,
      caption: optionalText(item.caption),
      placement: item.placement,
      sort_order: index,
    })),
  );
}

async function replaceChildRows(
  reportIds: string[],
  cropInputs: Map<string, CropReportInput>,
  reportCropIds: Map<string, string>,
  media: ReportMediaInput[],
): Promise<boolean> {
  const supabase = await createServerSupabase();
  const childTables = [
    "usage_report_applications",
    "usage_report_media",
    "usage_report_metrics",
  ] as const;

  for (const table of childTables) {
    const { error } = await supabase.from(table).delete().in("usage_report_id", reportIds);
    if (error !== null) {
      mutationError(`${table} の置換前削除に失敗`, error);
      return false;
    }
  }

  const applications = reportIds.flatMap((reportId) => {
    const cropId = reportCropIds.get(reportId);
    const input = cropId === undefined ? undefined : cropInputs.get(cropId);
    return input === undefined ? [] : applicationInserts(reportId, input);
  });
  const metrics = reportIds.flatMap((reportId) => {
    const cropId = reportCropIds.get(reportId);
    const input = cropId === undefined ? undefined : cropInputs.get(cropId);
    return input === undefined ? [] : metricInserts(reportId, input);
  });
  const mediaRows = mediaInserts(reportIds, media);

  if (applications.length > 0) {
    const { error } = await supabase.from("usage_report_applications").insert(applications);
    if (error !== null) {
      mutationError("処理日・使用方法の保存に失敗", error);
      return false;
    }
  }
  if (metrics.length > 0) {
    const { error } = await supabase.from("usage_report_metrics").insert(metrics);
    if (error !== null) {
      mutationError("定量データの保存に失敗", error);
      return false;
    }
  }
  if (mediaRows.length > 0) {
    const { error } = await supabase.from("usage_report_media").insert(mediaRows);
    if (error !== null) {
      mutationError("写真・動画情報の保存に失敗", error);
      return false;
    }
  }

  return true;
}

export async function mutateUsageReports({
  materialId,
  userId,
  mode,
  payload: rawPayload,
}: {
  materialId: string;
  userId: string;
  mode: MutationMode;
  payload: UsageReportFormPayload;
}): Promise<UsageReportActionResult> {
  const payloadResult = v.safeParse(UsageReportFormPayloadSchema, rawPayload);
  if (!payloadResult.success) {
    return validationFailure(
      "入力内容を読み取れませんでした。ページを再読み込みしてください。",
      {},
    );
  }
  const payload = payloadResult.output;
  if (payload.cropReports.length === 0) {
    return validationFailure("作物を1つ以上選択してください。", {
      crops: "作物を1つ以上選択してください。",
    });
  }

  const vocabularyErrors: UsageReportFieldErrors = {};
  validateSharedVocabulary(payload, vocabularyErrors);
  if (Object.keys(vocabularyErrors).length > 0) {
    return validationFailure("入力内容を確認してください。", vocabularyErrors);
  }
  if (mode === "submit") {
    const submissionErrors = validateUsageReportSubmission(payload);
    if (Object.keys(submissionErrors).length > 0) {
      return validationFailure(
        "未入力の必須項目があります。入力欄のメッセージを確認してください。",
        submissionErrors,
      );
    }
  }
  if (payload.media.some(({ url }) => !ownedMediaUrl(url, userId))) {
    return validationFailure("写真・動画の保存先を確認できませんでした。", {
      media: "写真・動画を追加し直してください。",
    });
  }

  const supabase = await createServerSupabase();
  const cropIds = payload.cropReports.map(({ cropId }) => cropId);
  const [materialResult, cropsResult, existingResult] = await Promise.all([
    supabase.from("materials").select("id, publication_status").eq("id", materialId).maybeSingle(),
    supabase.from("crops").select("id, crop_groups!crops_group_id_fkey (name)").in("id", cropIds),
    supabase
      .from("usage_reports")
      .select("id, crop_id, status")
      .eq("material_id", materialId)
      .eq("author_user_id", userId)
      .in("status", ["draft", "pending"]),
  ]);

  if (
    materialResult.error !== null ||
    cropsResult.error !== null ||
    existingResult.error !== null
  ) {
    mutationError("保存前の関連データ確認に失敗", {
      material: materialResult.error,
      crops: cropsResult.error,
      existing: existingResult.error,
    });
    return internalFailure();
  }
  if (materialResult.data === null) {
    return validationFailure("対象資材が見つかりません。", {});
  }
  if (materialResult.data.publication_status !== "published") {
    return validationFailure("掲載終了した資材には実証詳細レポートを投稿できません。", {});
  }
  if (cropsResult.data.length !== new Set(cropIds).size) {
    return validationFailure("選択した作物が見つかりません。", {
      crops: "作物を選択し直してください。",
    });
  }
  const cropGroupById = new Map<string, string>();
  for (const crop of cropsResult.data) {
    if (crop.crop_groups === null) {
      mutationError("選択した作物の作物群が欠落", crop);
      return internalFailure();
    }
    cropGroupById.set(crop.id, crop.crop_groups.name);
  }
  const stageErrors: UsageReportFieldErrors = {};
  for (const crop of payload.cropReports) {
    const groupName = cropGroupById.get(crop.cropId);
    if (
      groupName !== undefined &&
      crop.growthStage !== "" &&
      !stageSetForGroup(groupName).includes(crop.growthStage)
    ) {
      stageErrors[`${crop.cropId}.growthStage`] =
        "選択した作物に合う生育ステージを選び直してください。";
    }
  }
  if (Object.keys(stageErrors).length > 0) {
    return validationFailure("入力内容を確認してください。", stageErrors);
  }

  const existingReports: ExistingReport[] = existingResult.data;
  if (existingReports.some(({ status }) => status === "pending")) {
    return validationFailure("提出済みの実証詳細レポートは編集できません。", {});
  }

  const existingByCrop = new Map<string, ExistingReport>();
  for (const report of existingReports) {
    if (existingByCrop.has(report.crop_id)) {
      mutationError("同じ作物の draft が重複", {
        materialId,
        cropId: report.crop_id,
      });
      return validationFailure("下書きの状態を確認できませんでした。", {});
    }
    existingByCrop.set(report.crop_id, report);
  }

  const reportIds: string[] = [];
  const reportCropIds = new Map<string, string>();
  const cropInputs = new Map(payload.cropReports.map((crop) => [crop.cropId, crop]));

  for (const crop of payload.cropReports) {
    const values = reportInsert(materialId, userId, crop, payload.summary);
    const existing = existingByCrop.get(crop.cropId);
    const saveResult =
      existing === undefined
        ? await supabase.from("usage_reports").insert(values).select("id").single()
        : await supabase
            .from("usage_reports")
            .update(values)
            .eq("id", existing.id)
            .eq("author_user_id", userId)
            .eq("status", "draft")
            .select("id")
            .single();

    if (saveResult.error !== null) {
      mutationError("実証詳細レポート本体の保存に失敗", saveResult.error);
      return internalFailure();
    }
    reportIds.push(saveResult.data.id);
    reportCropIds.set(saveResult.data.id, crop.cropId);
  }

  const selectedCropIds = new Set(cropIds);
  const staleReportIds = existingReports
    .filter(({ crop_id }) => !selectedCropIds.has(crop_id))
    .map(({ id }) => id);
  if (staleReportIds.length > 0) {
    const { error } = await supabase
      .from("usage_reports")
      .delete()
      .in("id", staleReportIds)
      .eq("author_user_id", userId)
      .eq("status", "draft");
    if (error !== null) {
      mutationError("選択解除した作物の下書き削除に失敗", error);
      return internalFailure();
    }
  }

  if (!(await replaceChildRows(reportIds, cropInputs, reportCropIds, payload.media))) {
    return internalFailure();
  }

  if (mode === "submit") {
    const { data, error } = await supabase
      .from("usage_reports")
      .update({ status: "pending" })
      .in("id", reportIds)
      .eq("author_user_id", userId)
      .eq("status", "draft")
      .select("id");

    if (error !== null || data.length !== reportIds.length) {
      mutationError("実証詳細レポートの提出状態更新に失敗", {
        error,
        expected: reportIds,
        updated: data,
      });
      return internalFailure();
    }
  }

  return {
    ok: true,
    status: mode === "submit" ? "pending" : "draft",
    reportIds,
    message: mode === "submit" ? "実証詳細レポートを提出しました。" : "下書きを保存しました。",
  };
}
