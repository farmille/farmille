import { describe, expect, it } from "vitest";

import { mediaPlacementLabel, pickReportCover } from "@/server/usage-reports/model";

describe("実証詳細レポートのメディア配置表示", () => {
  it.each([
    ["treated", "処理区"],
    ["untreated", "対照区"],
  ])("%s を日本語で表示する", (placement, expected) => {
    expect(mediaPlacementLabel(placement)).toBe(expected);
  });

  it("未設定は未設定のまま返す", () => {
    expect(mediaPlacementLabel(null)).toBeNull();
  });

  it("未知の保存値をそのまま表示しない", () => {
    expect(() => mediaPlacementLabel("unknown")).toThrow("未対応のメディア配置です：unknown");
  });
});

describe("実証詳細レポートの一覧の表紙", () => {
  const photo = (id: string, sortOrder: number, measurementId: string | null = null) => ({
    id,
    media_type: "photo",
    sort_order: sortOrder,
    measurement_id: measurementId,
  });

  it("調査項目に差し込んだ画像は、並び順が先でも表紙にしない", () => {
    const cover = pickReportCover([
      photo("graph", 0, "measurement-1"),
      { ...photo("video", 1), media_type: "video" },
      photo("field-b", 3),
      photo("field-a", 2),
    ]);
    expect(cover?.id).toBe("field-a");
  });

  it("調査項目の画像と動画しかなければ表紙は無い", () => {
    expect(
      pickReportCover([
        photo("graph", 0, "measurement-1"),
        { ...photo("video", 1), media_type: "video" },
      ]),
    ).toBeNull();
  });
});
