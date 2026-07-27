import { syntheticSellerEmail } from "@/server/accounts/seller";
import { isUniqueViolation, reportAdminError, withAdmin } from "@/server/admin/guard";
import { generateInitialPassword, generateInviteCode } from "@/server/admin/secrets";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type SellerRow = Database["public"]["Tables"]["seller_accounts"]["Row"];

/** seller_accounts.status（01 §3・§6）。 */
export const SELLER_STATUSES = ["applied", "approved", "rejected", "suspended"] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const SELLER_STATUS_LABELS: Record<SellerStatus, string> = {
  applied: "審査中",
  approved: "承認済み",
  rejected: "却下",
  suspended: "凍結中",
};

export function isSellerStatus(value: unknown): value is SellerStatus {
  return (SELLER_STATUSES as readonly unknown[]).includes(value);
}

export type SellerListItem = Pick<
  SellerRow,
  "id" | "official_name" | "seller_type" | "login_id" | "status" | "created_at" | "approved_at"
>;

/** 詳細は内部項目（contact_*）も含む。admin 画面以外へは渡さない。 */
export type SellerDetail = SellerRow & {
  materialCount: number;
};

/** 承認時に発行した共有ログイン。パスワードは保存せず、この戻り値で一度だけ表示する。 */
export type SellerCredentials = {
  loginId: string;
  password: string;
};

function reportError(operation: string, error: unknown): void {
  reportAdminError("sellers", operation, error);
}

const LIST_COLUMNS = "id, official_name, seller_type, login_id, status, created_at, approved_at";

export async function listSellers(status: SellerStatus | "all"): Promise<Result<SellerListItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const query = supabase.from("seller_accounts").select(LIST_COLUMNS);
    const { data, error } = await (status === "all" ? query : query.eq("status", status)).order(
      "created_at",
      { ascending: false },
    );

    if (error !== null) {
      reportError("出品者一覧の取得に失敗", error);
      return fail("internal");
    }

    return succeed(data);
  });
}

export async function getSellerDetail(sellerId: string): Promise<Result<SellerDetail>> {
  return withAdmin(async ({ supabase }) => {
    const [sellerResult, materialResult] = await Promise.all([
      supabase.from("seller_accounts").select("*").eq("id", sellerId).maybeSingle(),
      supabase
        .from("materials")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId),
    ]);

    if (sellerResult.error !== null) {
      reportError("出品者詳細の取得に失敗", sellerResult.error);
      return fail("internal");
    }
    if (sellerResult.data === null) return fail("not_found");

    if (materialResult.error !== null) {
      reportError("claim 済み資材数の取得に失敗", materialResult.error);
      return fail("internal");
    }

    return succeed({ ...sellerResult.data, materialCount: materialResult.count ?? 0 });
  });
}

/**
 * 出品者申請の承認（01 §6 applied → approved）。
 *   1. 合成メール `{login_id}@sellers.farmille.internal` で Auth ユーザーを作成
 *   2. app_metadata に account_type='seller'・seller_id を付与
 *   3. seller_accounts を approved・approved_at・auth_user_id へ更新
 * 3 が失敗したら 1 で作った Auth ユーザーを削除し、片側だけ残さない。
 */
