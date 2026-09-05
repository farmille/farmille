"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AdminActionState } from "@/app/admin/_lib/action-state";
import { formDataString } from "@/lib/validation";
import {
  approveMaterialChangeRequest,
  rejectMaterialChangeRequest,
} from "@/server/admin/material-change-requests";
import { errorMessageJa } from "@/server/errors";

export async function resolveMaterialChangeRequestAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const requestId = formDataString(formData.get("requestId"))?.trim() ?? "";
  const decision = formDataString(formData.get("decision"));
  const reviewNote = formDataString(formData.get("reviewNote"))?.trim() ?? "";

  if (requestId.length === 0 || (decision !== "approve" && decision !== "reject")) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }
  if (decision === "reject" && reviewNote.length === 0) {
    return { status: "error", message: "却下理由を入力してください。" };
  }

  const result =
    decision === "approve"
      ? await approveMaterialChangeRequest(requestId, reviewNote)
      : await rejectMaterialChangeRequest(requestId, reviewNote);

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.error === "conflict"
          ? "申請は処理済みか、申請後に公開内容が変更されています。画面を再読み込みしてください。"
          : errorMessageJa[result.error],
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/materials");
  revalidatePath("/admin/materials/requests");
  revalidatePath(`/admin/materials/requests/${requestId}`);
  revalidatePath("/dashboard/materials");

  redirect(`/admin/materials/requests/${requestId}?resolved=${decision}`);
}
