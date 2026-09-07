import { describe, expect, it } from "vitest";

import {
  applyApplicationDetail,
  cultivationTypeDisplayLabel,
  cultivationTypeFromLabel,
  growthStageValue,
  parseGrowthStage,
  serializeApplicationDetail,
} from "@/server/usage-reports/application-detail";
import { createBlankCropReport } from "@/server/usage-reports/model";

describe("使用方法詳細の保存形式", () => {
  it("公開画面で読める行形式からフォーム状態を復元する", () => {
    const input = createBlankCropReport("crop-id");
    input.applicationMethod = "spray";
    input.sprayDilutionValue = "1000";
    input.sprayDilutionUnit = "倍";
    input.sprayAmountValue = "100";
    input.sprayAmountUnit = "L/10a";
    input.sprayArea = "100株";
    input.comparison.enabled = true;
    input.comparison.otherBsUse = "no";
    input.metricsEnabled = true;
    input.researchPeriod = "2026年7月";

    const detail = serializeApplicationDetail(input);
    const restored = applyApplicationDetail("crop-id", "葉・茎・果実に散布", detail);

    expect(detail).toContain("希釈倍率・濃度：1000｜倍");
    expect(restored.sprayAmountValue).toBe("100");
    expect(restored.comparison.enabled).toBe(true);
    expect(restored.comparison.otherBsUse).toBe("no");
    expect(restored.researchPeriod).toBe("2026年7月");
  });

  it("括弧を含む生育ステージと補足を混同しない", () => {
    const stored = growthStageValue("生育期（展葉・結球）", "葉数は8枚");
    expect(parseGrowthStage(stored)).toEqual({
      growthStage: "生育期（展葉・結球）",
      growthStageNote: "葉数は8枚",
    });
  });

  it("保存済みの栽培形態は日本語名と旧コードのどちらからも復元する", () => {
    expect(cultivationTypeFromLabel("露地栽培")).toBe("open_field");
    expect(cultivationTypeFromLabel("open_field")).toBe("open_field");
    expect(cultivationTypeDisplayLabel("open_field")).toBe("露地栽培");
    expect(cultivationTypeDisplayLabel("露地栽培")).toBe("露地栽培");
  });

  it("未知の栽培形態を空欄や内部値のまま表示しない", () => {
    expect(() => cultivationTypeDisplayLabel("unknown")).toThrow("未対応の栽培形態です：unknown");
  });
});
