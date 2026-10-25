import {
  reportNeedsMaterialAcks,
  validateUsageReportSubmission,
  type UsageReportInput,
} from "@/lib/usage-report";
import { graphWithPlots } from "@/lib/usage-report-plots";

export type ReportMaterialSummary = { id: string; name: string; manufacturerName: string };

/** 調査項目に差し込んだ画像（編集後の画像だけを保存する）。 */
export type ReportPageImage = { id: string; url: string; caption: string };

type ReportGraph = UsageReportInput["measurements"][number]["graphs"][number];
type ReportPageItemBase = { id: string; name: string; body: string };

/**
 * ページ版の調査項目。入れ方を選ぶ前は mode が空。
 * file は資料のグラフ・表の画像と補足説明、text は区ごとの結果の文章、
 * numeric は PDF読み取りなどで入った数値のグラフ（ページ版では表示と値の修正だけ）。
 */
export type ReportPageItem =
  | (ReportPageItemBase & { mode: "" | "text" })
  | (ReportPageItemBase & { mode: "file"; images: ReportPageImage[] })
  | (ReportPageItemBase & { mode: "numeric"; unit: string; graphs: ReportGraph[] });

export type ReportPageNumericItem = Extract<ReportPageItem, { mode: "numeric" }>;

export function reportPageItemImages(item: ReportPageItem): ReportPageImage[] {
  return item.mode === "file" ? item.images : [];
}

/** 1つのレポートに入れられる写真・画像の数（保存の入力の上限と同じ）。 */
export const REPORT_IMAGE_LIMIT = 30;

/** 差し込む前に読み込める PDF と写真の上限。読み込む前に大きさを、PDF は読み込んだ後にページ数を確かめる。 */
export const REPORT_PDF_LIMITS = { bytes: 20 * 1024 * 1024, pages: 40 } as const;
export const REPORT_PHOTO_LIMITS = { bytes: 50 * 1024 * 1024 } as const;

/** 文章の欄と、短い欄の文字数の上限（保存の入力の上限と同じ）。 */
export const REPORT_BODY_MAX = 20000;
export const REPORT_SHORT_MAX = 500;

/** 調査項目に属さない、以前の入力画面で節ごとに添えた写真・動画。公開記事では節の最後に出る。 */
export function reportLegacyMedia(input: UsageReportInput): UsageReportInput["media"] {
  return input.media.filter(
    (media) => media.measurementId === undefined || media.measurementId === null,
  );
}

/** 調査項目 itemId に入れられる画像の数。旧形式の節ごとの写真とほかの項目の画像を引く。 */
export function reportImageRoom(
  input: UsageReportInput,
  items: ReportPageItem[],
  itemId: string,
): number {
  const sectionPhotos = reportLegacyMedia(input).length;
  const others = items
    .filter((item) => item.id !== itemId)
    .reduce((sum, item) => sum + reportPageItemImages(item).length, 0);
  return Math.max(0, REPORT_IMAGE_LIMIT - sectionPhotos - others);
}

