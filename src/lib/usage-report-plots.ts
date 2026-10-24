import {
  createReportPlot,
  REPORT_PLOT_LIMIT,
  type ReportPlotTreatment,
  type UsageReportInput,
} from "./usage-report";

type Plot = UsageReportInput["plots"][number];
type Graph = UsageReportInput["measurements"][number]["graphs"][number];
type Named = UsageReportInput["varieties"][number];

/** グラフと区の印の系列色。`reportPlotColor` の variant と同じ名前。 */
export type ReportPlotSeries = "1" | "2" | "3" | "4" | "5";

const COMPARED_SERIES = ["3", "4", "5"] as const satisfies ReportPlotSeries[];

/** 区で使える資材。表の列とチップは、無処理・投稿した資材・比較した資材の順に並べる。 */
export type ReportPlotMaterial = {
  key: string;
  treatment: ReportPlotTreatment;
  name: string;
  role: "無処理" | "投稿した資材" | "比較した資材";
  series: ReportPlotSeries;
};

function comparedSeries(index: number): ReportPlotSeries {
  return COMPARED_SERIES[index % COMPARED_SERIES.length] ?? "3";
}

export function treatmentKey(treatment: ReportPlotTreatment): string {
  return treatment.kind === "compared"
    ? `compared:${treatment.comparedMaterialId}`
    : treatment.kind;
}

function comboKey(varietyId: string | null, treatment: ReportPlotTreatment): string {
  return `${varietyId ?? ""}|${treatmentKey(treatment)}`;
}

function plotComboKey(plot: Plot): string | null {
  return plot.treatment === null ? null : comboKey(plot.varietyId, plot.treatment);
}

export function reportPlotMaterials(
  input: Pick<UsageReportInput, "comparedMaterials">,
  postedName: string,
): ReportPlotMaterial[] {
  return [
    {
      key: "untreated",
      treatment: { kind: "untreated" },
      name: "無処理",
      role: "無処理",
      series: "1",
    },
    {
      key: "posted",
      treatment: { kind: "posted" },
      name: postedName,
      role: "投稿した資材",
      series: "2",
    },
    ...input.comparedMaterials.map(
      (material, index): ReportPlotMaterial => ({
        key: `compared:${material.id}`,
        treatment: { kind: "compared", comparedMaterialId: material.id },
        name: material.name,
        role: "比較した資材",
        series: comparedSeries(index),
      }),
    ),
  ];
}

/** 組み合わせの表の行にする品種。品種が不明・なし、または品種が無いときは「品種なし」の1行。 */
function plotRows(input: UsageReportInput): (Named | null)[] {
  return input.varietyUnknown || input.varieties.length === 0 ? [null] : input.varieties;
}

export type ReportPlotPlan = {
  rows: (Named | null)[];
  materials: ReportPlotMaterial[];
  /** 品種が2つ以上か比較した資材があるとき、または既定の2区がそろっていないときだけ、組み合わせの表を出す。 */
  showMatrix: boolean;
  checked: (varietyId: string | null, treatment: ReportPlotTreatment) => boolean;
  full: boolean;
};

export function plotPlan(input: UsageReportInput, postedName: string): ReportPlotPlan {
  const rows = plotRows(input);
  const combos = new Set(input.plots.map(plotComboKey));
  const checked = (varietyId: string | null, treatment: ReportPlotTreatment) =>
    combos.has(comboKey(varietyId, treatment));
  const only = rows[0]?.id ?? null;
  const defaults =
    rows.length === 1 && checked(only, { kind: "untreated" }) && checked(only, { kind: "posted" });
  return {
    rows,
    materials: reportPlotMaterials(input, postedName),
    showMatrix: rows.length > 1 || input.comparedMaterials.length > 0 || !defaults,
    checked,
    full: input.plots.length >= REPORT_PLOT_LIMIT,
  };
}

