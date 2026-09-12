import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { PersonalProfileSchema } from "./personal-profile";

describe("個人プロフィールの入力", () => {
  it.each(["farmer", "ja", "expert", "other"])("立場 %s を選べる", (standpoint) => {
    expect(v.safeParse(PersonalProfileSchema, { handle: "名前", standpoint }).success).toBe(true);
  });
  it("空白・長すぎる名前・不正な立場を拒否する", () => {
    for (const input of [
      { handle: " ", standpoint: "other" },
      { handle: "a".repeat(31), standpoint: "other" },
      { handle: "名前", standpoint: "admin" },
      { handle: null, standpoint: "other" },
      { handle: "名前", standpoint: null },
    ]) {
      expect(v.safeParse(PersonalProfileSchema, input).success).toBe(false);
    }
  });
  it("前後の空白を除き、ユーザーIDや権限の指定を入力から除外する", () => {
    expect(
      v.parse(PersonalProfileSchema, {
        handle: " 名前 ",
        standpoint: "other",
        user_id: "別人",
        account_type: "admin",
      }),
    ).toEqual({ handle: "名前", standpoint: "other" });
  });
});
