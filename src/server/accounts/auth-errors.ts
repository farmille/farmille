import type { AuthError } from "@supabase/supabase-js";

import type { ErrorCode } from "@/server/errors";

/**
 * Supabase Auth のエラーをアプリのエラーコードへ写す。
 * 未知のエラーは internal にまとめ、message だけをサーバーログへ残す
 * （パスワード・トークンは Supabase 側のエラー文言にも含まれないため出さない）。
 */
export function toErrorCode(error: AuthError, context: string): ErrorCode {
  switch (error.code) {
    case "weak_password":
      return "weak_password";
    case "user_already_exists":
    case "email_exists":
      return "email_unavailable";
    case "invalid_credentials":
    case "email_not_confirmed":
      return "invalid_credentials";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
      return "expired_link";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
    default:
      break;
  }

  if (error.status === 429) return "rate_limited";

  console.error(`[auth] ${context}: ${error.code ?? "unknown"} ${error.message}`);

  return "internal";
}
