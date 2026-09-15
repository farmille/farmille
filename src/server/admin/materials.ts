import { isUniqueViolation, reportAdminError, withAdmin } from "@/server/admin/guard";
import * as v from "valibot";
import { materialInputToRow, type MaterialInput } from "@/server/material-input";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

export {
  type MaterialFieldErrors,
  type MaterialInput,
  type MaterialValidation,
  validateMaterialInput,
} from "@/server/material-input";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

/** 分類・検索層（Farmille のみ編集可・01 §3）。 */
export const CLASSIFICATION_FIELDS = [
  "name",
  "manufacturer_name",
  "composition_type_id",
  "sales_status",
] as const;

/** 一次情報層（claim 済みメーカーも編集可・01 §3）。admin は種まきの初期値を入れられる。 */
export const PRIMARY_INFO_FIELDS = [
  "description",
  "general_use",
  "main_components",
  "mechanism",
  "usage_text",
  "price_range",
  "official_url",
  "catalog_url",
] as const;

export type AdminMaterialListItem = Pick<
  MaterialRow,
  | "id"
  | "name"
  | "manufacturer_name"
  | "sales_status"
  | "seller_id"
  | "review_count"
  | "publication_status"
  | "manufacturer_verified_at"
> & {
  productTypeNames: string[];
  sellerName: string | null;
};

export type AdminMaterialDetail = MaterialRow & {
  cropIds: string[];
  effectIds: string[];
  ingredientCategoryIds: string[];
  ingredientIds: string[];
  productTypeIds: string[];
  searchTagIds: string[];
  sellerName: string | null;
};

function reportError<ErrorValue>(operation: string, error: ErrorValue): void {
  reportAdminError("materials", operation, error);
}

export async function listAdminMaterials(query: string): Promise<Result<AdminMaterialListItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const keyword = query.trim();
    const base = supabase
      .from("materials")
      .select(
        "id, name, manufacturer_name, sales_status, seller_id, review_count, publication_status, manufacturer_verified_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    const { data, error } =
      keyword.length === 0
        ? await base
        : await base.or(`name.ilike.%${keyword}%,manufacturer_name.ilike.%${keyword}%`);

    if (error !== null) {
      reportError("資材一覧の取得に失敗", error);
      return fail("internal");
    }

    const materialIds = data.map(({ id }) => id);
    const [sellerNames, productTypeResult] = await Promise.all([
      loadSellerNames(data.map((row) => row.seller_id).filter((id): id is string => id !== null)),
      materialIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase
            .from("material_product_types")
            .select(
              "material_id, product_type:product_types!material_product_types_product_type_id_fkey(name)",
            )
            .in("material_id", materialIds),
    ]);

    if (!sellerNames.ok) return sellerNames;
    if (productTypeResult.error !== null || productTypeResult.data === null) {
      reportError("資材の製品タイプ取得に失敗", productTypeResult.error);
      return fail("internal");
    }

    const productTypeNamesByMaterial = new Map<string, string[]>();
    for (const relation of productTypeResult.data) {
      if (relation.product_type === null) {
        reportError("製品タイプの参照先が無い", relation);
        return fail("internal");
      }
      const names = productTypeNamesByMaterial.get(relation.material_id) ?? [];
      names.push(relation.product_type.name);
      productTypeNamesByMaterial.set(relation.material_id, names);
    }

    return succeed(
      data.map((row) => ({
        ...row,
        productTypeNames: productTypeNamesByMaterial.get(row.id) ?? [],
        sellerName: row.seller_id === null ? null : (sellerNames.data.get(row.seller_id) ?? null),
      })),
    );
  });
}

async function loadSellerNames(sellerIds: string[]): Promise<Result<Map<string, string>>> {
  const ids = [...new Set(sellerIds)];

  if (ids.length === 0) return succeed(new Map());

  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("seller_accounts")
      .select("id, official_name")
      .in("id", ids);

    if (error !== null) {
      reportError("claim 元のメーカー名の取得に失敗", error);
      return fail("internal");
    }

    return succeed(new Map(data.map((row) => [row.id, row.official_name])));
  });
}