/** 文字数の上限を超えている欄の名前（保存すると入力の検証で落ちるので、先に欄を示す）。 */
export function reportOverLimit(input: UsageReportInput, items: ReportPageItem[]): string[] {
  const over = (label: string, value: string, max: number) => (value.length > max ? [label] : []);
  return [
    ...input.varieties.flatMap((variety) => over("品種", variety.name, REPORT_SHORT_MAX)),
    ...input.comparedMaterials.flatMap((material) =>
      over("比較した資材", material.name, REPORT_SHORT_MAX),
    ),
    ...over("使用目的の補足", input.purposeNote, REPORT_SHORT_MAX),
    ...over("市区町村", input.city, REPORT_SHORT_MAX),
    ...over("結果・感想", input.observedChange, REPORT_BODY_MAX),
    ...over("栽培環境", input.cultivationEnvironment, REPORT_BODY_MAX),
    ...over("処理日と生育状況", input.timingNote, REPORT_BODY_MAX),
    ...over("全区に共通の説明", input.commonPlotDescription, REPORT_BODY_MAX),
    ...input.plots.flatMap((plot, index) => [
      ...over(`区${index + 1}の名前`, plot.name, REPORT_SHORT_MAX),
      ...over(`区${index + 1}の説明`, plot.description, REPORT_BODY_MAX),
    ]),
    ...items.flatMap((item, index) => [
      ...over(`調査項目${index + 1}の名前`, item.name, REPORT_SHORT_MAX),
      ...over(
        `調査項目${index + 1}の${item.mode === "text" ? "区ごとの結果" : "補足説明"}`,
        item.body,
        REPORT_BODY_MAX,
      ),
      ...reportPageItemImages(item).flatMap((image, k) =>
        over(`調査項目${index + 1}の${k + 1}枚目の画像のタイトル`, image.caption, REPORT_SHORT_MAX),
      ),
      ...(item.mode === "numeric"
        ? [
            ...over(`調査項目${index + 1}の単位`, item.unit, REPORT_SHORT_MAX),
            ...item.graphs.flatMap((graph, k) => [
              ...over(
                `調査項目${index + 1}の${k + 1}つ目のグラフの題`,
                graph.heading,
                REPORT_SHORT_MAX,
              ),
              ...graph.rows.flatMap((row) =>
                over(`調査項目${index + 1}の${k + 1}つ目のグラフの値`, row.value, REPORT_SHORT_MAX),
              ),
            ]),
          ]
        : []),
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
  return { id: crypto.randomUUID(), mode: "", name: "", body: "" };
}

/** 保存済みの入力から調査項目を作る。 */
export function itemsFromInput(input: UsageReportInput): ReportPageItem[] {
  const items = input.measurements.map((measurement): ReportPageItem => {
    const { id, name, body } = measurement;
    switch (measurement.kind) {
      case "image":
        return {
          id,
          mode: "file",
          name,
          body,
          images: input.media
            .filter((media) => media.measurementId === id && media.mediaType === "photo")
            .map((media) => ({ id: media.id, url: media.url, caption: media.caption })),
        };
      case "text":
        // 入れ方を選んだだけで本文が空の項目は、選ぶ前に戻して開く
        return { id, mode: body.trim() ? "text" : "", name, body };
      case "numeric":
        return {
          id,
          mode: "numeric",
          name,
          body,
          unit: measurement.unit,
          graphs: measurement.graphs,
        };
    }
  });
  return items.length > 0 ? items : [createReportPageItem()];
}

/** ページの調査項目を、保存に渡す入力へ戻す。調査項目以外の写真（旧形式の節ごとの写真）はそのまま残す。 */
export function inputWithItems(input: UsageReportInput, items: ReportPageItem[]): UsageReportInput {
  return {
    ...input,
    measurements: items.map((item) => {
      const { id, name, body } = item;
      switch (item.mode) {
        case "numeric":
          return { id, kind: "numeric", name, unit: item.unit, body, graphs: item.graphs };
        case "file":
          return { id, kind: "image", name, unit: "", body, graphs: [] };
        case "":
        case "text":
          return { id, kind: "text", name, unit: "", body, graphs: [] };
      }
    }),
    media: [
      ...reportLegacyMedia(input),
      ...items.flatMap((item) =>
        reportPageItemImages(item).map((image) => ({
          id: image.id,
          url: image.url,
          mediaType: "photo" as const,
          section: "measurements" as const,
          caption: image.caption,
          measurementId: item.id,
        })),
      ),
    ],
  };
}

/** 区を変えたあと、数値の調査項目のグラフの行を区にそろえる。変わらなければ同じ配列を返す。 */
export function itemsWithPlots(
  items: ReportPageItem[],
  plots: UsageReportInput["plots"],
): ReportPageItem[] {
  let changed = false;
  const next = items.map((item) => {
    if (item.mode !== "numeric") return item;
    const graphs = item.graphs.map((graph) => graphWithPlots(graph, plots));
    if (graphs.every((graph, index) => graph === item.graphs[index])) return item;
    changed = true;
    return { ...item, graphs };
  });
  return changed ? next : items;
}

export function reportPageItemDone(item: ReportPageItem): boolean {
  if (item.name.trim() === "") return false;
  switch (item.mode) {
    case "text":
      return item.body.trim() !== "";
    case "file":
      return item.images.length > 0;
    case "numeric":
      return item.graphs.some((graph) => graph.rows.some((row) => row.value.trim() !== ""));
    case "":
      return false;
  }
}

/** 記入状況の1行。target は未記入のときに移る先（画面の要素の id）。 */
export type ReportPageCheck = { key: string; label: string; ok: boolean; target: string };

/**
 * 記入状況の行と、行に当たる提出の検査（validateUsageReportSubmission）のキー。
 * 並びは画面の上からの順で、最初の未記入の項目へ移るときにこの順に探す。
 */
const SUBMISSION_CHECKS = [
  { key: "cropId", label: "作物", target: "report-prop-crop", errors: /^cropId$/ },
  {
    key: "variety",
    label: "品種",
    target: "report-prop-variety",
    errors: /^varieties(\.\d+\.name)?$/,
  },
  { key: "purposeTags", label: "使用目的", target: "report-prop-purpose", errors: /^purposeTags$/ },
  {
    key: "prefectureCode",
    label: "地域",
    target: "report-prop-region",
    errors: /^prefectureCode$/,
  },
  {
    key: "timingStages",
    label: "施用時期",
    target: "report-prop-stages",
    errors: /^timingStages$/,
  },
  {
    key: "observedChange",
    label: "結果・感想",
    target: "report-observed-change",
    errors: /^observedChange$/,
  },
  {
    key: "cultivationEnvironment",
    label: "栽培環境",
    target: "report-environment",
    errors: /^cultivationEnvironment$/,
  },
  {
    key: "timingNote",
    label: "処理日と生育状況",
    target: "report-timing-note",
    errors: /^timingNote$/,
  },
  { key: "timingAck", label: "処理日を記入した確認", target: "report-timing-ack", errors: null },
  {
    key: "plots",
    label: "比べた区",
    target: "report-plots",
    errors: /^(plots|comparedMaterials|varieties\.\d+\.plots$)/,
  },
  {
    key: "measurements",
    label: "調査項目ごとの結果",
    target: "report-items",
    errors: /^measurements/,
  },
  {
    key: "methodDetailsAck",
    label: "施用方法などを記入した確認",
    target: "report-method-ack",
    errors: /^methodDetailsAck$/,
  },
  { key: "privacyAck", label: "写り込みの確認", target: "report-privacy-ack", errors: null },
  {
    key: "documentsAck",
    label: "秘密保持の確認",
    target: "report-documents-ack",
    errors: /^documentsAck$/,
  },
  {
    key: "guidelineAck",
    label: "公開の同意",
    target: "report-guideline-ack",
    errors: /^guidelineAck$/,
  },
] as const satisfies { key: string; label: string; target: string; errors: RegExp | null }[];

type CheckKey = (typeof SUBMISSION_CHECKS)[number]["key"];

/** 提出の検査のほかに、画面でだけ確かめること。 */
function screenCheck(key: CheckKey, input: UsageReportInput, acks: ReportPageAcks): boolean {
  switch (key) {
    case "prefectureCode":
      return !input.showCity || input.city.trim() !== "";
    case "timingAck":
      return acks.timing;
    case "privacyAck":
      return acks.privacy;
    default:
      return true;
  }
}

/** 記入状況の行。input は調査項目を書き戻した保存の入力（inputWithItems）。 */
export function reportPageChecks(input: UsageReportInput, acks: ReportPageAcks): ReportPageCheck[] {
  const errors = Object.keys(validateUsageReportSubmission(input));
  const materialAcks = reportNeedsMaterialAcks(input);
  return SUBMISSION_CHECKS.flatMap(({ key, label, target, errors: pattern }) => {
    if ((key === "privacyAck" || key === "documentsAck") && !materialAcks) return [];
    const valid = pattern === null || !errors.some((error) => pattern.test(error));
    return [
      {
        key,
        label: key === "plots" ? `${label}${varietiesWithoutPlots(input, errors)}` : label,
        target,
        ok: valid && screenCheck(key, input, acks),
      },
    ];
  });
}

/** 区の無い品種の名前を、比べた区の行に添える。区の無い品種は提出の検査（varieties.<i>.plots）が決める。 */
function varietiesWithoutPlots(input: UsageReportInput, errors: string[]): string {
  const names = errors.flatMap((error) => {
    const index = /^varieties\.(\d+)\.plots$/.exec(error)?.[1];
    const variety = index === undefined ? undefined : input.varieties[Number(index)];
    return variety === undefined ? [] : [`「${variety.name.trim() || "品種名未入力"}」`];
  });
  return names.length > 0 ? `（品種${names.join("")}の区が無い）` : "";
}

export function reportPageTitle(materialName: string, cropName: string | null): string {
  return `${materialName} 実証詳細レポート｜${cropName ?? "作物"}`;
}
