import { describe, expect, it } from "vitest";

import {
  encodeFiltersQuery,
  formatLogicHint,
  parseFiltersQuery,
  parseQueryParam,
  parseSortParam,
  type SelectedSearchFilter,
} from "./search-selection";

describe("search-selection", () => {
  it("資材ジャンルを検索軸に使い、製品タイプのクエリを拒否する", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(parseFiltersQuery(`genre:${id}`).filters).toEqual([{ category: "genre", id }]);
    expect(() => parseFiltersQuery(`type:${id}`)).toThrow("不正な filters クエリ");
  });

  it("同一分類は「または」、分類間は「かつ」で文言化する", () => {
    const filters: SelectedSearchFilter[] = [
      { kind: "filter", id: "1", name: "ミニトマト", category: "crop" },
      { kind: "filter", id: "2", name: "いちご", category: "crop" },
      { kind: "filter", id: "3", name: "高温対策", category: "concern" },
    ];

    expect(formatLogicHint(filters)).toBe("ミニトマト または いちご かつ 高温対策");
  });

  it("filters クエリを分類・メーカー・資材名に分解する", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    const encoded = encodeFiltersQuery([
      { kind: "filter", id, name: "いちご", category: "crop" },
      { kind: "maker", name: "ICL JAPAN" },
      { kind: "name", name: "Actijump" },
    ]);

    expect(parseFiltersQuery(encoded)).toEqual({
      filters: [{ category: "crop", id }],
      makerNames: ["ICL JAPAN"],
      materialNames: ["Actijump"],
    });
  });

  it("分類接頭辞の無いUUIDを受け付けない", () => {
    expect(() => parseFiltersQuery("11111111-1111-1111-1111-111111111111")).toThrow(
      "不正な filters クエリ",
    );
  });

  it("q は未指定なら空文字、前後の空白は落とす", () => {
    expect(parseQueryParam(undefined)).toBe("");
    expect(parseQueryParam("  トマト ")).toBe("トマト");
  });

  it("配列の q は受け付けない", () => {
    expect(() => parseQueryParam(["a", "b"])).toThrow();
  });

  it("未指定の sort は reviews にする", () => {
    expect(parseSortParam(undefined)).toBe("reviews");
    expect(parseSortParam("rating")).toBe("rating");
  });
});
