"use server";

import { revalidatePath } from "next/cache";
import type { AdminActionState } from "@/app/admin/_lib/action-state";
import { removePublishedPost } from "@/server/admin/published-posts";
import { errorMessageJa } from "@/server/errors";

export async function removePublishedPostAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const result = await removePublishedPost(formData);
  if (!result.ok)
    return {
      status: "error",
      message:
        result.error === "conflict"
          ? "この投稿はすでに非公開になっているか、存在しません。再読み込みしてください。"
          : errorMessageJa[result.error],
    };
  for (const path of [
    "/",
    "/admin",
    "/admin/published-posts",
    "/admin/usage-reports",
    "/admin/reports",
    "/me",
    "/articles",
    `/materials/${result.data.materialId}`,
    `/users/${result.data.authorUserId}`,
  ])
    revalidatePath(path);
  if (result.data.type === "usage_report") {
    revalidatePath(`/reports/${result.data.id}`);
    revalidatePath(`/admin/usage-reports/${result.data.id}`);
  }
  return {
    status: "done",
    message: "公開から削除しました。投稿内容は運営の記録として保持されています。",
  };
}
