import type { SupabaseClient } from "@supabase/supabase-js";

import { COMPARE_MATERIAL_LIMITS } from "@/lib/compare-limits";
import { getMaterialWithSupabase } from "@/server/queries/materials";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

export { COMPARE_MATERIAL_LIMITS } from "@/lib/compare-limits";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialImageRow = Database["public"]["Tables"]["material_images"]["Row"];

type MaterialImage = Pick<MaterialImageRow, "id" | "url" | "image_type" | "sort_order">;

type SavedMaterialQueryRow = {
  id: string;
  created_at: string;
  material:
    | (Pick<
        MaterialRow,
        | "id"
        | "name"
        | "manufacturer_name"
        | "price_range"
        | "review_count"
        | "avg_rating"
        | "control_plot_ratio"
        | "manufacturer_verified_at"
        | "description"
      > & {
        material_images: MaterialImage[];
      })
    | null;
};

export type SavedMaterialItem = {
  savedId: string;
  savedAt: string;
  materialId: string;
  name: string;
  manufacturerName: string;
  productType: string | null;
  priceRange: string | null;
  reviewCount: number;
  avgRating: number | null;
  controlPlotRatio: number | null;
  official: boolean;
  description: string | null;
  primaryImageUrl: string | null;
};

export type CompareMaterialItem = {
  id: string;
  name: string;
  manufacturerName: string;
  avgRating: number | null;
  reviewCount: number;
  controlPlotRatio: number | null;
  productType: string | null;
  priceRange: string | null;
  tags: ReadonlyArray<{ id: string; name: string; category: string }>;
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/saved-materials] ${operation}`, error);
}

function bySortOrder(
  left: { id: string; sort_order: number },
  right: { id: string; sort_order: number },
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

async function loadProductTypeNames(
  supabase: SupabaseClient<Database>,
  materialIds: string[],
): Promise<Result<Map<string, string>>> {
  if (materialIds.length === 0) return succeed(new Map());

  const { data, error } = await supabase
    .from("material_product_types")
    .select(
      "material_id, product_type:product_types!material_product_types_product_type_id_fkey(name, sort_order)",
    )
    .in("material_id", materialIds);
  if (error !== null || data === null) {
    reportQueryError("製品タイプの取得に失敗", error);
    return fail("internal");
  }

  const itemsByMaterial = new Map<string, Array<{ name: string; sort_order: number }>>();
  for (const relation of data) {
    if (relation.product_type === null) {
      reportQueryError("製品タイプの参照先が無い", relation);
      return fail("internal");
    }
    const items = itemsByMaterial.get(relation.material_id) ?? [];
    items.push(relation.product_type);
    itemsByMaterial.set(relation.material_id, items);
  }

  return succeed(
    new Map(
      [...itemsByMaterial].map(([materialId, items]) => [
        materialId,
        items
          .toSorted((left, right) => left.sort_order - right.sort_order)
          .map(({ name }) => name)
          .join("、"),
      ]),
    ),
  );
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

/** お気に入り一覧。新しい保存から順。 */
export async function listSavedMaterials(
  userId: string,
  options?: { limit?: number },
): Promise<Result<readonly SavedMaterialItem[]>> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("saved_materials")
    .select(
      `
        id,
        created_at,
        material:materials!saved_materials_material_id_fkey (
          id,
          name,
          manufacturer_name,
          price_range,
          review_count,
          avg_rating,
          control_plot_ratio,
          manufacturer_verified_at,
          description,
          material_images (
            id,
            url,
            image_type,
            sort_order
          )
        )
      `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (options?.limit !== undefined) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error !== null) {
    reportQueryError("検討リストの取得に失敗", error);
    return fail("internal");
  }

  const rows: SavedMaterialQueryRow[] = data;
  const productTypes = await loadProductTypeNames(
    supabase,
    rows.flatMap(({ material }) => (material === null ? [] : [material.id])),
  );
  if (!productTypes.ok) return productTypes;
  const items: SavedMaterialItem[] = [];

  for (const row of rows) {
    if (row.material === null) {
      reportQueryError("検討リストの資材関連が欠落", { savedId: row.id });
      return fail("internal");
    }

    const images = row.material.material_images.toSorted(bySortOrder);

    items.push({
      savedId: row.id,
      savedAt: row.created_at,
      materialId: row.material.id,
      name: row.material.name,
      manufacturerName: row.material.manufacturer_name,
      productType: productTypes.data.get(row.material.id) ?? null,
      priceRange: row.material.price_range,
      reviewCount: row.material.review_count,
      avgRating: row.material.avg_rating,
      controlPlotRatio: row.material.control_plot_ratio,
      official: row.material.manufacturer_verified_at !== null,
      description: row.material.description,
      primaryImageUrl: images[0]?.url ?? null,
    });
  }

  return succeed(items);
}

/** お気に入りから1件解除する。 */
export async function unsaveMaterial(materialId: string, userId: string): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("saved_materials")
    .delete()
    .eq("material_id", materialId)
    .eq("user_id", userId);

  if (error !== null) {
    reportQueryError("お気に入りの解除に失敗", error);
    return fail("internal");
  }

  return succeed(null);
}

/**
 * 比較表用に選択資材を取得する。
 * 件数が 2〜4 以外、または未保存の資材が含まれる場合は invalid_body。
 */
export async function listMaterialsForCompare(
  userId: string,
  materialIds: readonly string[],
): Promise<Result<readonly CompareMaterialItem[]>> {
  const uniqueIds = [...new Set(materialIds)];

  if (
    uniqueIds.length < COMPARE_MATERIAL_LIMITS.min ||
    uniqueIds.length > COMPARE_MATERIAL_LIMITS.max
  ) {
    return fail("invalid_body");
  }

  const supabase = await createServerSupabase();
  const { data: savedRows, error: savedError } = await supabase
    .from("saved_materials")
    .select("material_id")
    .eq("user_id", userId)
    .in("material_id", uniqueIds);

  if (savedError !== null) {
    reportQueryError("比較対象の保存確認に失敗", savedError);
    return fail("internal");
  }

  if (savedRows.length !== uniqueIds.length) {
    return fail("invalid_body");
  }

  const { data, error } = await supabase
    .from("materials")
    .select(
      `
        id,
        name,
        manufacturer_name,
        price_range,
        review_count,
        avg_rating,
        control_plot_ratio
      `,
    )
    .in("id", uniqueIds);

  if (error !== null) {
    reportQueryError("比較資材の取得に失敗", error);
    return fail("internal");
  }

  type CompareQueryRow = Pick<
    MaterialRow,
    | "id"
    | "name"
    | "manufacturer_name"
    | "price_range"
    | "review_count"
    | "avg_rating"
    | "control_plot_ratio"
  >;

  const rows: CompareQueryRow[] = data;
  const byId = new Map(rows.map((row) => [row.id, row]));
  const detailResults = await Promise.all(
    uniqueIds.map((materialId) => getMaterialWithSupabase(supabase, materialId)),
  );
  const detailById = new Map(
    detailResults.flatMap((result) => (result.ok ? [[result.data.id, result.data] as const] : [])),
  );
  if (detailResults.some((result) => !result.ok)) return fail("internal");
  const items: CompareMaterialItem[] = [];

  for (const id of uniqueIds) {
    const row = byId.get(id);
    if (row === undefined) {
      return fail("not_found");
    }
    const detail = detailById.get(id);
    if (detail === undefined) return fail("not_found");
    const tags = [
      ...detail.effects.map(({ id, name }) => ({ id, name, category: "effect" })),
      ...detail.targetCrops.map(({ id, name }) => ({ id, name, category: "crop" })),
      ...detail.productTypes.map(({ id, name }) => ({ id, name, category: "type" })),
      ...detail.searchTags.map(({ id, name, category }) => ({ id, name, category })),
    ];

    items.push({
      id: row.id,
      name: row.name,
      manufacturerName: row.manufacturer_name,
      avgRating: row.avg_rating,
      reviewCount: row.review_count,
      controlPlotRatio: row.control_plot_ratio,
      productType:
        detail.productTypes.length === 0
          ? null
          : detail.productTypes.map(({ name }) => name).join("、"),
      priceRange: row.price_range,
      tags,
    });
  }

  return succeed(items);
}
