"use server";
import * as v from "valibot";
import { revalidatePath } from "next/cache";
import { SaveManufacturerProfileSchema } from "@/lib/manufacturer-profile";
import { requireSeller } from "@/server/auth";
import {
  saveManufacturerProfileVersion,
  withdrawManufacturerProfileVersion,
} from "@/server/manufacturer-profile";
import { uploadManufacturerLogo } from "@/server/manufacturer-logo";

export async function uploadLogo(formData: FormData) {
  const file = formData.get("logo");
  if (!(file instanceof File)) return { ok: false as const, message: "ロゴ画像を選んでください。" };
  return uploadManufacturerLogo(file);
}

export async function saveManufacturerProfile(
  input: v.InferOutput<typeof SaveManufacturerProfileSchema>,
) {
  const session = await requireSeller();
  if (!session.ok) return { ok: false as const, message: "企業会員でログインしてください。" };
  const parsed = v.safeParse(SaveManufacturerProfileSchema, input);
  if (!parsed.success)
    return { ok: false as const, message: "紹介文とURLの入力を確認してください。" };
  const { data, error } = await saveManufacturerProfileVersion(parsed.output);
  if (error) {
    console.error("[manufacturer-profile] 保存に失敗", error);
    return {
      ok: false as const,
      message:
        error.code === "40001"
          ? "別の画面で更新されました。入力を控えて再読み込みしてください。"
          : "プロフィールを保存できませんでした。入力内容と通信状態を確認してください。",
    };
  }
  revalidatePath("/dashboard/profile");
  return { ok: true as const, versionId: data };
}

export async function withdrawManufacturerProfile(id: string) {
  if (!(await requireSeller()).ok || !v.is(v.pipe(v.string(), v.uuid()), id)) return false;
  const { error } = await withdrawManufacturerProfileVersion(id);
  if (error) {
    console.error("[manufacturer-profile] 取り下げに失敗", error);
    return false;
  }
  revalidatePath("/dashboard/profile");
  return true;
}
