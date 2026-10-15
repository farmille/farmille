"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  createReportGraph,
  createReportMeasurement,
  createReportPlot,
  type UsageReportFieldErrors,
  type UsageReportInput,
} from "@/lib/usage-report";

import { METRIC_UNIT, ReportCellEditor, UNITS } from "./ReportCellEditor";
import { Badge } from "@/components/Badge";
import { Checkbox, Field, Input, Notice, Textarea } from "@/components/form";
import { reportPlotColor } from "@/components/ReportPlotColor";
import { toast } from "@/components/Toaster";

import { css, cva, cx } from "../../../../../../styled-system/css";

import { GroupHeading, pillButtonRecipe, reportToasterId } from "./ReportFormParts";
import { ReportGraphEditor, editKey, readCell, type EditTarget } from "./ReportGraphEditor";

type Measurement = UsageReportInput["measurements"][number];
type Graph = Measurement["graphs"][number];
type Plot = UsageReportInput["plots"][number];
type Row = Graph["rows"][number];

export const PLOT_GUIDE =
  "資材の使い方（施用方法・希釈倍率・使用量・回数など）と、あれば他の区と違う条件を記入してください。資材を使っていない区は「資材なし」と書き、他の区と違う条件があれば記入してください。";

const MOBILE_QUERY = "(max-width:640px)";
function subscribeMobile(callback: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function useMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => true,
  );
}

const sectionHeading = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    mt: "6.5",
    mb: "1",
    textStyle: "title",
    fontWeight: "extrabold",
  },
  variants: { lead: { true: { mt: "1.5" }, false: {} } },
  defaultVariants: { lead: false },
});

const sectionGuide = css({ mb: "2.5", textStyle: "supporting", color: "text.muted" });

const emptyGraphs = css({
  mt: "3",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "border.strong",
  borderRadius: "card",
  p: "4.5",
  textAlign: "center",
  textStyle: "supporting",
  color: "text.subtle",
});

const addRow = css({ display: "flex", flexWrap: "wrap", gap: "2", mt: "3" });

const footnote = css({ mt: "2.5", fontSize: "sm", lineHeight: "prose", color: "text.muted" });

const plotCard = css({
  mt: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  px: "3.5",
  py: "3",
});

const plotHead = css({ display: "flex", alignItems: "center", gap: "2", fontWeight: "extrabold" });

const swatch = css({ w: "3", h: "3", borderRadius: "mark", bg: "currentColor" });

const plotGrid = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "2.5",
  mt: "2",
  tab: { gridTemplateColumns: "{sizes.44} 1fr" },
});

const errorGap = css({ mt: "2" });

const blankRow = (plotId: string): Row => ({
  id: crypto.randomUUID(),
  plotId,
  label: "",
  value: "",
});

function withPlots(
  input: UsageReportInput,
  plots: Plot[],
  restored?: Map<string, Row>,
): UsageReportInput {
  return {
    ...input,
    plots,
    measurements: input.measurements.map((measurement) => ({
      ...measurement,
      graphs: measurement.graphs.map((graph) => ({
        ...graph,
        rows: plots.map((plot) => {
          const saved = restored?.get(graph.id);
          return (
            graph.rows.find((row) => row.plotId === plot.id) ??
            (saved && saved.plotId === plot.id ? saved : blankRow(plot.id))
          );
        }),
      })),
    })),
  };
}

function restorePlot(
  input: UsageReportInput,
  plot: Plot,
  index: number,
  rows: Map<string, Row>,
): UsageReportInput {
  const plots = [...input.plots];
  plots.splice(index, 0, plot);
  return withPlots(input, plots, rows);
}

function restoreGraph(
  input: UsageReportInput,
  measurement: Measurement,
  measurementIndex: number,
  removed: Graph,
  graphIndex: number,
): UsageReportInput {
  const graph = {
    ...removed,
    rows: input.plots.map(
      (plot) => removed.rows.find((row) => row.plotId === plot.id) ?? blankRow(plot.id),
    ),
  };
  const measurements = [...input.measurements];
  const existing = measurements.find((item) => item.id === measurement.id);
  if (existing) {
    const graphs = [...existing.graphs];
    graphs.splice(graphIndex, 0, graph);
    measurements[measurements.indexOf(existing)] = { ...existing, graphs };
  } else measurements.splice(measurementIndex, 0, { ...measurement, graphs: [graph] });
  return { ...input, measurements };
}

