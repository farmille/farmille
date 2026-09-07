import { reportAdminError, withAdmin } from "@/server/admin/guard";
import { getAdminMaterial, type AdminMaterialDetail } from "@/server/admin/materials";
import type { MaterialChangeRequestStatus } from "@/lib/material-change";
import type { MaterialInput } from "@/server/material-input";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type RequestRow = Database["public"]["Tables"]["material_change_requests"]["Row"];
type EvidenceRow = Database["public"]["Tables"]["material_change_request_evidences"]["Row"];

export {
  isMaterialChangeRequestStatus,
  isMaterialChangeType,
  MATERIAL_CHANGE_REQUEST_STATUSES,
  MATERIAL_CHANGE_REQUEST_STATUS_LABELS,
  MATERIAL_CHANGE_TYPES,
  MATERIAL_CHANGE_TYPE_LABELS,
  type MaterialChangeRequestStatus,
  type MaterialChangeType,
} from "@/lib/material-change";

export type MaterialChangeRequestListItem = Pick<
  RequestRow,
  | "id"
  | "material_id"
  | "result_material_id"
  | "seller_id"
  | "status"
  | "change_type"
  | "reason"
  | "submitted_at"
> & {
  materialName: string;
  sellerName: string;
};

export type MaterialChangeRequestSnapshot = MaterialInput & {
  evidences: EvidenceRow[];
};

export type MaterialChangeRequestDetail = {
  request: RequestRow;
  sellerName: string;
  proposal: MaterialChangeRequestSnapshot;
  current: AdminMaterialDetail | null;
};

function reportError<ErrorValue>(operation: string, error: ErrorValue): void {
  reportAdminError("material-change-requests", operation, error);
}

function mutationError(error: { code?: string | null }): Result<never> {
  if (error.code === "P0002") return fail("not_found");
  if (error.code === "23505" || error.code === "40001") return fail("conflict");
  if (error.code === "23514" || error.code === "22023" || error.code === "22P02") {
    return fail("invalid_body");
  }
  if (error.code === "42501") return fail("forbidden");
  return fail("internal");
}

export async function listMaterialChangeRequests(
  status: MaterialChangeRequestStatus | "all",
): Promise<Result<MaterialChangeRequestListItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const base = supabase
      .from("material_change_requests")
      .select(
        "id, material_id, result_material_id, seller_id, status, change_type, reason, submitted_at",
      )
      .order("submitted_at", { ascending: false });
    const { data, error } = await (status === "all" ? base : base.eq("status", status));

    if (error !== null) {
      reportError("申請一覧の取得に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return succeed([]);

    const requestIds = data.map(({ id }) => id);
    const sellerIds = [...new Set(data.map(({ seller_id }) => seller_id))];
    const [detailsResult, sellersResult] = await Promise.all([
      supabase
        .from("material_change_request_details")
        .select("request_id, name")
        .in("request_id", requestIds),
      supabase.from("seller_accounts").select("id, official_name").in("id", sellerIds),
    ]);

    if (detailsResult.error !== null || sellersResult.error !== null) {
      reportError("申請の関連情報取得に失敗", detailsResult.error ?? sellersResult.error);
      return fail("internal");
    }

    const materialNames = new Map(detailsResult.data.map((row) => [row.request_id, row.name]));
    const sellerNames = new Map(sellersResult.data.map((row) => [row.id, row.official_name]));

    const items: MaterialChangeRequestListItem[] = [];
    for (const row of data) {
      const materialName = materialNames.get(row.id);
      const sellerName = sellerNames.get(row.seller_id);
      if (materialName === undefined || sellerName === undefined) {
        reportError("申請の参照先が不足", row);
        return fail("internal");
      }
      items.push({ ...row, materialName, sellerName });
    }

    return succeed(items);
  });
}

