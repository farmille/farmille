import { randomInt } from "node:crypto";
import { selectAllRows } from "@/server/pagination";
import { createServerSupabase } from "@/server/supabase";
import { listMaterials } from "./materials";

/** 公開資材全体から重複なしで14件を抽出する。広告・優先枠は持たない。 */
export async function listHomeMaterials() {
  const client = await createServerSupabase();
  const candidates = await selectAllRows((from, to) =>
    client
      .from("materials")
      .select("id")
      .eq("publication_status", "published")
      .order("id")
      .range(from, to),
  );
  if (candidates.error)
    throw new Error("掲載資材の候補を取得できませんでした。", { cause: candidates.error });
  const ids = candidates.data.map((row) => row.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const selected = ids.slice(0, 14);
  if (selected.length === 0) return [];
  const result = await listMaterials({ page: 1, ids: selected });
  if (!result.ok) throw new Error("掲載資材を取得できませんでした：" + result.error);
  return Promise.all(
    result.data.items
      .toSorted((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id))
      .map(async (material) => {
        const categories = await client
          .from("material_ingredient_categories")
          .select("category:ingredient_categories(name,sort_order)")
          .eq("material_id", material.id);
        if (categories.error) throw new Error("資材の分類情報を取得できませんでした。");
        const names = categories.data
          .map((row) => {
            if (row.category === null) throw new Error("資材の分類情報が欠落しています。");
            return row.category;
          })
          .toSorted((a, b) => a.sort_order - b.sort_order)
          .map((row) => row.name);
        return {
          ...material,
          categories: names,
        };
      }),
  );
}
