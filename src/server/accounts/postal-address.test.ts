import { describe, expect, it } from "vitest";
import { lookupPostalAddress } from "./postal-address";

describe("郵便番号の住所検索", () => {
  it("都道府県と市区町村までを返す", async () => {
    expect(await lookupPostalAddress("1000001")).toEqual({
      ok: true,
      addresses: [{ prefectureCode: 13, city: "千代田区" }],
    });
  });
  it("先頭が0の郵便番号を保持する", async () => {
    expect(await lookupPostalAddress("0600001")).toEqual({
      ok: true,
      addresses: [{ prefectureCode: 1, city: "札幌市中央区" }],
    });
  });
  it("不正な形式や存在しない番号は自動入力しない", async () => {
    expect((await lookupPostalAddress("../test")).ok).toBe(false);
    expect((await lookupPostalAddress("0000000")).ok).toBe(false);
  });
});
