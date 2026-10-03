import { unstable_cache } from "next/cache";
import { cache } from "react";

import type { SearchCatalog } from "@/lib/material-search";
import { CACHE_TAGS } from "@/server/cache-tags";
import { selectAllRows } from "@/server/pagination";
import { listClassificationOptions, listSearchFilters } from "@/server/queries/classifications";
import { succeed, type Result } from "@/server/result";
import { createPublicSupabase } from "@/server/supabase";

// 公開・掲載終了と内容の変更は運営の操作が updateTag で失効させる。
// 評価・口コミ数・保存数・使用レポート数は投稿のたびには失効させず、10分の遅れを許容する。
const fetchCatalogMaterials = unstable_cache(
  async () => {
    const db = createPublicSupabase();
    const [counts, materials] = await Promise.all([
      db.rpc("catalog_material_counts"),
      selectAllRows((from, to) =>
        db
          .from("materials")
          .select(`id,name,manufacturer_name,description,avg_rating,review_count,created_at,
      material_images(url,is_current,sort_order),material_crops(crop_id),material_crop_groups(crop_group_id),
      material_effects(effect_id),material_ingredient_categories(ingredient_category_id,ingredient_categories(name)),
      material_search_tags(search_tag_id),material_application_methods(method)`)
          .eq("publication_status", "published")
          .order("id")
          .range(from, to),
      ),
    ]);
    if (counts.error) throw new Error("検索用の件数を取得できませんでした。");
    if (materials.error) throw new Error("資材の検索情報を取得できませんでした。");
    return { materials: materials.data, counts: counts.data };
  },
  ["catalog-materials"],
  { tags: [CACHE_TAGS.catalog], revalidate: 600 },
);

async function fetchCatalogSearch() {
  const [snapshot, options] = await Promise.all([
    fetchCatalogMaterials(),
    listClassificationOptions(),
  ]);
  if (!options.ok) throw new Error("検索用の作物分類を取得できませんでした。");
  return {
    ...snapshot,
    // 分類マスタは作物群ごとに並ぶが、検索のタグ一覧は作物の表示順で並べる。
    crops: options.data.crops.toSorted((left, right) => left.sort_order - right.sort_order),
    groups: options.data.cropGroups,
  };
}
export const getCatalogSearch = cache(fetchCatalogSearch);
export type CatalogSearch = Awaited<ReturnType<typeof getCatalogSearch>>;

/** 検索欄の候補。分類は分類マスタから、資材名とメーカー名は公開中の資材から作る。 */
export async function listSearchSuggestions(): Promise<Result<SearchCatalog>> {
  const [filters, catalog] = await Promise.all([listSearchFilters(), getCatalogSearch()]);
  if (!filters.ok) return filters;

  const byJapanese = (left: string, right: string) => left.localeCompare(right, "ja");
  return succeed({
    filters: filters.data,
    makers: [...new Set(catalog.materials.map((material) => material.manufacturer_name))].toSorted(
      byJapanese,
    ),
    materialNames: catalog.materials.map((material) => material.name).toSorted(byJapanese),
  });
}
