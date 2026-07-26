"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isMaterialId } from "@/app/materials/[id]/material-page-data";
import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { mutateUsageReports } from "@/server/mutations/usage-reports";
import type { UsageReportActionResult, UsageReportFormPayload } from "@/server/usage-reports/model";

async function runMutation(
  materialId: string,
  mode: "draft" | "submit",
  payload: UsageReportFormPayload,
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

  const result = await mutateUsageReports({
    materialId,
    userId: session.data.userId,
    mode,
    payload,
  });

  if (result.ok) {
    revalidatePath(reportPath);
  }
  return result;
}

export async function saveUsageReportDraftAction(
  materialId: string,
  payload: UsageReportFormPayload,
): Promise<UsageReportActionResult> {
  return runMutation(materialId, "draft", payload);
}

export async function submitUsageReportAction(
  materialId: string,
  payload: UsageReportFormPayload,
): Promise<UsageReportActionResult> {
  return runMutation(materialId, "submit", payload);
}
