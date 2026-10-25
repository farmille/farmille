import * as v from "valibot";

import type { ErrorCode } from "@/server/errors";

import { UsageReportInputSchema, type UsageReportInput } from "./usage-report";
import { treatmentKey } from "./usage-report-plots";

/** PDF読み取りで値を入れられる欄の経路。`{id}` には区・調査項目・グラフ・行などの id が入る。 */
export const PDF_READING_FIELD_PATHS = [
  "cropId",
  "purposeTags",
  "prefectureCode",
  "cultivationEnvironment",
  "timingStages",
  "timingNote",
  "commonPlotDescription",
  "observedChange",
  "varieties.{id}.name",
  "comparedMaterials.{id}.name",
  "plots.{id}.name",
  "plots.{id}.description",
  "plots.{id}.treatment",
  "measurements.{id}.name",
  "measurements.{id}.unit",
  "measurements.{id}.body",
  "measurements.{id}.graphs.{id}.heading",
  "measurements.{id}.graphs.{id}.rows.{id}.value",
] as const;

type WithIds<TPath extends string> = TPath extends `${infer Head}{id}${infer Tail}`
  ? `${Head}${string}${WithIds<Tail>}`
  : TPath;
export type PdfReadingFieldKey = WithIds<(typeof PDF_READING_FIELD_PATHS)[number]>;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const fieldKeyString = v.pipe(
  v.string(),
  v.maxLength(200),
  v.regex(
    new RegExp(
      `^(?:${PDF_READING_FIELD_PATHS.map((path) => path.replaceAll(".", "\\.").replaceAll("{id}", UUID)).join("|")})$`,
      "u",
    ),
  ),
);
// 正規表現と型は同じ経路の一覧から作るので、検査に通った文字列は PdfReadingFieldKey に入る。
export const PdfReadingFieldKeySchema = v.custom<PdfReadingFieldKey>((input) =>
  v.is(fieldKeyString, input),
);

export const PdfReadingFieldSchema = v.object({
  fieldKey: PdfReadingFieldKeySchema,
  value: v.pipe(v.string(), v.maxLength(20000)),
  quote: v.pipe(v.string(), v.maxLength(1000)),
});
export type PdfReadingField = v.InferOutput<typeof PdfReadingFieldSchema>;
export const PdfReadingFieldsSchema = v.pipe(
  v.array(PdfReadingFieldSchema),
  v.maxLength(2000),
  v.check(
    (fields) => new Set(fields.map(({ fieldKey }) => fieldKey)).size === fields.length,
    "同じ欄の値を2つ記録できません。",
  ),
);

/** 一時置き場の PDF の場所。`<利用者の id>/<アップロードの id>.pdf`。 */
export const PdfReadingUploadPathSchema = v.pipe(
  v.string(),
  v.regex(new RegExp(`^${UUID}/${UUID}\\.pdf$`, "u")),
);

/** PDFの大きさ・ページ数と、読み取る範囲の文字数の上限。ブラウザとサーバーで同じ値を使う。 */
export const PDF_READING_LIMITS = { bytes: 20 * 1024 * 1024, pages: 40, scope: 200 } as const;

/** 読み取りの前に必ずチェックしてもらう同意の文言。仕様書（pdf-reading-SPEC.md）の文言のまま変えない。 */
export const PDF_READING_CONSENT =
  "PDFの読み取りにはAnthropic社のAIモデルを使用しています。PDFはモデルの学習には用いられませんが、同社によりデータサーバー内に最大30日（規約違反の疑いがある場合を除く）データが保管されることがあります。Farmilleの運営がPDFを閲覧することはありません。";

export const PdfReadingRequestSchema = v.object({
  input: UsageReportInputSchema,
  uploadPath: PdfReadingUploadPathSchema,
  recaptchaToken: v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
  scope: v.pipe(v.string(), v.maxLength(PDF_READING_LIMITS.scope)),
  consent: v.literal(true),
});
export type PdfReadingRequest = v.InferOutput<typeof PdfReadingRequestSchema>;

