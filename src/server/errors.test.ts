import { describe, expect, it } from "vitest";

import { ERROR_CODES, errorMessageJa } from "@/server/errors";

describe("errorMessageJa", () => {
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
