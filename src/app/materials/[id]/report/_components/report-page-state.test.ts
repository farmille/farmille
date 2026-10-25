import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  createBlankUsageReport,
  reportNeedsMaterialAcks,
  UsageReportInputSchema,
  validateUsageReportSubmission,
  type UsageReportInput,
} from "@/lib/usage-report";
import { reportPlotEdits } from "@/lib/usage-report-plots";

import {
  inputWithItems,
  itemsFromInput,
  itemsWithPlots,
  reportPageChecks,
  type ReportPageItem,
} from "./report-page-state";
import { filledReport } from "./reportStoryFixture";

const acks = { timing: true, privacy: true };

function numericMeasurement(plots: UsageReportInput["plots"]) {
  return {
    id: crypto.randomUUID(),
    kind: "numeric" as const,
    name: "可販重量",
    unit: "g",
    body: "品種内で資材を比べた有意差の文字を付けた。",
    graphs: [
      {
        id: crypto.randomUUID(),
        heading: "収穫時",
        rows: plots.map((plot, index) => ({
          id: crypto.randomUUID(),
          plotId: plot.id,
          label: "",
          value: index === 0 ? "856±105 A" : "1126±139 B",
        })),
      },
    ],
  };
}

describe("ページ版の調査項目", () => {
  it("保存済みの画像・文章・数値の調査項目を読み込む", () => {
    const items = itemsFromInput({
      ...filledReport,
      measurements: [...filledReport.measurements, numericMeasurement(filledReport.plots)],
    });
    expect(items.map((item) => [item.name, item.mode])).toEqual([
      ["可販果収量", "file"],
      ["裂果率", "text"],
      ["可販重量", "numeric"],
    ]);
  });

  it("数値の調査項目は、題・単位・区ごとの値の原文を保ったまま書き戻す", () => {
    const numeric = numericMeasurement(filledReport.plots);
    const input = { ...filledReport, measurements: [...filledReport.measurements, numeric] };
    const back = inputWithItems(input, itemsFromInput(input));
    expect(back.measurements.at(-1)).toEqual(numeric);
    expect(itemsFromInput(back)).toEqual(itemsFromInput(input));
  });

  it("品種・比較した資材・共通の説明と区の資材は、書き戻しても残り、保存の入力として通る", () => {
    const postedName = "ヒートインパクト";
    const input = {
      ...reportPlotEdits.addComparedMaterial(
        reportPlotEdits.addVariety(filledReport, "アイコ", postedName),
        "ノビテク",
        postedName,
      ),
      commonPlotDescription: "かん水と施肥は全区同じ。",
    };
    const back = inputWithItems(input, itemsFromInput(input));
    expect(back.varieties).toEqual(input.varieties);
    expect(back.comparedMaterials).toEqual(input.comparedMaterials);
    expect(back.commonPlotDescription).toBe("かん水と施肥は全区同じ。");
    expect(back.plots.map(({ varietyId, treatment }) => ({ varietyId, treatment }))).toEqual(
      input.plots.map(({ varietyId, treatment }) => ({ varietyId, treatment })),
    );
    expect(v.safeParse(UsageReportInputSchema, back).success).toBe(true);
  });

  it("画面に欄の無い区の調査範囲も、書き戻して保存の入力に残す", () => {
    const input = {
      ...filledReport,
      plots: filledReport.plots.map((plot, index) => ({ ...plot, scope: `${(index + 1) * 10}株` })),
    };
    const back = inputWithItems(input, itemsFromInput(input));
    expect(back.plots.map((plot) => plot.scope)).toEqual(["10株", "20株", "30株"]);
  });

  it("区を変えると、数値のグラフの行を区ごとに1行にそろえ、残る区の値はそのまま", () => {
    const input = { ...filledReport, measurements: [numericMeasurement(filledReport.plots)] };
    const items = itemsFromInput(input);
    const [, second, third] = input.plots;
    if (second === undefined || third === undefined) throw new Error("記入例の区が足りません。");
    const plots = [second, third, { ...third, id: crypto.randomUUID() }];
    const next = itemsWithPlots(items, plots);
    const graph = next[0]?.mode === "numeric" ? next[0].graphs[0] : undefined;
    expect(graph?.rows.map((row) => [row.plotId, row.value])).toEqual([
      [second.id, "1126±139 B"],
      [third.id, "1126±139 B"],
      [plots[2]?.id, ""],
    ]);
    expect(itemsWithPlots(next, plots)).toBe(next);
  });

  it("画像を消した資料の項目は未完成", () => {
    const [file] = itemsFromInput(filledReport);
    if (file?.mode !== "file") throw new Error("記入例の調査項目がありません。");
    const items: ReportPageItem[] = [{ ...file, images: [] }];
    const back = inputWithItems(filledReport, items);
    const check = reportPageChecks(back, acks).find((c) => c.key === "measurements");
    expect(check?.ok).toBe(false);
  });
});

describe("記入状況", () => {
  it("空のレポートは確認のチェックを含めて未記入", () => {
    const blank = createBlankUsageReport(crypto.randomUUID());
    const items = itemsFromInput(blank);
    const missing = reportPageChecks(inputWithItems(blank, items), {
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
    const items = itemsFromInput(input);
    const keys = reportPageChecks(inputWithItems(input, items), {
      timing: true,
      privacy: false,
    })
      .filter((check) => !check.ok)
      .map((check) => check.key);
    expect(keys).toEqual(["privacyAck", "documentsAck"]);
  });

  it("関連資料のPDFだけを持つ下書きも、写り込みと秘密保持の確認が要り、確認すれば提出できる", () => {
    const input = {
      ...filledReport,
      methodDetailsAck: true,
      guidelineAck: true,
      measurements: filledReport.measurements.filter((measurement) => measurement.kind === "text"),
      media: [],
      documents: [
        { id: crypto.randomUUID(), path: "user/report/document.pdf", name: "成績書.pdf" },
      ],
    };
    const items = itemsFromInput(input);
    const payload = inputWithItems(input, items);
    expect(reportNeedsMaterialAcks(payload)).toBe(true);
    const missing = (checked: UsageReportInput, privacy: boolean) =>
      reportPageChecks(checked, { timing: true, privacy })
        .filter((check) => !check.ok)
        .map((check) => check.key);
    expect(missing(payload, false)).toEqual(["privacyAck", "documentsAck"]);
    expect(missing({ ...payload, documentsAck: true }, true)).toEqual([]);
  });

  it("区の説明は、全区に共通の説明があれば区ごとには要らない", () => {
    const input = {
      ...filledReport,
      commonPlotDescription: "1区10株、3反復。",
      plots: filledReport.plots.map((plot) => ({ ...plot, description: "" })),
    };
    const items = itemsFromInput(input);
    const plots = reportPageChecks(inputWithItems(input, items), acks).find(
      (check) => check.key === "plots",
    );
    expect(plots?.ok).toBe(true);
  });

  it("画面の確認がすべて済めば、提出チェックも通る", () => {
    const input = {
      ...filledReport,
      methodDetailsAck: true,
      documentsAck: true,
      guidelineAck: true,
    };
    const items = itemsFromInput(input);
    const payload = inputWithItems(input, items);
    expect(reportPageChecks(payload, acks).every((check) => check.ok)).toBe(true);
    expect(validateUsageReportSubmission(payload)).toEqual({});
  });
});
