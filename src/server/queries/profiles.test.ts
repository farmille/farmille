import { describe, expect, it } from "vitest";

import { validateProfileUpdate } from "@/server/queries/profiles";

describe("validateProfileUpdate", () => {
  it("ハンドルの前後空白を除いて受け付ける", () => {
    const result = validateProfileUpdate({ handle: "  いちごマン  " });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.handle).toBe("いちごマン");
  });

  it("空のハンドルを拒否する", () => {
    const result = validateProfileUpdate({ handle: "  " });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.handle).toBeTruthy();
  });

  it("31文字以上のハンドルを拒否する", () => {
    const result = validateProfileUpdate({ handle: "あ".repeat(31) });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.handle).toBeTruthy();
  });
});
