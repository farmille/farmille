import { describe, expect, it } from "vitest";
import { matchSearchCatalog, type SearchCatalog } from "./material-search";

const catalog: SearchCatalog = {
  filters: [
    { id: "crop", name: "ミニトマト", category: "crop", aliases: ["プチトマト"], sort_order: 0 },
  ],
  makers: ["GREEN", "トマト農材"],
  materialNames: Array.from({ length: 12 }, (_, index) => `トマト資材${index}`),
};

describe("キーワードに対応する検索候補", () => {
  it("候補の8件制限に関係なく作物・メーカー・資材名を検索対象にする", () => {
    const result = matchSearchCatalog(catalog, " トマト ");
    expect(result.filters).toEqual(catalog.filters);
    expect(result.makerNames).toEqual(["トマト農材"]);
    expect(result.materialNames).toHaveLength(12);
  });
  it("別名と大文字小文字を区別しない検索に対応する", () => {
    expect(matchSearchCatalog(catalog, "プチ").filters).toEqual(catalog.filters);
    expect(matchSearchCatalog(catalog, "green").makerNames).toEqual(["GREEN"]);
  });
  it("一致しない文字は全件表示に戻さない", () => {
    expect(matchSearchCatalog(catalog, "一致しない")).toEqual({
      filters: [],
      makerNames: [],
      materialNames: [],
    });
  });
});
