import type { UsageReportInput } from "@/lib/usage-report";

export type ReportMaterialSummary = { id: string; name: string; manufacturerName: string };

/** 調査項目に差し込んだ画像（編集後の画像だけを保存する）。 */
export type ReportPageImage = { id: string; url: string; caption: string };

/**
 * ページ版の調査項目。入れ方を選ぶ前は mode が空。
 * file は資料のグラフ・表の画像と補足説明、text は区ごとの結果の文章。
 */
export type ReportPageItem = {
  id: string;
  mode: "" | "file" | "text";
  name: string;
  body: string;
  images: ReportPageImage[];
};

/** 1つのレポートに入れられる写真・画像の数（保存の入力の上限と同じ）。 */
export const REPORT_IMAGE_LIMIT = 30;

/** 文章の欄と、短い欄の文字数の上限（保存の入力の上限と同じ）。 */
export const REPORT_BODY_MAX = 20000;
export const REPORT_SHORT_MAX = 500;

/** 調査項目 itemId に入れられる画像の数。旧形式の節ごとの写真とほかの項目の画像を引く。 */
export function reportImageRoom(
  input: UsageReportInput,
  items: ReportPageItem[],
  itemId: string,
): number {
  const sectionPhotos = input.media.filter(
    (media) => media.measurementId === undefined || media.measurementId === null,
  ).length;
  const others = items
    .filter((item) => item.id !== itemId && item.mode === "file")
    .reduce((sum, item) => sum + item.images.length, 0);
  return Math.max(0, REPORT_IMAGE_LIMIT - sectionPhotos - others);
}

/** 文字数の上限を超えている欄の名前（保存すると入力の検証で落ちるので、先に欄を示す）。 */
export function reportOverLimit(input: UsageReportInput, items: ReportPageItem[]): string[] {
  const over = (label: string, value: string, max: number) => (value.length > max ? [label] : []);
  return [
    ...over("品種", input.variety, REPORT_SHORT_MAX),
    ...over("使用目的の補足", input.purposeNote, REPORT_SHORT_MAX),
    ...over("市区町村", input.city, REPORT_SHORT_MAX),
    ...over("結果・感想", input.observedChange, REPORT_BODY_MAX),
    ...over("栽培環境", input.cultivationEnvironment, REPORT_BODY_MAX),
    ...over("処理日と生育状況", input.timingNote, REPORT_BODY_MAX),
    ...input.plots.flatMap((plot, index) => [
      ...over(`区${index + 1}の名前`, plot.name, REPORT_SHORT_MAX),
      ...over(`区${index + 1}の説明`, plot.description, REPORT_BODY_MAX),
    ]),
    ...items.flatMap((item, index) => [
      ...over(`調査項目${index + 1}の名前`, item.name, REPORT_SHORT_MAX),
      ...over(
        `調査項目${index + 1}の${item.mode === "file" ? "補足説明" : "区ごとの結果"}`,
        item.body,
        REPORT_BODY_MAX,
      ),
      ...item.images.flatMap((image, k) =>
        over(`調査項目${index + 1}の${k + 1}枚目の画像のタイトル`, image.caption, REPORT_SHORT_MAX),
      ),
    ]),
  ];
}

/** 上限に近づいた欄に出す一言。余裕があるあいだは出さない。 */
export function reportLengthNote(value: string, max: number): string | undefined {
  if (value.length < max * 0.9) return undefined;
  return value.length >= max
    ? `上限の${max.toLocaleString("ja-JP")}字に達しました。`
    : `あと${(max - value.length).toLocaleString("ja-JP")}字まで書けます。`;
}

/** DB に列を持たず、画面でだけ確かめるチェック。 */
export type ReportPageAcks = { timing: boolean; privacy: boolean };

export function createReportPageItem(): ReportPageItem {
  return { id: crypto.randomUUID(), mode: "", name: "", body: "", images: [] };
}

/** 保存済みの入力から調査項目を作る。5段階版の数値グラフは読み込まない。 */
export function itemsFromInput(input: UsageReportInput): ReportPageItem[] {
  const items = input.measurements.flatMap((measurement): ReportPageItem[] => {
    const images = input.media
      .filter((media) => media.measurementId === measurement.id && media.mediaType === "photo")
      .map(({ id, url, caption }) => ({ id, url, caption }));
    if (measurement.kind === "image")
      return [
        {
          id: measurement.id,
          mode: "file",
          name: measurement.name,
          body: measurement.body,
          images,
        },
      ];
    if (measurement.kind === "text")
      return [
        {
          id: measurement.id,
          // 入れ方を選んだだけで本文が空の項目は、選ぶ前に戻して開く
          mode: measurement.body.trim() ? "text" : "",
          name: measurement.name,
          body: measurement.body,
          images: [],
        },
      ];
    return [];
  });
  return items.length > 0 ? items : [createReportPageItem()];
}

