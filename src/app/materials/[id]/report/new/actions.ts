"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { fail, succeed } from "@/server/result";
import type { PdfReadingRequest, PdfReadingResult } from "@/lib/pdf-reading";
import { createPdfReadingDeps, readPdfIntoDraft } from "@/server/pdf-reading";

import { isMaterialId } from "@/app/materials/[id]/material-page-data";
import { otherOpenReport } from "@/app/materials/[id]/report/_components/report-page-state";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa, type ErrorCode } from "@/server/errors";
import {
  getStructuredReportFormData,
  saveStructuredUsageReport,
} from "@/server/usage-reports/structured";
import { getMaterial, searchPostingMaterials } from "@/server/queries/materials";
import type { UsageReportActionResult, UsageReportInput } from "@/lib/usage-report";

async function runMutation(
  materialId: string,
  mode: "draft" | "submit",
  payload: UsageReportInput,
  droppedMediaUrls: string[],
): Promise<UsageReportActionResult> {
  const reportPath = `/materials/${materialId}/report/new`;

  if (!isMaterialId(materialId)) {
    return { ok: false, message: errorMessageJa.not_found, fieldErrors: {} };
  }

  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(reportPath)}`);
    }

    return {
      ok: false,
      message: errorMessageJa[session.error],
      fieldErrors: {},
    };
  }

  if (payload.materialId !== materialId) {
    return { ok: false, message: "対象資材を選び直してください。", fieldErrors: {} };
  }

  const result = await saveStructuredUsageReport(
    payload,
    session.data.userId,
    mode === "submit",
    droppedMediaUrls,
  );

  if (result.ok) {
    revalidatePath(reportPath);
  }

  return result;
}

/** droppedMediaUrls は、この画面の入力に入っていて保存の前に外した画像。保存のあとに置き場から消す。 */
export async function saveUsageReportDraftAction(
  materialId: string,
  payload: UsageReportInput,
  droppedMediaUrls: string[],
): Promise<UsageReportActionResult> {
  return runMutation(materialId, "draft", payload, droppedMediaUrls);
}

export async function submitUsageReportAction(
  materialId: string,
  payload: UsageReportInput,
  droppedMediaUrls: string[],
): Promise<UsageReportActionResult> {
  return runMutation(materialId, "submit", payload, droppedMediaUrls);
}

function pdfReadingRefused(error: ErrorCode, message = errorMessageJa[error]): PdfReadingResult {
  return {
    ok: false,
    error,
    message,
    remaining: null,
    savedDraft: null,
    pdfValuesCheckRequired: false,
  };
}

/** 試験成績書の PDF を読み取り、下書きに写して保存する。読み取りの画面があるページの maxDuration（120秒）で動く。 */
export async function readPdfIntoReportAction(
  materialId: string,
  request: PdfReadingRequest,
): Promise<PdfReadingResult> {
  const reportPath = `/materials/${materialId}/report/new`;

  if (!isMaterialId(materialId)) return pdfReadingRefused("not_found");
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(reportPath)}`);
    }

    return pdfReadingRefused(session.error);
  }

  if (!v.is(v.object({ input: v.object({ materialId: v.literal(materialId) }) }), request)) {
    return pdfReadingRefused("invalid_body", "対象資材を選び直してください。");
  }

  const userId = session.data.userId;
  const result = await readPdfIntoDraft(request, userId, await createPdfReadingDeps(userId));

  if (result.ok) revalidatePath(reportPath);

  return result;
}

export async function searchReportMaterialsAction(query: string) {
  const parsed = v.safeParse(v.string(), query);

  if (!parsed.success) return fail("invalid_body");

  return searchPostingMaterials(parsed.output);
}

/** 資材を選び直したときに、作物と使用目的の候補に出す、その資材の登録作物と効果。 */
export async function getReportMaterialClassificationsAction(materialId: string) {
  const parsed = v.safeParse(v.string(), materialId);

  if (!parsed.success || !isMaterialId(parsed.output)) return fail("invalid_body");
  const material = await getMaterial(parsed.output);

  if (!material.ok) return material;

  return succeed({
    cropIds: material.data.targetCrops.map((crop) => crop.id),
    effectNames: material.data.effects.map((effect) => effect.name),
  });
}

/**
 * 資材を選び直す前に、選んだ資材に同じ利用者の下書きか確認中のレポートがあるかを確かめる。
 * 切り替えて保存すると同じ資材に下書きが2つでき、前の下書きを開けなくなる。今の下書きは数えない。
 */
export async function findOtherReportForMaterialAction(materialId: string, reportId: string) {
  const parsed = v.safeParse(
    v.object({ materialId: v.pipe(v.string(), v.uuid()), reportId: v.pipe(v.string(), v.uuid()) }),
    { materialId, reportId },
  );

  if (!parsed.success || !isMaterialId(parsed.output.materialId)) return fail("invalid_body");
  const session = await requireGeneralUser();

  if (!session.ok) return fail(session.error);
  const formData = await getStructuredReportFormData(parsed.output.materialId, session.data.userId);

  if (!formData.ok) return formData;

  return succeed(otherOpenReport(formData.data, parsed.output.reportId));
}
