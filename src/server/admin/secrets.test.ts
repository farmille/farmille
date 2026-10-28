import { describe, expect, it } from "vitest";

import { generateInitialPassword, generateInviteCode } from "@/server/admin/secrets";

describe("generateInitialPassword", () => {
  it("20 文字の英数字で、紛らわしい文字を含まない", () => {
    const password = generateInitialPassword();

    expect(password).toHaveLength(20);
    expect(password).toMatch(/^[a-zA-Z2-9]+$/);
    expect(password).not.toMatch(/[0Ol1I]/);

    expect(generateInitialPassword()).not.toBe(password);
  });
});

describe("generateInviteCode", () => {
  it("4文字ごとにハイフンで区切った大文字英数字を返す", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    expect(generateInviteCode()).not.toBe(code);
  });
});
