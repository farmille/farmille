import { describe, expect, it } from "vitest";

import { createBlankUsageReport, validateUsageReportSubmission } from "@/lib/usage-report";

import {
  inputWithItems,
  itemsFromInput,
  reportPageChecks,
  type ReportPageItem,
} from "./report-page-state";
import { filledReport } from "./reportStoryFixture";

const acks = { timing: true, privacy: true };

describe("ページ版の調査項目", () => {
  it("保存済みの画像の項目と文章の項目を読み込み、数値グラフは読み込まない", () => {
    const items = itemsFromInput({
      ...filledReport,
      measurements: [
        ...filledReport.measurements,
        {
          id: crypto.randomUUID(),
          kind: "numeric",
          name: "収量",
          unit: "kg",
          body: "",
          graphs: [],
        },
      ],
    });
    expect(items.map((item) => [item.name, item.mode, item.images.length])).toEqual([
      ["可販果収量", "file", 1],
      ["裂果率", "text", 0],
    ]);
  });

  it("書き戻すと画像は調査項目につながり、区の調査範囲は空になる", () => {
    const back = inputWithItems(filledReport, itemsFromInput(filledReport));
    expect(back.measurements.map((item) => item.kind)).toEqual(["image", "text"]);
    expect(back.media[0]?.measurementId).toBe(back.measurements[0]?.id);
    expect(back.plots.every((plot) => plot.scope === "")).toBe(true);
    expect(itemsFromInput(back)).toEqual(itemsFromInput(filledReport));
  });

  it("画像を消した資料の項目は未完成", () => {
    const [file] = itemsFromInput(filledReport);
    if (file === undefined) throw new Error("記入例の調査項目がありません。");
    const items: ReportPageItem[] = [{ ...file, images: [] }];
    const check = reportPageChecks(filledReport, items, acks).find((c) => c.key === "measurements");
    expect(check?.ok).toBe(false);
  });
});

describe("記入状況", () => {
  it("空のレポートは確認のチェックを含めて未記入", () => {
    const blank = createBlankUsageReport(crypto.randomUUID());
    const missing = reportPageChecks(blank, itemsFromInput(blank), {
      timing: false,
      privacy: false,
    })
      .filter((check) => !check.ok)
      .map((check) => check.key);
    expect(missing).toContain("timingAck");
    expect(missing).toContain("measurements");
    expect(missing).not.toContain("privacyAck");
  });

  it("画像を差し込んだら写り込みと秘密保持の確認が要る", () => {
    const input = { ...filledReport, methodDetailsAck: true, guidelineAck: true };
    const keys = reportPageChecks(input, itemsFromInput(input), { timing: true, privacy: false })
      .filter((check) => !check.ok)
      .map((check) => check.key);
    expect(keys).toEqual(["privacyAck", "documentsAck"]);
  });

  it("画面の確認がすべて済めば、提出チェックも通る", () => {
    const input = {
      ...filledReport,
      methodDetailsAck: true,
      documentsAck: true,
      guidelineAck: true,
    };
    const items = itemsFromInput(input);
    expect(reportPageChecks(input, items, acks).every((check) => check.ok)).toBe(true);
    expect(validateUsageReportSubmission(inputWithItems(input, items))).toEqual({});
  });
});
