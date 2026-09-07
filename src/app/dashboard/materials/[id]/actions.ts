"use server";

import { revalidatePath } from "next/cache";

import type { SellerFormState } from "@/app/dashboard/materials/_components/form-state";
import { requireSeller } from "@/server/auth";
import { errorMessageJa, type ErrorCode } from "@/server/errors";
import {
  createSellerMaterialEvidence,
  deleteSellerMaterialEvidence,
  validateEvidenceInput,
} from "@/server/mutations/seller-dashboard";

function errorState(code: ErrorCode, fieldErrors?: Record<string, string>): SellerFormState {
  return {
    status: "error",
    message: code === "conflict" ? "この資材には承認待ちの申請があります。" : errorMessageJa[code],
    fieldErrors,
  };
}

async function sellerIdForAction(): Promise<
  { ok: true; sellerId: string } | { ok: false; state: SellerFormState }
> {
  const session = await requireSeller();
  return session.ok
    ? { ok: true, sellerId: session.data.sellerId }
    : { ok: false, state: errorState(session.error) };
}

function revalidateMaterial(materialId: string): void {
  revalidatePath("/dashboard/materials");
  revalidatePath(`/dashboard/materials/${materialId}`);
  revalidatePath("/admin/materials/requests");
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
  if (!validation.ok) return errorState("invalid_body", validation.fieldErrors);

  const result = await createSellerMaterialEvidence(
    authorization.sellerId,
    materialId,
    validation.input,
  );
  if (!result.ok) return errorState(result.error);

  revalidateMaterial(materialId);
  return { status: "success", message: "エビデンス追加を申請しました。" };
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
  return { status: "success", message: "エビデンス削除を申請しました。" };
}
