import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  createBlankUsageReport,
  parseReportNumber,
  reportMeasurementGroups,
  reportVarietyNames,
  UsageReportInputSchema,
  validateUsageReportSubmission,
  withSingleVariety,
  type UsageReportInput,
} from "./usage-report";

const materialId = "11111111-1111-4111-8111-111111111111";
const noPdfReading = { pdfValuesCheckRequired: false };

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
    const errors = validateUsageReportSubmission(input, noPdfReading);
    expect(errors.cropId).toBeDefined();
    expect(errors["measurements.0.values"]).toBeDefined();
    expect(errors.guidelineAck).toBeDefined();
    expect(input.plots.map(({ varietyId, treatment }) => [varietyId, treatment])).toEqual([
      [input.varieties[0]?.id, { kind: "untreated" }],
      [input.varieties[0]?.id, { kind: "posted" }],
    ]);
  });
  it("負値・ゼロ・誤差・検定記号を原文を変更せず読む", () => {
    expect(parseReportNumber("41.7±0.8 a")).toEqual({ value: 41.7, error: 0.8 });
    expect(parseReportNumber("-2.5±0.2 n.s.")).toEqual({ value: -2.5, error: 0.2 });
    expect(parseReportNumber("0 ＊")).toEqual({ value: 0, error: null });
    expect(parseReportNumber("未測定")).toBeNull();
    expect(parseReportNumber("1,250±20 a")).toEqual({ value: 1250, error: 20 });
    expect(parseReportNumber("1,234,567")).toEqual({ value: 1234567, error: null });
  });

  it("品種が不明の状態から外すと、品種を1件作って全区に割り当てる", () => {
    const unknown = withSingleVariety(createBlankUsageReport(materialId), "", true);
    const known = withSingleVariety(unknown, "", false);
    const [variety] = known.varieties;
    expect(known.varietyUnknown).toBe(false);
    expect(known.varieties).toEqual([{ id: expect.any(String), name: "" }]);
    expect(known.plots.map((plot) => plot.varietyId)).toEqual([variety?.id, variety?.id]);
  });

  it.each([
    ["入力済み", (input: UsageReportInput) => input, []],
    [
      "資材未選択",
      (input: UsageReportInput) => ({
        ...input,
        plots: input.plots.map((plot, index) =>
          index === 0 ? { ...plot, treatment: null } : plot,
        ),
      }),
      ["plots.0.treatment"],
    ],
    [
      "区の品種未選択",
      (input: UsageReportInput) => ({
        ...input,
        plots: input.plots.map((plot, index) =>
          index === 1 ? { ...plot, varietyId: null } : plot,
        ),
      }),
      ["plots.1.variety"],
    ],
    [
      "投稿資材の区なし",
      (input: UsageReportInput) => ({
        ...input,
        plots: input.plots.map((plot) => ({ ...plot, treatment: { kind: "untreated" as const } })),
      }),
      ["plots.posted"],
    ],
    [
      "比較資材の名前なし",
      (input: UsageReportInput) => {
        const compared = { id: crypto.randomUUID(), name: " " };

        return {
          ...input,
          comparedMaterials: [compared],
          plots: input.plots.map((plot, index) =>
            index === 0
              ? {
                  ...plot,
                  treatment: { kind: "compared" as const, comparedMaterialId: compared.id },
                }
              : plot,
          ),
        };
      },
      ["comparedMaterials.0.name"],
    ],
    [
      "未使用の品種",
      (input: UsageReportInput) => ({
        ...input,
        varieties: [...input.varieties, { id: crypto.randomUUID(), name: "新藍" }],
      }),
      ["varieties.1.plots"],
    ],
    [
      "都道府県なし",
      (input: UsageReportInput) => ({ ...input, prefectureCode: null }),
      ["prefectureCode"],
    ],
    [
      "空の品種名",
      (input: UsageReportInput) => ({
        ...input,
        varieties: input.varieties.map((variety) => ({ ...variety, name: " " })),
      }),
      ["varieties.0.name"],
    ],
    ["品種なし", (input: UsageReportInput) => ({ ...input, varieties: [] }), ["varieties"]],
    ["品種不明", (input: UsageReportInput) => withSingleVariety(input, "", true), []],
    [
      "品種不明なのに品種あり",
      (input: UsageReportInput) => ({ ...input, varietyUnknown: true }),
      ["varieties", "plots.0.variety", "plots.1.variety"],
    ],
    [
      "区の説明なし",
      (input: UsageReportInput) => ({
        ...input,
        plots: input.plots.map((plot) => ({ ...plot, description: " " })),
      }),
      ["plots.0.description", "plots.1.description"],
    ],
    [
      "全区に共通の説明",
      (input: UsageReportInput) => ({
        ...input,
        commonPlotDescription: "各区10株、3反復",
        plots: input.plots.map((plot) => ({ ...plot, description: " " })),
      }),
      [],
    ],
    [
      "空の文章",
      (input: UsageReportInput) => ({
        ...input,
        measurements: input.measurements.map((item) => ({ ...item, body: "" })),
      }),
      ["measurements.0.values"],
    ],
    [
      "資料未確認",
      (input: UsageReportInput) => ({
        ...input,
        documents: [
          { id: crypto.randomUUID(), path: "owner/report/document.pdf", name: "成績書.pdf" },
        ],
      }),
      ["documentsAck"],
    ],
    [
      "調査項目なし",
      (input: UsageReportInput) => ({ ...input, measurements: [] }),
      ["measurements"],
    ],
  ])("提出条件：%s", (_name, edit, expected) => {
    expect(
      Object.keys(validateUsageReportSubmission(edit(submittableReport()), noPdfReading)).sort(),
    ).toEqual([...expected].sort());
  });

  it("ゼロの測定値を受け付け、画像のない項目と未確認の資料を拒否する", () => {
    const input = submittableReport();
    input.measurements = createBlankUsageReport(materialId).measurements.map((measurement) => ({
      ...measurement,
      name: "収量",
      graphs: measurement.graphs.map((graph) => ({
        ...graph,
        rows: graph.rows.map((row, index) => ({
          ...row,
          plotId: input.plots[index]?.id ?? null,
          value: "0",
        })),
      })),
    }));
    expect(validateUsageReportSubmission(input, noPdfReading)).toEqual({});

    const measurement = {
      id: crypto.randomUUID(),
      kind: "image" as const,
      name: "収量",
      unit: "",
      body: "",
      graphs: [],
    };

    input.measurements = [measurement];
    expect(validateUsageReportSubmission(input, noPdfReading)).toHaveProperty(
      "measurements.0.values",
    );
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
    expect(Object.keys(validateUsageReportSubmission(input, noPdfReading))).toEqual([
      "documentsAck",
    ]);
    input.documentsAck = true;
    expect(validateUsageReportSubmission(input, noPdfReading)).toEqual({});
    input.media = input.media.map((item) => ({ ...item, measurementId: null }));
    expect(validateUsageReportSubmission(input, noPdfReading)).toHaveProperty(
      "measurements.0.values",
    );
  });

  it.each([false, true])("PDF由来の値の確認要否：%s", (pdfValuesCheckRequired) => {
    const input = submittableReport();
    const options = { pdfValuesCheckRequired };
    expect(Boolean(validateUsageReportSubmission(input, options).pdfValuesChecked)).toBe(
      pdfValuesCheckRequired,
    );
    expect(validateUsageReportSubmission({ ...input, pdfValuesChecked: true }, options)).toEqual(
      {},
    );
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
    expect(validateUsageReportSubmission(input, noPdfReading).purposeNote).toBeUndefined();
    input.purposeNote = "高温期の萎れを軽くしたかった";
    expect(v.safeParse(UsageReportInputSchema, input).success).toBe(true);
    input.purposeNote = "あ".repeat(501);
    expect(v.safeParse(UsageReportInputSchema, input).success).toBe(false);
  });
  it("同じ調査項目と単位の数値の項目を、最初の項目の位置に入力を変えずにまとめる", () => {
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
    const text = { ...first, id: crypto.randomUUID(), kind: "text" as const, graphs: [] };
    const groups = reportMeasurementGroups([first, text, second, differentUnit]);
    expect(groups.map((group) => group.map(({ id }) => id))).toEqual([
      [first.id, second.id],
      [text.id],
      [differentUnit.id],
    ]);
    expect(first.graphs).toHaveLength(1);
    first.graphs[0]!.rows[0]!.plotId = null;
    expect(
      validateUsageReportSubmission(input, noPdfReading)["measurements.0.plots"],
    ).toBeDefined();
  });
});
