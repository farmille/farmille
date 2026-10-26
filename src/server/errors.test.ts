import { describe, expect, it } from "vitest";

import { ERROR_CODES, errorMessageJa, type ErrorCode } from "@/server/errors";

describe("errorMessageJa", () => {
  it("すべてのエラーコードに日本語文言を持つ", () => {
    const codes: ErrorCode[] = [
      "passkey_failed",
      "passkey_unavailable",
      "unauthorized",
      "forbidden",
      "not_found",
      "invalid_body",
      "conflict",
      "active_report_exists",
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
      // PDF読み取り
      "pdf_reading_limit",
      "captcha_failed",
      "pdf_invalid",
      "pdf_too_large",
      "pdf_too_many_pages",
      "pdf_reading_failed",
      "pdf_reading_no_match",
      "pdf_reading_incomplete",
      "pdf_reading_material_changed",
      "pdf_reading_unrecorded",
    ];

    expect(Object.keys(errorMessageJa)).toEqual(codes);
    expect(Object.values(errorMessageJa).every((message) => message.length > 0)).toBe(true);
  });

  it("PDF読み取りの失敗の文言は、どれも入力が残っていることを伝える", () => {
    // pdf_reading_unrecorded は、読み取った値が下書きに入った後の失敗なので除く
    const pdfCodes = ERROR_CODES.filter(
      (code) =>
        (code.startsWith("pdf_") && code !== "pdf_reading_unrecorded") || code === "captcha_failed",
    );
    expect(pdfCodes.length).toBeGreaterThan(0);
    for (const code of pdfCodes) {
      expect(errorMessageJa[code], code).toContain("入力した内容はそのまま残っています。");
    }
  });
});
