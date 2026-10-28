import { describe, expect, it } from "vitest";

import { validateMaterialInput } from "@/server/admin/materials";

const base = {
  name: "テスト資材",
  manufacturerName: "テスト製薬",
  compositionTypeId: "",
  salesStatus: "",
  description: "",
  generalUse: "",
  mainComponents: "",
  mechanism: "",
  usageText: "",
  priceRange: "",
  officialUrl: "",
  catalogUrl: "",
  cropIds: [],
  effectIds: [],
  ingredientCategoryIds: [],
  ingredientIds: [],
  productTypeIds: [],
  searchTagIds: [],
};

describe("validateMaterialInput", () => {
  it("空の任意項目は null にする（空文字を保存しない）", () => {
    const result = validateMaterialInput({ ...base, compositionTypeId: "", description: "" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.compositionTypeId).toBeNull();
    expect(result.input.description).toBeNull();

    expect(result.input.name).toBe("テスト資材");
    expect(result.input.manufacturerName).toBe("テスト製薬");
  });

  it("資材名とメーカー名の未入力を field ごとに返す", () => {
    const result = validateMaterialInput({ ...base, name: "  ", manufacturerName: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.manufacturerName).toBeDefined();
  });

  it("http(s) 以外の URL を弾く", () => {
    const result = validateMaterialInput({
      ...base,
      officialUrl: "javascript:alert(1)",
      catalogUrl: "example.com/catalog.pdf",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.officialUrl).toBeDefined();

    expect(result.fieldErrors.catalogUrl).toBeDefined();
  });

  it("分類 ID にファイルが混入したら入力エラーにする", () => {
    const result = validateMaterialInput({
      ...base,
      cropIds: [new File(["invalid"], "invalid.txt")],
    });

    expect(result.ok).toBe(false);
  });
});