/** 品種1つなら「資材名区」、2つ以上なら「品種・資材名」。同じ組み合わせの2つ目からは番号を付ける。 */
export function defaultPlotName(plot: Plot, input: UsageReportInput, postedName: string): string {
  if (plot.treatment === null) return "";
  const key = treatmentKey(plot.treatment);
  const material = reportPlotMaterials(input, postedName).find((item) => item.key === key);
  if (material === undefined) return "";
  const variety = input.varieties.find(({ id }) => id === plot.varietyId);
  const base =
    plotRows(input).length > 1 && variety !== undefined
      ? `${variety.name.trim()}・${material.name}`
      : `${material.name}区`;
  const order = input.plots
    .filter((item) => plotComboKey(item) === plotComboKey(plot))
    .findIndex((item) => item.id === plot.id);
  return order > 0 ? `${base}（${order + 1}）` : base;
}

/**
 * 区の組み合わせを変えた後の入力に、自動の名前を付け直す。
 * 空の名前と、変える前の自動の名前のままの区だけを付け直し、書き換えた名前は残す。
 */
export function withAutoPlotNames(
  before: UsageReportInput,
  after: UsageReportInput,
  postedBefore: string,
  postedAfter: string = postedBefore,
): UsageReportInput {
  const previous = new Map(before.plots.map((plot) => [plot.id, plot]));
  return {
    ...after,
    plots: after.plots.map((plot) => {
      const old = previous.get(plot.id);
      const auto =
        old === undefined ||
        old.name.trim() === "" ||
        old.name === defaultPlotName(old, before, postedBefore);
      return auto ? { ...plot, name: defaultPlotName(plot, after, postedAfter) } : plot;
    }),
  };
}

/** 区を品種の順、資材の順に並べるための位置。資材を選んでいない区は後ろ。 */
function plotOrder(input: UsageReportInput, postedName: string) {
  const rows = plotRows(input).map((variety) => variety?.id ?? null);
  const columns = reportPlotMaterials(input, postedName).map(({ key }) => key);
  return (plot: Plot) => {
    if (plot.treatment === null) return Number.MAX_SAFE_INTEGER;
    const row = rows.indexOf(plot.varietyId);
    return (
      (row < 0 ? rows.length : row) * columns.length + columns.indexOf(treatmentKey(plot.treatment))
    );
  };
}

/** 組み合わせの区を、品種と資材の並びの位置に足す。40区を超える分は足さない。 */
function insertPlots(
  input: UsageReportInput,
  combos: { varietyId: string | null; treatment: ReportPlotTreatment }[],
  postedName: string,
): UsageReportInput {
  const order = plotOrder(input, postedName);
  let plots = input.plots;
  for (const { varietyId, treatment } of combos) {
    if (plots.length >= REPORT_PLOT_LIMIT) break;
    const plot = createReportPlot(varietyId, treatment);
    const at = plots.findIndex((item) => order(item) > order(plot));
    plots = at < 0 ? [...plots, plot] : plots.toSpliced(at, 0, plot);
  }
  return { ...input, plots };
}

