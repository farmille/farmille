import { isUniqueViolation, reportAdminError, withAdmin } from "@/server/admin/guard";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

/** 分類・検索層（Farmille のみ編集可・01 §3）。 */
export const CLASSIFICATION_FIELDS = [
  "name",
  "manufacturer_name",
  "product_type",
  "jbsa_class",
  "sales_status",
] as const;

/** 一次情報層（claim 済み出品者も編集可・01 §3）。admin は種まきの初期値を入れられる。 */
export const PRIMARY_INFO_FIELDS = [
  "description",
  "general_use",
  "ingredients",
  "mechanism",
  "usage_text",
  "price_range",
  "official_url",
  "catalog_url",
] as const;

export type MaterialInput = {
  name: string;
  manufacturerName: string;
  productType: string | null;
  jbsaClass: string | null;
  salesStatus: string | null;
  description: string | null;
  generalUse: string | null;
  ingredients: string | null;
  mechanism: string | null;
  usageText: string | null;
  priceRange: string | null;
  officialUrl: string | null;
  catalogUrl: string | null;
  tagIds: string[];
};

export type AdminMaterialListItem = Pick<
  MaterialRow,
  | "id"
  | "name"
  | "manufacturer_name"
  | "product_type"
  | "sales_status"
  | "seller_id"
  | "review_count"
> & {
  sellerName: string | null;
};

export type AdminMaterialDetail = MaterialRow & {
  tagIds: string[];
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

export const EDIT_REQUEST_STATUS_LABELS: Record<EditRequestStatus, string> = {
  open: "未処理",
  done: "対応済み",
  declined: "見送り",
};

export function isEditRequestStatus(value: unknown): value is EditRequestStatus {
  return (EDIT_REQUEST_STATUSES as readonly unknown[]).includes(value);
}

function reportError(operation: string, error: unknown): void {
  reportAdminError("materials", operation, error);
}

export type MaterialFieldErrors = Partial<
  Record<"name" | "manufacturerName" | "officialUrl" | "catalogUrl", string>
>;

export type MaterialValidation =
  | { ok: true; input: MaterialInput }
  | { ok: false; fieldErrors: MaterialFieldErrors };

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalText(value: unknown): string | null {
  const text = toTrimmedString(value);

  return text.length === 0 ? null : text;
}

type UrlParse = { ok: true; value: string | null } | { ok: false };

function toOptionalHttpUrl(value: unknown): UrlParse {
  const text = toTrimmedString(value);
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
  name: unknown;
  manufacturerName: unknown;
  productType: unknown;
  jbsaClass: unknown;
  salesStatus: unknown;
  description: unknown;
  generalUse: unknown;
  ingredients: unknown;
  mechanism: unknown;
  usageText: unknown;
  priceRange: unknown;
  officialUrl: unknown;
  catalogUrl: unknown;
  tagIds: unknown;
}): MaterialValidation {
  const fieldErrors: MaterialFieldErrors = {};
  const name = toTrimmedString(raw.name);
  const manufacturerName = toTrimmedString(raw.manufacturerName);

  if (name.length === 0) fieldErrors.name = "資材名を入力してください。";
  if (manufacturerName.length === 0) {
    fieldErrors.manufacturerName = "メーカー名を入力してください。";
  }

  const officialUrl = toOptionalHttpUrl(raw.officialUrl);
  const catalogUrl = toOptionalHttpUrl(raw.catalogUrl);

  if (!officialUrl.ok) fieldErrors.officialUrl = "http(s) の URL で入力してください。";
  if (!catalogUrl.ok) fieldErrors.catalogUrl = "http(s) の URL で入力してください。";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    input: {
      name,
      manufacturerName,
      productType: toOptionalText(raw.productType),
      jbsaClass: toOptionalText(raw.jbsaClass),
      salesStatus: toOptionalText(raw.salesStatus),
      description: toOptionalText(raw.description),
      generalUse: toOptionalText(raw.generalUse),
      ingredients: toOptionalText(raw.ingredients),
      mechanism: toOptionalText(raw.mechanism),
      usageText: toOptionalText(raw.usageText),
      priceRange: toOptionalText(raw.priceRange),
      officialUrl: officialUrl.ok ? officialUrl.value : null,
      catalogUrl: catalogUrl.ok ? catalogUrl.value : null,
      tagIds: Array.isArray(raw.tagIds)
        ? raw.tagIds.filter((value): value is string => typeof value === "string")
        : [],
    },
  };
}

function toRow(input: MaterialInput) {
  return {
    name: input.name,
    manufacturer_name: input.manufacturerName,
    product_type: input.productType,
    jbsa_class: input.jbsaClass,
    sales_status: input.salesStatus,
    description: input.description,
    general_use: input.generalUse,
    ingredients: input.ingredients,
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
      .select("id, name, manufacturer_name, product_type, sales_status, seller_id, review_count")
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

    const sellerNames = await loadSellerNames(
      data.map((row) => row.seller_id).filter((id): id is string => id !== null),
    );

    if (!sellerNames.ok) return sellerNames;

    return succeed(
      data.map((row) => ({
        ...row,
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
    const [materialResult, tagResult] = await Promise.all([
      supabase.from("materials").select("*").eq("id", materialId).maybeSingle(),
      supabase.from("material_tags").select("tag_id").eq("material_id", materialId),
    ]);

    if (materialResult.error !== null) {
      reportError("資材詳細の取得に失敗", materialResult.error);
      return fail("internal");
    }
    if (materialResult.data === null) return fail("not_found");
    if (tagResult.error !== null) {
      reportError("資材のタグ取得に失敗", tagResult.error);
      return fail("internal");
    }

    const sellerId = materialResult.data.seller_id;
    const sellerNames = await loadSellerNames(sellerId === null ? [] : [sellerId]);

    if (!sellerNames.ok) return sellerNames;

    return succeed({
      ...materialResult.data,
      tagIds: tagResult.data.map((row) => row.tag_id),
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

    const tags = await replaceMaterialTags(data.id, input.tagIds);
    if (!tags.ok) return tags;

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

    return replaceMaterialTags(materialId, input.tagIds);
  });
}

async function replaceMaterialTags(materialId: string, tagIds: string[]): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const nextTagIds = [...new Set(tagIds)];
    const { error: deleteError } = await supabase
      .from("material_tags")
      .delete()
      .eq("material_id", materialId);

    if (deleteError !== null) {
      reportError("既存タグの削除に失敗", deleteError);
      return fail("internal");
    }

    if (nextTagIds.length === 0) return succeed(null);

    const { error: insertError } = await supabase
      .from("material_tags")
      .insert(nextTagIds.map((tagId) => ({ material_id: materialId, tag_id: tagId })));

    if (insertError !== null) {
      reportError("タグの付け替えに失敗", insertError);
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
