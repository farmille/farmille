import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  createBlankUsageReport,
  createReportMeasurement,
  reportNeedsMaterialAcks,
  UsageReportInputSchema,
  validateUsageReportSubmission,
  type UsageReportInput,
} from "@/lib/usage-report";
import { reportPlotEdits, withAutoPlotNames } from "@/lib/usage-report-plots";

import {
  inputWithItems,
  itemsFromInput,
  itemsWithPlots,
  latestRequests,
  otherOpenReport,
  reportPageChecks,
  reportPageItemDone,
  reportPdfReadingReplaces,
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

  it("数値の項目は、どのグラフにも数として読める値が入るまで書きかけ", () => {
    const measurement = numericMeasurement(filledReport.plots);
    const [first] = measurement.graphs;
    if (first === undefined) throw new Error("記入例のグラフがありません。");
    const withSecond = (value: string) =>
      itemsFromInput({
        ...filledReport,
        measurements: [
          {
            ...measurement,
            graphs: [
              first,
              {
                ...first,
                id: crypto.randomUUID(),
                rows: first.rows.map((row) => ({ ...row, id: crypto.randomUUID(), value })),
              },
            ],
          },
        ],
      })[0];
    const done = (value: string) => {
      const item = withSecond(value);
      if (item === undefined) throw new Error("調査項目がありません。");
      return reportPageItemDone(item);
    };
    expect(done("")).toBe(false);
    expect(done("abc")).toBe(false);
    expect(done("12.5")).toBe(true);
  });

  it("画像を消した資料の項目は未完成", () => {
    const [file] = itemsFromInput(filledReport);
    if (file?.mode !== "file") throw new Error("記入例の調査項目がありません。");
    const items: ReportPageItem[] = [{ ...file, images: [] }];
    const back = inputWithItems(filledReport, items);
    const check = reportPageChecks(back, acks, false).find((c) => c.key === "measurements");
    expect(check?.ok).toBe(false);
  });
});

describe("記入状況", () => {
  it("空のレポートは確認のチェックを含めて未記入", () => {
    const blank = createBlankUsageReport(crypto.randomUUID());
    const items = itemsFromInput(blank);
    const missing = reportPageChecks(
      inputWithItems(blank, items),
      { timing: false, privacy: false },
      false,
    )
      .filter((check) => !check.ok)
      .map((check) => check.key);
    expect(missing).toContain("timingAck");
    expect(missing).toContain("measurements");
    expect(missing).not.toContain("privacyAck");
  });

  it("画像を差し込んだら写り込みと秘密保持の確認が要る", () => {
    const input = { ...filledReport, methodDetailsAck: true, guidelineAck: true };
    const items = itemsFromInput(input);
    const keys = reportPageChecks(
      inputWithItems(input, items),
      { timing: true, privacy: false },
      false,
    )
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
      reportPageChecks(checked, { timing: true, privacy }, false)
        .filter((check) => !check.ok)
        .map((check) => check.key);
    expect(missing(payload, false)).toEqual(["privacyAck", "documentsAck"]);
    expect(missing({ ...payload, documentsAck: true }, true)).toEqual([]);
  });

  it("区の無い品種は、比べた区の行に品種名を添えて未記入にする", () => {
    const input = {
      ...filledReport,
      varieties: [...filledReport.varieties, { id: crypto.randomUUID(), name: "アイコ" }],
    };
    const items = itemsFromInput(input);
    const checks = reportPageChecks(inputWithItems(input, items), acks, false);
    expect(checks.find((check) => check.key === "plots")).toMatchObject({
      ok: false,
      label: "比べた区（品種「アイコ」の区が無い）",
      target: "report-plots",
    });
    expect(checks.find((check) => check.key === "variety")?.ok).toBe(true);
  });

  it("区の説明は、全区に共通の説明があれば区ごとには要らない", () => {
    const input = {
      ...filledReport,
      commonPlotDescription: "1区10株、3反復。",
      plots: filledReport.plots.map((plot) => ({ ...plot, description: "" })),
    };
    const items = itemsFromInput(input);
    const plots = reportPageChecks(inputWithItems(input, items), acks, false).find(
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
    expect(reportPageChecks(payload, acks, false).every((check) => check.ok)).toBe(true);
    expect(validateUsageReportSubmission(payload, { pdfValuesCheckRequired: false })).toEqual({});
  });

  it("PDF読み取りを写したレポートだけ、元のPDFと照らし合わせた確認が要る", () => {
    const input = {
      ...filledReport,
      methodDetailsAck: true,
      documentsAck: true,
      guidelineAck: true,
    };
    const items = itemsFromInput(input);
    const payload = inputWithItems(input, items);
    const keys = (required: boolean, checked: boolean) =>
      reportPageChecks({ ...payload, pdfValuesChecked: checked }, acks, required)
        .filter((check) => !check.ok)
        .map((check) => check.key);
    expect(keys(false, false)).toEqual([]);
    expect(keys(true, false)).toEqual(["pdfValuesChecked"]);
    expect(keys(true, true)).toEqual([]);
  });
});

describe("PDF読み取りで置き換わる入力", () => {
  it("自動の区の名前だけなら置き換わるものは無く、区の説明か数値の調査項目があれば置き換わる", () => {
    // ページ版の新しいレポートは、数値の調査項目を持たずに始まる
    const blank = { ...createBlankUsageReport(crypto.randomUUID()), measurements: [] };
    const named = withAutoPlotNames(blank, blank, "資材A");
    expect(reportPdfReadingReplaces(named, itemsFromInput(named), "資材A")).toBe(false);
    const described = {
      ...named,
      plots: named.plots.map((plot) => ({ ...plot, description: "1,000倍" })),
    };
    expect(reportPdfReadingReplaces(described, itemsFromInput(described), "資材A")).toBe(true);
    const numeric = { ...named, measurements: [createReportMeasurement(named.plots)] };
    expect(reportPdfReadingReplaces(numeric, itemsFromInput(numeric), "資材A")).toBe(true);
  });
});

describe("資材を選び直す前の確かめ", () => {
  const reportId = crypto.randomUUID();
  it("確認中のレポートか、今の下書きでない下書きがあれば、切り替えない", () => {
    expect(otherOpenReport({ draft: null, submitted: [{}] }, reportId)).toBe("pending");
    expect(
      otherOpenReport({ draft: { reportId: crypto.randomUUID() }, submitted: [] }, reportId),
    ).toBe("draft");
  });

  it("下書きが無いか、今の下書きなら切り替える", () => {
    expect(otherOpenReport({ draft: null, submitted: [] }, reportId)).toBeNull();
    expect(otherOpenReport({ draft: { reportId }, submitted: [] }, reportId)).toBeNull();
  });
});

describe("続けて選んだ資材の確かめ", () => {
  it("応答が前後しても、最後に選んだ資材の応答だけを使い、閉じたらどれも使わない", () => {
    const requests = latestRequests();
    const chosen: string[] = [];
    const a = requests.start();
    const b = requests.start();
    // B の応答が先に返り、A の応答が後から返る
    if (requests.isLatest(b)) chosen.push("B");
    if (requests.isLatest(a)) chosen.push("A");
    expect(chosen).toEqual(["B"]);
    const c = requests.start();
    requests.cancel();
    expect(requests.isLatest(c)).toBe(false);
  });
});
