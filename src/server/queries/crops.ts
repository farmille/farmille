import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type CropRow = Database["public"]["Tables"]["crops"]["Row"];

export type CropOption = Pick<CropRow, "id" | "name" | "group_id" | "sort_order">;

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/crops] ${operation}`, error);
}

/** プロフィール編集の作目複数選択用マスタ。 */
export async function listCropOptions(): Promise<Result<readonly CropOption[]>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("crops")
    .select("id, name, group_id, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error !== null) {
    reportQueryError("作目マスタの取得に失敗", error);
    return fail("internal");
  }

  return succeed(data);
}
