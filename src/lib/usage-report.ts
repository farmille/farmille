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
  variety: short,
  varietyUnknown: v.boolean(),
  observedChange: body,
  purposeTags: v.pipe(v.array(short), v.maxLength(30)),
  /** 使用目的の補足（任意）。usage_reports.purpose_note に保存する */
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
    v.maxLength(20),
  ),
  measurements: v.pipe(
    v.array(
      v.object({
        id: uuid,
        kind: v.picklist(["numeric", "text"]),
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
export type UsageReportFieldErrors = { [key: string]: string };
export type UsageReportActionResult =
  | { ok: true; status: "draft" | "pending"; reportId: string; updatedAt: string; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors: UsageReportFieldErrors;
      /** 提出に失敗しても下書きとしては保存できた場合の更新日時（次の保存の照合に使う） */
      savedUpdatedAt?: string;
    };
export function createReportPlot(): UsageReportInput["plots"][number] {
  return {
    id: crypto.randomUUID(),
    name: "",
    scope: "",
    description: "",
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
  const plots = [createReportPlot(), createReportPlot()];
  return {
    reportId: crypto.randomUUID(),
    expectedUpdatedAt: null,
    materialId,
    cropId: null,
    variety: "",
    varietyUnknown: false,
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
export function validateUsageReportSubmission(input: UsageReportInput) {
  const errors: UsageReportFieldErrors = {};
  const required = (key: string, valid: boolean, message = "※ ここを入力してください") => {
    if (!valid) errors[key] = message;
  };
  required("cropId", input.cropId !== null, "※ 使用作物を選んでください");
  required(
    "variety",
    input.varietyUnknown || input.variety.trim().length > 0,
    "※ 品種を入力するか、「品種が不明、または品種がない」にチェックしてください",
  );
  required("observedChange", input.observedChange.trim().length > 0);
  required("purposeTags", input.purposeTags.length > 0);
  required("prefectureCode", input.prefectureCode !== null, "※ 都道府県を選んでください");
  required("cultivationEnvironment", input.cultivationEnvironment.trim().length > 0);
  required("timingStages", input.timingStages.length > 0);
  required("timingNote", input.timingNote.trim().length > 0);
  required("plots", input.plots.length >= 2, "※ 2区以上を入力してください");
  input.plots.forEach((plot, i) => {
    required(`plots.${i}.name`, plot.name.trim().length > 0);
    required(`plots.${i}.scope`, plot.scope.trim().length > 0);
    required(`plots.${i}.description`, plot.description.trim().length > 0);
  });
  required(
    "measurements",
    input.measurements.some(
      (measurement) =>
        measurement.kind === "numeric" &&
        measurement.name.trim().length > 0 &&
        measurement.graphs.some((graph) =>
          graph.rows.some((row) => parseReportNumber(row.value) !== null),
        ),
    ),
    "※ 調査項目と数値を入力したグラフを1つ以上追加してください",
  );
  input.measurements.forEach((measurement, i) => {
    required(
      `measurements.${i}.name`,
      measurement.name.trim().length > 0,
      "※ 指標名を入力してください",
    );
    required(
      `measurements.${i}.values`,
      measurement.kind === "text"
        ? measurement.body.trim().length > 0
        : measurement.graphs.length > 0 &&
            measurement.graphs.every(({ rows }) =>
              rows.some(({ value }) => parseReportNumber(value) !== null),
            ),
      "※ 各区の数値、または文章を入力してください",
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
    input.documents.length === 0 || input.documentsAck,
    "※ 資料の公開権限を確認してください",
  );
  required("guidelineAck", input.guidelineAck, "※ 投稿ガイドラインへの同意が必要です");
  return errors;
}
export function reportErrorStep(key: string): number {
  if (key === "cropId" || key === "materialId" || key === "variety") return 1;
  if (key === "observedChange" || key === "purposeTags") return 2;
  if (["prefectureCode", "cultivationEnvironment", "timingStages", "timingNote"].includes(key))
    return 3;
  if (key.startsWith("plots") || key.startsWith("measurements") || key === "methodDetailsAck")
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