/** ページの調査項目を、保存に渡す入力へ戻す。調査項目以外の写真（旧形式の節ごとの写真）はそのまま残す。 */
export function inputWithItems(input: UsageReportInput, items: ReportPageItem[]): UsageReportInput {
  return {
    ...input,
    plots: input.plots.map((plot) => ({ ...plot, scope: "" })),
    measurements: items.map((item) => ({
      id: item.id,
      kind: item.mode === "file" ? ("image" as const) : ("text" as const),
      name: item.name,
      unit: "",
      body: item.body,
      graphs: [],
    })),
    media: [
      ...input.media.filter(
        (media) => media.measurementId === undefined || media.measurementId === null,
      ),
      ...items.flatMap((item) =>
        item.mode === "file"
          ? item.images.map((image) => ({
              id: image.id,
              url: image.url,
              mediaType: "photo" as const,
              section: "measurements" as const,
              caption: image.caption,
              measurementId: item.id,
            }))
          : [],
      ),
    ],
  };
}

export function reportPageItemDone(item: ReportPageItem): boolean {
  if (item.name.trim() === "") return false;
  if (item.mode === "text") return item.body.trim() !== "";
  if (item.mode === "file") return item.images.length > 0;
  return false;
}

export function reportPageHasImages(items: ReportPageItem[]): boolean {
  return items.some((item) => item.mode === "file" && item.images.length > 0);
}

/** 記入状況の1行。target は未記入のときに移る先（画面の要素の id）。 */
export type ReportPageCheck = { key: string; label: string; ok: boolean; target: string };

export function reportPageChecks(
  input: UsageReportInput,
  items: ReportPageItem[],
  acks: ReportPageAcks,
): ReportPageCheck[] {
  const images = reportPageHasImages(items);
  const checks: ReportPageCheck[] = [
    {
      key: "materialId",
      label: "資材",
      ok: input.materialId !== "",
      target: "report-prop-material",
    },
    { key: "cropId", label: "使用対象作目", ok: input.cropId !== null, target: "report-prop-crop" },
    {
      key: "variety",
      label: "品種",
      ok: input.varietyUnknown || input.variety.trim() !== "",
      target: "report-prop-variety",
    },
    {
      key: "purposeTags",
      label: "使用目的",
      ok: input.purposeTags.length > 0,
      target: "report-prop-purpose",
    },
    {
      key: "prefectureCode",
      label: "地域",
      ok: input.prefectureCode !== null && (!input.showCity || input.city.trim() !== ""),
      target: "report-prop-region",
    },
    {
      key: "timingStages",
      label: "施用時期",
      ok: input.timingStages.length > 0,
      target: "report-prop-stages",
    },
    {
      key: "observedChange",
      label: "結果・感想",
      ok: input.observedChange.trim() !== "",
      target: "report-observed-change",
    },
    {
      key: "cultivationEnvironment",
      label: "栽培環境",
      ok: input.cultivationEnvironment.trim() !== "",
      target: "report-environment",
    },
    {
      key: "timingNote",
      label: "処理日と生育状況",
      ok: input.timingNote.trim() !== "",
      target: "report-timing-note",
    },
    {
      key: "timingAck",
      label: "処理日を記入した確認",
      ok: acks.timing,
      target: "report-timing-ack",
    },
    {
      key: "plots",
      label: "比べた区",
      ok:
        input.plots.length >= 2 &&
        input.plots.every((plot) => plot.name.trim() !== "" && plot.description.trim() !== ""),
      target: "report-plots",
    },
    {
      key: "measurements",
      label: "調査項目ごとの結果",
      ok: items.length > 0 && items.every(reportPageItemDone),
      target: "report-items",
    },
    {
      key: "methodDetailsAck",
      label: "施用方法などを記入した確認",
      ok: input.methodDetailsAck,
      target: "report-method-ack",
    },
  ];
  if (images) {
    checks.push(
      {
        key: "privacyAck",
        label: "写り込みの確認",
        ok: acks.privacy,
        target: "report-privacy-ack",
      },
      {
        key: "documentsAck",
        label: "秘密保持の確認",
        ok: input.documentsAck,
        target: "report-documents-ack",
      },
    );
  }
  checks.push({
    key: "guidelineAck",
    label: "公開の同意",
    ok: input.guidelineAck,
    target: "report-guideline-ack",
  });
  return checks;
}

export function reportPageTitle(materialName: string, cropName: string | null): string {
  return `${materialName} 実証詳細レポート｜${cropName ?? "使用対象作目"}`;
}
