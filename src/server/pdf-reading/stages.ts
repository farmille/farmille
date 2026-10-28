import * as v from "valibot";

import {
  NO_PAGE,
  ReportReadingOutputSchema,
  type ReadingCatalog,
  type ReportReadingOutput,
} from "./apply";
import type {
  ExtractionModel,
  PdfExtraction,
  PdfExtractionError,
  PdfExtractionRequest,
  PdfExtractionUsage,
} from "./claude";
import {
  plotInstructions,
  REPORT_READING_SYSTEM,
  singleFieldsInstructions,
  skeletonInstructions,
  valueInstructions,
  type ReadingMaterial,
} from "./prompt";

const OPUS = "claude-opus-5-5";
const SONNET = "claude-sonnet-5-5";
const MAX_TOKENS = 32000;

/**
 * 段ごとのモデル。骨組みだけを Opus の fast で決め、量の多い書き写しは Sonnet に分けて同時に呼ぶ。
 * 書き写しの段は thinking を送らない（Sonnet 5.5 の既定の adaptive で、effort low のまま動く）。
 */
export const STAGE_MODELS = {
  skeleton: {
    model: OPUS,
    speed: "fast",
    effort: "low",
    adaptiveThinking: true,
    maxTokens: MAX_TOKENS,
  },
  singleFields: {
    model: SONNET,
    speed: "standard",
    effort: "low",
    adaptiveThinking: true,
    maxTokens: MAX_TOKENS,
  },
  copy: {
    model: SONNET,
    speed: "standard",
    effort: "low",
    adaptiveThinking: false,
    maxTokens: MAX_TOKENS,
  },
} as const satisfies Record<string, ExtractionModel>;

/** 値を書き写す呼び出し1本あたりの値（グラフ×区）の目安と、本数の上限。 */
const VALUES_PER_CALL = 50;
const MAX_VALUE_CALLS = 8;

const key = v.string();
const cited = { quote: v.string(), page: v.number() };
const evidence = v.array(v.strictObject({ ref: v.string(), ...cited }));
/** 単独の欄の根拠が指せる欄。ほかの ref はほかの段の根拠より先にまとめられ、別の欄の引用になるので断る。 */
const SINGLE_FIELD_REFS = [
  "crop",
  "prefecture",
  "purposes",
  "timingStages",
  "cultivationEnvironment",
  "timingNote",
  "commonPlotDescription",
  "observedChange",
] as const;

export const SkeletonSchema = v.strictObject({
  outcome: v.picklist(["read", "no_matching_trial"]),
  varieties: v.array(v.strictObject({ key, name: v.string() })),
  comparedMaterials: v.array(v.strictObject({ key, name: v.string() })),
  plots: v.array(
    v.strictObject({
      key,
      name: v.string(),
      varietyKey: v.string(),
      treatment: v.picklist(["posted", "compared", "untreated"]),
      comparedMaterialKey: v.string(),
    }),
  ),
  measurements: v.array(v.strictObject({ key, name: v.string(), unit: v.string() })),
  graphs: v.array(v.strictObject({ key, measurementKey: v.string(), heading: v.string() })),
});
export type Skeleton = v.InferOutput<typeof SkeletonSchema>;

export const SingleFieldsSchema = v.strictObject({
  crop: v.string(),
  prefecture: v.string(),
  purposes: v.array(v.string()),
  timingStages: v.array(v.picklist([0, 1, 2, 3, 4, 5, 6, 7])),
  cultivationEnvironment: v.string(),
  timingNote: v.string(),
  commonPlotDescription: v.string(),
  observedChange: v.string(),
  evidence: v.array(v.strictObject({ ref: v.picklist(SINGLE_FIELD_REFS), ...cited })),
});

export const ValuesSchema = v.strictObject({
  values: v.array(v.strictObject({ graphKey: v.string(), plotKey: v.string(), value: v.string() })),
  bodies: v.array(v.strictObject({ key, body: v.string() })),
  evidence,
});

export const PlotGroupsSchema = v.strictObject({
  groups: v.array(
    v.strictObject({
      plotKeys: v.array(v.string()),
      description: v.string(),
      quote: v.string(),
      page: v.number(),
    }),
  ),
  evidence,
});

/** 1回の呼び出し。claude.ts の extractFromPdf を、クライアントを決めて渡す（テストでは偽物）。 */
export type ExtractPdf = <TSchema extends v.GenericSchema>(
  request: PdfExtractionRequest<TSchema>,
) => Promise<PdfExtraction<v.InferOutput<TSchema>>>;

