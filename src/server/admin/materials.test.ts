import { describe, expect, it } from "vitest";

import { validateMaterialInput } from "@/server/admin/materials";

const base = {
  name: "テスト資材",
  manufacturerName: "テスト製薬",
  productType: "",
  jbsaClass: "",
  salesStatus: "",
  description: "",
  generalUse: "",
  ingredients: "",
  mechanism: "",
  usageText: "",
  priceRange: "",
  officialUrl: "",
  catalogUrl: "",
  tagIds: [] as unknown,
};

describe("validateMaterialInput", () => {
  it("分類・検索層の必須2項目が揃えば通る", () => {
    const result = validateMaterialInput(base);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.name).toBe("テスト資材");
    expect(result.input.manufacturerName).toBe("テスト製薬");
  });

  it("空の任意項目は null にする（空文字を保存しない）", () => {
    const result = validateMaterialInput({ ...base, productType: "   ", description: "" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.productType).toBeNull();
    expect(result.input.description).toBeNull();
  });

  it("資材名とメーカー名の未入力を field ごとに返す", () => {
    const result = validateMaterialInput({ ...base, name: "  ", manufacturerName: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.manufacturerName).toBeDefined();
  });

  it("http(s) 以外の URL を弾く", () => {
    const result = validateMaterialInput({ ...base, officialUrl: "javascript:alert(1)" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.officialUrl).toBeDefined();
  });

  it("URL の形になっていない文字列を弾く", () => {
    const result = validateMaterialInput({ ...base, catalogUrl: "example.com/catalog.pdf" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.catalogUrl).toBeDefined();
  });

  it("タグ ID は文字列だけを拾い、重複はそのまま渡す（保存側で一意化する）", () => {
    const result = validateMaterialInput({ ...base, tagIds: ["a", 1, "b", null] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.tagIds).toEqual(["a", "b"]);
  });

  it("tagIds が配列でなければ空にする", () => {
    const result = validateMaterialInput({ ...base, tagIds: "a" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.tagIds).toEqual([]);
  });
});
