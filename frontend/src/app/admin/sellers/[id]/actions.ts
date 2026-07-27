"use server";

import { revalidatePath } from "next/cache";

import type { SellerActionState } from "@/app/admin/_lib/action-state";
import {
  approveSellerApplication,
  issueSellerInviteCode,
  reinstateSellerAccount,
  rejectSellerApplication,
  suspendSellerAccount,
} from "@/server/admin/sellers";
import { errorMessageJa, type ErrorCode } from "@/server/errors";

const SELLER_OPERATIONS = ["approve", "reject", "suspend", "reinstate", "invite"] as const;
type SellerOperation = (typeof SELLER_OPERATIONS)[number];

function isSellerOperation(value: unknown): value is SellerOperation {
  return (SELLER_OPERATIONS as readonly unknown[]).includes(value);
}

/** 状態遷移の競合（すでに承認済み・却下済み等）は conflict で返る。 */
function sellerErrorMessage(code: ErrorCode): string {
  if (code === "conflict") {
    return "この出品者はすでに別の状態へ変わっています。画面を再読み込みして確認してください。";
  }

  return errorMessageJa[code];
}

/** 承認・却下・凍結・凍結解除・招待コード発行の入口。操作は hidden の operation で分ける。 */
export async function sellerOperationAction(
  _previousState: SellerActionState,
  formData: FormData,
): Promise<SellerActionState> {
  const sellerId = formData.get("sellerId");
  const operation = formData.get("operation");

  if (typeof sellerId !== "string" || sellerId.length === 0 || !isSellerOperation(operation)) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const result = await runSellerOperation(operation, sellerId);

  if (!result.ok) {
    return { status: "error", message: sellerErrorMessage(result.error) };
  }

  revalidatePath(`/admin/sellers/${sellerId}`);
  revalidatePath("/admin/sellers");
  revalidatePath("/admin");

  return result.state;
}

async function runSellerOperation(
  operation: SellerOperation,
  sellerId: string,
): Promise<{ ok: true; state: SellerActionState } | { ok: false; error: ErrorCode }> {
  if (operation === "approve") {
    const result = await approveSellerApplication(sellerId);

    return result.ok
      ? { ok: true, state: { status: "approved", credentials: result.data } }
      : { ok: false, error: result.error };
  }

  if (operation === "invite") {
    const result = await issueSellerInviteCode(sellerId);

    return result.ok
      ? { ok: true, state: { status: "invited", inviteCode: result.data.inviteCode } }
      : { ok: false, error: result.error };
  }

  if (operation === "reject") {
    const result = await rejectSellerApplication(sellerId);

    return result.ok
      ? { ok: true, state: { status: "done", message: "申請を却下しました。" } }
      : { ok: false, error: result.error };
  }

  if (operation === "suspend") {
    const result = await suspendSellerAccount(sellerId);

    return result.ok
      ? {
          ok: true,
          state: { status: "done", message: "凍結しました。出品者ログインはできなくなります。" },
        }
      : { ok: false, error: result.error };
  }

  const result = await reinstateSellerAccount(sellerId);

  return result.ok
    ? { ok: true, state: { status: "done", message: "凍結を解除しました。" } }
    : { ok: false, error: result.error };
}
