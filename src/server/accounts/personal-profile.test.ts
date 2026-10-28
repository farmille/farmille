import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { PersonalProfileSchema } from "./personal-profile";

describe("個人プロフィールの入力", () => {
  it("一般会員の立場を選べる", () => {
    for (const standpoint of ["farmer", "ja", "government", "other"]) {
      expect(v.safeParse(PersonalProfileSchema, { handle: "名前", standpoint }).success).toBe(true);
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

    {
      for (const input of [
        { handle: " ", standpoint: "other" },
        { handle: "a".repeat(31), standpoint: "other" },
        { handle: "名前", standpoint: "admin" },
        { handle: null, standpoint: "other" },
        { handle: "名前", standpoint: null },
      ]) {
        expect(v.safeParse(PersonalProfileSchema, input).success).toBe(false);
      }
    }
  });
});
