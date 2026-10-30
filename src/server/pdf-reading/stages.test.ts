// @vitest-environment node
import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { ReportReadingOutputSchema } from "./apply";
import type { PdfExtractionError } from "./claude";
import {
  PlotGroupsSchema,
  readReportPdf,
  SingleFieldsSchema,
  SkeletonSchema,
  valueChunks,
  ValuesSchema,
  type ExtractPdf,
} from "./stages";

type Stage = "skeleton" | "single" | "values" | "plots";

const STAGES: ReadonlyArray<[v.GenericSchema, Stage]> = [
  [SkeletonSchema, "skeleton"],
  [SingleFieldsSchema, "single"],
  [ValuesSchema, "values"],
  [PlotGroupsSchema, "plots"],
];

function stageOf(schema: v.GenericSchema): Stage {
  const found = STAGES.find(([candidate]) => candidate === schema);

  if (found === undefined) throw new Error("想定外のスキーマ");

  return found[1];
}

const plot = (key: string, treatment: "posted" | "untreated") => ({
  key,
  name: `${key}区`,
  varietyKey: "v1",
  treatment,
  comparedMaterialKey: "",
});

const answers = {
  skeleton: {
    outcome: "read",
    varieties: [{ key: "v1", name: "新藍" }],
    comparedMaterials: [],
    plots: [plot("p1", "posted"), plot("p2", "posted"), plot("p3", "untreated")],
    measurements: [{ key: "k1", name: "球重", unit: "g" }],
    graphs: [
      { key: "g1", measurementKey: "k1", heading: "1回目" },
      { key: "g2", measurementKey: "k1", heading: "2回目" },
    ],
  },
  single: {
    crop: "キャベツ",
    prefecture: "新潟県",
    purposes: [],
    timingStages: [1],
    cultivationEnvironment: "露地",
    timingNote: "",
    commonPlotDescription: "",
    observedChange: "",
    evidence: [{ ref: "crop", quote: "キャベツ", page: 1 }],
  },
  values: {
    values: [{ graphKey: "g1", plotKey: "p1", value: "1126" }],
    bodies: [{ key: "k1", body: "異なる英字間に有意差あり" }],
    evidence: [{ ref: "g1", quote: "表3 球重", page: 4 }],
  },
  plots: {
    groups: [
      { plotKeys: ["p1", "p2"], description: "定植時に500倍で灌注", quote: "500倍", page: 2 },
      { plotKeys: ["p3"], description: "資材なし", quote: "無処理", page: 2 },
    ],
    evidence: [{ ref: "v1", quote: "品種：新藍", page: 1 }],
  },
};

type Behavior = "answer" | "hang" | PdfExtractionError;

type Answers = typeof answers;

