"use server";
import { revalidatePath } from "next/cache";
import { recordMaterialPageAudit } from "@/server/material-page-audits";

export async function recordMaterialAuditAction(input: {
  materialId: string;
  outcome: string;
  note: string;
}) {
  const result = await recordMaterialPageAudit(input);
  if (!result.ok)
    return {
      ok: false as const,
      message:
        result.error === "invalid_body"
          ? "確認結果と記録を入力してください。"
          : "確認記録を保存できませんでした。",
    };
  revalidatePath(`/admin/materials/${input.materialId}`);
  revalidatePath(`/dashboard/materials/${input.materialId}`);
  revalidatePath(`/materials/${input.materialId}`);
  return { ok: true as const, message: "確認記録を保存しました。メーカーも記録を閲覧できます。" };
}
