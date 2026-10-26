import { describe, expect, it } from "vitest";

import {
  createBlankUsageReport,
  REPORT_PLOT_LIMIT,
  withSingleVariety,
  type UsageReportInput,
} from "./usage-report";
import {
  firstReportChart,
  graphSections,
  graphWithPlots,
  plotPlan,
  reportPlotEdits,
  reportPlotLayout,
  reportPlotSeries,
  withAutoPlotNames,
} from "./usage-report-plots";

const posted = "ヒートインパクト";

function blank(): UsageReportInput {
  const input = withSingleVariety(
    createBlankUsageReport("11111111-1111-4111-8111-111111111111"),
    "新藍",
    false,
  );
  return withAutoPlotNames(input, input, posted);
}

const names = (input: UsageReportInput) => input.plots.map((plot) => plot.name);

describe("区の組み合わせ", () => {
  it("新しいレポートは品種1つ・2区で、組み合わせの表を出さず、区に資材名の名前が付く", () => {
    const input = blank();
    expect(plotPlan(input, posted).showMatrix).toBe(false);
    expect(names(input)).toEqual(["無処理区", "ヒートインパクト区"]);
  });

  it("品種を足すと、その品種で今ある資材の区ができ、名前は「品種・資材」に変わる", () => {
    const input = reportPlotEdits.addVariety(blank(), "味珠", posted);
    expect(plotPlan(input, posted).showMatrix).toBe(true);
    expect(names(input)).toEqual([
      "新藍・無処理",
      "新藍・ヒートインパクト",
      "味珠・無処理",
      "味珠・ヒートインパクト",
    ]);
  });

  it("書き換えた区の名前は、組み合わせや品種名を変えても上書きしない", () => {
    const start = blank();
    const renamed = {
      ...start,
      plots: start.plots.map((plot, index) =>
        index === 1 ? { ...plot, name: "1,000倍区" } : plot,
      ),
    };
    const added = reportPlotEdits.addVariety(renamed, "味珠", posted);
    const variety = added.varieties[1];
    if (variety === undefined) throw new Error("足した品種がありません。");
    const next = reportPlotEdits.renameVariety(added, variety.id, "味珠2", posted);
    expect(names(next)).toEqual([
      "新藍・無処理",
      "1,000倍区",
      "味珠2・無処理",
      "味珠2・ヒートインパクト",
    ]);
  });

  it("比較した資材を足すと品種ごとに区ができ、表のチェックを外すとその区だけ消える", () => {
    const two = reportPlotEdits.addVariety(blank(), "味珠", posted);
    const added = reportPlotEdits.addComparedMaterial(two, "ノビテク", posted);
    expect(names(added)).toEqual([
      "新藍・無処理",
      "新藍・ヒートインパクト",
      "新藍・ノビテク",
      "味珠・無処理",
      "味珠・ヒートインパクト",
      "味珠・ノビテク",
    ]);
    const [first, second] = added.varieties;
    if (first === undefined || second === undefined) throw new Error("品種が足りません。");
    const removed = reportPlotEdits.toggle(added, second.id, { kind: "untreated" }, false, posted);
    expect(names(removed)).not.toContain("味珠・無処理");
    const plan = plotPlan(removed, posted);
    expect(plan.checked(second.id, { kind: "untreated" })).toBe(false);
    expect(plan.checked(first.id, { kind: "untreated" })).toBe(true);
    const back = reportPlotEdits.toggle(removed, second.id, { kind: "untreated" }, true, posted);
    expect(names(back)).toEqual(names(added));
  });

  it("比較した資材を外すと、その資材の区も消える", () => {
    const added = reportPlotEdits.addComparedMaterial(blank(), "ノビテク", posted);
    const material = added.comparedMaterials[0];
    if (material === undefined) throw new Error("比較した資材がありません。");
    expect(names(added)).toEqual(["無処理区", "ヒートインパクト区", "ノビテク区"]);
    const removed = reportPlotEdits.removeComparedMaterial(added, material.id, posted);
    expect(names(removed)).toEqual(["無処理区", "ヒートインパクト区"]);
    expect(plotPlan(removed, posted).showMatrix).toBe(false);
  });

  it("既定の2区が欠けたら、戻せるように表を出す", () => {
    const input = blank();
    const varietyId = input.varieties[0]?.id ?? null;
    const removed = reportPlotEdits.toggle(input, varietyId, { kind: "untreated" }, false, posted);
    expect(plotPlan(removed, posted).showMatrix).toBe(true);
  });

  it("同じ資材の区を足すと、2つ目から番号が付く", () => {
    const input = blank();
    const varietyId = input.varieties[0]?.id ?? null;
    const added = reportPlotEdits.addPlot(input, varietyId, { kind: "posted" }, posted);
    expect(names(added)).toEqual(["無処理区", "ヒートインパクト区", "ヒートインパクト区（2）"]);
  });

  it("表を出す組み合わせでも、選んだ品種と資材の区を組み合わせの並びの位置に足し、名前を付ける", () => {
    const input = reportPlotEdits.addVariety(blank(), "アイコ", posted);
    const [first, second] = input.varieties;
    if (first === undefined || second === undefined) throw new Error("品種が2つ要ります");
    const added = reportPlotEdits.addPlot(input, first.id, { kind: "posted" }, posted);
    expect(names(added)).toEqual([
      "新藍・無処理",
      "新藍・ヒートインパクト",
      "新藍・ヒートインパクト（2）",
      "アイコ・無処理",
      "アイコ・ヒートインパクト",
    ]);
    expect(added.plots[2]?.varietyId).toBe(first.id);
  });

  it("品種が不明・なしなら品種は0件で、区の品種は空", () => {
    const input = reportPlotEdits.setVarietyUnknown(blank(), true, posted);
    expect(input.varieties).toEqual([]);
    expect(input.plots.every((plot) => plot.varietyId === null)).toBe(true);
    const added = reportPlotEdits.addComparedMaterial(input, "ノビテク", posted);
    expect(added.plots.map((plot) => plot.varietyId)).toEqual([null, null, null]);
    expect(reportPlotEdits.addVariety(added, "新藍", posted)).toBe(added);
  });

  it("要る区が上限に収まらない追加は断り、品種も資材も区も足さない", () => {
    let input = reportPlotEdits.addVariety(blank(), "アイコ", posted);
    for (let i = 0; i < 17; i += 1)
      input = reportPlotEdits.addComparedMaterial(input, `資材${i}`, posted);
    const [first] = input.varieties;
    input = reportPlotEdits.addPlot(input, first?.id ?? null, { kind: "posted" }, posted);
    expect(input.plots).toHaveLength(REPORT_PLOT_LIMIT - 1);
    // 品種が2つなので、比較した資材を1つ足すと区が2つ増える
    expect(reportPlotEdits.addComparedMaterial(input, "ノビテク", posted)).toBe(input);
    expect(reportPlotEdits.addVariety(input, "千果", posted)).toBe(input);
    const full = reportPlotEdits.addPlot(input, first?.id ?? null, { kind: "posted" }, posted);
    expect(full.plots).toHaveLength(REPORT_PLOT_LIMIT);
    expect(plotPlan(full, posted).full).toBe(true);
    expect(reportPlotEdits.addPlot(full, first?.id ?? null, { kind: "posted" }, posted)).toBe(full);
  });
});

