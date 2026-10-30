import { describe, expect, it } from "vitest";
import { matchSearchCatalog, type SearchCatalog } from "./material-search";

const catalog: SearchCatalog = {
  filters: [
    { id: "crop", name: "ミニトマト", category: "crop", aliases: ["プチトマト"], sort_order: 0 },
  ],
  makers: ["GREEN", "トマト農材"],
  materials: Array.from({ length: 12 }, (_, index) => ({
    name: `トマト資材${index}`,
    aliases: [],
  })),
};

describe("キーワードに対応する検索候補", () => {
  it("正式名称・読み・別名のどれに一致しても表示製品名を候補にする", () => {
    const names: SearchCatalog = {
      filters: [],
      makers: [],
      materials: [{ name: "活力サポート", aliases: ["Bio Support 53", "バイオサポート", "BS53"] }],
    };

    for (const query of ["bio support", "ばいお", "ＢＳ５３"]) {
      expect(matchSearchCatalog(names, query).materialNames).toEqual(["活力サポート"]);
    }

    {
      expect(matchSearchCatalog(catalog, "プチ").filters).toEqual(catalog.filters);
      expect(matchSearchCatalog(catalog, "green").makerNames).toEqual(["GREEN"]);
    }
  });
  it("候補の8件制限に関係なく作物・メーカー・資材名を検索対象にする", () => {
    const result = matchSearchCatalog(catalog, " トマト ");
    expect(result.filters).toEqual(catalog.filters);
    expect(result.makerNames).toEqual(["トマト農材"]);
    expect(result.materialNames).toHaveLength(12);
  });

  it("一致しない文字は全件表示に戻さない", () => {
    expect(matchSearchCatalog(catalog, "一致しない")).toEqual({
      filters: [],
      makerNames: [],
      materialNames: [],
    });
  });
});