export type ReportReadingRequest = {
  pdf: Uint8Array;
  material: ReadingMaterial;
  trial: string;
  catalog: Pick<ReadingCatalog, "crops" | "effectNames">;
  deadline: number;
  pages: number;
};

/** グラフ×区の値の数から、値を書き写す呼び出しの本数を決め、グラフを途中で切らずにほぼ同じ数ずつ分ける。 */
export function valueChunks(skeleton: Pick<Skeleton, "graphs" | "plots">): Skeleton["graphs"][] {
  const { graphs, plots } = skeleton;
  if (graphs.length === 0) return [];
  const wanted = Math.ceil((graphs.length * plots.length) / VALUES_PER_CALL);
  const calls = Math.max(1, Math.min(MAX_VALUE_CALLS, graphs.length, wanted));
  const edge = (index: number) => Math.floor((index * graphs.length) / calls);
  return Array.from({ length: calls }, (_, index) => graphs.slice(edge(index), edge(index + 1)));
}

type Merged = { ok: true; output: ReportReadingOutput } | { ok: false };

/** 値の呼び出し1本の出力と、その呼び出しに渡したグラフ。 */
export type CopiedValues = {
  graphs: Skeleton["graphs"];
  output: v.InferOutput<typeof ValuesSchema>;
};

/**
 * 段ごとの出力を、applyPdfReading が受ける形にまとめる。
 * 区や調査項目の key の参照切れと、その段で書けない key を指しているもの（区の説明の根拠は品種・資材・区、
 * 値と根拠は渡したグラフ、補足は渡したグラフの調査項目だけ）と、根拠のページが PDF に無いものは失敗にする。
 */
export function mergeStages(
  skeleton: Skeleton,
  single: v.InferOutput<typeof SingleFieldsSchema>,
  plotGroups: v.InferOutput<typeof PlotGroupsSchema>,
  copied: CopiedValues[],
  pages: number,
): Merged {
  const plotKeys = new Set(skeleton.plots.map((plot) => plot.key));
  const measurementKeys = new Set(skeleton.measurements.map((measurement) => measurement.key));
  const namedKeys = new Set(
    [...skeleton.varieties, ...skeleton.comparedMaterials, ...skeleton.plots].map(({ key }) => key),
  );
  if (plotGroups.evidence.some(({ ref }) => !namedKeys.has(ref))) return { ok: false };
  for (const { graphs, output } of copied) {
    const graphKeys = new Set(graphs.map((graph) => graph.key));
    const ownerKeys = new Set(graphs.map((graph) => graph.measurementKey));
    if (
      output.values.some(({ graphKey }) => !graphKeys.has(graphKey)) ||
      output.bodies.some(({ key }) => !ownerKeys.has(key)) ||
      output.evidence.some(({ ref }) => !graphKeys.has(ref))
    )
      return { ok: false };
  }
  const values = copied.map(({ output }) => output);
  const descriptions = new Map<string, string>();
  const plotEvidence: ReportReadingOutput["evidence"] = [];
  for (const group of plotGroups.groups) {
    for (const plotKey of group.plotKeys) {
      if (!plotKeys.has(plotKey)) return { ok: false };
      if (!descriptions.has(plotKey)) descriptions.set(plotKey, group.description);
      plotEvidence.push({ ref: plotKey, quote: group.quote, page: group.page });
    }
  }
  const bodies = new Map<string, string>();
  for (const { key: measurementKey, body } of values.flatMap((chunk) => chunk.bodies)) {
    if (!measurementKeys.has(measurementKey)) return { ok: false };
    if (body.trim() !== "" && !bodies.has(measurementKey)) bodies.set(measurementKey, body);
  }
  const { evidence: singleEvidence, ...fields } = single;
  const merged = v.safeParse(ReportReadingOutputSchema, {
    ...fields,
    outcome: skeleton.outcome,
    varieties: skeleton.varieties,
    comparedMaterials: skeleton.comparedMaterials,
    plots: skeleton.plots.map((plot) => ({
      ...plot,
      description: descriptions.get(plot.key) ?? "",
    })),
    measurements: skeleton.measurements.map((measurement) => ({
      ...measurement,
      body: bodies.get(measurement.key) ?? "",
    })),
    graphs: skeleton.graphs,
    values: values.flatMap((chunk) => chunk.values),
    evidence: [
      ...singleEvidence,
      ...plotGroups.evidence,
      ...plotEvidence,
      ...values.flatMap((chunk) => chunk.evidence),
    ],
  });
  const cited = (page: number) =>
    page === NO_PAGE || (Number.isInteger(page) && page >= 1 && page <= pages);
  return merged.success && merged.output.evidence.every(({ page }) => cited(page))
    ? { ok: true, output: merged.output }
    : { ok: false };
}

