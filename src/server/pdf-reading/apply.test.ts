import { describe, expect, it } from "vitest";

import { effectivePdfReadingMarks, pdfReadingFieldValue } from "@/lib/pdf-reading";
import { createBlankUsageReport, type UsageReportInput } from "@/lib/usage-report";

import { applyPdfReading, type ReadingCatalog, type ReportReadingOutput } from "./apply";

const materialId = "7d2e4e77-8e4a-4e65-9f2a-5c3b8b2e9c33";
const cropId = "3c5e1a2b-4d6f-4a8b-9c0d-1e2f3a4b5c6d";
const otherCropId = "4d6f2b3c-5e7a-4b9c-8d1e-2f3a4b5c6d7e";

const catalog: ReadingCatalog = {
  crops: [
    { id: cropId, name: "キャベツ", aliases: ["チリメンキャベツ"] },
    { id: otherCropId, name: "トルコギキョウ", aliases: [] },
  ],
  effectNames: ["収量改善", "耐暑性改善"],
  postedName: "ヒートインパクト",
};

function ids() {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String((n += 1)).padStart(12, "0")}`;
}

type Plot = ReportReadingOutput["plots"][number];

function plot(key: string, treatment: Plot["treatment"], patch: Partial<Plot> = {}): Plot {
  return {
    key,
    name: "",
    description: "",
    varietyKey: "v1",
    treatment,
    comparedMaterialKey: "",
    ...patch,
  };
}

function reading(overrides: Partial<ReportReadingOutput> = {}): ReportReadingOutput {
  return {
    outcome: "read",
    crop: "キャベツ",
    prefecture: "埼玉県",
    purposes: ["耐暑性改善"],
    timingStages: [1],
    cultivationEnvironment: "露地",
    timingNote: "7月25日定植",
    commonPlotDescription: "",
    observedChange: "処理区で結球重が重かった。",
    varieties: [{ key: "v1", name: "新藍" }],
    comparedMaterials: [],
    plots: [
      plot("p1", "posted", { name: "ヒートインパクト区", description: "500倍を定植時に灌注" }),
      plot("p2", "untreated", { name: "無処理区" }),
    ],
    measurements: [{ key: "k1", name: "結球重", unit: "g", body: "" }],
    graphs: [{ key: "g1", measurementKey: "k1", heading: "" }],
    values: [
      { graphKey: "g1", plotKey: "p1", value: "1126±139 B" },
      { graphKey: "g1", plotKey: "p2", value: "980±120 A" },
    ],
    evidence: [
      { ref: "timingNote", quote: "定植：7月25日", page: 1 },
      { ref: "p1", quote: "ヒートインパクト500倍", page: 2 },
      { ref: "g1", quote: "表2 可販重量", page: 3 },
    ],
    ...overrides,
  };
}

function base(patch: Partial<UsageReportInput> = {}): UsageReportInput {
  return { ...createBlankUsageReport(materialId), pdfValuesChecked: true, ...patch };
}

function applied(input: UsageReportInput, output: ReportReadingOutput = reading()) {
  const result = applyPdfReading(input, output, catalog, ids());
  if (!result.ok) throw new Error(`写せなかった：${result.error}`);
  return result;
}

describe("applyPdfReading", () => {
  it("空の単独の欄だけに入れ、入力済みの欄はそのまま残す", () => {
    const { input, fields } = applied(
      base({ cropId: otherCropId, observedChange: "自分で書いた感想", purposeTags: [] }),
    );
    expect(input.cropId).toBe(otherCropId);
    expect(input.observedChange).toBe("自分で書いた感想");
    expect(input.timingNote).toBe("7月25日定植");
    expect(input.purposeTags).toEqual(["耐暑性改善"]);
    expect(input.prefectureCode).toBe(11);
    expect(input.timingStages).toEqual([1]);
    const keys = fields.map(({ fieldKey }) => fieldKey);
    expect(keys).not.toContain("cropId");
    expect(keys).not.toContain("observedChange");
    expect(fields).toContainEqual({
      fieldKey: "timingNote",
      quote: "「定植：7月25日」（1ページ）",
    });
  });

  it("作物・都道府県・使用目的は候補と完全に一致したときだけ入れる", () => {
    const { input, fields } = applied(
      base({ prefectureCode: 13 }),
      reading({ crop: "チリメンキャベツ", prefecture: "埼玉", purposes: ["収量の改善"] }),
    );
    expect(input.cropId).toBe(cropId);
    expect(input.prefectureCode).toBe(13);
    expect(input.purposeTags).toEqual([]);
    expect(fields.map(({ fieldKey }) => fieldKey)).not.toContain("prefectureCode");
  });

  it("都道府県は、登録住所から入った値や選んだ値があっても PDF の試験地で置き換える", () => {
    const { input, fields } = applied(base({ prefectureCode: 13 }));
    expect(input.prefectureCode).toBe(11);
    expect(fields.map(({ fieldKey }) => fieldKey)).toContain("prefectureCode");
  });

  it("都道府県が変わるときだけ、前の市区町村を外す", () => {
    const moved = applied(base({ prefectureCode: 13, city: "八王子市", showCity: true })).input;
    expect(moved).toMatchObject({ prefectureCode: 11, city: "", showCity: false });
    const same = applied(base({ prefectureCode: 11, city: "熊谷市", showCity: true })).input;
    expect(same).toMatchObject({ prefectureCode: 11, city: "熊谷市", showCity: true });
    const unread = applied(
      base({ prefectureCode: 13, city: "八王子市", showCity: true }),
      reading({ prefecture: "" }),
    ).input;
    expect(unread).toMatchObject({ prefectureCode: 13, city: "八王子市", showCity: true });
  });

  it("品種・比較した資材・区を読み取った内容で置き換える", () => {
    const output = reading({
      varieties: [
        { key: "v1", name: "新藍" },
        { key: "v2", name: "初恋" },
      ],
      comparedMaterials: [{ key: "m1", name: "資材X" }],
      plots: [
        plot("p1", "posted"),
        plot("p2", "untreated"),
        plot("p3", "posted", { varietyKey: "v2" }),
        plot("p4", "untreated", { varietyKey: "v2" }),
        plot("p5", "compared", { name: "資材X区", comparedMaterialKey: "m1" }),
      ],
      measurements: [],
      graphs: [],
      values: [],
    });
    const { input } = applied(base(), output);
    expect(input.varieties.map(({ name }) => name)).toEqual(["新藍", "初恋"]);
    expect(input.varietyUnknown).toBe(false);
    expect(input.plots).toHaveLength(5);
    const [first, , , , compared] = input.plots;
    expect(first?.varietyId).toBe(input.varieties[0]?.id);
    expect(first?.name).toBe("新藍・ヒートインパクト");
    expect(compared?.treatment).toEqual({
      kind: "compared",
      comparedMaterialId: input.comparedMaterials[0]?.id,
    });
    expect(compared?.name).toBe("資材X区");
  });

  it("品種が無い PDF は品種を不明にし、区の品種を外す", () => {
    const output = reading({ varieties: [] });
    const plots = output.plots.map((item) => ({ ...item, varietyKey: "" }));
    const { input } = applied(base(), { ...output, plots });
    expect(input.varietyUnknown).toBe(true);
    expect(input.plots.every((item) => item.varietyId === null)).toBe(true);
  });

  it("数値の調査項目と空の項目は置き換え、画像と文章の調査項目と写真は残す", () => {
    const blank = base();
    const textItem = {
      id: crypto.randomUUID(),
      kind: "text" as const,
      name: "観察",
      unit: "",
      body: "葉色が濃い",
      graphs: [],
    };
    const imageItem = {
      ...textItem,
      id: crypto.randomUUID(),
      kind: "image" as const,
      name: "写真",
    };
    const photo = {
      id: crypto.randomUUID(),
      url: "https://example.supabase.co/storage/v1/object/public/report-media/u/r/p.jpg",
      mediaType: "photo" as const,
      section: "measurements" as const,
      caption: "",
      measurementId: imageItem.id,
    };
    const { input } = applied({
      ...blank,
      measurements: [
        ...blank.measurements,
        { ...textItem, id: crypto.randomUUID(), name: "", body: "" },
        textItem,
        imageItem,
      ],
      media: [photo],
    });
    expect(input.measurements.map(({ kind, name }) => [kind, name])).toEqual([
      ["text", "観察"],
      ["image", "写真"],
      ["numeric", "結球重"],
    ]);
    expect(input.media).toEqual([photo]);
  });

  it("グラフの行は全区に1行ずつ区の順に作り、PDF に値が無い区は空にする", () => {
    const { input, fields } = applied(
      base(),
      reading({
        plots: [...reading().plots, plot("p3", "untreated", { name: "対照区" })],
        graphs: [{ key: "g1", measurementKey: "k1", heading: "収穫時" }],
        values: [{ graphKey: "g1", plotKey: "p3", value: "33.6a" }],
      }),
    );
    const graph = input.measurements.at(-1)?.graphs[0];
    expect(graph?.heading).toBe("収穫時");
    expect(graph?.rows.map(({ plotId }) => plotId)).toEqual(input.plots.map(({ id }) => id));
    expect(graph?.rows.map(({ value }) => value)).toEqual(["", "", "33.6a"]);
    expect(fields.filter(({ fieldKey }) => fieldKey.endsWith(".value"))).toHaveLength(1);
  });

  it("投稿した資材の試験が見つからなければ該当なしにする", () => {
    const untreated = reading().plots.map((item) => ({ ...item, treatment: "untreated" as const }));
    for (const bad of [
      reading({ outcome: "no_matching_trial" }),
      reading({ plots: reading().plots.slice(0, 1) }),
      reading({ plots: untreated }),
    ]) {
      expect(applyPdfReading(base(), bad, catalog, ids())).toEqual({
        ok: false,
        error: "pdf_reading_no_match",
      });
    }
  });

  it("区・品種・比較した資材・調査項目・グラフの鍵が見つからなければ失敗にする", () => {
    const [posted, untreated] = reading().plots;
    if (posted === undefined || untreated === undefined) throw new Error("区が足りない");
    for (const bad of [
      reading({ plots: [{ ...posted, varietyKey: "v9" }, untreated] }),
      reading({
        plots: [posted, { ...untreated, treatment: "compared", comparedMaterialKey: "m9" }],
      }),
      reading({ values: [{ graphKey: "g1", plotKey: "p9", value: "1" }] }),
      reading({ values: [{ graphKey: "g9", plotKey: "p1", value: "1" }] }),
      reading({ graphs: [{ key: "g1", measurementKey: "k9", heading: "" }] }),
    ]) {
      expect(applyPdfReading(base(), bad, catalog, ids())).toEqual({
        ok: false,
        error: "pdf_reading_failed",
      });
    }
  });

  it("品種・比較した資材・区・調査項目・グラフの鍵が重なっていれば失敗にする", () => {
    const [posted, untreated] = reading().plots;
    if (posted === undefined || untreated === undefined) throw new Error("区が足りない");
    for (const bad of [
      reading({ plots: [posted, { ...untreated, key: "p1" }] }),
      reading({
        varieties: [
          { key: "v1", name: "新藍" },
          { key: "v1", name: "彩峰" },
        ],
      }),
      reading({
        comparedMaterials: [
          { key: "m1", name: "資材B" },
          { key: "m1", name: "資材C" },
        ],
      }),
      reading({
        measurements: [
          { key: "k1", name: "結球重", unit: "g", body: "" },
          { key: "k1", name: "球径", unit: "cm", body: "" },
        ],
      }),
      reading({
        graphs: [
          { key: "g1", measurementKey: "k1", heading: "1回目" },
          { key: "g1", measurementKey: "k1", heading: "2回目" },
        ],
      }),
      reading({ plots: [posted, { ...untreated, key: "v1" }] }),
    ]) {
      expect(applyPdfReading(base(), bad, catalog, ids())).toEqual({
        ok: false,
        error: "pdf_reading_failed",
      });
    }
  });

  it("写すたびに PDF と照らし合わせた確認を外す", () => {
    expect(applied(base({ pdfValuesChecked: true })).input.pdfValuesChecked).toBe(false);
  });

  it("記録した値は今の値と一致し、値を直した欄の印だけが外れる", () => {
    const { input, fields } = applied(base());
    const marks = fields.map(({ fieldKey, quote }) => ({
      fieldKey,
      quote,
      value: pdfReadingFieldValue(input, fieldKey) ?? "",
    }));
    expect(
      fields.every(({ fieldKey }) => pdfReadingFieldValue(input, fieldKey) !== undefined),
    ).toBe(true);
    expect(effectivePdfReadingMarks(marks, input)).toEqual(marks);
    const [first] = input.plots;
    const nameKey = `plots.${first?.id}.name`;
    const edited = {
      ...input,
      plots: input.plots.map((item) =>
        item.id === first?.id ? { ...item, name: "直した名前" } : item,
      ),
    };
    expect(effectivePdfReadingMarks(marks, edited).map(({ fieldKey }) => fieldKey)).toEqual(
      marks.map(({ fieldKey }) => fieldKey).filter((fieldKey) => fieldKey !== nameKey),
    );
    expect(marks.find(({ fieldKey }) => fieldKey === nameKey)?.quote).toBe(
      "「ヒートインパクト500倍」（2ページ）",
    );
    const row = input.measurements.at(-1)?.graphs[0]?.rows[0];
    expect(marks.find(({ fieldKey }) => fieldKey.endsWith(`${row?.id}.value`))?.quote).toBe(
      "「表2 可販重量」（3ページ）",
    );
  });
});
