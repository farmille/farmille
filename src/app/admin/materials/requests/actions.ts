"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/app/admin/_lib/action-state";
import { isEditRequestStatus, resolveMaterialEditRequest } from "@/server/admin/materials";
import { errorMessageJa } from "@/server/errors";

/** 分類変更申請の処理（open → done / declined）。 */
export async function resolveEditRequestAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const requestId = formData.get("requestId");
  const nextStatus = formData.get("nextStatus");

  if (
    typeof requestId !== "string" ||
    requestId.length === 0 ||
    !isEditRequestStatus(nextStatus) ||
    nextStatus === "open"
  ) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const result = await resolveMaterialEditRequest(requestId, nextStatus);

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.error === "conflict"
          ? "この申請はすでに処理済みです。画面を再読み込みしてください。"
          : errorMessageJa[result.error],
    };
  }

  revalidatePath("/admin/materials/requests");
  revalidatePath("/admin");

  return {
    status: "done",
    message: nextStatus === "done" ? "対応済みにしました。" : "見送りにしました。",
  };
}
