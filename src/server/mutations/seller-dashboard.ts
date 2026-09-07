import type { SupabaseClient } from "@supabase/supabase-js";
import type { ErrorCode } from "@/server/errors";
import { formDataString } from "@/lib/validation";
import type { MaterialInput } from "@/server/material-input";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

export const PRIMARY_INFORMATION_FIELDS = [
  "description",
  "general_use",
  "main_components",
  "mechanism",
  "usage_text",
  "price_range",
  "official_url",
  "catalog_url",
] as const;

export type PrimaryInformationField = (typeof PRIMARY_INFORMATION_FIELDS)[number];
export type PrimaryInformationUpdate = Pick<MaterialRow, PrimaryInformationField>;

type ValidationSuccess<T> = {
  ok: true;
  input: T;
};

type ValidationFailure = {
  ok: false;
  fieldErrors: Record<string, string>;
};

export type InputValidation<T> = ValidationSuccess<T> | ValidationFailure;

export const EVIDENCE_TYPES = ["sds", "paper", "trial", "leaflet"] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export type EvidenceInput = {
  evidenceType: EvidenceType;
  title: string;
  source: { kind: "external"; externalUrl: string } | { kind: "storage"; storagePath: string };
};

function optionalText(
  value: FormDataEntryValue | null,
  field: string,
  fieldErrors: Record<string, string>,
): string | null {
  const parsed = formDataString(value);
  if (parsed === null) {
    fieldErrors[field] = "入力内容を確認してください。";
    return null;
  }

  const normalized = parsed.trim();
  return normalized.length === 0 ? null : normalized;
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** 一次情報層の8カラムだけを正規化する。分類・検索層は入力型にも含めない。 */
export function validatePrimaryInformation(input: {
  description: FormDataEntryValue | null;
  general_use: FormDataEntryValue | null;
  main_components: FormDataEntryValue | null;
  mechanism: FormDataEntryValue | null;
  usage_text: FormDataEntryValue | null;
  price_range: FormDataEntryValue | null;
  official_url: FormDataEntryValue | null;
  catalog_url: FormDataEntryValue | null;
}): InputValidation<PrimaryInformationUpdate> {
  const fieldErrors: Record<string, string> = {};
  const normalized: PrimaryInformationUpdate = {
    description: optionalText(input.description, "description", fieldErrors),
    general_use: optionalText(input.general_use, "general_use", fieldErrors),
    main_components: optionalText(input.main_components, "main_components", fieldErrors),
    mechanism: optionalText(input.mechanism, "mechanism", fieldErrors),
    usage_text: optionalText(input.usage_text, "usage_text", fieldErrors),
    price_range: optionalText(input.price_range, "price_range", fieldErrors),
    official_url: optionalText(input.official_url, "official_url", fieldErrors),
    catalog_url: optionalText(input.catalog_url, "catalog_url", fieldErrors),
  };

  for (const field of ["official_url", "catalog_url"] as const) {
    const value = normalized[field];
    if (value !== null && !validHttpUrl(value)) {
      fieldErrors[field] = "URLはhttpまたはhttpsで始まる形式で入力してください。";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, input: normalized };
}

function isEvidenceType(value: string): value is EvidenceType {
  return EVIDENCE_TYPES.some((type) => type === value);
}

function storagePathForMaterial(path: string, sellerId: string, materialId: string): boolean {
  const prefix = `${sellerId}/${materialId}/evidences/`;
  if (!path.startsWith(prefix)) return false;

  const objectName = path.slice(prefix.length);
  return /^[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/.test(objectName);
}

function evidenceSource(
  externalUrl: string | null,
  storagePath: string | null,
): EvidenceInput["source"] | null {
  if (externalUrl !== null && storagePath === null) {
    return { kind: "external", externalUrl };
  }
  if (externalUrl === null && storagePath !== null) {
    return { kind: "storage", storagePath };
  }
  return null;
}

/** エビデンスは外部URLか、本人フォルダへアップロード済みの画像を1つだけ受け取る。 */
export function validateEvidenceInput(
  input: {
    evidenceType: FormDataEntryValue | null;
    title: FormDataEntryValue | null;
    externalUrl: FormDataEntryValue | null;
    storagePath: FormDataEntryValue | null;
  },
  sellerId: string,
  materialId: string,
): InputValidation<EvidenceInput> {
  const fieldErrors: Record<string, string> = {};
  const evidenceTypeValue = formDataString(input.evidenceType);
  const evidenceType =
    evidenceTypeValue !== null && isEvidenceType(evidenceTypeValue) ? evidenceTypeValue : null;
  const title = optionalText(input.title, "title", fieldErrors);
  const externalUrl = optionalText(input.externalUrl, "externalUrl", fieldErrors);
  const storagePath = optionalText(input.storagePath, "storagePath", fieldErrors);
  const source = evidenceSource(externalUrl, storagePath);

  if (evidenceType === null) {
    fieldErrors.evidenceType = "エビデンスの種類を選択してください。";
  }
  if (title === null) {
    fieldErrors.title = "タイトルを入力してください。";
  }

  if (source === null) {
    fieldErrors.source = "ファイルまたは外部URLのどちらか一方を指定してください。";
  }
  if (externalUrl !== null && !validHttpUrl(externalUrl)) {
    fieldErrors.externalUrl = "URLはhttpまたはhttpsで始まる形式で入力してください。";
  }
  if (storagePath !== null && !storagePathForMaterial(storagePath, sellerId, materialId)) {
    fieldErrors.storagePath = "アップロード先を確認してください。";
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    evidenceType === null ||
    title === null ||
    source === null
  ) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      evidenceType,
      title,
      source,
    },
  };
}

export function validateEditRequestText(value: FormDataEntryValue | null): InputValidation<string> {
  const text = formDataString(value);
  if (text === null || text.trim().length === 0) {
    return {
      ok: false,
      fieldErrors: { requestText: "変更してほしい内容と理由を入力してください。" },
    };
  }

  return { ok: true, input: text.trim() };
}

function errorCodeForMutation(error: { code?: string }): ErrorCode {
  switch (error.code) {
    case "42501":
      return "forbidden";
    case "23505":
    case "40001":
      return "conflict";
    case "P0002":
      return "not_found";
    case "23514":
    case "22P02":
      return "invalid_body";
    default:
      return "internal";
  }
}

function reportMutationError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/mutations/seller-dashboard] ${operation}`, error);
}

async function ensureOwnedMaterial(
  supabase: SupabaseClient<Database>,
  sellerId: string,
  materialId: string,
): Promise<Result<null>> {
  const { data, error } = await supabase
    .from("materials")
    .select("id")
    .eq("id", materialId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error !== null) {
    reportMutationError("資材所有権の確認に失敗", error);
    return fail("internal");
  }

  return data === null ? fail("not_found") : succeed(null);
}

function materialRpcParameters(input: MaterialInput, reason: string) {
  return {
    p_name: input.name,
    p_composition_type_id: input.compositionTypeId ?? "",
    p_sales_status: input.salesStatus ?? "",
    p_description: input.description ?? "",
    p_general_use: input.generalUse ?? "",
    p_main_components: input.mainComponents ?? "",
    p_mechanism: input.mechanism ?? "",
    p_usage_text: input.usageText ?? "",
    p_price_range: input.priceRange ?? "",
    p_official_url: input.officialUrl ?? "",
    p_catalog_url: input.catalogUrl ?? "",
    p_crop_ids: input.cropIds,
    p_effect_ids: input.effectIds,
    p_ingredient_category_ids: input.ingredientCategoryIds,
    p_ingredient_ids: input.ingredientIds,
    p_product_type_ids: input.productTypeIds,
    p_search_tag_ids: input.searchTagIds,
    p_reason: reason,
  };
}

/** メーカーによる新規資材を、公開せず承認待ちスナップショットとして保存する。 */
export async function submitSellerMaterialCreateRequest(
  input: MaterialInput,
  reason: string,
): Promise<Result<{ requestId: string }>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc(
    "submit_material_create_change",
    materialRpcParameters(input, reason),
  );

  if (error !== null) {
    reportMutationError("資材新規登録申請に失敗", error);
    return fail(errorCodeForMutation(error));
  }
  return succeed({ requestId: data });
}

/** メーカーによる公開資材の変更を、承認待ちスナップショットとして保存する。 */
export async function submitSellerMaterialUpdateRequest(
  materialId: string,
  input: MaterialInput,
  reason: string,
): Promise<Result<{ requestId: string }>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("submit_material_update_change", {
    p_material_id: materialId,
    ...materialRpcParameters(input, reason),
  });

  if (error !== null) {
    reportMutationError("資材情報変更申請に失敗", error);
    return fail(errorCodeForMutation(error));
  }
  return succeed({ requestId: data });
}

export async function submitSellerMaterialArchiveRequest(
  materialId: string,
  reason: string,
): Promise<Result<{ requestId: string }>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("submit_material_archive_request", {
    p_material_id: materialId,
    p_reason: reason,
  });

  if (error !== null) {
    reportMutationError("資材掲載終了申請に失敗", error);
    return fail(errorCodeForMutation(error));
  }
  return succeed({ requestId: data });
}

export async function confirmSellerMaterialInformation(materialId: string): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("confirm_material_information", {
    p_material_id: materialId,
  });

  if (error !== null) {
    reportMutationError("資材情報のメーカー確認に失敗", error);
    return fail(errorCodeForMutation(error));
  }
  return succeed(null);
}

export async function cancelSellerMaterialChangeRequest(requestId: string): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("cancel_material_change_request", {
    p_request_id: requestId,
  });

  if (error !== null) {
    reportMutationError("資材変更申請の取消に失敗", error);
    return fail(errorCodeForMutation(error));
  }
  return succeed(null);
}

/** エビデンス追加も公開行へ直接書かず、資材変更申請として保存する。 */
export async function createSellerMaterialEvidence(
  sellerId: string,
  materialId: string,
  input: EvidenceInput,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const ownership = await ensureOwnedMaterial(supabase, sellerId, materialId);
  if (!ownership.ok) return ownership;

  const storagePath = input.source.kind === "storage" ? input.source.storagePath : null;
  const fileUrl =
    storagePath === null
      ? null
      : supabase.storage.from("material-images").getPublicUrl(storagePath).data.publicUrl;
  const { error } = await supabase.rpc("submit_material_evidence_add_request", {
    p_material_id: materialId,
    p_evidence_type: input.evidenceType,
    p_title: input.title,
    p_file_url: fileUrl ?? "",
    p_external_url: input.source.kind === "external" ? input.source.externalUrl : "",
    p_meta: storagePath === null ? null : { storage_path: storagePath },
  });

  if (error === null) {
    return succeed(null);
  }

  reportMutationError("エビデンスの追加に失敗", error);
  if (storagePath !== null) {
    const { error: cleanupError } = await supabase.storage
      .from("material-images")
      .remove([storagePath]);
    if (cleanupError !== null) {
      reportMutationError("登録失敗後のファイル回収に失敗", cleanupError);
    }
  }

  return fail(errorCodeForMutation(error));
}

/** エビデンス削除も、承認されるまでは公開行と保存ファイルを保持する。 */
export async function deleteSellerMaterialEvidence(
  sellerId: string,
  materialId: string,
  evidenceId: string,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const ownership = await ensureOwnedMaterial(supabase, sellerId, materialId);
  if (!ownership.ok) return ownership;

  const { data: evidence, error: evidenceError } = await supabase
    .from("material_evidences")
    .select("id")
    .eq("id", evidenceId)
    .eq("material_id", materialId)
    .maybeSingle();

  if (evidenceError !== null) {
    reportMutationError("削除対象エビデンスの取得に失敗", evidenceError);
    return fail("internal");
  }
  if (evidence === null) return fail("not_found");

  const { error: deleteError } = await supabase.rpc("submit_material_evidence_remove_request", {
    p_material_id: materialId,
    p_evidence_id: evidence.id,
  });

  if (deleteError !== null) {
    reportMutationError("エビデンスの削除に失敗", deleteError);
    return fail(errorCodeForMutation(deleteError));
  }
  return succeed(null);
}
