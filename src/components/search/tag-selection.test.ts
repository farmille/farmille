import { describe, expect, it } from "vitest";

import {
  encodeTagsQuery,
  formatLogicHint,
  parseSortParam,
  parseTagsQuery,
  type SelectedSearchTag,
} from "./tag-selection";

describe("tag-selection", () => {
  it("同一分類は「または」、分類間は「かつ」で文言化する", () => {
    const tags: SelectedSearchTag[] = [
      {
        kind: "tag",
        id: "1",
        name: "ミニトマト",
        category: "crop",
        dbCategory: "crop",
      },
      {
        kind: "tag",
        id: "2",
        name: "いちご",
        category: "crop",
        dbCategory: "crop",
      },
      {
        kind: "tag",
        id: "3",
        name: "高温対策",
        category: "concern",
        dbCategory: "concern",
      },
    ];

    expect(formatLogicHint(tags)).toBe("ミニトマト または いちご かつ 高温対策");
  });

  it("tags クエリを UUID / maker / name に分解する", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    const encoded = encodeTagsQuery([
      {
        kind: "tag",
        id,
        name: "いちご",
        category: "crop",
        dbCategory: "crop",
      },
      { kind: "maker", name: "ICL JAPAN" },
      { kind: "name", name: "Actijump" },
    ]);

    expect(parseTagsQuery(encoded)).toEqual({
      tagIds: [id],
      makerNames: ["ICL JAPAN"],
      materialNames: ["Actijump"],
    });
  });

  it("未指定の sort は reviews にする", () => {
    expect(parseSortParam(undefined)).toBe("reviews");
    expect(parseSortParam("rating")).toBe("rating");
  });
});
