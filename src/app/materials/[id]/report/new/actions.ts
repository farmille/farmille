"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { fail } from "@/server/result";

import { isMaterialId } from "@/app/materials/[id]/material-page-data";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { saveStructuredUsageReport } from "@/server/usage-reports/structured";
import { searchPostingMaterials } from "@/server/queries/materials";
import type { UsageReportActionResult, UsageReportInput } from "@/lib/usage-report";

async function runMutation(
  materialId: string,
  mode: "draft" | "submit",
  payload: UsageReportInput,
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
  const result = await saveStructuredUsageReport(payload, session.data.userId, mode === "submit");

  if (result.ok) {
    revalidatePath(reportPath);
  }
  return result;
}

export async function saveUsageReportDraftAction(
  materialId: string,
  payload: UsageReportInput,
): Promise<UsageReportActionResult> {
  return runMutation(materialId, "draft", payload);
}

export async function submitUsageReportAction(
  materialId: string,
  payload: UsageReportInput,
): Promise<UsageReportActionResult> {
  return runMutation(materialId, "submit", payload);
}

export async function searchReportMaterialsAction(query: string) {
  const parsed = v.safeParse(v.string(), query);
  if (!parsed.success) return fail("invalid_body");
  return searchPostingMaterials(parsed.output);
}
