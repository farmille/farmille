import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { createBlankUsageReport } from "./usage-report";
import {
  effectivePdfReadingMarks,
  PDF_READING_FIELD_PATHS,
  pdfReadingFieldValue,
  PdfReadingFieldKeySchema,
  PdfReadingFieldsSchema,
  PdfReadingUploadPathSchema,
} from "./pdf-reading";

const plotId = "0f4c8a52-3a3e-4d5e-9a63-1b2c3d4e5f60";
const graphId = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const rowId = "9e8d7c6b-5a49-4382-9716-0f1e2d3c4b5a";

describe("PDF読み取りの欄の経路", () => {
  it("区・調査項目・グラフ・行を id で指す経路を受け付ける", () => {
    for (const key of [
      "observedChange",
      "cropId",
      `plots.${plotId}.name`,
      `varieties.${plotId}.name`,
      `measurements.${plotId}.graphs.${graphId}.heading`,
      `measurements.${plotId}.graphs.${graphId}.rows.${rowId}.value`,
    ]) {
      expect(v.is(PdfReadingFieldKeySchema, key), key).toBe(true);
    }
  });

  it("一覧のどの経路も、id を入れると受け付ける", () => {
    for (const path of PDF_READING_FIELD_PATHS) {
      expect(v.is(PdfReadingFieldKeySchema, path.replaceAll("{id}", plotId)), path).toBe(true);
    }
  });

  it("一覧に無い欄、id でない区切り、余分な区切りを拒否する", () => {
    for (const key of [
      "purposeNote",
      `plots.${plotId}.nmae`,
      "plots.1.name",
      `plots.${plotId.toUpperCase()}.name`,
      `plots.${plotId}`,
      `plots.${plotId}.name.`,
      `.plots.${plotId}.name`,
      `measurements.${plotId}.graphs.${graphId}.rows.${rowId}.label`,
      `measurements.${plotId}.rows.${rowId}.value`,
    ]) {
      expect(v.is(PdfReadingFieldKeySchema, key), key).toBe(false);
    }
  });

  it("同じ欄を2回記録しようとしたら拒否する", () => {
    const field = { fieldKey: `plots.${plotId}.name`, value: "処理区", quote: "処理区（1000倍）" };
    expect(v.is(PdfReadingFieldsSchema, [field])).toBe(true);
    expect(v.is(PdfReadingFieldsSchema, [field, { ...field, value: "対照区" }])).toBe(false);
  });

  it("引用は1000字まで、記録は2000欄まで", () => {
    const field = { fieldKey: "observedChange", value: "", quote: "あ".repeat(1000) };
    expect(v.is(PdfReadingFieldsSchema, [field])).toBe(true);
    expect(v.is(PdfReadingFieldsSchema, [{ ...field, quote: "あ".repeat(1001) }])).toBe(false);
    const many = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        fieldKey: `plots.${crypto.randomUUID()}.name`,
        value: `区${i}`,
        quote: "",
      }));
    expect(v.is(PdfReadingFieldsSchema, many(2000))).toBe(true);
    expect(v.is(PdfReadingFieldsSchema, many(2001))).toBe(false);
  });
});

describe("PDF の一時置き場の場所", () => {
  it("利用者のフォルダの直下にある、id を名前にした PDF だけを受け付ける", () => {
    expect(v.is(PdfReadingUploadPathSchema, `${plotId}/${graphId}.pdf`)).toBe(true);
    expect(v.is(PdfReadingUploadPathSchema, `${plotId}/成績書.pdf`)).toBe(false);
    expect(v.is(PdfReadingUploadPathSchema, `${plotId}/sub/${graphId}.pdf`)).toBe(false);
    expect(v.is(PdfReadingUploadPathSchema, `${graphId}.pdf`)).toBe(false);
  });
});

describe("pdfReadingFieldValue", () => {
  const input = {
    ...createBlankUsageReport(plotId),
    timingStages: [4, 1],
    purposeTags: ["収量改善", "耐暑性改善"],
  };
  const [first] = input.plots;

  it("欄の今の値を比較用の文字列で返す", () => {
    expect(pdfReadingFieldValue(input, "timingStages")).toBe("1,4");
    expect(pdfReadingFieldValue(input, "purposeTags")).toBe("収量改善\n耐暑性改善");
    expect(pdfReadingFieldValue(input, "cropId")).toBe("");
    expect(pdfReadingFieldValue(input, `plots.${first?.id}.treatment`)).toBe("untreated");
  });

  it("対象の区や行が無ければ undefined を返す", () => {
    expect(pdfReadingFieldValue(input, `plots.${rowId}.name`)).toBeUndefined();
    expect(
      pdfReadingFieldValue(input, `measurements.${plotId}.graphs.${graphId}.rows.${rowId}.value`),
    ).toBeUndefined();
  });

  it("印は記録の値と今の値が同じ欄だけに残る", () => {
    const marks = [
      { fieldKey: "timingStages" as const, value: "1,4", quote: "" },
      { fieldKey: "cropId" as const, value: graphId, quote: "" },
    ];
    expect(effectivePdfReadingMarks(marks, input)).toEqual([marks[0]]);
  });
});
