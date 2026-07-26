import { describe, expect, it } from "vitest";

import { validateProfileUpdate } from "@/server/queries/profiles";

describe("validateProfileUpdate", () => {
  it("必須項目が揃えば成功する", () => {
    const result = validateProfileUpdate({
      handle: "いちごマン",
      prefectureCode: "8",
      prefecturePublic: "on",
      bio: "一言",
      cultivationStyles: ["施設園芸", "慣行栽培"],
      affiliation: "全青協",
      websiteUrl: "https://example.com",
      snsUrl: "",
      cropIds: ["crop-1"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.handle).toBe("いちごマン");
    expect(result.input.prefectureCode).toBe(8);
    expect(result.input.prefecturePublic).toBe(true);
    expect(result.input.cultivationStyles).toEqual(["施設園芸", "慣行栽培"]);
    expect(result.input.snsUrl).toBeNull();
  });

  it("ハンドル空・不正URLはフィールドエラー", () => {
    const result = validateProfileUpdate({
      handle: "  ",
      prefectureCode: "8",
      prefecturePublic: false,
      bio: "",
      cultivationStyles: [],
      affiliation: "",
      websiteUrl: "ftp://example.com",
      snsUrl: "not-a-url",
      cropIds: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.handle).toBeTruthy();
    expect(result.fieldErrors.websiteUrl).toBeTruthy();
    expect(result.fieldErrors.snsUrl).toBeTruthy();
  });

  it("未知の栽培形態は拒否する", () => {
    const result = validateProfileUpdate({
      handle: "test",
      prefectureCode: "1",
      prefecturePublic: true,
      bio: "",
      cultivationStyles: ["未知の形態"],
      affiliation: "",
      websiteUrl: "",
      snsUrl: "",
      cropIds: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.cultivationStyles).toBeTruthy();
  });
});
