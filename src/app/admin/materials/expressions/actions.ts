"use server";
import { revalidatePath } from "next/cache";
import { reviewMaterialPage, reviewManufacturerProfile } from "@/server/admin/material-page-review";

export async function reviewManufacturerProfileAction(input: {
  versionId: string;
  publish: boolean;
  note: string;
}) {
  const result = await reviewManufacturerProfile(input);
  if (!result.ok)
    return {
      ok: false as const,
      message:
        result.error === "conflict"
          ? "公開プロフィールまたは原稿が更新されています。再読み込みして確認してください。"
          : "結果を保存できませんでした。修正理由と通信状態を確認してください。",
    };
  revalidatePath(`/sellers/${result.data}`);
  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/materials/expressions", "layout");
  return {
    ok: true as const,
    message: input.publish ? "プロフィールを反映しました。" : "修正を依頼しました。",
  };
}

export async function reviewMaterialPageAction(input: {
  versionId: string;
  publish: boolean;
  note: string;
}) {
  const result = await reviewMaterialPage(input);
  if (!result.ok)
    return {
      ok: false as const,
      message:
        result.error === "conflict"
          ? "原稿または公開内容が更新されています。再読み込みして確認してください。"
          : result.error === "invalid_body"
            ? "修正が必要な箇所と理由を記入してください。"
            : "結果を保存できませんでした。編集権と通信状態を確認してください。",
    };
  revalidatePath(`/materials/${result.data}`);
  revalidatePath(`/dashboard/materials/${result.data}`);
  revalidatePath("/admin/materials/expressions", "layout");
  return {
    ok: true as const,
    message: input.publish
      ? "表現確認を完了し、製品情報を反映しました。"
      : "修正が必要な箇所をメーカーへ返しました。",
  };
}
