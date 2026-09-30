import { listClassificationOptions } from "@/server/queries/classifications";
import * as v from "valibot";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  UsageReportInputSchema,
  validateUsageReportSubmission,
  type UsageReportInput,
  type UsageReportActionResult,
} from "@/lib/usage-report";
import { createServerSupabase } from "@/server/supabase";
import { fail, succeed } from "@/server/result";
import { clientEnv } from "@/env";
import type { Database } from "@/types/database.types";

export function reportMediaUrl(value: string, authorId: string): string {
  const path = new URL(value).pathname;
  if (!path.startsWith(`/storage/v1/object/public/report-media/${authorId}/`)) {
    throw new Error("実証詳細レポートの写真の保存先が不正です。");
  }
  const url = new URL(clientEnv.supabaseUrl);
  url.pathname = path;
  return url.href;
}

function ownedMediaUrl(value: string, userId: string): boolean {
  const url = URL.parse(value);
  return (
    url !== null &&
    url.origin === new URL(clientEnv.supabaseUrl).origin &&
    url.pathname.startsWith(`/storage/v1/object/public/report-media/${userId}/`)
  );
}

export async function saveStructuredUsageReport(
  raw: UsageReportInput,
  userId: string,
  submit: boolean,
): Promise<UsageReportActionResult> {
  const parsed = v.safeParse(UsageReportInputSchema, raw);
  if (!parsed.success)
    return { ok: false, message: "入力内容を確認してください。", fieldErrors: {} };
  const input = parsed.output;
  const fieldErrors = submit ? validateUsageReportSubmission(input) : {};
  if (Object.keys(fieldErrors).length > 0)
    return { ok: false, message: "未入力の必須項目があります。", fieldErrors };
  if (input.media.some((item) => !ownedMediaUrl(item.url, userId))) {
    return {
      ok: false,
      message: "写真・動画の保存先を確認できませんでした。追加し直してください。",
      fieldErrors: {},
    };
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("save_usage_report", {
    p_input: input,
    p_submit: submit,
  });
  if (error !== null) {
    console.error("[usage-reports] 保存に失敗", error);
    return {
      ok: false,
      message:
        error.code === "40001"
          ? "別の画面で下書きが更新されています。入力内容を控えてから再読み込みしてください。"
          : "保存できませんでした。入力内容はそのまま残っています。内容を確認して、もう一度保存してください。",
      fieldErrors: {},
    };
  }
  const saved = data[0];
  if (saved === undefined || (saved.status !== "draft" && saved.status !== "pending")) {
    throw new Error("実証詳細レポートの保存結果を確認できませんでした。");
  }
  return {
    ok: true,
    status: saved.status,
    reportId: saved.report_id,
    updatedAt: saved.updated_at,
    message: submit
      ? "実証詳細レポートを提出しました。運営が確認後に公開します。"
      : "下書きを保存しました。",
  };
}

export async function getStructuredUsageReport(
  reportId: string,
  supabase: SupabaseClient<Database>,
) {
  const { data, error } = await supabase
    .from("usage_reports")
    .select(`*,
    locations:usage_report_private_locations(city),
    timings:usage_report_timings(stage),
    plots:usage_report_plots(*,steps:usage_report_plot_steps(*,targets:usage_report_step_targets(target))),
    measurements:usage_report_measurements(*,graphs:usage_report_graphs(*,rows:usage_report_graph_rows(*))),
    media:usage_report_media(*), documents:usage_report_documents(*), headings:usage_report_headings(*)
  `)
    .eq("id", reportId)
    .eq("form_version", 2)
    .maybeSingle();
  if (error !== null) {
    console.error("[usage-reports] 保存内容の取得に失敗", error);
    return fail("internal");
  }
  if (data === null) return succeed(null);
  const byOrder = (left: { sort_order: number }, right: { sort_order: number }) =>
    left.sort_order - right.sort_order;
  const parsed = v.safeParse(UsageReportInputSchema, {
    reportId: data.id,
    expectedUpdatedAt: data.updated_at,
    materialId: data.material_id,
    cropId: data.crop_id,
    variety: data.variety ?? "",
    varietyUnknown: data.variety_unknown,
    observedChange: data.observed_change,
    purposeTags: data.purpose_tags,
    prefectureCode: data.prefecture_code,
    city: data.locations?.city ?? "",
    showCity: data.publish_city,
    cultivationEnvironment: data.cultivation_environment,
    timingStages: data.timings.map((item) => item.stage),
    timingNote: data.timing_note,
    plots: data.plots.toSorted(byOrder).map((plot) => ({
      id: plot.id,
      name: plot.name,
      scope: plot.survey_scope,
      description: plot.description,
      steps: plot.steps.toSorted(byOrder).map((step) => ({
        id: step.id,
        method: step.method,
        otherText: step.other_text,
        targets: step.targets.map((target) => target.target),
      })),
    })),
    measurements: data.measurements.toSorted(byOrder).map((item) => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      unit: item.unit,
      body: item.body,
      graphs: item.graphs.toSorted(byOrder).map((graph) => ({
        id: graph.id,
        heading: graph.heading,
        rows: graph.rows.toSorted(byOrder).map((row) => ({
          id: row.id,
          plotId: row.plot_id,
          label: row.label,
          value: row.value_text,
        })),
      })),
    })),
    media: data.media.toSorted(byOrder).map((item) => ({
      id: item.id,
      url: reportMediaUrl(item.url, data.author_user_id),
      mediaType: item.media_type,
      section: item.placement,
      caption: item.caption ?? "",
    })),
    documents: data.documents
      .toSorted(byOrder)
      .map((item) => ({ id: item.id, path: item.storage_path, name: item.name })),
    headings: data.headings.map((item) => ({ section: item.section, title: item.title })),
    methodDetailsAck: data.method_details_ack,
    documentsAck: data.documents_ack,
    guidelineAck: data.pesticide_ack,
  });
  if (!parsed.success) {
    console.error("[usage-reports] 保存内容の形式が不正", v.summarize(parsed.issues));
    return fail("internal");
  }
  return succeed(parsed.output);
}