describe("区の並びと色", () => {
  it("区に資材が無い既存のレポートは、区の順に1列で、区の順に塗る", () => {
    const input = blank();
    const legacy = {
      ...input,
      plots: [...input.plots, input.plots[1]].flatMap((plot) =>
        plot === undefined ? [] : [{ ...plot, id: crypto.randomUUID(), treatment: null }],
      ),
    };
    const layout = reportPlotLayout(legacy, posted);
    expect(layout.groups).toHaveLength(1);
    expect(layout.groups[0]?.plots.map(({ series }) => series)).toEqual(["1", "2", "3"]);
    expect(layout.legend).toBeNull();
  });

  it("品種が2つ以上なら品種ごとにまとめ、資材で塗り、凡例を付ける", () => {
    const input = reportPlotEdits.addComparedMaterial(
      reportPlotEdits.addVariety(blank(), "味珠", posted),
      "ノビテク",
      posted,
    );
    const layout = reportPlotLayout(input, posted);
    expect(layout.groups.map(({ variety }) => variety)).toEqual(["新藍", "味珠"]);
    expect(layout.groups[1]?.plots.map(({ series }) => series)).toEqual(["1", "2", "3"]);
    expect(layout.legend?.map(({ label }) => label)).toEqual([
      "無処理",
      "ヒートインパクト（投稿した資材）",
      "ノビテク（比較した資材）",
    ]);
  });

  it("グラフの行は品種ごとの節に分かれ、値の原文を保つ", () => {
    const input = reportPlotEdits.addVariety(blank(), "味珠", posted);
    const graph = graphWithPlots({ id: crypto.randomUUID(), heading: "", rows: [] }, input.plots);
    const valued = {
      ...graph,
      rows: graph.rows.map((row, index) => ({ ...row, value: `${index + 1}±1 a` })),
    };
    const sections = graphSections(valued, input.plots, reportPlotLayout(input, posted));
    expect(sections.map(({ heading, rows }) => [heading, rows.map(({ value }) => value)])).toEqual([
      ["新藍", ["1±1 a", "2±1 a"]],
      ["味珠", ["3±1 a", "4±1 a"]],
    ]);
    expect(graphWithPlots(valued, input.plots)).toBe(valued);
  });
});

