"use server";

import { redirect } from "next/navigation";

import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { formDataString } from "@/lib/validation";
import {
  createContentReport,
  isReportReasonCode,
  isReportTargetType,
  type ReportTargetType,
} from "@/server/mutations/reports";

export type ReportActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * 通報の送信。useActionState から呼ぶため、想定内の失敗（未選択・二重通報等）は
 * throw せず ReportActionState で返す。未ログインのみログイン画面へ誘導する。
 */
export async function createReportAction(
  targetType: ReportTargetType,
  targetId: string,
  currentPath: string,
  _previousState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  if (!isReportTargetType(targetType)) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const reasonCodeValue = formDataString(formData.get("reasonCode"));
  const detailValue = formDataString(formData.get("detail"));

  if (reasonCodeValue === null || !isReportReasonCode(reasonCodeValue)) {
    return { status: "error", message: "通報理由を選択してください。" };
  }

  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }

    return { status: "error", message: errorMessageJa[session.error] };
  }

  const result = await createContentReport({
    reporterUserId: session.data.userId,
    targetType,
    targetId,
    reasonCode: reasonCodeValue,
    detail: detailValue,
  });

  if (!result.ok) {
    return { status: "error", message: errorMessageJa[result.error] };
  }

  return { status: "success" };
}