/** 区の組み合わせを変える操作。どれも変えた後に自動の名前を付け直す。 */
export const reportPlotEdits = {
  toggle(
    input: UsageReportInput,
    varietyId: string | null,
    treatment: ReportPlotTreatment,
    checked: boolean,
    postedName: string,
  ): UsageReportInput {
    const key = comboKey(varietyId, treatment);
    const next = checked
      ? insertPlots(input, [{ varietyId, treatment }], postedName)
      : { ...input, plots: input.plots.filter((plot) => plotComboKey(plot) !== key) };
    return withAutoPlotNames(input, next, postedName);
  },

  /** 品種を足し、その品種で今ある資材の区をすべて作る。 */
  addVariety(input: UsageReportInput, name: string, postedName: string): UsageReportInput {
    if (input.varietyUnknown || input.varieties.length >= REPORT_PLOT_LIMIT) return input;
    const variety = { id: crypto.randomUUID(), name };
    const added = { ...input, varieties: [...input.varieties, variety] };
    const next = insertPlots(
      added,
      reportPlotMaterials(added, postedName).map(({ treatment }) => ({
        varietyId: variety.id,
        treatment,
      })),
      postedName,
    );
    return withAutoPlotNames(input, next, postedName);
  },

  /** 品種とその品種の区を外す。品種は1つ以上残す。 */
  removeVariety(input: UsageReportInput, varietyId: string, postedName: string): UsageReportInput {
    if (input.varieties.length <= 1) return input;
    const next = {
      ...input,
      varieties: input.varieties.filter(({ id }) => id !== varietyId),
      plots: input.plots.filter((plot) => plot.varietyId !== varietyId),
    };
    return withAutoPlotNames(input, next, postedName);
  },

  renameVariety(
    input: UsageReportInput,
    varietyId: string,
    name: string,
    postedName: string,
  ): UsageReportInput {
    const next = {
      ...input,
      varieties: input.varieties.map((variety) =>
        variety.id === varietyId ? { ...variety, name } : variety,
      ),
    };
    return withAutoPlotNames(input, next, postedName);
  },

  /** 不明・なしにすると品種を空にして区の品種を外す。戻すと空の品種を1つ作り、全区に付ける。 */
  setVarietyUnknown(
    input: UsageReportInput,
    unknown: boolean,
    postedName: string,
  ): UsageReportInput {
    const variety = { id: crypto.randomUUID(), name: "" };
    const next = {
      ...input,
      varietyUnknown: unknown,
      varieties: unknown ? [] : [variety],
      plots: input.plots.map((plot) => ({ ...plot, varietyId: unknown ? null : variety.id })),
    };
    return withAutoPlotNames(input, next, postedName);
  },

  /** 比較した資材を足し、品種ごとにその資材の区を作る。 */
  addComparedMaterial(input: UsageReportInput, name: string, postedName: string): UsageReportInput {
    if (input.comparedMaterials.length >= REPORT_PLOT_LIMIT) return input;
    const material = { id: crypto.randomUUID(), name };
    const added = { ...input, comparedMaterials: [...input.comparedMaterials, material] };
    const treatment: ReportPlotTreatment = { kind: "compared", comparedMaterialId: material.id };
    const next = insertPlots(
      added,
      plotRows(added).map((variety) => ({ varietyId: variety?.id ?? null, treatment })),
      postedName,
    );
    return withAutoPlotNames(input, next, postedName);
  },

  removeComparedMaterial(
    input: UsageReportInput,
    materialId: string,
    postedName: string,
  ): UsageReportInput {
    const next = {
      ...input,
      comparedMaterials: input.comparedMaterials.filter(({ id }) => id !== materialId),
      plots: input.plots.filter(
        (plot) =>
          plot.treatment?.kind !== "compared" || plot.treatment.comparedMaterialId !== materialId,
      ),
    };
    return withAutoPlotNames(input, next, postedName);
  },

  /** 投稿した資材の区を1つ足す（量や回数の違いを分ける区）。 */
  addPostedPlot(input: UsageReportInput, postedName: string): UsageReportInput {
    const varietyId = plotRows(input)[0]?.id ?? null;
    const next = insertPlots(input, [{ varietyId, treatment: { kind: "posted" } }], postedName);
    return withAutoPlotNames(input, next, postedName);
  },

  removePlot(input: UsageReportInput, plotId: string, postedName: string): UsageReportInput {
    const next = { ...input, plots: input.plots.filter((plot) => plot.id !== plotId) };
    return withAutoPlotNames(input, next, postedName);
  },

  /** 資材を選んでいない区（区に資材を持たない下書き）に資材を付ける。 */
  setTreatment(
    input: UsageReportInput,
    plotId: string,
    treatment: ReportPlotTreatment,
    postedName: string,
  ): UsageReportInput {
    const next = {
      ...input,
      plots: input.plots.map((plot) => (plot.id === plotId ? { ...plot, treatment } : plot)),
    };
    return withAutoPlotNames(input, next, postedName);
  },
};

/** グラフの行を区にそろえる。区ごとにちょうど1行にし、行の無い区には空の値の行を足す。 */
export function graphWithPlots(graph: Graph, plots: Plot[]): Graph {
  const aligned =
    graph.rows.length === plots.length &&
    plots.every((plot, index) => graph.rows[index]?.plotId === plot.id);
  if (aligned) return graph;
  return {
    ...graph,
    rows: plots.map(
      (plot) =>
        graph.rows.find((row) => row.plotId === plot.id) ?? {
          id: crypto.randomUUID(),
          plotId: plot.id,
          label: "",
          value: "",
        },
    ),
  };
}

export type ReportPlotGroup = {
  key: string;
  /** 品種ごとにまとめるときの品種名。まとめないときは null。 */
  variety: string | null;
  plots: { plot: Plot; series: ReportPlotSeries }[];
};

