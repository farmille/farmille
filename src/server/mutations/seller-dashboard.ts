import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import type { ErrorCode } from "@/server/errors";
import { formDataString } from "@/lib/validation";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database, Json } from "@/types/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

export const PRIMARY_INFORMATION_FIELDS = [
  "description",
  "general_use",
  "ingredients",
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
  ingredients: FormDataEntryValue | null;
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
    ingredients: optionalText(input.ingredients, "ingredients", fieldErrors),
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
      return "conflict";
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

/** 本人セッションのクライアントで一次情報層だけを更新する。 */
export async function updateSellerMaterialPrimaryInformation(
  sellerId: string,
  materialId: string,
  input: PrimaryInformationUpdate,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("materials")
    .update(input)
    .eq("id", materialId)
    .eq("seller_id", sellerId)
    .select("id")
    .maybeSingle();

  if (error !== null) {
    reportMutationError("一次情報の更新に失敗", error);
    return fail(errorCodeForMutation(error));
  }

  return data === null ? fail("not_found") : succeed(null);
}

/** 本人セッションのクライアントでエビデンス行を追加する。 */
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
  const { error } = await supabase.from("material_evidences").insert({
    material_id: materialId,
    evidence_type: input.evidenceType,
    title: input.title,
    file_url: fileUrl,
    external_url: input.source.kind === "external" ? input.source.externalUrl : null,
    meta: storagePath === null ? null : { storage_path: storagePath },
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

function storagePathFromMeta(meta: Json | null): string | null {
  const result = v.safeParse(v.object({ storage_path: v.string() }), meta);
  return result.success ? result.output.storage_path : null;
}

/** 本人セッションのクライアントでエビデンス行と管理対象ファイルを削除する。 */
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
    .select("id, meta")
    .eq("id", evidenceId)
    .eq("material_id", materialId)
    .maybeSingle();

  if (evidenceError !== null) {
    reportMutationError("削除対象エビデンスの取得に失敗", evidenceError);
    return fail("internal");
  }
  if (evidence === null) return fail("not_found");

  const storagePath = storagePathFromMeta(evidence.meta);
  if (storagePath !== null && !storagePathForMaterial(storagePath, sellerId, materialId)) {
    reportMutationError("エビデンスの保存先が所有者規約に違反", {
      sellerId,
      materialId,
      evidenceId,
    });
    return fail("internal");
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("material_evidences")
    .delete()
    .eq("id", evidenceId)
    .eq("material_id", materialId)
    .select("id")
    .maybeSingle();

  if (deleteError !== null) {
    reportMutationError("エビデンスの削除に失敗", deleteError);
    return fail(errorCodeForMutation(deleteError));
  }
  if (deleted === null) return fail("not_found");

  if (storagePath !== null) {
    const { error: storageError } = await supabase.storage
      .from("material-images")
      .remove([storagePath]);
    if (storageError !== null) {
      // DB を表示の正とし、孤立ファイルの回収失敗は監視ログへ残す。
      reportMutationError("削除済みエビデンスのファイル回収に失敗", storageError);
    }
  }

  return succeed(null);
}

/** 分類・検索層には触れず、本人名義の変更申請を追加する。 */
export async function createSellerMaterialEditRequest(
  sellerId: string,
  materialId: string,
  requestText: string,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const ownership = await ensureOwnedMaterial(supabase, sellerId, materialId);
  if (!ownership.ok) return ownership;

  const { error } = await supabase.from("material_edit_requests").insert({
    material_id: materialId,
    seller_id: sellerId,
    request_text: requestText,
    status: "open",
  });

  if (error !== null) {
    reportMutationError("分類変更申請の追加に失敗", error);
    return fail(errorCodeForMutation(error));
  }

  return succeed(null);
}
