"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/app/admin/_lib/action-state";
import { formDataString } from "@/lib/validation";
import {
  isUsageReportEditorialOperation,
  updateUsageReportEditorial,
} from "@/server/admin/usage-reports";
import { errorMessageJa } from "@/server/errors";

function formText(formData: FormData, name: string): string | null {
  return formDataString(formData.get(name));
}

/** pending 実証詳細レポートの調整保存・公開・差し戻し。 */
export async function updateUsageReportEditorialAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const reportId = formText(formData, "reportId");
  const operation = formText(formData, "operation");
  const title = formText(formData, "title");
  const observedChange = formText(formData, "observedChange");
  const negativeNote = formText(formData, "negativeNote");
  const summary = formText(formData, "summary");
  const editorNote = formText(formData, "editorNote");

  if (
    reportId === null ||
    reportId.length === 0 ||
    !isUsageReportEditorialOperation(operation) ||
    title === null ||
    observedChange === null ||
    negativeNote === null ||
    summary === null ||
    editorNote === null
  ) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const result = await updateUsageReportEditorial(reportId, operation, {
    title,
    observedChange,
    negativeNote,
    summary,
    editorNote,
  });

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.error === "invalid_body"
          ? operation === "decline"
            ? "タイトル・本文・まとめ・差し戻し理由を入力してください。"
            : "タイトル・本文・まとめを入力してください。"
          : result.error === "conflict"
            ? "この実証詳細レポートはすでに別の状態へ変わっています。再読み込みしてください。"
            : errorMessageJa[result.error],
    };
  }

  revalidatePath(`/admin/usage-reports/${reportId}`);
  revalidatePath("/admin/usage-reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/me");
  revalidatePath("/admin");

  const messages = {
    save: "編集内容を保存しました。",
    publish: "実証詳細レポートを公開しました。",
    decline: "実証詳細レポートを差し戻しました。",
  } as const;

  return { status: "done", message: messages[operation] };
}
