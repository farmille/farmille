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
    ];

    expect(Object.keys(errorMessageJa)).toEqual(codes);
    expect(Object.values(errorMessageJa).every((message) => message.length > 0)).toBe(true);
  });
});