const NO_MATCH: ReportReadingOutput = {
  outcome: "no_matching_trial",
  crop: "",
  prefecture: "",
  purposes: [],
  timingStages: [],
  cultivationEnvironment: "",
  timingNote: "",
  commonPlotDescription: "",
  observedChange: "",
  varieties: [],
  comparedMaterials: [],
  plots: [],
  measurements: [],
  graphs: [],
  values: [],
  evidence: [],
};

/**
 * 試験成績書の PDF を、段に分けて読み取る。
 * A 骨組み（Opus fast）と B 単独の欄（Sonnet）を同時に呼び、A が返ったら C 値（量に応じた本数）と D 区の説明を同時に呼ぶ。
 * どれか1本でも失敗したら、残りを打ち切って全体を失敗にする。記録する model と speed は A のもの、トークン数は全部の合計。
 */
export async function readReportPdf(
  extract: ExtractPdf,
  request: ReportReadingRequest,
): Promise<PdfExtraction<ReportReadingOutput>> {
  const controller = new AbortController();
  const usages: PdfExtractionUsage[] = [];
  const failures: PdfExtractionError[] = [];
  const call = async <TSchema extends v.GenericSchema>(
    model: ExtractionModel,
    schema: TSchema,
    instructions: string,
  ) => {
    const result = await extract({
      model,
      schema,
      instructions,
      pdf: request.pdf,
      system: REPORT_READING_SYSTEM,
      deadline: request.deadline,
      signal: controller.signal,
    });
    if (result.usage !== null) usages.push(result.usage);
    if (!result.ok) {
      failures.push(result.error);
      controller.abort();
    }
    return result;
  };
  const total = (skeletonUsage: PdfExtractionUsage | null): PdfExtractionUsage => ({
    model: skeletonUsage?.model ?? STAGE_MODELS.skeleton.model,
    speed: skeletonUsage?.speed ?? STAGE_MODELS.skeleton.speed,
    inputTokens: usages.reduce((sum, usage) => sum + usage.inputTokens, 0),
    outputTokens: usages.reduce((sum, usage) => sum + usage.outputTokens, 0),
  });
  const failed = (skeletonUsage: PdfExtractionUsage | null, error: PdfExtractionError) => ({
    ok: false as const,
    error,
    usage: usages.length > 0 ? total(skeletonUsage) : null,
  });

  const singlePending = call(
    STAGE_MODELS.singleFields,
    SingleFieldsSchema,
    singleFieldsInstructions(request.material, request.trial, request.catalog),
  );
  const skeleton = await call(
    STAGE_MODELS.skeleton,
    SkeletonSchema,
    skeletonInstructions(request.material, request.trial),
  );
  if (!skeleton.ok || failures.length > 0) {
    await singlePending;
    return failed(skeleton.usage, failures[0] ?? "failed");
  }
  if (skeleton.output.outcome === "no_matching_trial") {
    controller.abort();
    await singlePending;
    return { ok: true, output: NO_MATCH, usage: total(skeleton.usage) };
  }
  const [plotGroups, values, single] = await Promise.all([
    call(STAGE_MODELS.copy, PlotGroupsSchema, plotInstructions(skeleton.output)),
    Promise.all(
      valueChunks(skeleton.output).map(async (graphs) => ({
        graphs,
        result: await call(
          STAGE_MODELS.copy,
          ValuesSchema,
          valueInstructions(skeleton.output, graphs),
        ),
      })),
    ),
    singlePending,
  ]);
  const copied = values.flatMap(({ graphs, result }) =>
    result.ok ? [{ graphs, output: result.output }] : [],
  );
  if (!single.ok || !plotGroups.ok || copied.length !== values.length)
    return failed(skeleton.usage, failures[0] ?? "failed");
  const merged = mergeStages(
    skeleton.output,
    single.output,
    plotGroups.output,
    copied,
    request.pages,
  );
  if (!merged.ok) {
    console.error(
      "[pdf-reading] 段の出力の key や根拠の ref・ページが、骨組みやその段、PDF に無い",
    );
    return failed(skeleton.usage, "invalid_output");
  }
  return { ok: true, output: merged.output, usage: total(skeleton.usage) };
}
