import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { PasswordChangeSchema } from "@/server/accounts/password";

describe("PasswordChangeSchema", () => {
  const input = {
    currentPassword: "old-password",
    password: "new-password",
    passwordConfirmation: "new-password",
  };
  it("現在のパスワードと一致する確認欄を要求する", () => {
    expect(v.safeParse(PasswordChangeSchema, input).success).toBe(true);
    expect(v.safeParse(PasswordChangeSchema, { ...input, currentPassword: "" }).success).toBe(
      false,
    );
    expect(
      v.safeParse(PasswordChangeSchema, { ...input, passwordConfirmation: "different" }).success,
    ).toBe(false);

    {
      for (const password of ["old-password", "short", "a".repeat(129)]) {
        expect(
          v.safeParse(PasswordChangeSchema, { ...input, password, passwordConfirmation: password })
            .success,
        ).toBe(false);
      }
    }
  });
});
