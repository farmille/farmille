import * as v from "valibot";

import { PREFECTURES } from "@/lib/prefectures";
import type { PdfReadingFieldKey } from "@/lib/pdf-reading";
import type { ReportPlotTreatment, UsageReportInput } from "@/lib/usage-report";
import { defaultPlotName, graphWithPlots } from "@/lib/usage-report-plots";
import type { CropOption } from "@/server/queries/usage-report-form";

// 構造化出力に渡す形。入れ子が深く項目が多いと文法のコンパイルが断られるので、
// 一覧は平らに並べて key で指し合い、根拠の引用は evidence にまとめる。
// null 許容と省略可は使わず、無い値は空文字・空配列・page 0 で表す。
const key = v.string();
export const ReportReadingOutputSchema = v.strictObject({
  outcome: v.picklist(["read", "no_matching_trial"]),
  crop: v.string(),
  prefecture: v.string(),
  purposes: v.array(v.string()),
  timingStages: v.array(v.picklist([0, 1, 2, 3, 4, 5, 6, 7])),
  cultivationEnvironment: v.string(),
  timingNote: v.string(),
  commonPlotDescription: v.string(),
  observedChange: v.string(),
  varieties: v.array(v.strictObject({ key, name: v.string() })),
  comparedMaterials: v.array(v.strictObject({ key, name: v.string() })),
  plots: v.array(
    v.strictObject({
      key,
      name: v.string(),
      description: v.string(),
      varietyKey: v.string(),
      treatment: v.picklist(["posted", "compared", "untreated"]),
      comparedMaterialKey: v.string(),
    }),
  ),
  measurements: v.array(
    v.strictObject({ key, name: v.string(), unit: v.string(), body: v.string() }),
  ),
  graphs: v.array(v.strictObject({ key, measurementKey: v.string(), heading: v.string() })),
  values: v.array(v.strictObject({ graphKey: v.string(), plotKey: v.string(), value: v.string() })),
  evidence: v.array(v.strictObject({ ref: v.string(), quote: v.string(), page: v.number() })),
});
export type ReportReadingOutput = v.InferOutput<typeof ReportReadingOutputSchema>;

export type ReadingCatalog = {
  crops: Pick<CropOption, "id" | "name" | "aliases">[];
  effectNames: string[];
  /** 投稿した資材の名前。区の名前が PDF に無いときの自動の名前に使う。 */
  postedName: string;
};

/** 入れた欄と根拠の引用。記録する値は、保存した入力から pdfReadingFieldValue で作る。 */
export type AppliedField = { fieldKey: PdfReadingFieldKey; quote: string };

export type AppliedReading = { input: UsageReportInput; fields: AppliedField[] };

export type PdfReadingApplication =
  | ({ ok: true } & AppliedReading)
  | { ok: false; error: "pdf_reading_no_match" | "pdf_reading_failed" };

const QUOTE_MAX = 1000;

const normalized = (value: string) => value.normalize("NFKC").trim();

/** 残す調査項目。数値の調査項目は古い区を指すので外し、名前も本文も無い文章の項目（入れ方を選ぶ前の空の項目）も外す。 */
function kept(measurement: UsageReportInput["measurements"][number]): boolean {
  if (measurement.kind === "numeric") return false;
  return (
    measurement.kind !== "text" || measurement.name.trim() !== "" || measurement.body.trim() !== ""
  );
}

/** 鍵の参照切れを表す。写像の途中で見つけたら全体を失敗にする。 */
class BrokenKey extends Error {}

function resolver(entries: { key: string }[], ids: string[]) {
  const map = new Map(entries.map((entry, index) => [entry.key, ids[index]]));
  return (ref: string): string => {
    const id = map.get(ref);
    if (id === undefined) throw new BrokenKey(ref);
    return id;
  };
}

