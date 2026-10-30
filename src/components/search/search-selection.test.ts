import { describe, expect, it } from "vitest";

import {
  buildSearchHref,
  encodeFiltersQuery,
  formatLogicHint,
  parseFiltersQuery,
  parseQueryParam,
  parseSortParam,
  selectedFilterChipName,
  type SelectedSearchFilter,
} from "./search-selection";

describe("search-selection", () => {
  it("並び替えと選択条件を保ってキーワードをURLへ格納する", () => {
    const url = new URL(
      buildSearchHref({
        filters: [{ kind: "maker", name: "メーカー" }],
        sort: "rating",
        query: " トマト ",
      }),
      "https://example.com",
    );

    expect(url.searchParams.get("q")).toBe("トマト");
    expect(url.searchParams.get("sort")).toBe("rating");
    expect(parseFiltersQuery(url.searchParams.get("filters") ?? undefined).makerNames).toEqual([
      "メーカー",
    ]);
  });
  it("資材ジャンルを検索軸に使い、製品タイプのクエリを拒否する", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(parseFiltersQuery(`genre:${id}`).filters).toEqual([{ category: "genre", id }]);
    expect(() => parseFiltersQuery(`type:${id}`)).toThrow("不正な filters クエリ");
    expect(() => parseFiltersQuery(id)).toThrow("不正な filters クエリ");
  });

  it("同一分類は「または」、分類間は「かつ」で文言化する", () => {
    const filters: SelectedSearchFilter[] = [
      { kind: "filter", id: "1", name: "ミニトマト", category: "crop" },
      { kind: "filter", id: "2", name: "いちご", category: "crop" },
      { kind: "filter", id: "3", name: "高温対策", category: "concern" },
    ];

    expect(formatLogicHint(filters)).toBe("ミニトマト または いちご かつ 高温対策");
  });

  it("選んだ資材ジャンルのチップは略称にし、文言化には資材ジャンル名を使う", () => {
    const genre: SelectedSearchFilter = {
      kind: "filter",
      id: "1",
      name: "アミノ酸、ペプチド、タンパク質加水分解物",
      shortName: "アミノ酸",
      category: "genre",
    };

    const crop: SelectedSearchFilter = {
      kind: "filter",
      id: "2",
      name: "トマト",
      category: "crop",
    };

    expect(selectedFilterChipName(genre)).toBe("アミノ酸");
    expect(selectedFilterChipName(crop)).toBe("トマト");
    expect(selectedFilterChipName({ kind: "maker", name: "ICL JAPAN" })).toBe("ICL JAPAN");
    expect(formatLogicHint([crop, genre])).toBe(
      "トマト かつ アミノ酸、ペプチド、タンパク質加水分解物",
    );
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

  it("q は未指定なら空文字、前後の空白は落とす", () => {
    expect(parseQueryParam(undefined)).toBe("");
    expect(parseQueryParam("  トマト ")).toBe("トマト");
    expect(() => parseQueryParam(["a", "b"])).toThrow();
  });

  it("未指定の sort は reviews にする", () => {
    expect(parseSortParam(undefined)).toBe("reviews");
    expect(parseSortParam("rating")).toBe("rating");
  });
});
