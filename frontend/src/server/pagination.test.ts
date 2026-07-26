import { describe, expect, it } from "vitest";

import { DEFAULT_PER_PAGE, pageRange } from "@/server/pagination";

describe("pageRange", () => {
  it("1ページ目の両端を返す", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: DEFAULT_PER_PAGE - 1 });
  });

  it("指定件数で後続ページの両端を返す", () => {
    expect(pageRange(3, 10)).toEqual({ from: 20, to: 29 });
  });

  it.each([
    [0, 10],
    [1.5, 10],
    [1, 0],
    [1, 2.5],
  ])("正の整数でない指定を拒否する", (page, perPage) => {
    expect(() => pageRange(page, perPage)).toThrow(RangeError);
  });
});