describe("一覧カードのグラフ", () => {
  const plots = [
    { id: "p1", name: "無処理区" },
    { id: "p2", name: "処理区" },
  ];
  const byOrder = reportPlotSeries({
    plots: plots.map(({ id }) => ({ id, treatment: null })),
    comparedMaterials: [],
  });
  const row = (id: string, plotId: string, value: string) => ({ id, plotId, label: "", value });

  it("文章の項目と1区しか読めないグラフを飛ばし、区の順で色を決める", () => {
    const chart = firstReportChart(
      [
        { kind: "text", name: "様子", unit: "", graphs: [] },
        {
          kind: "numeric",
          name: "草丈",
          unit: "cm",
          graphs: [{ heading: "", rows: [row("a", "p1", "未計測"), row("b", "p2", "40")] }],
        },
        {
          kind: "numeric",
          name: "可販果収量",
          unit: "t/10a",
          graphs: [{ heading: "6月", rows: [row("c", "p2", "20.1±0.4"), row("d", "p1", "18.2")] }],
        },
      ],
      plots,
      byOrder,
    );
    expect(chart).toEqual({
      title: "可販果収量・6月",
      unit: "t/10a",
      rows: [
        expect.objectContaining({ label: "処理区", value: 20.1, error: 0.4, series: "2" }),
        expect.objectContaining({ label: "無処理区", value: 18.2, series: "1" }),
      ],
      hiddenRowCount: 0,
    });
  });

  it("すべての区に使った資材があれば、区の順ではなく資材で色を決める", () => {
    const series = reportPlotSeries({
      plots: [
        { id: "p1", treatment: { kind: "posted" } },
        { id: "p2", treatment: { kind: "untreated" } },
      ],
      comparedMaterials: [],
    });
    const chart = firstReportChart(
      [
        {
          kind: "numeric",
          name: "収量",
          unit: "kg",
          graphs: [{ heading: "", rows: [row("a", "p1", "12"), row("b", "p2", "10")] }],
        },
      ],
      plots,
      series,
    );
    expect(chart?.rows.map((item) => item.series)).toEqual(["2", "1"]);
  });

  it("区が多いときは先頭の3区だけを出し、残りの数を持つ", () => {
    const many = Array.from({ length: 5 }, (_, index) => ({
      id: `p${index}`,
      name: `区${index + 1}`,
    }));
    const chart = firstReportChart(
      [
        {
          kind: "numeric",
          name: "収量",
          unit: "kg",
          graphs: [{ heading: "", rows: many.map((plot) => row(`r-${plot.id}`, plot.id, "10")) }],
        },
      ],
      many,
      byOrder,
    );
    expect(chart?.rows.map((item) => item.label)).toEqual(["区1", "区2", "区3"]);
    expect(chart?.hiddenRowCount).toBe(2);
  });

  it("読めるグラフがなければ null", () => {
    expect(
      firstReportChart([{ kind: "numeric", name: "収量", unit: "", graphs: [] }], plots, byOrder),
    ).toBeNull();
  });
});
