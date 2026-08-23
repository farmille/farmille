"use server";

import { revalidatePath } from "next/cache";

import type { SellerActionState } from "@/app/admin/_lib/action-state";
import { formDataString } from "@/lib/validation";
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

function isSellerOperation(value: string | null): value is SellerOperation {
  return value !== null && SELLER_OPERATIONS.some((operation) => operation === value);
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
  const sellerId = formDataString(formData.get("sellerId"));
  const operation = formDataString(formData.get("operation"));
  const rejectedReason = formData.get("rejectedReason");

  if (sellerId === null || sellerId.length === 0 || !isSellerOperation(operation)) {
    return { status: "error", message: errorMessageJa.invalid_body };
  }

  const result = await runSellerOperation(operation, sellerId, rejectedReason);

  if (!result.ok) {
    return { status: "error", message: sellerErrorMessage(result.error) };
  }

  // 初期パスワードは再取得できないため、承認時は現在の詳細画面を再描画せず、
  // Server Action の戻り値を確実に画面へ残す。
  if (operation !== "approve") {
    revalidatePath(`/admin/sellers/${sellerId}`);
  }
  revalidatePath("/admin/sellers");
  revalidatePath("/admin");

  return result.state;
}

async function runSellerOperation(
  operation: SellerOperation,
  sellerId: string,
  rejectedReason: FormDataEntryValue | null,
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
    const reason = formDataString(rejectedReason);
    if (reason === null) {
      return { ok: false, error: "invalid_body" };
    }

    const result = await rejectSellerApplication(sellerId, reason);

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
