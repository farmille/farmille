"use server";

import * as v from "valibot";
import { revalidatePath } from "next/cache";
import { SaveMaterialPageSchema } from "@/lib/material-page-editor";
import { requireSeller } from "@/server/auth";
import { createServerSupabase } from "@/server/supabase";

export async function saveMaterialPage(input: v.InferOutput<typeof SaveMaterialPageSchema>) {
  const session = await requireSeller();
  if (!session.ok)
    return { ok: false as const, message: "メーカーアカウントでログインしてください。" };
  const parsed = v.safeParse(SaveMaterialPageSchema, input);
  if (!parsed.success)
    return {
      ok: false as const,
      message:
        "資料の分類・タイトル・URL、試験の概要・実施機関、登録事業者と関係会社を確認してください。同じURLや会社名は重複して送信できません。",
    };
  const db = await createServerSupabase();
  const { data, error } = await db.rpc("save_material_page_version", {
    p_material_id: parsed.output.materialId,
    p_expected_version: parsed.output.expectedVersion ?? undefined,
    p_content: parsed.output.content,
    p_submit: parsed.output.submit,
  });
  if (error) {
    console.error("[material-page] 原稿保存に失敗", error);
    return {
      ok: false as const,
      message:
        error.code === "40001"
          ? "別の画面で原稿が更新されました。入力を控えてから再読み込みしてください。"
          : error.code === "42501"
            ? "この資材は編集権の書類確認が必要です。"
            : "原稿を保存できませんでした。入力を残していますので、内容を確認して再度お試しください。",
    };
  }
  revalidatePath(`/dashboard/materials/${parsed.output.materialId}`);
  revalidatePath("/dashboard/materials");
  return { ok: true as const, versionId: data };
}

export async function withdrawMaterialPage(versionId: string) {
  const session = await requireSeller();
  if (!session.ok || !v.is(v.pipe(v.string(), v.uuid()), versionId)) return false;
  const db = await createServerSupabase();
  const { error } = await db.rpc("withdraw_material_page_version", { p_version_id: versionId });
  if (error) {
    console.error("[material-page] 取り下げに失敗", error);
    return false;
  }
  revalidatePath("/dashboard/materials", "layout");
  return true;
}

export async function hideMaterialPage(input: { materialId: string; note: string }) {
  if (!(await requireSeller()).ok) return false;
  const parsed = v.safeParse(
    v.object({
      materialId: v.pipe(v.string(), v.uuid()),
      note: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(10000)),
    }),
    input,
  );
  if (!parsed.success) return false;
  const db = await createServerSupabase();
  const { error } = await db.rpc("hide_owned_material_page", {
    p_material_id: parsed.output.materialId,
    p_note: parsed.output.note,
  });
  if (error) {
    console.error("[material-page] 非公開への変更に失敗", error);
    return false;
  }
  revalidatePath(`/materials/${input.materialId}`);
  revalidatePath(`/dashboard/materials/${input.materialId}`);
  revalidatePath("/dashboard/materials");
  return true;
}
