import { describe, expect, it } from "vitest";

import { reportCrop } from "@/server/usage-reports/crop";

describe("reportCrop", () => {
  it("作物マスタの作目を優先する", () => {
    expect(reportCrop({ crop: { id: "crop-1", name: "トマト" }, crop_name_other: null })).toEqual({
      id: "crop-1",
      name: "トマト",
    });
  });

  it("「その他」の名前はIDなしの作目として返す", () => {
    expect(reportCrop({ crop: null, crop_name_other: "ステビア" })).toEqual({
      id: null,
      name: "ステビア",
    });
  });

  it("どちらも無ければnullを返す", () => {
    expect(reportCrop({ crop: null, crop_name_other: null })).toBeNull();
  });
});
