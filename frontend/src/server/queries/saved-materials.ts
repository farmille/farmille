import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

function reportQueryError(operation: string, error: unknown): void {
  console.error(`[server/queries/saved-materials] ${operation}`, error);
}

export async function isMaterialSaved(
  materialId: string,
  userId: string,
): Promise<Result<boolean>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("saved_materials")
    .select("id")
    .eq("material_id", materialId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error !== null) {
    reportQueryError("保存状態の取得に失敗", error);
    return fail("internal");
  }

  return succeed(data !== null);
}

export async function toggleSavedMaterial(
  materialId: string,
  userId: string,
): Promise<Result<boolean>> {
  const supabase = await createServerSupabase();
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id")
    .eq("id", materialId)
    .maybeSingle();

  if (materialError !== null) {
    reportQueryError("保存対象資材の確認に失敗", materialError);
    return fail("internal");
  }

  if (material === null) {
    return fail("not_found");
  }

  const { data: saved, error: savedError } = await supabase
    .from("saved_materials")
    .select("id")
    .eq("material_id", materialId)
    .eq("user_id", userId)
    .maybeSingle();

  if (savedError !== null) {
    reportQueryError("保存状態の取得に失敗", savedError);
    return fail("internal");
  }

  if (saved !== null) {
    const { error } = await supabase
      .from("saved_materials")
      .delete()
      .eq("id", saved.id)
      .eq("user_id", userId);

    if (error !== null) {
      reportQueryError("資材の保存解除に失敗", error);
      return fail("internal");
    }

    return succeed(false);
  }

  const { error } = await supabase.from("saved_materials").insert({
    material_id: materialId,
    user_id: userId,
  });

  if (error !== null) {
    reportQueryError("資材の保存に失敗", error);
    return fail("internal");
  }

  return succeed(true);
}
