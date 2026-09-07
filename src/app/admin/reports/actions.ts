"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/app/admin/_lib/action-state";
import { formDataString } from "@/lib/validation";
import { processContentReport } from "@/server/admin/reports";
import { errorMessageJa } from "@/server/errors";

/** open の通報を resolved または dismissed へ進める。 */
export async function processContentReportAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const reportId = formDataString(formData.get("reportId"));
  const nextStatus = formDataString(formData.get("nextStatus"));

  if (
    reportId === null ||
    reportId.length === 0 ||
    (nextStatus !== "resolved" && nextStatus !== "dismissed")
  ) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const result = await processContentReport(reportId, nextStatus);

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.error === "conflict"
          ? "この通報または対象コンテンツはすでに別の状態へ変わっています。再読み込みしてください。"
          : errorMessageJa[result.error],
    };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath("/me");
  revalidatePath("/articles");

  return {
    status: "done",
    message: nextStatus === "resolved" ? "対応済みにしました。" : "通報を却下しました。",
  };
}
