import { describe, expect, it } from "vitest";

import { errorMessageJa, type ErrorCode } from "@/server/errors";

describe("errorMessageJa", () => {
  it("すべてのエラーコードに日本語文言を持つ", () => {
    const codes: ErrorCode[] = [
      "unauthorized",
      "forbidden",
      "not_found",
      "invalid_body",
      "conflict",
      "aal2_required",
      "internal",
      // 認証（T-13）
      "handle_taken",
      "email_unavailable",
      "invalid_credentials",
      "seller_invalid_credentials",
      "weak_password",
      "rate_limited",
      "expired_link",
      // 通報（T-34）
      "already_reported",
      // メーカー申請（T-41）
      "login_id_taken",
      "invalid_invite_code",
    ];

    expect(Object.keys(errorMessageJa)).toEqual(codes);
    expect(Object.values(errorMessageJa).every((message) => message.length > 0)).toBe(true);
  });
});