/** 読み取りの結果。成功なら保存済みの下書きと入れた欄、失敗なら画面に出す文言。どちらも今月の残り回数を添える（取れなければ null）。 */
export type PdfReadingResult =
  | { ok: true; input: UsageReportInput; marks: PdfReadingField[]; remaining: number }
  | { ok: false; error: ErrorCode; message: string; remaining: number | null };

type FieldPath = (typeof PDF_READING_FIELD_PATHS)[number];
type FieldValue = (input: UsageReportInput, ids: string[]) => string | undefined;

function measurementGraph(input: UsageReportInput, [measurementId, graphId]: string[]) {
  return input.measurements
    .find(({ id }) => id === measurementId)
    ?.graphs.find(({ id }) => id === graphId);
}

const byId = <T extends { id: string }>(items: T[], id: string | undefined) =>
  items.find((item) => item.id === id);

const FIELD_VALUES = {
  cropId: (input) => input.cropId ?? "",
  purposeTags: (input) => input.purposeTags.join("\n"),
  prefectureCode: (input) => String(input.prefectureCode ?? ""),
  cultivationEnvironment: (input) => input.cultivationEnvironment,
  timingStages: (input) => input.timingStages.toSorted((a, b) => a - b).join(","),
  timingNote: (input) => input.timingNote,
  commonPlotDescription: (input) => input.commonPlotDescription,
  observedChange: (input) => input.observedChange,
  "varieties.{id}.name": (input, [id]) => byId(input.varieties, id)?.name,
  "comparedMaterials.{id}.name": (input, [id]) => byId(input.comparedMaterials, id)?.name,
  "plots.{id}.name": (input, [id]) => byId(input.plots, id)?.name,
  "plots.{id}.description": (input, [id]) => byId(input.plots, id)?.description,
  "plots.{id}.treatment": (input, [id]) => {
    const plot = byId(input.plots, id);
    return plot === undefined
      ? undefined
      : plot.treatment === null
        ? ""
        : treatmentKey(plot.treatment);
  },
  "measurements.{id}.name": (input, [id]) => byId(input.measurements, id)?.name,
  "measurements.{id}.unit": (input, [id]) => byId(input.measurements, id)?.unit,
  "measurements.{id}.body": (input, [id]) => byId(input.measurements, id)?.body,
  "measurements.{id}.graphs.{id}.heading": (input, ids) => measurementGraph(input, ids)?.heading,
  "measurements.{id}.graphs.{id}.rows.{id}.value": (input, ids) =>
    byId(measurementGraph(input, ids)?.rows ?? [], ids[2])?.value,
} satisfies Record<FieldPath, FieldValue>;

const FIELD_MATCHERS = PDF_READING_FIELD_PATHS.map((path) => ({
  pattern: new RegExp(`^${path.replaceAll(".", "\\.").replaceAll("{id}", `(${UUID})`)}$`, "u"),
  value: FIELD_VALUES[path],
}));

/**
 * 欄の今の値を、比較用の文字列で返す。対象の区や行が無ければ undefined。
 * 読み取りで記録する値と、印を出すかの比較の両方をこの関数で作る。
 */
export function pdfReadingFieldValue(
  input: UsageReportInput,
  fieldKey: PdfReadingFieldKey,
): string | undefined {
  for (const { pattern, value } of FIELD_MATCHERS) {
    const match = pattern.exec(fieldKey);
    if (match !== null) return value(input, match.slice(1));
  }
  return undefined;
}

/** 今の値が読み取りで入れた値と同じ欄の印だけを返す。直した欄と、消えた区・行の印は落ちる。 */
export function effectivePdfReadingMarks(
  marks: PdfReadingField[],
  input: UsageReportInput,
): PdfReadingField[] {
  return marks.filter((mark) => pdfReadingFieldValue(input, mark.fieldKey) === mark.value);
}
