import * as v from "valibot";
import { trimmedFormDataString } from "@/lib/validation";
import { isUniqueViolation, reportAdminError, withAdmin } from "@/server/admin/guard";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

/** 分類・検索層（Farmille のみ編集可・01 §3）。 */
export const CLASSIFICATION_FIELDS = [
  "name",
  "manufacturer_name",
  "composition_type_id",
  "sales_status",
] as const;

/** 一次情報層（claim 済み出品者も編集可・01 §3）。admin は種まきの初期値を入れられる。 */
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

export type MaterialInput = {
  name: string;
  manufacturerName: string;
  compositionTypeId: string | null;
  salesStatus: string | null;
  description: string | null;
  generalUse: string | null;
  mainComponents: string | null;
  mechanism: string | null;
  usageText: string | null;
  priceRange: string | null;
  officialUrl: string | null;
  catalogUrl: string | null;
  cropIds: string[];
  effectIds: string[];
  ingredientCategoryIds: string[];
  ingredientIds: string[];
  productTypeIds: string[];
  searchTagIds: string[];
};

export type AdminMaterialListItem = Pick<
  MaterialRow,
  "id" | "name" | "manufacturer_name" | "sales_status" | "seller_id" | "review_count"
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

export type MaterialEditRequestItem = {
  id: string;
  materialId: string;
  materialName: string;
  sellerId: string;
  sellerName: string;
  requestText: string;
  status: string;
  createdAt: string;
};

export const EDIT_REQUEST_STATUSES = ["open", "done", "declined"] as const;
export type EditRequestStatus = (typeof EDIT_REQUEST_STATUSES)[number];

export const EDIT_REQUEST_STATUS_LABELS = {
  open: "未処理",
  done: "対応済み",
  declined: "見送り",
} satisfies Record<EditRequestStatus, string>;

export function isEditRequestStatus(value: string | null | undefined): value is EditRequestStatus {
  return value !== null && EDIT_REQUEST_STATUSES.some((status) => status === value);
}

function reportError<ErrorValue>(operation: string, error: ErrorValue): void {
  reportAdminError("materials", operation, error);
}

export type MaterialFieldErrors = Partial<
  Record<
    | "name"
    | "manufacturerName"
    | "officialUrl"
    | "catalogUrl"
    | "compositionTypeId"
    | "classifications",
    string
  >
>;

export type MaterialValidation =
  | { ok: true; input: MaterialInput }
  | { ok: false; fieldErrors: MaterialFieldErrors };

function toOptionalText(value: FormDataEntryValue | null): string | null {
  const text = trimmedFormDataString(value);

  return text.length === 0 ? null : text;
}

type UrlParse = { ok: true; value: string | null } | { ok: false };

function toOptionalHttpUrl(value: FormDataEntryValue | null): UrlParse {
  const text = trimmedFormDataString(value);
  if (text.length === 0) return { ok: true, value: null };

  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false };

    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false };
  }
}

/** フォーム入力の検証。分類・検索層の name / manufacturer_name だけが必須。 */
export function validateMaterialInput(raw: {
  name: FormDataEntryValue | null;
  manufacturerName: FormDataEntryValue | null;
  compositionTypeId: FormDataEntryValue | null;
  salesStatus: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  generalUse: FormDataEntryValue | null;
  mainComponents: FormDataEntryValue | null;
  mechanism: FormDataEntryValue | null;
  usageText: FormDataEntryValue | null;
  priceRange: FormDataEntryValue | null;
  officialUrl: FormDataEntryValue | null;
  catalogUrl: FormDataEntryValue | null;
  cropIds: readonly FormDataEntryValue[];
  effectIds: readonly FormDataEntryValue[];
  ingredientCategoryIds: readonly FormDataEntryValue[];
  ingredientIds: readonly FormDataEntryValue[];
  productTypeIds: readonly FormDataEntryValue[];
  searchTagIds: readonly FormDataEntryValue[];
}): MaterialValidation {
  const fieldErrors: MaterialFieldErrors = {};
  const name = trimmedFormDataString(raw.name);
  const manufacturerName = trimmedFormDataString(raw.manufacturerName);

  if (name.length === 0) fieldErrors.name = "資材名を入力してください。";
  if (manufacturerName.length === 0) {
    fieldErrors.manufacturerName = "メーカー名を入力してください。";
  }

  const officialUrl = toOptionalHttpUrl(raw.officialUrl);
  const catalogUrl = toOptionalHttpUrl(raw.catalogUrl);

  if (!officialUrl.ok) fieldErrors.officialUrl = "http(s) の URL で入力してください。";
  if (!catalogUrl.ok) fieldErrors.catalogUrl = "http(s) の URL で入力してください。";
  const compositionTypeIdText = trimmedFormDataString(raw.compositionTypeId);
  const compositionTypeIdResult = v.safeParse(
    v.union([v.literal(""), v.pipe(v.string(), v.uuid())]),
    compositionTypeIdText,
  );
  if (!compositionTypeIdResult.success) {
    fieldErrors.compositionTypeId = "組成タイプの選択内容が正しくありません。";
  }

  const idListSchema = v.array(v.pipe(v.string(), v.uuid()));
  const cropIdsResult = v.safeParse(idListSchema, raw.cropIds);
  const effectIdsResult = v.safeParse(idListSchema, raw.effectIds);
  const ingredientCategoryIdsResult = v.safeParse(idListSchema, raw.ingredientCategoryIds);
  const ingredientIdsResult = v.safeParse(idListSchema, raw.ingredientIds);
  const productTypeIdsResult = v.safeParse(idListSchema, raw.productTypeIds);
  const searchTagIdsResult = v.safeParse(idListSchema, raw.searchTagIds);
  const classificationResults = [
    cropIdsResult,
    effectIdsResult,
    ingredientCategoryIdsResult,
    ingredientIdsResult,
    productTypeIdsResult,
    searchTagIdsResult,
  ];
  if (classificationResults.some((result) => !result.success)) {
    fieldErrors.classifications = "分類の選択内容が正しくありません。";
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !compositionTypeIdResult.success ||
    !cropIdsResult.success ||
    !effectIdsResult.success ||
    !ingredientCategoryIdsResult.success ||
    !ingredientIdsResult.success ||
    !productTypeIdsResult.success ||
    !searchTagIdsResult.success
  ) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      name,
      manufacturerName,
      compositionTypeId:
        compositionTypeIdResult.output.length === 0 ? null : compositionTypeIdResult.output,
      salesStatus: toOptionalText(raw.salesStatus),
      description: toOptionalText(raw.description),
      generalUse: toOptionalText(raw.generalUse),
      mainComponents: toOptionalText(raw.mainComponents),
      mechanism: toOptionalText(raw.mechanism),
      usageText: toOptionalText(raw.usageText),
      priceRange: toOptionalText(raw.priceRange),
      officialUrl: officialUrl.ok ? officialUrl.value : null,
      catalogUrl: catalogUrl.ok ? catalogUrl.value : null,
      cropIds: cropIdsResult.output,
      effectIds: effectIdsResult.output,
      ingredientCategoryIds: ingredientCategoryIdsResult.output,
      ingredientIds: ingredientIdsResult.output,
      productTypeIds: productTypeIdsResult.output,
      searchTagIds: searchTagIdsResult.output,
    },
  };
}

