import type { AuthError } from "@supabase/supabase-js";
import { errorMessageJa } from "@/server/errors";

/** 無効な設定や非対応端末を、ユーザーの認証失敗と区別する。 */
export function passkeyErrorMessage(error: Pick<AuthError, "code">): string {
  if (error.code === "passkey_disabled") return errorMessageJa.passkey_unavailable;

  return errorMessageJa.passkey_failed;
}