export function ReportComparisonFields({
  input,
  onChange,
  errors,
  manualUnits,
  onManualUnit,
}: {
  input: UsageReportInput;
  onChange: Dispatch<SetStateAction<UsageReportInput>>;
  errors: UsageReportFieldErrors;
  manualUnits: ReadonlySet<string>;
  onManualUnit: (id: string) => void;
}) {
  const mobile = useMobile();
  const [ed, setEd] = useState<EditTarget | null>(null);
  const [periodHints, setPeriodHints] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!ed) return;
    const close = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-cell-editor], [data-edit]")) return;
      setEd(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [ed]);

  const cards = input.measurements.flatMap((measurement) =>
    measurement.kind === "numeric"
      ? measurement.graphs.map((graph, graphIndex) => ({ measurement, graph, graphIndex }))
      : [],
  );
  const cardOf = (graphId: string) => cards.find((card) => card.graph.id === graphId);

  function updateMeasurement(next: Measurement) {
    onChange({
      ...input,
      measurements: input.measurements.map((item) => (item.id === next.id ? next : item)),
    });
  }
  function updateGraph(measurement: Measurement, next: Graph) {
    updateMeasurement({
      ...measurement,
      graphs: measurement.graphs.map((item) => (item.id === next.id ? next : item)),
    });
  }
  function updatePlot(id: string, values: Partial<Plot>) {
    onChange({
      ...input,
      plots: input.plots.map((plot) => (plot.id === id ? { ...plot, ...values } : plot)),
    });
  }
  function sequence(): EditTarget[] {
    return cards.flatMap(({ graph }, index) => [
      { k: "axis", g: graph.id },
      ...(index === 0
        ? input.plots.map((plot): EditTarget => ({ k: "name", g: graph.id, p: plot.id }))
        : []),
      ...input.plots.map((plot): EditTarget => ({ k: "val", g: graph.id, p: plot.id })),
    ]);
  }
  function isEmpty(target: EditTarget) {
    const card = cardOf(target.g);
    if (target.k === "axis") return !card?.measurement.name.trim();
    if (target.k === "name") return !input.plots.find((plot) => plot.id === target.p)?.name.trim();
    if (target.k === "val")
      return (
        readCell(card?.graph.rows.find((row) => row.plotId === target.p)?.value ?? "").kind !==
        "num"
      );
    return false;
  }
  function goNext(from: EditTarget) {
    const seq = sequence();
    const index = seq.findIndex(
      (item) => editKey(item) === editKey(from) && (item.k === "name" || item.g === from.g),
    );
    setEd(seq.slice(index + 1).find(isEmpty) ?? seq.find(isEmpty) ?? null);
  }
  function next(from: EditTarget) {
    if (from.k === "val") {
      const position = input.plots.findIndex((plot) => plot.id === from.p);
      const after = input.plots[position + 1];
      if (after) {
        setEd({ k: "val", g: from.g, p: after.id });
        return;
      }
    }
    goNext(from);
  }
  function edit(target: EditTarget) {
    const card = cardOf(target.g);
    if (target.k === "val" && card && !card.measurement.name.trim()) {
      toast("先に、左上の調査項目と単位を書きます", { duration: 1800, toasterId: reportToasterId });
      setEd({ k: "axis", g: target.g });
      return;
    }
    setEd(target);
  }

  function addPlot(graphId: string) {
    const plot = createReportPlot();
    onChange(withPlots(input, [...input.plots, plot]));
    setEd({ k: "name", g: graphId, p: plot.id });
  }
  function removePlot(plotId: string) {
    if (input.plots.length <= 2) {
      toast("区は2つ以上必要です", { duration: 1800, toasterId: reportToasterId });
      return;
    }
    const index = input.plots.findIndex((plot) => plot.id === plotId);
    const plot = input.plots[index];
    if (!plot) return;
    const rows = new Map<string, Row>();
    for (const measurement of input.measurements)
      for (const graph of measurement.graphs) {
        const row = graph.rows.find((item) => item.plotId === plotId);
        if (row) rows.set(graph.id, row);
      }
    setEd(null);
    onChange(
      withPlots(
        input,
        input.plots.filter((item) => item.id !== plotId),
      ),
    );
    toast(`「${plot.name || "区"}」を削除しました`, {
      duration: 6000,
      toasterId: reportToasterId,
      action: {
        label: "元に戻す",
        onClick: () => onChange((current) => restorePlot(current, plot, index, rows)),
      },
    });
  }
  function removeGraph(measurement: Measurement, graphIndex: number) {
    const graph = measurement.graphs[graphIndex];
    if (!graph) return;
    setEd(null);
    const graphs = measurement.graphs.filter((item) => item.id !== graph.id);
    onChange({
      ...input,
      measurements: graphs.length
        ? input.measurements.map((item) =>
            item.id === measurement.id ? { ...item, graphs } : item,
          )
        : input.measurements.filter((item) => item.id !== measurement.id),
    });
    const measurementIndex = input.measurements.indexOf(measurement);
    toast("グラフを削除しました", {
      duration: 6000,
      toasterId: reportToasterId,
      action: {
        label: "元に戻す",
        onClick: () =>
          onChange((current) =>
            restoreGraph(current, measurement, measurementIndex, graph, graphIndex),
          ),
      },
    });
  }
  function addPeriod(measurement: Measurement, graphIndex: number) {
    const graph = createReportGraph(input.plots);
    const graphs = [...measurement.graphs];
    graphs.splice(graphIndex + 1, 0, graph);
    updateMeasurement({ ...measurement, graphs });
    setPeriodHints(new Set([...periodHints, measurement.id]));
    setEd({ k: "title", g: graph.id });
  }

  const textMeasurements = input.measurements.filter((item) => item.kind === "text");
  function updateText(measurement: Measurement | undefined, body: string) {
    const measurements = input.measurements.filter((item) => item.id !== measurement?.id);
    if (body.trim())
      measurements.push({
        ...(measurement ?? createReportMeasurement(input.plots)),
        kind: "text",
        name: measurement?.name || "グラフにしにくい調査結果",
        body,
        graphs: [],
      });
    onChange({ ...input, measurements });
  }

  return (
    <>
      <GroupHeading title="比較・使用結果" note="何と何を比べて、何を測ったか" />
      <div>
        <div>
          <h3 className={sectionHeading({ lead: true })}>
            結果のグラフ <Badge variant="required">必須</Badge>
          </h3>
          <p className={sectionGuide}>
            グラフの ✎ の付いた欄を押して書き込みます。書き終えたら Enter で次の欄へ進みます。
          </p>
          {errors.measurements && <Notice tone="error">{errors.measurements}</Notice>}
          {cards.length === 0 && (
            <div className={emptyGraphs}>グラフがありません。下のボタンから追加します。</div>
          )}
          {cards.map(({ measurement, graph, graphIndex }, index) => {
            const measurementIndex = input.measurements.indexOf(measurement);
            const nameError = errors[`measurements.${measurementIndex}.name`];
            const valueError =
              errors[`measurements.${measurementIndex}.values`] ??
              errors[`measurements.${measurementIndex}.plots`];
            return (
              <ReportGraphEditor
                key={graph.id}
                measurement={measurement}
                graph={graph}
                plots={input.plots}
                graphNumber={index + 1}
                mobile={mobile}
                active={ed}
                onEdit={edit}
                onAddPlot={() => addPlot(graph.id)}
                onRemovePlot={removePlot}
                onRemove={() => removeGraph(measurement, graphIndex)}
                onAddPeriod={() => addPeriod(measurement, graphIndex)}
                periodHint={periodHints.has(measurement.id) || measurement.graphs.length > 1}
              >
                {nameError && (
                  <Notice tone="error" className={errorGap}>
                    {nameError}
                  </Notice>
                )}
                {valueError && (
                  <Notice tone="error" className={errorGap}>
                    {valueError}
                  </Notice>
                )}
                {ed?.g === graph.id && (
                  <ReportCellEditor
                    target={ed}
                    graphNumber={index + 1}
                    measurement={measurement}
                    graph={graph}
                    plots={input.plots}
                    mobile={mobile}
                    unitIsManual={manualUnits.has(measurement.id)}
                    onManualUnit={() => onManualUnit(measurement.id)}
                    onMeasurementChange={updateMeasurement}
                    onGraphChange={(next) => updateGraph(measurement, next)}
                    onPlotChange={updatePlot}
                    onRangeAll={(scope) => {
                      onChange({
                        ...input,
                        plots: input.plots.map((plot) => ({ ...plot, scope })),
                      });
                      toast("調査した範囲を全ての区に入れました", {
                        duration: 1800,
                        toasterId: reportToasterId,
                      });
                    }}
                    onRemovePlot={removePlot}
                    onNext={next}
                    onClose={() => setEd(null)}
                  />
                )}
              </ReportGraphEditor>
            );
          })}
          <div className={addRow}>
            <button
              type="button"
              className={pillButtonRecipe({ tone: "dashed", strong: true })}
              disabled={input.measurements.length >= 30}
              onClick={() =>
                onChange({
                  ...input,
                  measurements: [...input.measurements, createReportMeasurement(input.plots)],
                })
              }
            >
              ＋ 別の調査項目のグラフを追加
            </button>
          </div>
          <div className={footnote}>
            ※ 誤差や有意差の記号も、数値のあとにそのまま書けます（例：41.7±0.8 a、82
            ＊）。±はエラーバーになります。記号の意味は、いちばん下の欄に書けます。
          </div>
        </div>

        <div>
          <h3 className={sectionHeading({ lead: true })}>
            区の説明 <Badge variant="required">必須</Badge>
          </h3>
          <p className={sectionGuide}>
            グラフの区ごとに、調査した範囲と、この区の説明。{PLOT_GUIDE}
          </p>
          {errors.plots && <Notice tone="error">{errors.plots}</Notice>}
          {input.plots.map((plot, index) => {
            const nameError = errors[`plots.${index}.name`];
            return (
              <div key={plot.id} className={plotCard}>
                <div className={plotHead}>
                  <span className={cx(swatch, reportPlotColor(index))} />
                  {plot.name || "（区の名前）"}
                </div>
                {nameError && (
                  <Notice tone="error" className={errorGap}>
                    {nameError}
                  </Notice>
                )}
                <div className={plotGrid}>
                  <div>
                    <Input
                      label="調査した範囲（必須）"
                      labelSize="sm"
                      error={errors[`plots.${index}.scope`]}
                      placeholder="1区10株、3反復"
                      value={plot.scope}
                      onChange={(event) => updatePlot(plot.id, { scope: event.target.value })}
                    />
                    <button
                      type="button"
                      className={cx(
                        pillButtonRecipe({ tone: "quiet", size: "xs", strong: true }),
                        css({ mt: "1.5" }),
                      )}
                      onClick={() => {
                        onChange({
                          ...input,
                          plots: input.plots.map((item) => ({ ...item, scope: plot.scope })),
                        });
                        toast("調査した範囲を全ての区に入れました", {
                          duration: 1800,
                          toasterId: reportToasterId,
                        });
                      }}
                    >
                      この範囲を全ての区に入れる
                    </button>
                  </div>
                  <div>
                    <Textarea
                      label="この区の説明（必須）"
                      labelSize="sm"
                      error={errors[`plots.${index}.description`]}
                      placeholder={PLOT_GUIDE}
                      value={plot.description}
                      onChange={(event) => updatePlot(plot.id, { description: event.target.value })}
                    />
                    <Notice tone="neutral" title="記入例" className={css({ mt: "1.5" })}>
                      {index === 0
                        ? "〇〇は使っていない。かん水と施肥は処理区と同じ。"
                        : "〇〇を1,000倍に希釈し（希釈倍率）、10aあたり200L（使用量）を葉面散布（施用方法）。7日おきに3回（回数）。元肥は慣行の75%に減らした。"}
                    </Notice>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Field requirement="required" error={errors.methodDetailsAck}>
          <Checkbox
            variant="row"
            checked={input.methodDetailsAck}
            onCheckedChange={(methodDetailsAck) => onChange({ ...input, methodDetailsAck })}
          >
            資材を使った区の説明に、施用方法・希釈倍率・使用量・回数を明記しました
          </Checkbox>
        </Field>
        <h3 className={sectionHeading()}>
          グラフにしにくい調査結果 <Badge variant="optional">任意</Badge>
        </h3>
        <p className={sectionGuide}>
          数値にしにくい変化や様子、区ごとの違いなど。±や＊を使った場合の意味もここに書けます。
        </p>
        {(textMeasurements.length > 0 ? textMeasurements : [undefined]).map((measurement) => (
          <Textarea
            key={measurement?.id ?? "qualitative"}
            hideLabel
            label={measurement?.name || "グラフにしにくい調査結果"}
            placeholder="グラフにしにくい変化や様子"
            value={measurement?.body ?? ""}
            onChange={(event) => updateText(measurement, event.target.value)}
          />
        ))}
        <Notice tone="neutral" title="記入例" className={css({ mt: "2" })}>
          ・処理区では11月以降も葉色が濃く、成り疲れが見られなかった。無処理区は12月に入って草勢が落ち、下葉の黄化が目立った。
          <br />
          ・奇形（花芽飛び）の発生節数は、処理区が平均1.2節、無処理区が2.5節（平均値±標準誤差、n=30、5%水準で有意差あり）。
        </Notice>
      </div>
      <datalist id="metricList">
        {[...METRIC_UNIT.keys()].map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="unitList">
        {UNITS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
    </>
  );
}