function toRow(input: MaterialInput): Database["public"]["Tables"]["materials"]["Insert"] {
  return {
    name: input.name,
    manufacturer_name: input.manufacturerName,
    composition_type_id: input.compositionTypeId,
    sales_status: input.salesStatus,
    description: input.description,
    general_use: input.generalUse,
    main_components: input.mainComponents,
    mechanism: input.mechanism,
    usage_text: input.usageText,
    price_range: input.priceRange,
    official_url: input.officialUrl,
    catalog_url: input.catalogUrl,
  };
}

export async function listAdminMaterials(query: string): Promise<Result<AdminMaterialListItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const keyword = query.trim();
    const base = supabase
      .from("materials")
      .select("id, name, manufacturer_name, sales_status, seller_id, review_count")
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
      reportError("claim 元の出品者名の取得に失敗", error);
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
      .insert(toRow(input))
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

/** 資材の編集（admin は全カラム可）。 */
export async function updateMaterial(
  materialId: string,
  input: MaterialInput,
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("materials")
      .update(toRow(input))
      .eq("id", materialId)
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
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    if (sellerId !== null) {
      const { data: seller, error } = await supabase
        .from("seller_accounts")
        .select("status")
        .eq("id", sellerId)
        .maybeSingle();

      if (error !== null) {
        reportError("claim 先出品者の確認に失敗", error);
        return fail("internal");
      }
      if (seller === null) return fail("not_found");
      // 審査中・却下・凍結中の組織に一次情報の編集権を渡さない。
      if (seller.status !== "approved") return fail("conflict");
    }

    const { data, error } = await supabase
      .from("materials")
      .update({ seller_id: sellerId })
      .eq("id", materialId)
      .select("id");

    if (error !== null) {
      reportError("claim 紐づけの更新に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("not_found");

    return succeed(null);
  });
}

/** 分類変更申請の一覧（01 §3 material_edit_requests）。 */
export async function listMaterialEditRequests(
  status: EditRequestStatus | "all",
): Promise<Result<MaterialEditRequestItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const base = supabase
      .from("material_edit_requests")
      .select("id, material_id, seller_id, request_text, status, created_at")
      .order("created_at", { ascending: false });
    const { data, error } = await (status === "all" ? base : base.eq("status", status));

    if (error !== null) {
      reportError("分類変更申請の取得に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return succeed([]);

    const [materialsResult, sellersResult] = await Promise.all([
      supabase
        .from("materials")
        .select("id, name")
        .in("id", [...new Set(data.map((row) => row.material_id))]),
      supabase
        .from("seller_accounts")
        .select("id, official_name")
        .in("id", [...new Set(data.map((row) => row.seller_id))]),
    ]);

    if (materialsResult.error !== null || sellersResult.error !== null) {
      reportError(
        "分類変更申請の関連レコード取得に失敗",
        materialsResult.error ?? sellersResult.error,
      );
      return fail("internal");
    }

    const materialNames = new Map(materialsResult.data.map((row) => [row.id, row.name]));
    const sellerNames = new Map(sellersResult.data.map((row) => [row.id, row.official_name]));

    return succeed(
      data.map((row) => ({
        id: row.id,
        materialId: row.material_id,
        materialName: materialNames.get(row.material_id) ?? "（削除済みの資材）",
        sellerId: row.seller_id,
        sellerName: sellerNames.get(row.seller_id) ?? "（削除済みの出品者）",
        requestText: row.request_text,
        status: row.status,
        createdAt: row.created_at,
      })),
    );
  });
}

/** 分類変更申請の処理（open → done / declined）。 */
export async function resolveMaterialEditRequest(
  requestId: string,
  nextStatus: Exclude<EditRequestStatus, "open">,
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("material_edit_requests")
      .update({ status: nextStatus })
      .eq("id", requestId)
      .eq("status", "open")
      .select("id");

    if (error !== null) {
      reportError("分類変更申請の処理に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("conflict");

    return succeed(null);
  });
}
