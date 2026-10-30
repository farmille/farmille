"use server";

import { revalidatePath } from "next/cache";
import type { SellerFormState } from "@/app/dashboard/materials/_components/form-state";
import { requireSeller } from "@/server/auth";
import { errorMessageJa, type ErrorCode } from "@/server/errors";
import { cancelSellerMaterialChangeRequest } from "@/server/mutations/seller-dashboard";

function errorState(code: ErrorCode): SellerFormState {
  return {
    status: "error",
    message:
      code === "conflict"
        ? "この資材には承認待ちの申請があります。先に申請の処理または取消を行ってください。"
        : errorMessageJa[code],
  };
}

async function authorize(): Promise<SellerFormState | null> {
  const session = await requireSeller();

  return session.ok ? null : errorState(session.error);
}

function revalidateMaterialRoutes(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/materials");
  revalidatePath("/admin");
  revalidatePath("/admin/materials/requests");
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