export type ReportPlotLayout = {
  groups: ReportPlotGroup[];
  /** 使った資材の色の凡例。品種ごとにまとめるときか、比較した資材があるときだけ。 */
  legend: { key: string; label: string; series: ReportPlotSeries }[] | null;
  /** 区の id（グラフの行の区）から色を引く。区に当たらない行は行の順で決める。 */
  series: (plotId: string | null, index: number) => ReportPlotSeries;
};

function orderSeries(index: number): ReportPlotSeries {
  if (index === 0) return "1";
  if (index === 1) return "2";
  return comparedSeries(index - 2);
}

/**
 * 記事とプレビューでの区の並びと色。全区が使った資材を持つときは資材で塗り、
 * さらに品種が2つ以上なら品種ごとにまとめる。資材を持たない区がある既存のレポートは、区の順に1列で並べ、区の順で塗る。
 */
export function reportPlotLayout(input: UsageReportInput, postedName: string): ReportPlotLayout {
  const byMaterial = input.plots.length > 0 && input.plots.every((plot) => plot.treatment !== null);
  const materials = new Map(
    reportPlotMaterials(input, postedName).map((material) => [material.key, material]),
  );
  const seriesOf = new Map(
    input.plots.map((plot, index) => [
      plot.id,
      (byMaterial && plot.treatment !== null
        ? materials.get(treatmentKey(plot.treatment))?.series
        : undefined) ?? orderSeries(index),
    ]),
  );
  const series = (plotId: string | null, index: number) =>
    (plotId === null ? undefined : seriesOf.get(plotId)) ?? orderSeries(index);
  const entry = (plot: Plot, index: number) => ({ plot, series: series(plot.id, index) });
  const grouped =
    byMaterial &&
    input.varieties.length > 1 &&
    input.plots.every((plot) => input.varieties.some(({ id }) => id === plot.varietyId));
  const groups: ReportPlotGroup[] = grouped
    ? input.varieties.flatMap((variety) => {
        const plots = input.plots.flatMap((plot, index) =>
          plot.varietyId === variety.id ? [entry(plot, index)] : [],
        );
        return plots.length > 0 ? [{ key: variety.id, variety: variety.name.trim(), plots }] : [];
      })
    : [{ key: "all", variety: null, plots: input.plots.map(entry) }];
  const used = new Set(
    input.plots.flatMap((plot) => (plot.treatment === null ? [] : [treatmentKey(plot.treatment)])),
  );
  const legend =
    byMaterial && (grouped || input.comparedMaterials.length > 0)
      ? [...materials.values()]
          .filter(({ key }) => used.has(key))
          .map(({ key, name, role, series: tone }) => ({
            key,
            label: role === name ? name : `${name}（${role}）`,
            series: tone,
          }))
      : null;
  return { groups, legend, series };
}

export type ReportGraphSection = {
  key: string;
  heading: string | null;
  rows: { id: string; label: string; value: string; series: ReportPlotSeries }[];
};

/** グラフの行を区の並び（品種ごとの節）に分ける。まとめないときは行の順のまま1節にする。 */
export function graphSections(
  graph: Graph,
  plots: UsageReportInput["plots"],
  layout: ReportPlotLayout,
): ReportGraphSection[] {
  if (layout.groups.every((group) => group.variety === null))
    return [
      {
        key: "all",
        heading: null,
        rows: graph.rows.map((row, index) => {
          const plotIndex = plots.findIndex((plot) => plot.id === row.plotId);
          return {
            id: row.id,
            label: plots[plotIndex]?.name.trim() || row.label.trim() || `区 ${index + 1}`,
            value: row.value,
            series: layout.series(row.plotId, plotIndex >= 0 ? plotIndex : index),
          };
        }),
      },
    ];
  return layout.groups.map((group) => ({
    key: group.key,
    heading: group.variety,
    rows: group.plots.flatMap(({ plot, series }) => {
      const row = graph.rows.find((item) => item.plotId === plot.id);
      return row === undefined
        ? []
        : [{ id: row.id, label: plot.name.trim() || row.label.trim(), value: row.value, series }];
    }),
  }));
}
