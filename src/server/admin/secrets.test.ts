import { describe, expect, it } from "vitest";

import { generateInitialPassword, generateInviteCode } from "@/server/admin/secrets";

describe("generateInitialPassword", () => {
  it("20 文字の英数字で、紛らわしい文字を含まない", () => {
    const password = generateInitialPassword();

    expect(password).toHaveLength(20);
    expect(password).toMatch(/^[a-zA-Z2-9]+$/);
    expect(password).not.toMatch(/[0Ol1I]/);
  });

  it("呼び出しごとに異なる（乱数であることの最低限の確認）", () => {
    const generated = new Set(Array.from({ length: 20 }, () => generateInitialPassword()));

    expect(generated.size).toBe(20);
  });
});

describe("generateInviteCode", () => {
  it("4文字ごとにハイフンで区切った大文字英数字を返す", () => {
    expect(generateInviteCode()).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("呼び出しごとに異なる", () => {
    const generated = new Set(Array.from({ length: 20 }, () => generateInviteCode()));

    expect(generated.size).toBe(20);
  });
});
