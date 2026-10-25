import * as v from "valibot";

const uuid = v.pipe(v.string(), v.uuid());
const short = v.pipe(v.string(), v.maxLength(500));
const body = v.pipe(v.string(), v.maxLength(20000));
export const REPORT_SECTIONS = [
  { value: "results", title: "結果・感想" },
  { value: "effects", title: "期待した効果" },
  { value: "conditions", title: "栽培条件・施用時期" },
  { value: "plots", title: "比較した区" },
  { value: "measurements", title: "使用結果の詳細" },
  { value: "documents", title: "関連資料" },
] as const;
const section = v.picklist(REPORT_SECTIONS.map(({ value }) => value));
export const REPORT_PLOT_LIMIT = 40;
const named = v.object({ id: uuid, name: short });
const plotTreatment = v.variant("kind", [
  v.object({ kind: v.literal("posted") }),
  v.object({ kind: v.literal("untreated") }),
  v.object({ kind: v.literal("compared"), comparedMaterialId: uuid }),
]);
const graphRow = v.object({ id: uuid, plotId: v.nullable(uuid), label: short, value: short });
const graph = v.object({
  id: uuid,
  heading: short,
  rows: v.pipe(v.array(graphRow), v.maxLength(50)),
});
export const UsageReportInputSchema = v.object({
  reportId: uuid,
  expectedUpdatedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  materialId: uuid,
  cropId: v.nullable(uuid),
  varietyUnknown: v.boolean(),
  varieties: v.pipe(v.array(named), v.maxLength(REPORT_PLOT_LIMIT)),
  comparedMaterials: v.pipe(v.array(named), v.maxLength(REPORT_PLOT_LIMIT)),
  commonPlotDescription: body,
  observedChange: body,
  purposeTags: v.pipe(v.array(short), v.maxLength(30)),
  purposeNote: short,
  prefectureCode: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(47))),
  city: short,
  showCity: v.boolean(),
  cultivationEnvironment: body,
  timingStages: v.pipe(
    v.array(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(7))),
    v.maxLength(8),
  ),
  timingNote: body,
  plots: v.pipe(
    v.array(
      v.object({
        id: uuid,
        name: short,
        scope: short,
        description: body,
        varietyId: v.nullable(uuid),
        treatment: v.nullable(plotTreatment),
        steps: v.pipe(
          v.array(
            v.object({
              id: uuid,
              method: v.picklist(["", "spray", "drench", "mix", "soak", "coat", "other"]),
              targets: v.pipe(v.array(short), v.maxLength(6)),
              otherText: short,
            }),
          ),
          v.maxLength(20),
        ),
      }),
    ),
    v.maxLength(REPORT_PLOT_LIMIT),
  ),
  measurements: v.pipe(
    v.array(
      v.object({
        id: uuid,
        kind: v.picklist(["numeric", "text", "image"]),
        name: short,
        unit: short,
        body,
        graphs: v.pipe(v.array(graph), v.maxLength(20)),
      }),
    ),
    v.maxLength(30),
  ),
  media: v.pipe(
    v.array(
      v.object({
        id: uuid,
        url: v.pipe(v.string(), v.url(), v.maxLength(4000)),
        mediaType: v.picklist(["photo", "video"]),
        section,
        caption: short,
        measurementId: v.optional(v.nullable(uuid)),
      }),
    ),
    v.maxLength(30),
  ),
  documents: v.pipe(
    v.array(v.object({ id: uuid, path: v.pipe(v.string(), v.maxLength(1000)), name: short })),
    v.maxLength(10),
  ),
  headings: v.pipe(v.array(v.object({ section, title: short })), v.maxLength(6)),
  methodDetailsAck: v.boolean(),
  documentsAck: v.boolean(),
  guidelineAck: v.boolean(),
});
export type UsageReportInput = v.InferOutput<typeof UsageReportInputSchema>;
export type ReportPlotTreatment = v.InferOutput<typeof plotTreatment>;
export type UsageReportFieldErrors = { [key: string]: string };
export type UsageReportActionResult =
  | { ok: true; status: "draft" | "pending"; reportId: string; updatedAt: string; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors: UsageReportFieldErrors;
      savedDraft?: { updatedAt: string; status: "partial" | "complete" };
    };