export async function approveSellerApplication(
  sellerId: string,
): Promise<Result<SellerCredentials>> {
  return withAdmin(async ({ supabase }) => {
    const { data: seller, error } = await supabase
      .from("seller_accounts")
      .select("id, login_id, status, auth_user_id")
      .eq("id", sellerId)
      .maybeSingle();

    if (error !== null) {
      reportError("承認対象の取得に失敗", error);
      return fail("internal");
    }
    if (seller === null) return fail("not_found");
    // 二重承認・共有ログインの二重発行を防ぐ。
    if (seller.status !== "applied" || seller.auth_user_id !== null) return fail("conflict");

    const email = syntheticSellerEmail(seller.login_id);
    if (email === null) {
      reportError("login_id から合成メールを作れません", seller.login_id);
      return fail("invalid_body");
    }

    const password = generateInitialPassword();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { account_type: "seller", seller_id: seller.id },
    });

    if (createError !== null) {
      reportError("共有ログインの作成に失敗", createError);
      return fail(createError.code === "email_exists" ? "conflict" : "internal");
    }

    const { data: updated, error: updateError } = await supabase
      .from("seller_accounts")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        auth_user_id: created.user.id,
      })
      .eq("id", seller.id)
      .eq("status", "applied")
      .select("id");

    if (updateError !== null || updated.length === 0) {
      const { error: rollbackError } = await supabase.auth.admin.deleteUser(created.user.id);

      if (rollbackError !== null) {
        reportError("承認の巻き戻し（Auth ユーザー削除）に失敗", rollbackError);
      }
      reportError("承認の反映に失敗", updateError ?? "更新対象が 0 件でした");

      return fail(updateError === null ? "conflict" : "internal");
    }

    return succeed({ loginId: seller.login_id, password });
  });
}

/** 却下（01 §6 applied → rejected）。 */
export async function rejectSellerApplication(sellerId: string): Promise<Result<null>> {
  return updateSellerStatus(sellerId, "rejected", ["applied"], "却下");
}

/** 凍結（01 §6 運用中の凍結）。共有ログインは残すが、出品者ログインは status で弾かれる。 */
export async function suspendSellerAccount(sellerId: string): Promise<Result<null>> {
  return updateSellerStatus(sellerId, "suspended", ["approved"], "凍結");
}

/** 凍結解除。承認済みへ戻す（共有ログインは発行済みのため再発行しない）。 */
export async function reinstateSellerAccount(sellerId: string): Promise<Result<null>> {
  return updateSellerStatus(sellerId, "approved", ["suspended"], "凍結解除");
}

async function updateSellerStatus(
  sellerId: string,
  nextStatus: SellerStatus,
  allowedCurrentStatuses: SellerStatus[],
  operationLabel: string,
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    // approved へ戻す場合も approved_at の NOT NULL 制約を満たす必要がある。
    const { data: seller, error: loadError } = await supabase
      .from("seller_accounts")
      .select("status, approved_at")
      .eq("id", sellerId)
      .maybeSingle();

    if (loadError !== null) {
      reportError(`${operationLabel}対象の取得に失敗`, loadError);
      return fail("internal");
    }
    if (seller === null) return fail("not_found");
    if (!isSellerStatus(seller.status) || !allowedCurrentStatuses.includes(seller.status)) {
      return fail("conflict");
    }

    const { data, error } = await supabase
      .from("seller_accounts")
      .update({
        status: nextStatus,
        approved_at:
          nextStatus === "approved"
            ? (seller.approved_at ?? new Date().toISOString())
            : seller.approved_at,
      })
      .eq("id", sellerId)
      .in("status", allowedCurrentStatuses)
      .select("id");

    if (error !== null) {
      reportError(`${operationLabel}に失敗`, error);
      return fail("internal");
    }
    if (data.length === 0) return fail("conflict");

    return succeed(null);
  });
}

/** 招待コードの発行・再発行（02 §2 `/sellers/apply` の招待コード入力に対応）。 */
export async function issueSellerInviteCode(
  sellerId: string,
): Promise<Result<{ inviteCode: string }>> {
  return withAdmin(async ({ supabase }) => {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from("seller_accounts")
      .update({ invite_code: inviteCode })
      .eq("id", sellerId)
      .select("id");

    if (error !== null) {
      if (isUniqueViolation(error)) return fail("conflict");
      reportError("招待コードの発行に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("not_found");

    return succeed({ inviteCode });
  });
}

/** claim 紐づけの候補（承認済みのみ）。 */
export async function listClaimableSellers(): Promise<
  Result<Pick<SellerRow, "id" | "official_name" | "login_id">[]>
> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("seller_accounts")
      .select("id, official_name, login_id")
      .eq("status", "approved")
      .order("official_name", { ascending: true });

    if (error !== null) {
      reportError("claim 候補の取得に失敗", error);
      return fail("internal");
    }

    return succeed(data);
  });
}
