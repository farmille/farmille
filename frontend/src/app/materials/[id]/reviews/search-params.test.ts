import { describe, expect, it } from "vitest";

import { parseReviewSearchParams } from "./search-params";

describe("parseReviewSearchParams", () => {
  it("指定された並び順とページを返す", () => {
    expect(parseReviewSearchParams({ sort: "helpful", page: "3" })).toEqual({
      sort: "helpful",
      page: 3,
    });
  });

  it("不正な値は新着順の1ページ目として扱う", () => {
    expect(parseReviewSearchParams({ sort: "unknown", page: "0" })).toEqual({
      sort: "newest",
      page: 1,
    });
  });

  it("複数値では先頭を使う", () => {
    expect(
      parseReviewSearchParams({
        sort: ["rating", "newest"],
        page: ["2", "4"],
      }),
    ).toEqual({
      sort: "rating",
      page: 2,
    });
  });
});