/** 段ごとにふるまいを決めた偽の呼び出し。hang は外から打ち切られるまで返さない。 */
function fakeExtract(
  behaviors: ReadonlyMap<Stage, Behavior> = new Map(),
  overrides: Partial<Answers> = {},
) {
  const log: string[] = [];
  const calls: Array<{ stage: Stage; speed: string; aborted: () => boolean }> = [];

  const extract: ExtractPdf = async (request) => {
    const stage = stageOf(request.schema);

    const usage = {
      model: request.model.model,
      speed: request.model.speed,
      inputTokens: 1000,
      outputTokens: 100,
    };

    log.push(`start:${stage}`);
    calls.push({
      stage,
      speed: request.model.speed,
      aborted: () => request.signal?.aborted === true,
    });

    if (request.signal?.aborted === true) return { ok: false, error: "deadline", usage: null };
    const behavior = behaviors.get(stage) ?? "answer";

    if (behavior === "hang") {
      await new Promise((resolve) => request.signal?.addEventListener("abort", resolve));
      log.push(`end:${stage}`);

      return { ok: false, error: "deadline", usage: null };
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
    log.push(`end:${stage}`);

    if (behavior !== "answer") return { ok: false, error: behavior, usage };
    // extractFromPdf と同じく、スキーマに合わない出力は invalid_output にする
    const parsed = v.safeParse(request.schema, overrides[stage] ?? answers[stage]);

    if (!parsed.success) return { ok: false, error: "invalid_output", usage };

    return { ok: true, output: parsed.output, usage };
  };

  return { extract, log, calls };
}

const request = {
  pdf: new TextEncoder().encode("%PDF-1.4"),
  material: { name: "高活性腐植資材", manufacturerName: "メーカー", aliases: [] },
  trial: "キャベツの全品種の全区",
  catalog: { crops: [{ id: "c1", name: "キャベツ", aliases: [] }], effectNames: ["収量の増加"] },
  deadline: Number.MAX_SAFE_INTEGER,
  pages: 4,
};

describe("readReportPdf", () => {
  it("骨組みと単独の欄を同時に呼び、骨組みの後に値と区の説明を同時に呼ぶ", async () => {
    const { extract, log, calls } = fakeExtract();
    const result = await readReportPdf(extract, request);
    expect(result.ok).toBe(true);
    const at = (event: string) => log.indexOf(event);
    expect(at("start:single")).toBeLessThan(at("end:skeleton"));
    expect(at("start:skeleton")).toBeLessThan(at("end:single"));

    const copyStarts = log.flatMap((event, index) =>
      event === "start:values" || event === "start:plots" ? [index] : [],
    );

    const copyEnds = log.flatMap((event, index) =>
      event === "end:values" || event === "end:plots" ? [index] : [],
    );

    expect(Math.min(...copyStarts)).toBeGreaterThan(at("end:skeleton"));
    expect(Math.max(...copyStarts)).toBeLessThan(Math.min(...copyEnds));

    expect(calls.filter(({ speed }) => speed === "fast").map(({ stage }) => stage)).toEqual([
      "skeleton",
    ]);
  });

  it("区の説明の組を、組の全区に配る", async () => {
    const { extract } = fakeExtract();
    const result = await readReportPdf(extract, request);

    if (!result.ok) throw new Error(result.error);
    expect(result.output.plots.map(({ key, description }) => [key, description])).toEqual([
      ["p1", "定植時に500倍で灌注"],
      ["p2", "定植時に500倍で灌注"],
      ["p3", "資材なし"],
    ]);
    expect(result.output.evidence).toContainEqual({ ref: "p2", quote: "500倍", page: 2 });
  });

  it("まとめた結果は読み取りの出力の形を満たし、トークン数は全部の呼び出しの合計になる", async () => {
    const { extract, calls } = fakeExtract();
    const result = await readReportPdf(extract, request);

    if (!result.ok) throw new Error(result.error);
    expect(v.is(ReportReadingOutputSchema, result.output)).toBe(true);
    expect(result.output.measurements[0]?.body).toBe("異なる英字間に有意差あり");
    expect(result.output.crop).toBe("キャベツ");
    expect(result.usage).toEqual({
      model: "claude-opus-5-5",
      speed: "fast",
      inputTokens: 1000 * calls.length,
      outputTokens: 100 * calls.length,
    });
  });

  it.each([
    ["values", "server_error"],
    ["plots", "deadline"],
    ["single", "invalid_output"],
    ["skeleton", "refusal"],
  ] as const)(
    "%s の失敗（%s）で全体を失敗にし、待っているほかの呼び出しを打ち切る",
    async (stage, error) => {
      const copying = stage === "values" || stage === "plots";

      const behaviors = new Map<Stage, Behavior>([
        ["skeleton", copying ? "answer" : "hang"],
        ["single", "hang"],
        ["values", "hang"],
        ["plots", "hang"],
        [stage, error],
      ]);

      const { extract, calls } = fakeExtract(behaviors);
      const result = await readReportPdf(extract, request);
      expect(result.ok ? null : result.error).toBe(error);
      const waiting = calls.filter((call) => behaviors.get(call.stage) === "hang");
      expect(waiting.length).toBeGreaterThan(0);
      expect(waiting.every(({ aborted }) => aborted())).toBe(true);
    },
  );

  it("根拠がその段で書けない key を指していれば、出力の不正として失敗にする", async () => {
    const evidence = (ref: string) => [{ ref, quote: "引用", page: 1 }];

    const cases = [
      { single: { ...answers.single, evidence: evidence("g1") } },
      { plots: { ...answers.plots, evidence: evidence("g1") } },
      { values: { ...answers.values, evidence: evidence("p1") } },
      {
        plots: {
          groups: [{ plotKeys: ["p9"], description: "", quote: "", page: 1 }],
          evidence: [],
        },
      },
    ];

    for (const overrides of cases) {
      const result = await readReportPdf(fakeExtract(new Map(), overrides).extract, request);
      expect(result.ok ? null : result.error).toBe("invalid_output");
    }
  });

  it.each([
    [
      "値",
      { values: [{ graphKey: "g1", plotKey: "p1", value: "1126" }], bodies: [], evidence: [] },
    ],
    ["補足", { values: [], bodies: [{ key: "k1", body: "有意差あり" }], evidence: [] }],
    ["根拠", { values: [], bodies: [], evidence: [{ ref: "g1", quote: "表3", page: 4 }] }],
  ])("%sは、その呼び出しに渡したグラフと調査項目にだけ入れられる", async (_, values) => {
    // グラフ2つ×区30の60件なので、値はグラフ1つずつの2本に分かれ、2本目には g2（k2）だけを渡す
    const plots = Array.from({ length: 30 }, (_, index) =>
      plot(`p${index + 1}`, index === 0 ? "posted" : "untreated"),
    );

    const groups = [{ plotKeys: plots.map(({ key }) => key), description: "", quote: "", page: 1 }];

    const overrides = {
      skeleton: {
        ...answers.skeleton,
        plots,
        measurements: [
          { key: "k1", name: "球重", unit: "g" },
          { key: "k2", name: "葉色", unit: "" },
        ],
        graphs: [
          { key: "g1", measurementKey: "k1", heading: "" },
          { key: "g2", measurementKey: "k2", heading: "" },
        ],
      },
      plots: { groups, evidence: [] },
      values,
    };

    const { extract, calls } = fakeExtract(new Map(), overrides);
    const result = await readReportPdf(extract, request);
    expect(calls.filter(({ stage }) => stage === "values")).toHaveLength(2);
    expect(result.ok ? null : result.error).toBe("invalid_output");
  });

  it("根拠のページは、0（記載なし）か PDF のページ数までの整数だけを通す", async () => {
    const cite = (page: number) => ({
      single: { ...answers.single, evidence: [{ ref: "crop", quote: "キャベツ", page }] },
    });

    for (const page of [0, 1, 4]) {
      const result = await readReportPdf(fakeExtract(new Map(), cite(page)).extract, request);
      expect(result.ok, `${page}ページ`).toBe(true);
    }

    for (const page of [5, 999, 1.8, -1]) {
      const result = await readReportPdf(fakeExtract(new Map(), cite(page)).extract, request);
      expect(result.ok ? null : result.error, `${page}ページ`).toBe("invalid_output");
    }
  });

  it("骨組みが該当なしなら、値と区の説明を呼ばずに該当なしを返す", async () => {
    const { extract, calls } = fakeExtract(new Map([["single", "hang"]]), {
      skeleton: { ...answers.skeleton, outcome: "no_matching_trial" },
    });

    const result = await readReportPdf(extract, request);
    expect(result.ok && result.output.outcome).toBe("no_matching_trial");
    expect(calls.map(({ stage }) => stage).toSorted()).toEqual(["single", "skeleton"]);
  });
});

describe("valueChunks", () => {
  const graphs = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      key: `g${index + 1}`,
      measurementKey: "k1",
      heading: "",
    }));

  const plots = (count: number) =>
    Array.from({ length: count }, (_, index) => plot(`p${index + 1}`, "untreated"));

  it.each([
    [7, 20, 3],
    [40, 30, 8],
    [3, 100, 3],
  ])("グラフ %i × 区 %i は %i 本に、グラフを切らずに分ける", (graphCount, plotCount, calls) => {
    const all = graphs(graphCount);
    const chunks = valueChunks({ graphs: all, plots: plots(plotCount) });
    expect(chunks).toHaveLength(calls);
    expect(chunks.flat()).toEqual(all);
    const sizes = chunks.map((chunk) => chunk.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("グラフが無ければ呼ばない", () => {
    expect(valueChunks({ graphs: [], plots: plots(4) })).toEqual([]);
  });
});
