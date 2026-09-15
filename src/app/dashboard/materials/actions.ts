"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SellerFormState } from "@/app/dashboard/materials/_components/form-state";
import { formDataString } from "@/lib/validation";
import { requireSeller } from "@/server/auth";
import { errorMessageJa, type ErrorCode } from "@/server/errors";
import { validateMaterialInput } from "@/server/material-input";
import {
  cancelSellerMaterialChangeRequest,
  confirmSellerMaterialInformation,
  submitSellerMaterialArchiveRequest,
  submitSellerMaterialCreateRequest,
  submitSellerMaterialUpdateRequest,
} from "@/server/mutations/seller-dashboard";

function errorState(code: ErrorCode, fieldErrors?: Record<string, string>): SellerFormState {
  return {
    status: "error",
    message:
      code === "conflict"
        ? "この資材には承認待ちの申請があります。先に申請の処理または取消を行ってください。"
        : errorMessageJa[code],
    fieldErrors,
  };
}

async function authorize(): Promise<SellerFormState | null> {
  const session = await requireSeller();
  return session.ok ? null : errorState(session.error);
}

function readMaterialInput(formData: FormData) {
  return validateMaterialInput({
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
  });
}

function reasonFrom(formData: FormData): string {
  return formDataString(formData.get("reason"))?.trim() ?? "";
}

function revalidateMaterialRoutes(materialId?: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/materials");
  revalidatePath("/admin");
  revalidatePath("/admin/materials/requests");
  if (materialId !== undefined) {
    revalidatePath(`/dashboard/materials/${materialId}`);
    revalidatePath(`/materials/${materialId}`);
  }
}

export async function submitMaterialCreateAction(
  _previousState: SellerFormState,
  formData: FormData,
): Promise<SellerFormState> {
  const denied = await authorize();
  if (denied !== null) return denied;

  const validation = readMaterialInput(formData);
  if (!validation.ok) return errorState("invalid_body", validation.fieldErrors);

  const result = await submitSellerMaterialCreateRequest(validation.input, reasonFrom(formData));
  if (!result.ok) return errorState(result.error);

  revalidateMaterialRoutes();
  redirect(`/dashboard/materials/requests/${result.data.requestId}`);
}

export async function submitMaterialUpdateAction(
  materialId: string,
  _previousState: SellerFormState,
  formData: FormData,
): Promise<SellerFormState> {
  const denied = await authorize();
  if (denied !== null) return denied;

  const validation = readMaterialInput(formData);
  if (!validation.ok) return errorState("invalid_body", validation.fieldErrors);

  const result = await submitSellerMaterialUpdateRequest(
    materialId,
    validation.input,
    reasonFrom(formData),
  );
  if (!result.ok) return errorState(result.error);

  revalidateMaterialRoutes(materialId);
  redirect(`/dashboard/materials/requests/${result.data.requestId}`);
}

export async function submitMaterialArchiveAction(
  materialId: string,
  _previousState: SellerFormState,
  formData: FormData,
): Promise<SellerFormState> {
  const denied = await authorize();
  if (denied !== null) return denied;
  const reason = reasonFrom(formData);
  if (reason.length === 0) {
    return errorState("invalid_body", { reason: "掲載終了の理由を入力してください。" });
  }

  const result = await submitSellerMaterialArchiveRequest(materialId, reason);
  if (!result.ok) return errorState(result.error);

  revalidateMaterialRoutes(materialId);
  redirect(`/dashboard/materials/requests/${result.data.requestId}`);
}

export async function confirmMaterialInformationAction(
  materialId: string,
  _previousState: SellerFormState,
): Promise<SellerFormState> {
  const denied = await authorize();
  if (denied !== null) return denied;

  const result = await confirmSellerMaterialInformation(materialId);
  if (!result.ok) return errorState(result.error);

  revalidateMaterialRoutes(materialId);
  return { status: "success", message: "公開中の資材情報の確認を記録しました。" };
}

export async function cancelMaterialChangeRequestAction(
  requestId: string,
  _previousState: SellerFormState,
): Promise<SellerFormState> {
  const denied = await authorize();
  if (denied !== null) return denied;

  const result = await cancelSellerMaterialChangeRequest(requestId);
  if (!result.ok) return errorState(result.error);

  revalidateMaterialRoutes();
  return { status: "success", message: "申請を取り消しました。" };
}