export async function getAdminMaterial(materialId: string): Promise<Result<AdminMaterialDetail>> {
  return withAdmin(async ({ supabase }) => {
    const [
      materialResult,
      cropResult,
      effectResult,
      ingredientCategoryResult,
      ingredientResult,
      productTypeResult,
      searchTagResult,
    ] = await Promise.all([
      supabase.from("materials").select("*").eq("id", materialId).maybeSingle(),
      supabase.from("material_crops").select("crop_id").eq("material_id", materialId),
      supabase.from("material_effects").select("effect_id").eq("material_id", materialId),
      supabase
        .from("material_ingredient_categories")
        .select("ingredient_category_id")
        .eq("material_id", materialId),
      supabase.from("material_ingredients").select("ingredient_id").eq("material_id", materialId),
      supabase
        .from("material_product_types")
        .select("product_type_id")
        .eq("material_id", materialId),
      supabase.from("material_search_tags").select("search_tag_id").eq("material_id", materialId),
    ]);

    if (materialResult.error !== null) {
      reportError("資材詳細の取得に失敗", materialResult.error);
      return fail("internal");
    }
    if (materialResult.data === null) return fail("not_found");
    const relationError =
      cropResult.error ??
      effectResult.error ??
      ingredientCategoryResult.error ??
      ingredientResult.error ??
      productTypeResult.error ??
      searchTagResult.error;
    if (relationError !== null) {
      reportError("資材の分類取得に失敗", relationError);
      return fail("internal");
    }
    const cropRelations = cropResult.data;
    const effectRelations = effectResult.data;
    const ingredientCategoryRelations = ingredientCategoryResult.data;
    const ingredientRelations = ingredientResult.data;
    const productTypeRelations = productTypeResult.data;
    const searchTagRelations = searchTagResult.data;
    if (
      cropRelations === null ||
      effectRelations === null ||
      ingredientCategoryRelations === null ||
      ingredientRelations === null ||
      productTypeRelations === null ||
      searchTagRelations === null
    ) {
      reportError("資材分類の応答にデータが無い", { materialId });
      return fail("internal");
    }

    const sellerId = materialResult.data.seller_id;
    const sellerNames = await loadSellerNames(sellerId === null ? [] : [sellerId]);

    if (!sellerNames.ok) return sellerNames;

    return succeed({
      ...materialResult.data,
      cropIds: cropRelations.map((row) => row.crop_id),
      effectIds: effectRelations.map((row) => row.effect_id),
      ingredientCategoryIds: ingredientCategoryRelations.map((row) => row.ingredient_category_id),
      ingredientIds: ingredientRelations.map((row) => row.ingredient_id),
      productTypeIds: productTypeRelations.map((row) => row.product_type_id),
      searchTagIds: searchTagRelations.map((row) => row.search_tag_id),
      sellerName: sellerId === null ? null : (sellerNames.data.get(sellerId) ?? null),
    });
  });
}

/** 資材の種まき登録（分類・検索層＋一次情報の初期値）。 */
export async function createMaterial(input: MaterialInput): Promise<Result<{ id: string }>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("materials")
      .insert(materialInputToRow(input))
      .select("id")
      .single();

    if (error !== null) {
      if (isUniqueViolation(error)) return fail("conflict");
      reportError("資材の登録に失敗", error);
      return fail("internal");
    }

    const classifications = await replaceMaterialClassifications(data.id, input);
    if (!classifications.ok) return classifications;

    return succeed({ id: data.id });
  });
}

/** 運営が用意する、編集権移行前の資材情報を更新する。 */
export async function updateMaterial(
  materialId: string,
  input: MaterialInput,
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const { data: current, error: currentError } = await supabase
      .from("materials")
      .select("content_revision, seller_id, published_page_version_id")
      .eq("id", materialId)
      .maybeSingle();

    if (currentError !== null) {
      reportError("資材のリビジョン取得に失敗", currentError);
      return fail("internal");
    }
    if (current === null) return fail("not_found");
    if (current.seller_id !== null || current.published_page_version_id !== null) {
      return fail("forbidden");
    }

    const { data, error } = await supabase
      .from("materials")
      .update({ ...materialInputToRow(input), content_revision: current.content_revision + 1 })
      .eq("id", materialId)
      .is("seller_id", null)
      .is("published_page_version_id", null)
      .eq("content_revision", current.content_revision)
      .select("id");

    if (error !== null) {
      if (isUniqueViolation(error)) return fail("conflict");
      reportError("資材の更新に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("not_found");

    return replaceMaterialClassifications(materialId, input);
  });
}

