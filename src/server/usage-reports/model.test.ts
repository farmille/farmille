import { describe, expect, it } from "vitest";

import { mediaPlacementLabel } from "@/server/usage-reports/model";

describe("使用レポートのメディア配置表示", () => {
  it.each([
    ["observation", "観察した変化"],
    ["cover", "冒頭（カバー）"],
    ["method", "使用方法"],
    ["harvest", "収穫調査"],
    ["summary", "まとめ・感想"],
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
