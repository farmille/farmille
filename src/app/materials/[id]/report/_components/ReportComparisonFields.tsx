"use client";

import { Checkbox } from "@/components/Checkbox";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import {
  createReportPlot,
  createReportGraph,
  createReportMeasurement,
  type UsageReportInput,
  type UsageReportFieldErrors,
} from "@/lib/usage-report";
import { css } from "../../../../../../styled-system/css";
import { FieldLabel, FieldError } from "./FormUI";
import { ReportGraphEditor, plotHint } from "./ReportGraphEditor";

type Measurement = UsageReportInput["measurements"][number];
const card = css({
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  p: "3",
  display: "grid",
  gap: "3",
});
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
  const [removed, setRemoved] = useState<{
    measurement: Measurement;
    graph: Measurement["graphs"][number];
    measurementIndex: number;
    graphIndex: number;
  } | null>(null);
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), 8000);
    return () => clearTimeout(timer);
  }, [removed]);
  function updateMeasurement(next: Measurement) {
    onChange({
      ...input,
      measurements: input.measurements.map((item) => (item.id === next.id ? next : item)),
    });
  }
  function updatePlot(id: string, values: Partial<UsageReportInput["plots"][number]>) {
    onChange({
      ...input,
      plots: input.plots.map((plot) => (plot.id === id ? { ...plot, ...values } : plot)),
    });
  }
  function changePlots(plots: UsageReportInput["plots"]) {
    onChange({
      ...input,
      plots,
      measurements: input.measurements.map((measurement) => ({
        ...measurement,
        graphs: measurement.graphs.map((graph) => ({
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
        })),
      })),
    });
  }
  function removeGraph(measurement: Measurement, graphIndex: number) {
    const graph = measurement.graphs[graphIndex];
    if (!graph) return;
    setRemoved({
      measurement,
      graph,
      graphIndex,
      measurementIndex: input.measurements.indexOf(measurement),
    });
    const graphs = measurement.graphs.filter((item) => item.id !== graph.id);
    onChange({
      ...input,
      measurements: graphs.length
        ? input.measurements.map((item) =>
            item.id === measurement.id ? { ...item, graphs } : item,
          )
        : input.measurements.filter((item) => item.id !== measurement.id),
    });
  }
  function restoreGraph() {
    if (!removed) return;
    const graph = {
      ...removed.graph,
      rows: input.plots.map(
        (plot) =>
          removed.graph.rows.find((row) => row.plotId === plot.id) ?? {
            id: crypto.randomUUID(),
            plotId: plot.id,
            label: "",
            value: "",
          },
      ),
    };
    const existing = input.measurements.find((item) => item.id === removed.measurement.id);
    const measurements = [...input.measurements];
    if (existing) {
      const graphs = [...existing.graphs];
      graphs.splice(removed.graphIndex, 0, graph);
      measurements[measurements.indexOf(existing)] = { ...existing, graphs };
    } else
      measurements.splice(removed.measurementIndex, 0, { ...removed.measurement, graphs: [graph] });
    onChange({ ...input, measurements });
    setRemoved(null);
  }
  const textMeasurements = input.measurements.filter((item) => item.kind === "text");
  const graphs = input.measurements.flatMap((measurement) =>
    measurement.kind === "numeric"
      ? measurement.graphs.map((graph, graphIndex) => ({ measurement, graph, graphIndex }))
      : [],
  );
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
    <div className={css({ display: "grid", gap: "4", minW: "0" })}>
      <FieldLabel required>結果のグラフ</FieldLabel>
      <p>鉛筆マークを押して、調査項目・区の名前・数値を入力してください。</p>
      <FieldError message={errors.measurements} />
      {graphs.map(({ measurement, graph, graphIndex }, index) => (
        <div key={graph.id}>
          <ReportGraphEditor
            measurement={measurement}
            graph={graph}
            plots={input.plots}
            graphNumber={index + 1}
            onMeasurementChange={updateMeasurement}
            unitIsManual={manualUnits.has(measurement.id)}
            onManualUnit={() => onManualUnit(measurement.id)}
            onPlotChange={updatePlot}
            onAddPlot={() => changePlots([...input.plots, createReportPlot()])}
            onRemovePlot={(id) => changePlots(input.plots.filter((plot) => plot.id !== id))}
            onRemove={() => removeGraph(measurement, graphIndex)}
            onAddPeriod={() => {
              const next = [...measurement.graphs];
              next.splice(graphIndex + 1, 0, createReportGraph(input.plots));
              updateMeasurement({ ...measurement, graphs: next });
            }}
          />
          <FieldError
            message={errors[`measurements.${input.measurements.indexOf(measurement)}.name`]}
          />
          <FieldError
            message={
              errors[`measurements.${input.measurements.indexOf(measurement)}.values`] ||
              errors[`measurements.${input.measurements.indexOf(measurement)}.plots`]
            }
          />
        </div>
      ))}
      {removed && (
        <div role="status">
          グラフを削除しました。
          <Button type="button" variant="ghost" onClick={restoreGraph}>
            元に戻す
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        disabled={input.measurements.length >= 30}
        onClick={() =>
          onChange({
            ...input,
            measurements: [...input.measurements, createReportMeasurement(input.plots)],
          })
        }
      >
        ＋ 別の調査項目のグラフを追加
      </Button>
      <p>
        数字の後に誤差や有意差の記号も書けます。例：41.7±0.8 a、82 ＊、40.2
        n.s.。先頭の数値で棒を描き、±の値をエラーバーにします。検定方法や有意水準は下の補足に記入してください。
      </p>
      <FieldLabel required>区の説明（2区以上）</FieldLabel>
      <p>グラフの区ごとに、調査した範囲と、この区の説明を入力してください。{plotHint}</p>
      <FieldError message={errors.plots} />
      {input.plots.map((plot, index) => (
        <section key={plot.id} className={card}>
          <h3>{plot.name || `区 ${index + 1}`}</h3>
          <FieldError message={errors[`plots.${index}.name`]} />
          <label>
            調査した範囲（必須）
            <Input
              value={plot.scope}
              placeholder="例）1区10株、3反復"
              onChange={(e) => updatePlot(plot.id, { scope: e.target.value })}
            />
          </label>
          <FieldError message={errors[`plots.${index}.scope`]} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                ...input,
                plots: input.plots.map((item) => ({ ...item, scope: plot.scope })),
              })
            }
          >
            この範囲を全ての区に入れる
          </Button>
          <label>
            この区の説明（必須）
            <Textarea
              placeholder={plotHint}
              value={plot.description}
              onChange={(e) => updatePlot(plot.id, { description: e.target.value })}
            />
          </label>
          <p>
            {index === 0
              ? "記入例：〇〇は使っていない。かん水と施肥は処理区と同じ。"
              : "記入例：〇〇を1,000倍に希釈し（希釈倍率）、10aあたり200L（使用量）を葉面散布（施用方法）。7日おきに3回（回数）。元肥は慣行の75%に減らした。"}
          </p>
          <FieldError message={errors[`plots.${index}.description`]} />
        </section>
      ))}
      <label>
        <Checkbox
          checked={input.methodDetailsAck}
          onChange={(e) => onChange({ ...input, methodDetailsAck: e.target.checked })}
        />{" "}
        資材を使った区の説明に、施用方法・希釈倍率・使用量・回数を明記しました（必須）
      </label>
      <FieldError message={errors.methodDetailsAck} />
      <FieldLabel>グラフにしにくい調査結果</FieldLabel>
      <p>数値にしにくい変化や様子、区ごとの違いなど。±や＊を使った場合の意味もここに書けます。</p>
      {(textMeasurements.length ? textMeasurements : [undefined]).map((measurement, index) => (
        <label key={index === 0 ? "qualitative" : measurement?.id}>
          {measurement?.name || "グラフにしにくい調査結果"}
          <Textarea
            placeholder="グラフにしにくい変化や様子"
            value={measurement?.body ?? ""}
            onChange={(event) => updateText(measurement, event.target.value)}
          />
        </label>
      ))}
      <p>
        記入例：処理区では11月以降も葉色が濃く、成り疲れが見られなかった。無処理区は12月に入って草勢が落ち、下葉の黄化が目立った。
      </p>
    </div>
  );
}
