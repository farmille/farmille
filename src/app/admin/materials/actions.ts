"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MaterialFormState, MaterialFormValues } from "@/app/admin/_lib/action-state";
import { formDataString, formDataStrings } from "@/lib/validation";
import {
  createMaterial,
  setMaterialSeller,
  setMaterialPublicationStatus,
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

export async function setMaterialPublicationStatusAction(
  _previousState: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  const materialId = formDataString(formData.get("materialId"))?.trim() ?? "";
  const status = formDataString(formData.get("publicationStatus"));
  if (materialId.length === 0 || (status !== "published" && status !== "archived")) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const result = await setMaterialPublicationStatus(materialId, status);
  if (!result.ok) return { status: "error", message: errorMessageJa[result.error] };

  revalidatePath(`/admin/materials/${materialId}`);
  revalidatePath("/admin/materials");
  revalidatePath(`/materials/${materialId}`);
  return {
    status: "done",
    message: status === "published" ? "資材を公開状態へ戻しました。" : "資材を掲載終了にしました。",
  };
}

const TEXT_FIELDS = [
  "name",
  "manufacturerName",
  "compositionTypeId",
  "salesStatus",
  "description",
  "generalUse",
  "mainComponents",
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
    const value = formDataString(formData.get(field));
    if (value !== null) fields[field] = value;
  }

  return {
    fields,
    cropIds: formDataStrings(formData.getAll("cropIds")),
    effectIds: formDataStrings(formData.getAll("effectIds")),
    ingredientCategoryIds: formDataStrings(formData.getAll("ingredientCategoryIds")),
    ingredientIds: formDataStrings(formData.getAll("ingredientIds")),
    productTypeIds: formDataStrings(formData.getAll("productTypeIds")),
    searchTagIds: formDataStrings(formData.getAll("searchTagIds")),
  };
}

function readInput(formData: FormData) {
  return {
    name: formData.get("name"),
    manufacturerName: formData.get("manufacturerName"),
    compositionTypeId: formData.get("compositionTypeId"),
    salesStatus: formData.get("salesStatus"),
    description: formData.get("description"),
    generalUse: formData.get("generalUse"),
    mainComponents: formData.get("mainComponents"),
    mechanism: formData.get("mechanism"),
    usageText: formData.get("usageText"),
    priceRange: formData.get("priceRange"),
    officialUrl: formData.get("officialUrl"),
    catalogUrl: formData.get("catalogUrl"),
    cropIds: formData.getAll("cropIds"),
    effectIds: formData.getAll("effectIds"),
    ingredientCategoryIds: formData.getAll("ingredientCategoryIds"),
    ingredientIds: formData.getAll("ingredientIds"),
    productTypeIds: formData.getAll("productTypeIds"),
    searchTagIds: formData.getAll("searchTagIds"),
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
  const materialId = formDataString(formData.get("materialId"));

  if (materialId === null || materialId.length === 0) {
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
  const materialId = formDataString(formData.get("materialId"));
  const sellerId = formDataString(formData.get("sellerId"));

  if (materialId === null || materialId.length === 0) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const nextSellerId = sellerId !== null && sellerId.length > 0 ? sellerId : null;
  const result = await setMaterialSeller(materialId, nextSellerId);

  if (!result.ok) {
    if (result.error === "conflict") {
      return {
        status: "error",
        message: "承認済みのメーカーにだけ claim を紐づけられます。",
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
        ? "claim を解除し、メーカー確認状態をリセットしました。"
        : "claim を紐づけました。",
  };
}
