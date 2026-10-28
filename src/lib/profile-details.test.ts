import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { ProfileDetailsInputSchema } from "./profile-details";

const profile = {
  handle: "農家",
  bio: "",
  affiliations: [],
  cropIds: [],
  cropNamesOther: [],
  links: [],
};
describe("公開プロフィールの入力境界", () => {
  it("自己紹介やタグは任意で保存できる", () => {
    expect(v.safeParse(ProfileDetailsInputSchema, profile).success).toBe(true);
  });
  it.each(["javascript:alert(1)", "data:text/html,test", "ftp://example.com", "https://"])(
    "不正な公開リンクを拒否する：%s",
    (url) => {
      expect(v.safeParse(ProfileDetailsInputSchema, { ...profile, links: [url] }).success).toBe(
        false,
      );
    },
  );
  it("自由入力の所属と複数のURLを保存できる", () => {
    const result = v.parse(ProfileDetailsInputSchema, {
      ...profile,
      affiliations: [" JA青年部 ", "生産者の会"],
      links: ["https://example.com", "https://example.org"],
    });
    expect(result.affiliations).toEqual(["JA青年部", "生産者の会"]);
  });
  it("作物マスタにない作目は「その他」の名前として複数保存できる", () => {
    const result = v.parse(ProfileDetailsInputSchema, {
      ...profile,
      cropNamesOther: [" ステビア ", "パッションフルーツ"],
    });
    expect(result.cropNamesOther).toEqual(["ステビア", "パッションフルーツ"]);
    expect(
      v.safeParse(ProfileDetailsInputSchema, { ...profile, cropNamesOther: ["  "] }).success,
    ).toBe(false);
  });
  it("マスタID以外の作目と過大な入力を拒否する", () => {
    expect(
      v.safeParse(ProfileDetailsInputSchema, { ...profile, cropIds: ["トマト"] }).success,
    ).toBe(false);
    expect(
      v.safeParse(ProfileDetailsInputSchema, { ...profile, affiliations: Array(21).fill("所属") })
        .success,
    ).toBe(false);
  });
});
