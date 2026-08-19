"use server";

import { revalidatePath } from "next/cache";

import type { SellerFormState } from "./_components/form-state";
import { requireSeller } from "@/server/auth";
import { errorMessageJa, sellerDashboardMessageJa, type ErrorCode } from "@/server/errors";
import {
  createSellerMaterialEditRequest,
  createSellerMaterialEvidence,
  deleteSellerMaterialEvidence,
  updateSellerMaterialPrimaryInformation,
  validateEditRequestText,
  validateEvidenceInput,
  validatePrimaryInformation,
} from "@/server/mutations/seller-dashboard";

function errorState(code: ErrorCode, fieldErrors?: Record<string, string>): SellerFormState {
  return {
    status: "error",
    message: errorMessageJa[code],
    fieldErrors,
  };
}

async function sellerIdForAction(): Promise<
  { ok: true; sellerId: string } | { ok: false; state: SellerFormState }
> {
  const session = await requireSeller();

  if (!session.ok) {
    return { ok: false, state: errorState(session.error) };
  }

  return { ok: true, sellerId: session.data.sellerId };
}

function revalidateMaterial(materialId: string): void {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/materials/${materialId}`);
  revalidatePath(`/materials/${materialId}`);
}

export async function updatePrimaryInformationAction(
  materialId: string,
  _previousState: SellerFormState,
  formData: FormData,
): Promise<SellerFormState> {
  const authorization = await sellerIdForAction();
  if (!authorization.ok) return authorization.state;

  const validation = validatePrimaryInformation({
    description: formData.get("description"),
    general_use: formData.get("general_use"),
    ingredients: formData.get("ingredients"),
    mechanism: formData.get("mechanism"),
    usage_text: formData.get("usage_text"),
    price_range: formData.get("price_range"),
    official_url: formData.get("official_url"),
    catalog_url: formData.get("catalog_url"),
  });

  if (!validation.ok) {
    return errorState("invalid_body", validation.fieldErrors);
  }

  const result = await updateSellerMaterialPrimaryInformation(
    authorization.sellerId,
    materialId,
    validation.input,
  );

  if (!result.ok) return errorState(result.error);

  revalidateMaterial(materialId);
  return {
    status: "success",
    message: sellerDashboardMessageJa.primaryInformationSaved,
  };
}

export async function addEvidenceAction(
  materialId: string,
  formData: FormData,
): Promise<SellerFormState> {
  const authorization = await sellerIdForAction();
  if (!authorization.ok) return authorization.state;

  const validation = validateEvidenceInput(
    {
      evidenceType: formData.get("evidenceType"),
      title: formData.get("title"),
      externalUrl: formData.get("externalUrl"),
      storagePath: formData.get("storagePath"),
    },
    authorization.sellerId,
    materialId,
  );

  if (!validation.ok) {
    return errorState("invalid_body", validation.fieldErrors);
  }

  const result = await createSellerMaterialEvidence(
    authorization.sellerId,
    materialId,
    validation.input,
  );

  if (!result.ok) return errorState(result.error);

  revalidateMaterial(materialId);
  return {
    status: "success",
    message: sellerDashboardMessageJa.evidenceAdded,
  };
}

export async function deleteEvidenceAction(
  materialId: string,
  evidenceId: string,
): Promise<SellerFormState> {
  const authorization = await sellerIdForAction();
  if (!authorization.ok) return authorization.state;

  const result = await deleteSellerMaterialEvidence(authorization.sellerId, materialId, evidenceId);

  if (!result.ok) return errorState(result.error);

  revalidateMaterial(materialId);
  return {
    status: "success",
    message: sellerDashboardMessageJa.evidenceDeleted,
  };
}

export async function submitEditRequestAction(
  materialId: string,
  _previousState: SellerFormState,
  formData: FormData,
): Promise<SellerFormState> {
  const authorization = await sellerIdForAction();
  if (!authorization.ok) return authorization.state;

  const validation = validateEditRequestText(formData.get("requestText"));
  if (!validation.ok) {
    return errorState("invalid_body", validation.fieldErrors);
  }

  const result = await createSellerMaterialEditRequest(
    authorization.sellerId,
    materialId,
    validation.input,
  );

  if (!result.ok) return errorState(result.error);

  revalidatePath(`/dashboard/materials/${materialId}`);
  return {
    status: "success",
    message: sellerDashboardMessageJa.editRequestSubmitted,
  };
}
