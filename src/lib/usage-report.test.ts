import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  createBlankUsageReport,
  parseReportNumber,
  UsageReportInputSchema,
  validateUsageReportSubmission,
} from "./usage-report";

describe("実証詳細レポート", () => {
  it("下書きは空欄を保持し、公開時に不足を返す", () => {
    const input = createBlankUsageReport("11111111-1111-4111-8111-111111111111");
    expect(v.safeParse(UsageReportInputSchema, input).success).toBe(true);
    const errors = validateUsageReportSubmission(input);
    expect(errors.cropId).toBeDefined();
    expect(errors["measurements.0.values"]).toBeDefined();
    expect(errors.guidelineAck).toBeDefined();
  });
  it("負値・ゼロ・誤差・検定記号を原文を変更せず読む", () => {
    expect(parseReportNumber("41.7±0.8 a")).toEqual({ value: 41.7, error: 0.8 });
    expect(parseReportNumber("-2.5±0.2 n.s.")).toEqual({ value: -2.5, error: 0.2 });
    expect(parseReportNumber("0 ＊")).toEqual({ value: 0, error: null });
    expect(parseReportNumber("未測定")).toBeNull();
  });
  it("ゼロの数値を有効とし、文章や添付資料の未確認を提出前に検出する", () => {
    const input = createBlankUsageReport("11111111-1111-4111-8111-111111111111");
    input.cropId = "22222222-2222-4222-8222-222222222222";
    input.observedChange = "変化はありませんでした。";
    input.purposeTags = ["耐暑性改善"];
    input.cultivationEnvironment = "露地";
    input.timingStages = [3];
    input.timingNote = "9月1日に散布しました。";
    input.plots = input.plots.map((plot, index) => ({
      ...plot,
      name: `区${index + 1}`,
      scope: "10株",
      description: "資材なし",
    }));
    input.measurements = input.measurements.map((measurement) => ({
      ...measurement,
      name: "収量",
      graphs: measurement.graphs.map((graph) => ({
        ...graph,
        rows: graph.rows.map((row) => ({ ...row, value: "0" })),
      })),
    }));
    input.methodDetailsAck = true;
    input.guidelineAck = true;
    expect(validateUsageReportSubmission(input)).toEqual({});
    input.measurements = input.measurements.map((measurement) => ({
      ...measurement,
      kind: "text",
    }));
    expect(validateUsageReportSubmission(input)["measurements.0.values"]).toBeDefined();
    input.documents = [
      { id: crypto.randomUUID(), path: "owner/report/document.pdf", name: "成績書.pdf" },
    ];
    expect(validateUsageReportSubmission(input).documentsAck).toBeDefined();
  });
});