async function replaceMaterialClassifications(
  materialId: string,
  input: MaterialInput,
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const cropIds = [...new Set(input.cropIds)];
    const cropResult =
      cropIds.length === 0
        ? { data: [], error: null }
        : await supabase.from("crops").select("id, name").in("id", cropIds);
    if (cropResult.error !== null || cropResult.data === null) {
      reportError("対象作物名の取得に失敗", cropResult.error);
      return fail("internal");
    }
    if (cropResult.data.length !== cropIds.length) return fail("invalid_body");
    const cropNameById = new Map(cropResult.data.map((crop) => [crop.id, crop.name]));
    const cropRelations: Database["public"]["Tables"]["material_crops"]["Insert"][] = [];
    for (const [index, cropId] of cropIds.entries()) {
      const sourceName = cropNameById.get(cropId);
      if (sourceName === undefined) return fail("invalid_body");
      cropRelations.push({
        material_id: materialId,
        crop_id: cropId,
        source_name: sourceName,
        sort_order: index,
      });
    }

    const deleteResults = await Promise.all([
      supabase.from("material_crops").delete().eq("material_id", materialId),
      supabase.from("material_effects").delete().eq("material_id", materialId),
      supabase.from("material_ingredient_categories").delete().eq("material_id", materialId),
      supabase.from("material_ingredients").delete().eq("material_id", materialId),
      supabase.from("material_product_types").delete().eq("material_id", materialId),
      supabase.from("material_search_tags").delete().eq("material_id", materialId),
    ]);
    const deleteError = deleteResults.find(({ error }) => error !== null)?.error ?? null;
    if (deleteError !== null) {
      reportError("既存分類の削除に失敗", deleteError);
      return fail("internal");
    }

    const effectIds = [...new Set(input.effectIds)];
    const ingredientCategoryIds = [...new Set(input.ingredientCategoryIds)];
    const ingredientIds = [...new Set(input.ingredientIds)];
    const productTypeIds = [...new Set(input.productTypeIds)];
    const searchTagIds = [...new Set(input.searchTagIds)];
    const insertResults = await Promise.all([
      cropIds.length === 0
        ? Promise.resolve({ error: null })
        : supabase.from("material_crops").insert(cropRelations),
      effectIds.length === 0
        ? Promise.resolve({ error: null })
        : supabase
            .from("material_effects")
            .insert(
              effectIds.map((effectId) => ({ material_id: materialId, effect_id: effectId })),
            ),
      ingredientCategoryIds.length === 0
        ? Promise.resolve({ error: null })
        : supabase.from("material_ingredient_categories").insert(
            ingredientCategoryIds.map((ingredientCategoryId) => ({
              material_id: materialId,
              ingredient_category_id: ingredientCategoryId,
            })),
          ),
      ingredientIds.length === 0
        ? Promise.resolve({ error: null })
        : supabase.from("material_ingredients").insert(
            ingredientIds.map((ingredientId) => ({
              material_id: materialId,
              ingredient_id: ingredientId,
            })),
          ),
      productTypeIds.length === 0
        ? Promise.resolve({ error: null })
        : supabase.from("material_product_types").insert(
            productTypeIds.map((productTypeId) => ({
              material_id: materialId,
              product_type_id: productTypeId,
            })),
          ),
      searchTagIds.length === 0
        ? Promise.resolve({ error: null })
        : supabase.from("material_search_tags").insert(
            searchTagIds.map((searchTagId) => ({
              material_id: materialId,
              search_tag_id: searchTagId,
            })),
          ),
    ]);
    const insertError = insertResults.find(({ error }) => error !== null)?.error ?? null;
    if (insertError !== null) {
      reportError("分類の付け替えに失敗", insertError);
      return fail("internal");
    }

    return succeed(null);
  });
}

/**
 * claim の紐づけ・解除（01 §6 未claim ⇄ claim済み）。
 * v1 は自動ハンドシェイクを作らず admin 画面から手動で成立させる。
 */
export async function setMaterialSeller(
  materialId: string,
  sellerId: string | null,
  documentReference: string,
): Promise<Result<null>> {
  const validated = v.safeParse(
    v.object({
      materialId: v.pipe(v.string(), v.uuid()),
      sellerId: v.nullable(v.pipe(v.string(), v.uuid())),
      documentReference: v.pipe(v.string(), v.trim(), v.maxLength(2000)),
    }),
    { materialId, sellerId, documentReference },
  );
  if (!validated.success || (sellerId !== null && validated.output.documentReference.length === 0))
    return fail("invalid_body");
  return withAdmin(async ({ supabase, session }) => {
    if (sellerId !== null) {
      const { data: seller, error } = await supabase
        .from("seller_accounts")
        .select("status")
        .eq("id", sellerId)
        .maybeSingle();

      if (error !== null) {
        reportError("claim 先メーカーの確認に失敗", error);
        return fail("internal");
      }
      if (seller === null) return fail("not_found");
      // 審査中・却下・凍結中の組織に一次情報の編集権を渡さない。
      if (seller.status !== "approved") return fail("conflict");
    }

    const { error } =
      sellerId === null
        ? await supabase.rpc("revoke_material_editor_grant", {
            p_material_id: materialId,
            p_actor_id: session.userId,
          })
        : await supabase.rpc("set_material_editor_grant", {
            p_material_id: materialId,
            p_seller_id: sellerId,
            p_document_reference: validated.output.documentReference,
            p_actor_id: session.userId,
          });

    if (error !== null) {
      reportError("claim 紐づけの更新に失敗", error);
      return fail("internal");
    }
    return succeed(null);
  });
}

/** 運営による公開状態の直接変更。掲載終了でも行と投稿履歴は保持する。 */
export async function setMaterialPublicationStatus(
  materialId: string,
  status: "published" | "archived",
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const { data: material, error: loadError } = await supabase
      .from("materials")
      .select("content_revision")
      .eq("id", materialId)
      .maybeSingle();
    if (loadError !== null) {
      reportError("資材公開状態の取得に失敗", loadError);
      return fail("internal");
    }
    if (material === null) return fail("not_found");

    const { error } = await supabase
      .from("materials")
      .update({
        publication_status: status,
        archived_at: status === "archived" ? new Date().toISOString() : null,
        content_revision: material.content_revision + 1,
      })
      .eq("id", materialId);
    if (error !== null) {
      reportError("資材公開状態の更新に失敗", error);
      return fail("internal");
    }
    return succeed(null);
  });
}
