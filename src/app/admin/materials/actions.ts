"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MaterialFormState, MaterialFormValues } from "@/app/admin/_lib/action-state";
import {
  createMaterial,
  setMaterialSeller,
  updateMaterial,
  validateMaterialInput,
} from "@/server/admin/materials";
import { errorMessageJa, type ErrorCode } from "@/server/errors";

function materialErrorMessage(code: ErrorCode): string {
  if (code === "conflict") {
    return "同じ資材名とメーカー名の組み合わせがすでに登録されています。";
  }

  return errorMessageJa[code];
}

const TEXT_FIELDS = [
  "name",
  "manufacturerName",
  "productType",
  "jbsaClass",
  "salesStatus",
  "description",
  "generalUse",
  "ingredients",
  "mechanism",
  "usageText",
  "priceRange",
  "officialUrl",
  "catalogUrl",
] as const;

/** React 19 の form action は送信後にフォームを初期化するので、送信値を返して再表示する。 */
function submittedValues(formData: FormData): MaterialFormValues {
  const fields: Record<string, string> = {};

  for (const field of TEXT_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") fields[field] = value;
  }

  return {
    fields,
    tagIds: formData.getAll("tagIds").filter((value): value is string => typeof value === "string"),
  };
}

function readInput(formData: FormData) {
  return {
    name: formData.get("name"),
    manufacturerName: formData.get("manufacturerName"),
    productType: formData.get("productType"),
    jbsaClass: formData.get("jbsaClass"),
    salesStatus: formData.get("salesStatus"),
    description: formData.get("description"),
    generalUse: formData.get("generalUse"),
    ingredients: formData.get("ingredients"),
    mechanism: formData.get("mechanism"),
    usageText: formData.get("usageText"),
    priceRange: formData.get("priceRange"),
    officialUrl: formData.get("officialUrl"),
    catalogUrl: formData.get("catalogUrl"),
    tagIds: formData.getAll("tagIds"),
  };
}

/** 資材の種まき登録。成功したら編集画面へ送る。 */
export async function createMaterialAction(
  _previousState: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  const validation = validateMaterialInput(readInput(formData));

  if (!validation.ok) {
    return {
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors: validation.fieldErrors,
      values: submittedValues(formData),
    };
  }

  const result = await createMaterial(validation.input);

  if (!result.ok) {
    return {
      status: "error",
      message: materialErrorMessage(result.error),
      values: submittedValues(formData),
    };
  }

  revalidatePath("/admin/materials");
  redirect(`/admin/materials/${result.data.id}?created=1`);
}

export async function updateMaterialAction(
  _previousState: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  const materialId = formData.get("materialId");

  if (typeof materialId !== "string" || materialId.length === 0) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const validation = validateMaterialInput(readInput(formData));

  if (!validation.ok) {
    return {
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors: validation.fieldErrors,
      values: submittedValues(formData),
    };
  }

  const result = await updateMaterial(materialId, validation.input);

  if (!result.ok) {
    return {
      status: "error",
      message: materialErrorMessage(result.error),
      values: submittedValues(formData),
    };
  }

  revalidatePath(`/admin/materials/${materialId}`);
  revalidatePath("/admin/materials");
  revalidatePath(`/materials/${materialId}`);

  return { status: "done", message: "資材を更新しました。" };
}

/** claim の紐づけ・解除（01 §6）。sellerId が空文字なら解除。 */
export async function setMaterialSellerAction(
  _previousState: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  const materialId = formData.get("materialId");
  const sellerId = formData.get("sellerId");

  if (typeof materialId !== "string" || materialId.length === 0) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const nextSellerId = typeof sellerId === "string" && sellerId.length > 0 ? sellerId : null;
  const result = await setMaterialSeller(materialId, nextSellerId);

  if (!result.ok) {
    if (result.error === "conflict") {
      return {
        status: "error",
        message: "承認済みの出品者にだけ claim を紐づけられます。",
      };
    }

    return { status: "error", message: errorMessageJa[result.error] };
  }

  revalidatePath(`/admin/materials/${materialId}`);
  revalidatePath("/admin/materials");
  revalidatePath(`/materials/${materialId}`);

  return {
    status: "done",
    message:
      nextSellerId === null
        ? "claim を解除しました。メーカー確認済みバッジは外れます。"
        : "claim を紐づけました。公開側にメーカー確認済みバッジが出ます。",
  };
}
