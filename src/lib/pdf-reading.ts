import * as v from "valibot";

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
