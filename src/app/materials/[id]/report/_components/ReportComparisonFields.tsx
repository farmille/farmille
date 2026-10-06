"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import {
  createReportGraph,
  createReportMeasurement,
  createReportPlot,
  type UsageReportFieldErrors,
  type UsageReportInput,
} from "@/lib/usage-report";

import { METRIC_UNIT, ReportCellEditor, UNITS } from "./ReportCellEditor";
import { Badge, Need, plotColorClass } from "./ReportFormParts";
import { ReportGraphEditor, editKey, readCell, type EditTarget } from "./ReportGraphEditor";

type Measurement = UsageReportInput["measurements"][number];
type Graph = Measurement["graphs"][number];
type Plot = UsageReportInput["plots"][number];
type Row = Graph["rows"][number];

type Toast =
  | { kind: "info"; message: string }
  | {
      kind: "graph";
      message: string;
      measurement: Measurement;
      graph: Graph;
      measurementIndex: number;
      graphIndex: number;
    }
  | { kind: "plot"; message: string; plot: Plot; index: number; rows: Map<string, Row> };

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

const blankRow = (plotId: string): Row => ({
  id: crypto.randomUUID(),
  plotId,
  label: "",
  value: "",
});

/** 見本の pane 4「比較・使用結果」（試作C2）。区は全グラフで共有する */
export function ReportComparisonFields({
  input,
  onChange,
  errors,
  manualUnits,
  onManualUnit,
}: {
  input: UsageReportInput;
  onChange: (input: UsageReportInput) => void;
  errors: UsageReportFieldErrors;
  manualUnits: ReadonlySet<string>;
  onManualUnit: (id: string) => void;
}) {
  const mobile = useMobile();
  const [ed, setEd] = useState<EditTarget | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [periodHints, setPeriodHints] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.kind === "info" ? 1800 : 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 書き込み枠とグラフの外を押したら閉じる（見本の pointerdown）
  useEffect(() => {
    if (!ed) return;
    const close = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".ed") || event.target.closest("[data-edit]")) return;
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
  function withPlots(plots: Plot[], restored?: Map<string, Row>): UsageReportInput {
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

  // 書く順番：項目と単位 → 区の名前（最初のグラフだけ） → 数値（見本の seq()）
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
      setToast({ kind: "info", message: "先に、左上の調査項目と単位を書きます" });
      setEd({ k: "axis", g: target.g });
      return;
    }
    setEd(target);
  }

  function addPlot(graphId: string) {
    const plot = createReportPlot();
    onChange(withPlots([...input.plots, plot]));
    setEd({ k: "name", g: graphId, p: plot.id });
  }
  function removePlot(plotId: string) {
    if (input.plots.length <= 2) {
      setToast({ kind: "info", message: "区は2つ以上必要です" });
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
    onChange(withPlots(input.plots.filter((item) => item.id !== plotId)));
    setToast({
      kind: "plot",
      message: `「${plot.name || "区"}」を削除しました`,
      plot,
      index,
      rows,
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
    setToast({
      kind: "graph",
      message: "グラフを削除しました",
      measurement,
      graph,
      graphIndex,
      measurementIndex: input.measurements.indexOf(measurement),
    });
  }
  function undo() {
    if (!toast || toast.kind === "info") return;
    if (toast.kind === "plot") {
      const plots = [...input.plots];
      plots.splice(toast.index, 0, toast.plot);
      onChange(withPlots(plots, toast.rows));
    } else {
      const graph = {
        ...toast.graph,
        rows: input.plots.map(
          (plot) => toast.graph.rows.find((row) => row.plotId === plot.id) ?? blankRow(plot.id),
        ),
      };
      const measurements = [...input.measurements];
      const existing = measurements.find((item) => item.id === toast.measurement.id);
      if (existing) {
        const graphs = [...existing.graphs];
        graphs.splice(toast.graphIndex, 0, graph);
        measurements[measurements.indexOf(existing)] = { ...existing, graphs };
      } else
        measurements.splice(toast.measurementIndex, 0, { ...toast.measurement, graphs: [graph] });
      onChange({ ...input, measurements });
    }
    setToast(null);
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
      <h3 className="grp" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
        比較・使用結果<small>何と何を比べて、何を測ったか</small>
      </h3>
      <div id="s4">
        <div id="itemsField">
          <h3>
            結果のグラフ <Badge required />
            <Need message={errors.measurements} />
          </h3>
          <p className="guide">
            グラフの ✎ の付いた欄を押して書き込みます。書き終えたら Enter で次の欄へ進みます。
          </p>
          {cards.length === 0 && (
            <div className="nocards">グラフがありません。下のボタンから追加します。</div>
          )}
          {cards.map(({ measurement, graph, graphIndex }, index) => {
            const measurementIndex = input.measurements.indexOf(measurement);
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
                <Need block message={errors[`measurements.${measurementIndex}.name`]} />
                <Need
                  block
                  message={
                    errors[`measurements.${measurementIndex}.values`] ??
                    errors[`measurements.${measurementIndex}.plots`]
                  }
                />
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
                      setToast({ kind: "info", message: "調査した範囲を全ての区に入れました" });
                    }}
                    onRemovePlot={removePlot}
                    onNext={next}
                    onClose={() => setEd(null)}
                  />
                )}
              </ReportGraphEditor>
            );
          })}
          <div className="adds">
            <button
              type="button"
              className="add"
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
          <div className="note-s">
            ※ 誤差や有意差の記号も、数値のあとにそのまま書けます（例：41.7±0.8 a、82
            ＊）。±はエラーバーになります。記号の意味は、いちばん下の欄に書けます。
          </div>
        </div>

        <div id="plotsField">
          <h3>
            区の説明 <Badge required />
            <Need message={errors.plots} />
          </h3>
          <p className="guide">グラフの区ごとに、調査した範囲と、この区の説明。{PLOT_GUIDE}</p>
          {input.plots.map((plot, index) => (
            <div key={plot.id} className="plotd">
              <div className="plotd-h">
                <span className={`sw ${plotColorClass(index)}`} />
                {plot.name || "（区の名前）"}
                <Need message={errors[`plots.${index}.name`]} />
              </div>
              <div className="pg">
                <div>
                  <label className="lbl" htmlFor={`plot-scope-${plot.id}`}>
                    調査した範囲（必須）
                  </label>
                  <input
                    id={`plot-scope-${plot.id}`}
                    className="input"
                    placeholder="例）1区10株、3反復"
                    value={plot.scope}
                    onChange={(event) => updatePlot(plot.id, { scope: event.target.value })}
                  />
                  <Need block message={errors[`plots.${index}.scope`]} />
                  <button
                    type="button"
                    className="mini"
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      onChange({
                        ...input,
                        plots: input.plots.map((item) => ({ ...item, scope: plot.scope })),
                      });
                      setToast({ kind: "info", message: "調査した範囲を全ての区に入れました" });
                    }}
                  >
                    この範囲を全ての区に入れる
                  </button>
                </div>
                <div>
                  <label className="lbl" htmlFor={`plot-desc-${plot.id}`}>
                    この区の説明（必須）
                  </label>
                  <textarea
                    id={`plot-desc-${plot.id}`}
                    className="input"
                    data-desc
                    placeholder={PLOT_GUIDE}
                    value={plot.description}
                    onChange={(event) => updatePlot(plot.id, { description: event.target.value })}
                  />
                  <Need block message={errors[`plots.${index}.description`]} />
                  <div className="ex ex-s">
                    <b>記入例</b>
                    {index === 0
                      ? "〇〇は使っていない。かん水と施肥は処理区と同じ。"
                      : "〇〇を1,000倍に希釈し（希釈倍率）、10aあたり200L（使用量）を葉面散布（施用方法）。7日おきに3回（回数）。元肥は慣行の75%に減らした。"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div id="usageField">
          <label className="chk2">
            <input
              type="checkbox"
              checked={input.methodDetailsAck}
              onChange={(event) => onChange({ ...input, methodDetailsAck: event.target.checked })}
            />
            資材を使った区の説明に、施用方法・希釈倍率・使用量・回数を明記しました{" "}
            <Badge required />
            <Need message={errors.methodDetailsAck} />
          </label>
        </div>
        <h3>
          グラフにしにくい調査結果 <Badge />
        </h3>
        <p className="guide">
          数値にしにくい変化や様子、区ごとの違いなど。±や＊を使った場合の意味もここに書けます。
        </p>
        {(textMeasurements.length > 0 ? textMeasurements : [undefined]).map((measurement) => (
          <textarea
            key={measurement?.id ?? "qualitative"}
            className="input"
            style={{ minHeight: 96 }}
            aria-label={measurement?.name || "グラフにしにくい調査結果"}
            placeholder="グラフにしにくい変化や様子"
            value={measurement?.body ?? ""}
            onChange={(event) => updateText(measurement, event.target.value)}
          />
        ))}
        <div className="ex">
          <b>記入例</b>
          <br />
          ・処理区では11月以降も葉色が濃く、成り疲れが見られなかった。無処理区は12月に入って草勢が落ち、下葉の黄化が目立った。
          <br />
          ・奇形（花芽飛び）の発生節数は、処理区が平均1.2節、無処理区が2.5節（平均値±標準誤差、n=30、5%水準で有意差あり）。
        </div>
        {toast && (
          <div className="toast on" role="status">
            <span>{toast.message}</span>
            {toast.kind !== "info" && (
              <button type="button" onClick={undo}>
                元に戻す
              </button>
            )}
          </div>
        )}
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
