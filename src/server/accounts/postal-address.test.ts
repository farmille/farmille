import { postalFill } from "@/lib/postal-fill";
import { describe, expect, it } from "vitest";
import { lookupPostalAddress } from "./postal-address";

describe("郵便番号の住所検索", () => {
  it("1000001 は東京都千代田区千代田を返す", async () => {
    expect(await lookupPostalAddress("1000001")).toEqual({
      ok: true,
      addresses: [{ prefectureCode: 13, city: "千代田区", town: "千代田" }],
    });
  });

  it("0600000 は町名を入れない", async () => {
    expect(await lookupPostalAddress("0600000")).toEqual({
      ok: true,
      addresses: [{ prefectureCode: 1, city: "札幌市中央区", town: "" }],
    });
  });
  it("不正な形式や存在しない番号は自動入力しない", async () => {
    expect((await lookupPostalAddress("../test")).ok).toBe(false);
    expect((await lookupPostalAddress("0000000")).ok).toBe(false);
  });
  it("町名が1つのときだけ番地まで入れ、複数なら市区町村で止める", () => {
    expect(postalFill([{ prefectureCode: 13, city: "大田区", town: "久が原" }])).toEqual({
      status: "town",
      prefectureCode: 13,
      city: "大田区",
      town: "久が原",
    });
    expect(postalFill([{ prefectureCode: 1, city: "札幌市中央区", town: "" }])).toEqual({
      status: "city",
      prefectureCode: 1,
      city: "札幌市中央区",
    });
    expect(
      postalFill([
        { prefectureCode: 1, city: "夕張市", town: "南部青葉町" },
        { prefectureCode: 1, city: "夕張市", town: "南部菊水町" },
      ]),
    ).toEqual({ status: "many-towns", prefectureCode: 1, city: "夕張市" });
    expect(
      postalFill([
        { prefectureCode: 1, city: "札幌市厚別区", town: "" },
        { prefectureCode: 1, city: "札幌市清田区", town: "" },
      ]),
    ).toEqual({ status: "many-cities" });
  });
});