/**
 * 読み取った内容を下書きに写す。
 * 作物などの単独の欄は空のときだけ入れ、都道府県・品種・比較した資材・区は置き換える。
 * base の数値の調査項目は古い区を指しているので外し、画像と文章の調査項目は残して後ろに読み取った調査項目を足す。
 */
export function applyPdfReading(
  base: UsageReportInput,
  output: ReportReadingOutput,
  catalog: ReadingCatalog,
  newId: () => string,
): PdfReadingApplication {
  if (
    output.outcome === "no_matching_trial" ||
    output.plots.length < 2 ||
    !output.plots.some((plot) => plot.treatment === "posted")
  )
    return { ok: false, error: "pdf_reading_no_match" };
  try {
    return { ok: true, ...mapReading(base, output, catalog, newId) };
  } catch (error) {
    if (!(error instanceof BrokenKey)) throw error;
    console.error("[pdf-reading] 読み取った内容の鍵が見つからない", error.message);
    return { ok: false, error: "pdf_reading_failed" };
  }
}

function mapReading(
  base: UsageReportInput,
  output: ReportReadingOutput,
  catalog: ReadingCatalog,
  newId: () => string,
): AppliedReading {
  const evidence = new Map<string, string>();
  for (const { ref, quote, page } of output.evidence) {
    const text = quote.trim() === "" ? "" : `「${quote.trim()}」`;
    const cited = page >= 1 ? `${text}（${Math.trunc(page)}ページ）` : text;
    if (!evidence.has(ref)) evidence.set(ref, cited.slice(0, QUOTE_MAX));
  }
  const fields: AppliedField[] = [];
  const note = (fieldKey: PdfReadingFieldKey, ref: string) =>
    fields.push({ fieldKey, quote: evidence.get(ref) ?? "" });

  const cropName = normalized(output.crop);
  const crop =
    base.cropId === null && cropName !== ""
      ? catalog.crops.find(
          (item) =>
            normalized(item.name) === cropName ||
            item.aliases.some((alias) => normalized(alias) === cropName),
        )
      : undefined;
  if (crop !== undefined) note("cropId", "crop");

  const purposeTags =
    base.purposeTags.length === 0
      ? [
          ...new Set(
            output.purposes
              .map((name) => name.trim())
              .filter((name) => catalog.effectNames.includes(name)),
          ),
        ]
      : [];
  if (purposeTags.length > 0) note("purposeTags", "purposes");

  // 都道府県は試験地を表すので、登録住所から先に入った値や選んだ値があっても PDF の値で置き換える
  const prefecture = PREFECTURES.find(({ name }) => name === normalized(output.prefecture));
  if (prefecture !== undefined) note("prefectureCode", "prefecture");

  const timingStages =
    base.timingStages.length === 0
      ? [...new Set(output.timingStages)].toSorted((a, b) => a - b)
      : [];
  if (timingStages.length > 0) note("timingStages", "timingStages");

  const fill = (
    field: "cultivationEnvironment" | "timingNote" | "commonPlotDescription" | "observedChange",
  ): string => {
    const value = output[field].trim();
    if (base[field].trim() !== "" || value === "") return base[field];
    note(field, field);
    return value;
  };

  const varieties = output.varieties.map((variety) => ({ id: newId(), name: variety.name.trim() }));
  const comparedMaterials = output.comparedMaterials.map((material) => ({
    id: newId(),
    name: material.name.trim(),
  }));
  const varietyId = resolver(
    output.varieties,
    varieties.map(({ id }) => id),
  );
  const comparedId = resolver(
    output.comparedMaterials,
    comparedMaterials.map(({ id }) => id),
  );
  output.varieties.forEach((variety, index) =>
    note(`varieties.${varieties[index]?.id ?? ""}.name`, variety.key),
  );
  output.comparedMaterials.forEach((material, index) =>
    note(`comparedMaterials.${comparedMaterials[index]?.id ?? ""}.name`, material.key),
  );

  const plots = output.plots.map((plot): UsageReportInput["plots"][number] => {
    const treatment: ReportPlotTreatment =
      plot.treatment === "compared"
        ? { kind: "compared", comparedMaterialId: comparedId(plot.comparedMaterialKey) }
        : { kind: plot.treatment };
    return {
      id: newId(),
      name: plot.name.trim(),
      scope: "",
      description: plot.description.trim(),
      varietyId:
        varieties.length === 0 || plot.varietyKey === "" ? null : varietyId(plot.varietyKey),
      treatment,
      steps: [],
    };
  });
  const replaced: UsageReportInput = {
    ...base,
    varietyUnknown: varieties.length === 0,
    varieties,
    comparedMaterials,
    plots,
  };
  const named = plots.map((plot) => ({
    ...plot,
    name: plot.name === "" ? defaultPlotName(plot, replaced, catalog.postedName) : plot.name,
  }));
  const plotId = resolver(
    output.plots,
    named.map(({ id }) => id),
  );
  output.plots.forEach((plot, index) => {
    const id = named[index]?.id ?? "";
    note(`plots.${id}.name`, plot.key);
    note(`plots.${id}.treatment`, plot.key);
    if (plot.description.trim() !== "") note(`plots.${id}.description`, plot.key);
  });

  const measurements = output.measurements.map((measurement) => {
    const id = newId();
    note(`measurements.${id}.name`, measurement.key);
    if (measurement.unit.trim() !== "") note(`measurements.${id}.unit`, measurement.key);
    if (measurement.body.trim() !== "") note(`measurements.${id}.body`, measurement.key);
    const graphs = output.graphs
      .filter(({ measurementKey }) => measurementKey === measurement.key)
      .map((graph) => {
        const graphId = newId();
        if (graph.heading.trim() !== "")
          note(`measurements.${id}.graphs.${graphId}.heading`, graph.key);
        const values = output.values.filter(({ graphKey }) => graphKey === graph.key);
        const rows = values.map((value) => ({
          id: newId(),
          plotId: plotId(value.plotKey),
          label: "",
          value: value.value.trim(),
        }));
        const aligned = graphWithPlots({ id: graphId, heading: graph.heading.trim(), rows }, named);
        // 区ごとの値の根拠は、グラフの根拠（表や図の題）でまとめて示す
        const read = new Set(rows.map(({ id: rowId }) => rowId));
        for (const row of aligned.rows)
          if (read.has(row.id) && row.value !== "")
            note(`measurements.${id}.graphs.${graphId}.rows.${row.id}.value`, graph.key);
        return aligned;
      });
    return {
      id,
      kind: "numeric" as const,
      name: measurement.name.trim(),
      unit: measurement.unit.trim(),
      body: measurement.body.trim(),
      graphs,
    };
  });
  const measurementKeys = new Set(output.measurements.map((measurement) => measurement.key));
  const graphKeys = new Set(output.graphs.map((graph) => graph.key));
  const stray =
    output.graphs.find(({ measurementKey }) => !measurementKeys.has(measurementKey))
      ?.measurementKey ?? output.values.find(({ graphKey }) => !graphKeys.has(graphKey))?.graphKey;
  if (stray !== undefined) throw new BrokenKey(stray);

  return {
    input: {
      ...replaced,
      plots: named,
      cropId: crop?.id ?? base.cropId,
      purposeTags: purposeTags.length > 0 ? purposeTags : base.purposeTags,
      prefectureCode: prefecture?.code ?? base.prefectureCode,
      timingStages: timingStages.length > 0 ? timingStages : base.timingStages,
      cultivationEnvironment: fill("cultivationEnvironment"),
      timingNote: fill("timingNote"),
      commonPlotDescription: fill("commonPlotDescription"),
      observedChange: fill("observedChange"),
      measurements: [...base.measurements.filter(kept), ...measurements],
      pdfValuesChecked: false,
    },
    fields,
  };
}