export function createReportPlot(
  varietyId: string | null,
  treatment: ReportPlotTreatment,
): UsageReportInput["plots"][number] {
  return {
    id: crypto.randomUUID(),
    name: "",
    scope: "",
    description: "",
    varietyId,
    treatment,
    steps: [],
  };
}
export function createReportGraph(
  plots: UsageReportInput["plots"],
): UsageReportInput["measurements"][number]["graphs"][number] {
  return {
    id: crypto.randomUUID(),
    heading: "",
    rows: plots.map(({ id }) => ({ id: crypto.randomUUID(), plotId: id, label: "", value: "" })),
  };
}
export function createReportMeasurement(
  plots: UsageReportInput["plots"],
): UsageReportInput["measurements"][number] {
  return {
    id: crypto.randomUUID(),
    kind: "numeric",
    name: "",
    unit: "",
    body: "",
    graphs: [createReportGraph(plots)],
  };
}
export function createBlankUsageReport(materialId: string): UsageReportInput {
  const variety = { id: crypto.randomUUID(), name: "" };
  const plots = [
    createReportPlot(variety.id, { kind: "untreated" }),
    createReportPlot(variety.id, { kind: "posted" }),
  ];
  return {
    reportId: crypto.randomUUID(),
    expectedUpdatedAt: null,
    materialId,
    cropId: null,
    varietyUnknown: false,
    varieties: [variety],
    comparedMaterials: [],
    commonPlotDescription: "",
    observedChange: "",
    purposeTags: [],
    purposeNote: "",
    prefectureCode: null,
    city: "",
    showCity: false,
    cultivationEnvironment: "",
    timingStages: [],
    timingNote: "",
    plots,
    measurements: [createReportMeasurement(plots)],
    media: [],
    documents: [],
    headings: [],
    methodDetailsAck: false,
    documentsAck: false,
    guidelineAck: false,
  };
}
/** 品種を1つだけ入れる画面の値を、品種の一覧の1件目に写す。2件目以降と区の品種は残し、品種の無い区だけ1件目にする。不明なら品種を空にし、区の品種も外す。 */
export function withSingleVariety(
  input: UsageReportInput,
  name: string,
  unknown: boolean,
): UsageReportInput {
  if (unknown)
    return {
      ...input,
      varietyUnknown: true,
      varieties: [],
      plots: input.plots.map((plot) => ({ ...plot, varietyId: null })),
    };
  const [first, ...rest] = input.varieties;
  const variety = { id: first?.id ?? crypto.randomUUID(), name };
  return {
    ...input,
    varietyUnknown: false,
    varieties: [variety, ...rest],
    plots: input.plots.map((plot) => ({ ...plot, varietyId: plot.varietyId ?? variety.id })),
  };
}
export function reportVarietyNames(input: Pick<UsageReportInput, "varieties">): string {
  return input.varieties
    .map(({ name }) => name.trim())
    .filter((name) => name.length > 0)
    .join("・");
}
export function parseReportNumber(raw: string): { value: number; error: number | null } | null {
  const match = raw
    .trim()
    .replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, "")
    .match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*±\s*(\d+(?:\.\d*)?|\.\d+))?/);
  if (!match) return null;
  const value = Number(match[1]);
  const error = match[2] === undefined ? null : Number(match[2]);
  return Number.isFinite(value) && (error === null || Number.isFinite(error))
    ? { value, error }
    : null;
}
/** 写り込みと秘密保持の確認が要るか。関連資料（PDF）か、調査項目に差し込んだ画像があるとき。 */
export function reportNeedsMaterialAcks(
  input: Pick<UsageReportInput, "documents" | "media">,
): boolean {
  return (
    input.documents.length > 0 ||
    input.media.some((media) => (media.measurementId ?? null) !== null)
  );
}
export function validateUsageReportSubmission(input: UsageReportInput) {
  const errors: UsageReportFieldErrors = {};
  const required = (key: string, valid: boolean, message = "※ ここを入力してください") => {
    if (!valid) errors[key] = message;
  };
  required("cropId", input.cropId !== null, "※ 使用対象作目を選んでください");
  required(
    "varieties",
    input.varietyUnknown ? input.varieties.length === 0 : input.varieties.length > 0,
    input.varietyUnknown
      ? "※ 「品種が不明、または品種がない」のときは品種を入れないでください"
      : "※ 品種を入力するか、「品種が不明、または品種がない」にチェックしてください",
  );
  input.varieties.forEach((variety, i) => {
    required(`varieties.${i}.name`, variety.name.trim().length > 0, "※ 品種を入力してください");
  });
  input.comparedMaterials.forEach((material, i) => {
    required(
      `comparedMaterials.${i}.name`,
      material.name.trim().length > 0,
      "※ 比較した資材の名前を入力してください",
    );
  });
  required("observedChange", input.observedChange.trim().length > 0);
  required("purposeTags", input.purposeTags.length > 0);
  required("prefectureCode", input.prefectureCode !== null, "※ 都道府県を選んでください");
  required("cultivationEnvironment", input.cultivationEnvironment.trim().length > 0);
  required("timingStages", input.timingStages.length > 0);
  required("timingNote", input.timingNote.trim().length > 0);
  required("plots", input.plots.length >= 2, "※ 2区以上を入力してください");
  input.plots.forEach((plot, i) => {
    required(`plots.${i}.name`, plot.name.trim().length > 0);
    required(
      `plots.${i}.description`,
      plot.description.trim().length > 0 || input.commonPlotDescription.trim().length > 0,
    );
    required(
      `plots.${i}.variety`,
      input.varietyUnknown === (plot.varietyId === null),
      "※ 区の品種を選んでください",
    );
    required(`plots.${i}.treatment`, plot.treatment !== null, "※ 区で使った資材を選んでください");
  });
  required(
    "plots.posted",
    input.plots.some((plot) => plot.treatment?.kind === "posted"),
    "※ 投稿する資材を使った区を1つ以上入れてください",
  );
  required("measurements", input.measurements.length > 0, "※ 調査項目を1つ以上追加してください");
  input.measurements.forEach((measurement, i) => {
    required(
      `measurements.${i}.name`,
      measurement.name.trim().length > 0,
      "※ 指標名を入力してください",
    );
    required(
      `measurements.${i}.values`,
      reportMeasurementHasResult(measurement, input.media),
      "※ 各区の数値、資料のグラフ・表、または文章を入力してください",
    );
    if (measurement.kind === "numeric") {
      required(
        `measurements.${i}.plots`,
        measurement.graphs.every(
          (graph) =>
            graph.rows.length === input.plots.length &&
            input.plots.every(
              (plot) => graph.rows.filter((row) => row.plotId === plot.id).length === 1,
            ),
        ),
        "※ グラフの区を区の説明と揃えてください",
      );
    }
  });
  required("methodDetailsAck", input.methodDetailsAck, "※ 使用方法の記載を確認してください");
  required(
    "documentsAck",
    !reportNeedsMaterialAcks(input) || input.documentsAck,
    "※ 資料の公開権限を確認してください",
  );
  required("guidelineAck", input.guidelineAck, "※ 投稿ガイドラインへの同意が必要です");
  return errors;
}
function reportMeasurementHasResult(
  measurement: UsageReportInput["measurements"][number],
  media: UsageReportInput["media"],
): boolean {
  switch (measurement.kind) {
    case "text":
      return measurement.body.trim().length > 0;
    case "image":
      return media.some((item) => item.measurementId === measurement.id);
    case "numeric":
      return (
        measurement.graphs.length > 0 &&
        measurement.graphs.every(({ rows }) =>
          rows.some(({ value }) => parseReportNumber(value) !== null),
        )
      );
  }
}
export function reportErrorStep(key: string): number {
  if (key === "cropId" || key === "materialId" || key.startsWith("varieties")) return 1;
  if (key === "observedChange" || key === "purposeTags") return 2;
  if (["prefectureCode", "cultivationEnvironment", "timingStages", "timingNote"].includes(key))
    return 3;
  if (
    key.startsWith("plots") ||
    key.startsWith("comparedMaterials") ||
    key.startsWith("measurements") ||
    key === "methodDetailsAck"
  )
    return 4;
  return 5;
}

export function groupReportMeasurements(measurements: UsageReportInput["measurements"]) {
  const groups: UsageReportInput["measurements"] = [];
  for (const measurement of measurements) {
    if (measurement.kind !== "numeric") continue;
    const group = groups.find(
      (item) =>
        item.name.trim() === measurement.name.trim() &&
        item.unit.trim() === measurement.unit.trim(),
    );
    if (group) group.graphs.push(...measurement.graphs);
    else groups.push({ ...measurement, graphs: [...measurement.graphs] });
  }
  return groups;
}