export async function getStructuredReportFormData(materialId: string, userId: string) {
  const supabase = await createServerSupabase();
  const [options, reports, profile, favorites, materialCrops] = await Promise.all([
    listClassificationOptions(),
    supabase
      .from("usage_reports")
      .select("id,status,updated_at,crop:crops(name),form_version")
      .eq("material_id", materialId)
      .eq("author_user_id", userId)
      .in("status", ["draft", "pending"])
      .order("updated_at", { ascending: false }),
    supabase.from("public_profiles").select("prefecture_code,city").eq("user_id", userId).single(),
    supabase.from("profile_crops").select("crop_id").eq("user_id", userId),
    supabase.from("material_crops").select("crop_id").eq("material_id", materialId),
  ]);
  if (!options.ok) return options;
  const error = reports.error ?? profile.error ?? favorites.error ?? materialCrops.error;
  if (
    error !== null ||
    profile.data === null ||
    reports.data === null ||
    favorites.data === null ||
    materialCrops.data === null
  ) {
    console.error("[usage-reports] 入力候補の取得に失敗", error);
    return fail("internal");
  }
  const draftRow = reports.data.find((row) => row.status === "draft" && row.form_version === 2);
  const draft =
    draftRow === undefined ? succeed(null) : await getStructuredUsageReport(draftRow.id, supabase);
  if (!draft.ok) return draft;
  const documents =
    draft.data === null ? succeed([]) : await getReportDocumentUrls(draft.data, supabase);
  if (!documents.ok) return documents;
  return succeed({
    documentUrls: documents.data,
    crops: options.data.crops,
    effects: options.data.effects,
    favoriteCropIds: favorites.data.map((item) => item.crop_id),
    materialCropIds: materialCrops.data.map((item) => item.crop_id),
    prefectureCode: profile.data.prefecture_code,
    city: profile.data.city ?? "",
    draft: draft.data,
    submitted: reports.data
      .filter((row) => row.status === "pending")
      .map((row) => {
        if (row.crop === null) throw new Error("提出済みレポートの作物が見つかりません。");
        return {
          id: row.id,
          cropName: row.crop.name,
          status: "pending" as const,
          updatedAt: row.updated_at,
        };
      }),
  });
}

export async function getReportDocumentUrls(
  input: UsageReportInput,
  supabase: SupabaseClient<Database>,
) {
  if (input.documents.length === 0) return succeed([]);
  const { data, error } = await supabase.storage.from("report-documents").createSignedUrls(
    input.documents.map((item) => item.path),
    600,
  );
  if (error !== null) {
    console.error("[usage-reports] 資料リンクの作成に失敗", error);
    return fail("internal");
  }
  const urls: Array<{ id: string; url: string }> = [];
  for (const document of input.documents) {
    const signed = data.find((item) => item.path === document.path);
    if (
      signed === undefined ||
      signed.error !== null ||
      signed.signedUrl === null ||
      signed.signedUrl.length === 0
    ) {
      console.error("[usage-reports] 資料ファイルを取得できません", document.id);
      return fail("internal");
    }
    urls.push({ id: document.id, url: signed.signedUrl });
  }
  return succeed(urls);
}
