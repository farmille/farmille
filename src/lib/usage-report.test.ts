import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  createBlankUsageReport,
  groupReportMeasurements,
  parseReportNumber,
  reportErrorStep,
  reportVarietyNames,
  UsageReportInputSchema,
  validateUsageReportSubmission,
  withSingleVariety,
  type UsageReportInput,
} from "./usage-report";

const materialId = "11111111-1111-4111-8111-111111111111";

function submittableReport(): UsageReportInput {
  const input = withSingleVariety(createBlankUsageReport(materialId), "アイコ", false);
  return {
    ...input,
    cropId: "22222222-2222-4222-8222-222222222222",
    prefectureCode: 8,
    observedChange: "変化はありませんでした。",
    purposeTags: ["耐暑性改善"],
    cultivationEnvironment: "露地",
    timingStages: [3],
    timingNote: "9月1日に散布しました。",
    plots: input.plots.map((plot, index) => ({
      ...plot,
      name: `区${index + 1}`,
      description: "10株を調査",
    })),
    measurements: [
      { id: crypto.randomUUID(), kind: "text", name: "観察", unit: "", body: "差なし", graphs: [] },
    ],
    methodDetailsAck: true,
    guidelineAck: true,
  };
}

describe("実証詳細レポート", () => {
  it("下書きは空欄を保持し、公開時に不足を返す", () => {
    const input = createBlankUsageReport(materialId);
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
    expect(parseReportNumber("1,250±20 a")).toEqual({ value: 1250, error: 20 });
    expect(parseReportNumber("1,234,567")).toEqual({ value: 1234567, error: null });
  });
  it("ゼロの数値を有効とし、文章や添付資料の未確認を提出前に検出する", () => {
    const input = withSingleVariety(createBlankUsageReport(materialId), "", true);
    input.cropId = "22222222-2222-4222-8222-222222222222";
    input.prefectureCode = 8;
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
    expect(validateUsageReportSubmission(input).measurements).toBeUndefined();
    input.documents = [
      { id: crypto.randomUUID(), path: "owner/report/document.pdf", name: "成績書.pdf" },
    ];
    expect(validateUsageReportSubmission(input).documentsAck).toBeDefined();
  });
  it("ページ版：区の調査範囲は任意で、資料のグラフ・表の画像だけでも、秘密保持を確認すれば提出できる", () => {
    const input = withSingleVariety(createBlankUsageReport(materialId), "", true);
    input.cropId = "22222222-2222-4222-8222-222222222222";
    input.prefectureCode = 8;
    input.observedChange = "変化はありませんでした。";
    input.purposeTags = ["耐暑性改善"];
    input.cultivationEnvironment = "露地";
    input.timingStages = [3];
    input.timingNote = "9月1日に散布しました。";
    input.plots = input.plots.map((plot, index) => ({
      ...plot,
      name: `区${index + 1}`,
      description: "10株を調査",
    }));
    const measurement = {
      id: crypto.randomUUID(),
      kind: "image" as const,
      name: "収量",
      unit: "",
      body: "",
      graphs: [],
    };
    input.measurements = [measurement];
    input.methodDetailsAck = true;
    input.guidelineAck = true;
    expect(validateUsageReportSubmission(input)["measurements.0.values"]).toBeDefined();
    input.media = [
      {
        id: crypto.randomUUID(),
        url: "https://example.supabase.co/storage/v1/object/public/report-media/owner/graph.png",
        mediaType: "photo",
        section: "measurements",
        caption: "",
        measurementId: measurement.id,
      },
    ];
    expect(v.safeParse(UsageReportInputSchema, input).success).toBe(true);
    expect(Object.keys(validateUsageReportSubmission(input))).toEqual(["documentsAck"]);
    input.documentsAck = true;
    expect(validateUsageReportSubmission(input)).toEqual({});
    input.media = input.media.map((item) => ({ ...item, measurementId: null }));
    expect(validateUsageReportSubmission(input)["measurements.0.values"]).toBeDefined();
    input.measurements = [];
    expect(validateUsageReportSubmission(input).measurements).toBe(
      "※ 調査項目を1つ以上追加してください",
    );
  });
  it("都道府県と品種は提出時に必須で、品種は「不明」のチェックで不要になる", () => {
    const blank = createBlankUsageReport(materialId);
    const errors = validateUsageReportSubmission(blank);
    expect(errors.prefectureCode).toBe("※ 都道府県を選んでください");
    expect(errors["varieties.0.name"]).toBe("※ 品種を入力してください");
    expect(reportErrorStep("prefectureCode")).toBe(3);
    expect(reportErrorStep("varieties.0.name")).toBe(1);
    expect(validateUsageReportSubmission({ ...blank, prefectureCode: 8 }).prefectureCode).toBe(
      undefined,
    );
    expect(
      validateUsageReportSubmission(withSingleVariety(blank, "  ", false))["varieties.0.name"],
    ).toBeDefined();
    const named = withSingleVariety(blank, "アイコ", false);
    expect(named.varieties).toEqual([{ id: blank.varieties[0]?.id, name: "アイコ" }]);
    expect(validateUsageReportSubmission(named)["varieties.0.name"]).toBeUndefined();
    const unknown = withSingleVariety(named, "", true);
    expect(unknown.varieties).toEqual([]);
    expect(unknown.plots.map((plot) => plot.varietyId)).toEqual([null, null]);
    const unknownErrors = validateUsageReportSubmission(unknown);
    expect(Object.keys(unknownErrors).filter((key) => /variet/.test(key))).toEqual([]);
    expect(validateUsageReportSubmission({ ...named, varieties: [] }).varieties).toBe(
      "※ 品種を入力するか、「品種が不明、または品種がない」にチェックしてください",
    );
    expect(
      validateUsageReportSubmission({ ...unknown, varieties: named.varieties }).varieties,
    ).toBe("※ 「品種が不明、または品種がない」のときは品種を入れないでください");
  });
  it("1つの品種の入力欄で名前を変えても、他の品種と区の品種は残る", () => {
    const blank = createBlankUsageReport(materialId);
    const aiko = { id: crypto.randomUUID(), name: "アイコ" };
    const momotaro = { id: crypto.randomUUID(), name: "桃太郎" };
    const [first, second] = blank.plots;
    if (first === undefined || second === undefined) throw new Error("区が2つありません。");
    const input: UsageReportInput = {
      ...blank,
      varieties: [aiko, momotaro],
      plots: [
        { ...first, varietyId: aiko.id },
        { ...second, varietyId: momotaro.id },
        { ...second, id: crypto.randomUUID(), varietyId: null },
      ],
    };
    const renamed = withSingleVariety(input, "アイコ改", false);
    expect(renamed.varieties).toEqual([{ id: aiko.id, name: "アイコ改" }, momotaro]);
    expect(renamed.plots.map((plot) => plot.varietyId)).toEqual([aiko.id, momotaro.id, aiko.id]);
    expect(
      Object.keys(validateUsageReportSubmission(renamed)).filter((key) => /variet/.test(key)),
    ).toEqual([]);
  });
  it("品種が不明の状態から外すと、品種を1件作って全区に割り当てる", () => {
    const unknown = withSingleVariety(createBlankUsageReport(materialId), "", true);
    const known = withSingleVariety(unknown, "", false);
    const [variety] = known.varieties;
    expect(known.varietyUnknown).toBe(false);
    expect(known.varieties).toEqual([{ id: expect.any(String), name: "" }]);
    expect(known.plots.map((plot) => plot.varietyId)).toEqual([variety?.id, variety?.id]);
  });
  it("新しいレポートは品種1つと、無処理・投稿した資材の2区から始まる", () => {
    const input = createBlankUsageReport(materialId);
    const [variety] = input.varieties;
    expect(input.varieties).toEqual([{ id: expect.any(String), name: "" }]);
    expect(input.comparedMaterials).toEqual([]);
    expect(input.commonPlotDescription).toBe("");
    expect(input.plots.map((plot) => [plot.varietyId, plot.treatment])).toEqual([
      [variety?.id, { kind: "untreated" }],
      [variety?.id, { kind: "posted" }],
    ]);
    expect(v.safeParse(UsageReportInputSchema, input).success).toBe(true);
  });
  it("提出できるレポートは、区ごとに品種と使った資材を持つ", () => {
    const input = submittableReport();
    expect(validateUsageReportSubmission(input)).toEqual({});
    const [untreated, posted] = input.plots;
    if (!untreated || !posted) throw new Error("区の初期データがありません。");
    expect(
      validateUsageReportSubmission({
        ...input,
        plots: [{ ...untreated, treatment: null }, posted],
      }),
    ).toEqual({ "plots.0.treatment": "※ 区で使った資材を選んでください" });
    expect(
      validateUsageReportSubmission({
        ...input,
        plots: [untreated, { ...posted, varietyId: null }],
      }),
    ).toEqual({ "plots.1.variety": "※ 区の品種を選んでください" });
    expect(
      validateUsageReportSubmission({
        ...input,
        plots: [untreated, { ...posted, treatment: { kind: "untreated" } }],
      }),
    ).toEqual({ "plots.posted": "※ 投稿する資材を使った区を1つ以上入れてください" });
    const compared = { id: crypto.randomUUID(), name: " " };
    expect(
      validateUsageReportSubmission({
        ...input,
        comparedMaterials: [compared],
        plots: [
          { ...untreated, treatment: { kind: "compared", comparedMaterialId: compared.id } },
          posted,
        ],
      }),
    ).toEqual({ "comparedMaterials.0.name": "※ 比較した資材の名前を入力してください" });
    expect(reportErrorStep("comparedMaterials.0.name")).toBe(4);
    expect(reportErrorStep("plots.posted")).toBe(4);
  });
  it("区の説明は、区ごとか全区に共通の説明のどちらかがあればよい", () => {
    const input = submittableReport();
    const blankDescriptions = input.plots.map((plot) => ({ ...plot, description: " " }));
    expect(validateUsageReportSubmission({ ...input, plots: blankDescriptions })).toEqual({
      "plots.0.description": "※ ここを入力してください",
      "plots.1.description": "※ ここを入力してください",
    });
    expect(
      validateUsageReportSubmission({
        ...input,
        plots: blankDescriptions,
        commonPlotDescription: "各区10株、3反復",
      }),
    ).toEqual({});
  });
  it("区・品種・比較した資材は40まで", () => {
    const input = submittableReport();
    const [posted] = input.plots.slice(1);
    if (!posted) throw new Error("区の初期データがありません。");
    const plots = (count: number) =>
      Array.from({ length: count }, () => ({ ...posted, id: crypto.randomUUID() }));
    expect(v.safeParse(UsageReportInputSchema, { ...input, plots: plots(40) }).success).toBe(true);
    expect(v.safeParse(UsageReportInputSchema, { ...input, plots: plots(41) }).success).toBe(false);
    const names = (count: number) =>
      Array.from({ length: count }, () => ({ id: crypto.randomUUID(), name: "品種" }));
    expect(v.safeParse(UsageReportInputSchema, { ...input, varieties: names(41) }).success).toBe(
      false,
    );
    expect(
      v.safeParse(UsageReportInputSchema, { ...input, comparedMaterials: names(41) }).success,
    ).toBe(false);
  });
  it("比較した資材の区は、比較した資材を指す", () => {
    const input = submittableReport();
    const [untreated, posted] = input.plots;
    if (!untreated || !posted) throw new Error("区の初期データがありません。");
    const plots = [{ ...untreated, treatment: { kind: "compared" } }, posted];
    expect(v.safeParse(UsageReportInputSchema, { ...input, plots }).success).toBe(false);
  });
  it("品種の表示は、空でない品種名を順につなぐ", () => {
    expect(
      reportVarietyNames({
        varieties: [
          { id: crypto.randomUUID(), name: " 新藍 " },
          { id: crypto.randomUUID(), name: "" },
          { id: crypto.randomUUID(), name: "初恋" },
        ],
      }),
    ).toBe("新藍・初恋");
  });
  it("使用目的の補足は任意で、500字を超えると形式エラーにする", () => {
    const input = createBlankUsageReport(materialId);
    expect(input.purposeNote).toBe("");
    expect(validateUsageReportSubmission(input).purposeNote).toBeUndefined();
    input.purposeNote = "高温期の萎れを軽くしたかった";
    expect(v.safeParse(UsageReportInputSchema, input).success).toBe(true);
    input.purposeNote = "あ".repeat(501);
    expect(v.safeParse(UsageReportInputSchema, input).success).toBe(false);
  });
  it("同じ調査項目と単位のグラフを入力を変えずにまとめる", () => {
    const input = createBlankUsageReport(materialId);
    const first = input.measurements[0]!;
    const second = {
      ...first,
      id: crypto.randomUUID(),
      name: "収量 ",
      unit: "kg",
      graphs: [{ ...first.graphs[0]!, id: crypto.randomUUID() }],
    };
    first.name = "収量";
    first.unit = "kg";
    const differentUnit = { ...second, id: crypto.randomUUID(), unit: "g" };
    const groups = groupReportMeasurements([first, second, differentUnit]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.graphs).toHaveLength(2);
    expect(first.graphs).toHaveLength(1);
    first.graphs[0]!.rows[0]!.plotId = null;
    expect(validateUsageReportSubmission(input)["measurements.0.plots"]).toBeDefined();
  });
});
