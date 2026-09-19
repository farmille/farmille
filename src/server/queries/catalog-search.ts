import { cache } from "react";
import { createServerSupabase } from "@/server/supabase";

async function fetchCatalogSearch() {
  const db = await createServerSupabase();
  const [crops, groups, counts] = await Promise.all([
    db
      .from("crops")
      .select("id,name,aliases,group_id,sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    db
      .from("crop_groups")
      .select("id,name,parent_id,hierarchy_level,sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    db.rpc("catalog_material_counts"),
  ]);
  if (crops.error || groups.error || counts.error)
    throw new Error("検索用の作物分類・件数を取得できませんでした。");
  function page(offset: number) {
    return db
      .from("materials")
      .select(`id,name,manufacturer_name,description,avg_rating,review_count,created_at,
      material_images(url,is_current,sort_order),material_crops(crop_id),material_crop_groups(crop_group_id),
      material_effects(effect_id),material_ingredient_categories(ingredient_category_id,ingredient_categories(name)),
      material_search_tags(search_tag_id),material_application_methods(method)`)
      .eq("publication_status", "published")
      .order("id")
      .range(offset, offset + 499);
  }
  const first = await page(0);
  if (first.error) throw new Error("資材の検索情報を取得できませんでした。");
  const materials = first.data;
  for (let offset = 500; materials.length === offset; offset += 500) {
    const next = await page(offset);
    if (next.error) throw new Error("資材の検索情報を取得できませんでした。");
    materials.push(...next.data);
  }
  return { materials, crops: crops.data, groups: groups.data, counts: counts.data };
}
export const getCatalogSearch = cache(fetchCatalogSearch);
export type CatalogSearch = Awaited<ReturnType<typeof getCatalogSearch>>;