export async function getMaterialChangeRequest(
  requestId: string,
): Promise<Result<MaterialChangeRequestDetail>> {
  const requestResult = await withAdmin(async ({ supabase }) => {
    const [
      request,
      detail,
      crops,
      effects,
      ingredientCategories,
      ingredients,
      productTypes,
      tags,
      evidences,
    ] = await Promise.all([
      supabase.from("material_change_requests").select("*").eq("id", requestId).maybeSingle(),
      supabase
        .from("material_change_request_details")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle(),
      supabase.from("material_change_request_crops").select("crop_id").eq("request_id", requestId),
      supabase
        .from("material_change_request_effects")
        .select("effect_id")
        .eq("request_id", requestId),
      supabase
        .from("material_change_request_ingredient_categories")
        .select("ingredient_category_id")
        .eq("request_id", requestId),
      supabase
        .from("material_change_request_ingredients")
        .select("ingredient_id")
        .eq("request_id", requestId),
      supabase
        .from("material_change_request_product_types")
        .select("product_type_id")
        .eq("request_id", requestId),
      supabase
        .from("material_change_request_search_tags")
        .select("search_tag_id")
        .eq("request_id", requestId),
      supabase
        .from("material_change_request_evidences")
        .select("*")
        .eq("request_id", requestId)
        .order("sort_order", { ascending: true }),
    ]);

    const error =
      request.error ??
      detail.error ??
      crops.error ??
      effects.error ??
      ingredientCategories.error ??
      ingredients.error ??
      productTypes.error ??
      tags.error ??
      evidences.error;
    if (error !== null) {
      reportError("申請詳細の取得に失敗", error);
      return fail("internal");
    }
    if (request.data === null || detail.data === null) return fail("not_found");
    if (
      crops.data === null ||
      effects.data === null ||
      ingredientCategories.data === null ||
      ingredients.data === null ||
      productTypes.data === null ||
      tags.data === null ||
      evidences.data === null
    ) {
      reportError("申請詳細の関連データが空", { requestId });
      return fail("internal");
    }

    const { data: seller, error: sellerError } = await supabase
      .from("seller_accounts")
      .select("official_name")
      .eq("id", request.data.seller_id)
      .maybeSingle();
    if (sellerError !== null) {
      reportError("申請元メーカーの取得に失敗", sellerError);
      return fail("internal");
    }
    if (seller === null) return fail("not_found");

    return succeed({
      request: request.data,
      sellerName: seller.official_name,
      proposal: {
        name: detail.data.name,
        manufacturerName: detail.data.manufacturer_name,
        compositionTypeId: detail.data.composition_type_id,
        salesStatus: detail.data.sales_status,
        description: detail.data.description,
        generalUse: detail.data.general_use,
        mainComponents: detail.data.main_components,
        mechanism: detail.data.mechanism,
        usageText: detail.data.usage_text,
        priceRange: detail.data.price_range,
        officialUrl: detail.data.official_url,
        catalogUrl: detail.data.catalog_url,
        cropIds: crops.data.map(({ crop_id }) => crop_id),
        effectIds: effects.data.map(({ effect_id }) => effect_id),
        ingredientCategoryIds: ingredientCategories.data.map(
          ({ ingredient_category_id }) => ingredient_category_id,
        ),
        ingredientIds: ingredients.data.map(({ ingredient_id }) => ingredient_id),
        productTypeIds: productTypes.data.map(({ product_type_id }) => product_type_id),
        searchTagIds: tags.data.map(({ search_tag_id }) => search_tag_id),
        evidences: evidences.data,
      },
      materialId: request.data.material_id,
    });
  });

  if (!requestResult.ok) return requestResult;
  const { materialId, ...data } = requestResult.data;
  if (materialId === null) return succeed({ ...data, current: null });

  const current = await getAdminMaterial(materialId);
  if (!current.ok) return current;
  return succeed({ ...data, current: current.data });
}

export async function approveMaterialChangeRequest(
  requestId: string,
  reviewNote: string,
): Promise<Result<{ materialId: string }>> {
  return withAdmin(async ({ session, supabase }) => {
    const { data, error } = await supabase.rpc("approve_material_change_request", {
      p_request_id: requestId,
      p_reviewed_by_user_id: session.userId,
      p_review_note: reviewNote,
    });

    if (error !== null) {
      reportError("申請の承認に失敗", error);
      return mutationError(error);
    }
    return succeed({ materialId: data });
  });
}

export async function rejectMaterialChangeRequest(
  requestId: string,
  reviewNote: string,
): Promise<Result<null>> {
  return withAdmin(async ({ session, supabase }) => {
    const { error } = await supabase.rpc("reject_material_change_request", {
      p_request_id: requestId,
      p_reviewed_by_user_id: session.userId,
      p_review_note: reviewNote,
    });

    if (error !== null) {
      reportError("申請の却下に失敗", error);
      return mutationError(error);
    }
    return succeed(null);
  });
}
