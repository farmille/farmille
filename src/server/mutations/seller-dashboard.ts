import type { ErrorCode } from "@/server/errors";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

function errorCodeForMutation(error: { code?: string }): ErrorCode {
  switch (error.code) {
    case "42501":
      return "forbidden";
    case "23505":
    case "40001":
      return "conflict";
    case "P0002":
      return "not_found";
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

export async function cancelSellerMaterialChangeRequest(requestId: string): Promise<Result<null>> {
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("cancel_material_change_request", {
    p_request_id: requestId,
  });

  if (error !== null) {
    reportMutationError("資材変更申請の取消に失敗", error);

    return fail(errorCodeForMutation(error));
  }

  return succeed(null);
}
