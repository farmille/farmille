import { randomInt } from "node:crypto";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import { listMaterials } from "./materials";

/** 公開資材全体から重複なしで14件を抽出する。広告・優先枠は持たない。 */
export async function listHomeMaterials() {
  const client = await createServerSupabase();
  const ids: string[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await client
      .from("materials")
      .select("id")
      .eq("publication_status", "published")
      .order("id")
      .range(offset, offset + 499);
    if (result.error)
      throw new Error("掲載資材の候補を取得できませんでした。", { cause: result.error });
    ids.push(...result.data.map((row) => row.id));
    if (result.data.length < 500) break;
  }
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const selected = ids.slice(0, 14);
  if (selected.length === 0) return [];
  const result = await listMaterials({ page: 1, ids: selected });
  if (!result.ok) throw new Error("掲載資材を取得できませんでした：" + result.error);
  const admin = createAdminSupabase();
  return Promise.all(
    result.data.items
      .toSorted((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id))
      .map(async (material) => {
        const [reports, saves, categories] = await Promise.all([
          client
            .rpc("list_usage_report_previews", undefined, { count: "exact", head: true })
            .select("id")
            .eq("material_id", material.id)
            .eq("status", "published"),
          // 保存者の識別情報は取得せず、総件数だけを公開する。
          admin
            .from("saved_materials")
            .select("id", { count: "exact", head: true })
            .eq("material_id", material.id),
          client
            .from("material_ingredient_categories")
            .select("category:ingredient_categories(name,sort_order)")
            .eq("material_id", material.id),
        ]);
        if (
          reports.error ||
          saves.error ||
          categories.error ||
          reports.count === null ||
          saves.count === null
        )
          throw new Error("掲載資材の集計を取得できませんでした。");
        const names = categories.data
          .map((row) => {
            if (row.category === null) throw new Error("資材の分類情報が欠落しています。");
            return row.category;
          })
          .toSorted((a, b) => a.sort_order - b.sort_order)
          .map((row) => row.name);
        return {
          ...material,
          reportCount: reports.count,
          savedCount: saves.count,
          categories: names,
        };
      }),
  );
}
