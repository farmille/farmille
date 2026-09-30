"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { reportPlotColor } from "@/components/ReportPlotColor";
import { parseReportNumber, type UsageReportInput } from "@/lib/usage-report";
import { css } from "../../../../../../styled-system/css";

type Measurement = UsageReportInput["measurements"][number];
type Graph = Measurement["graphs"][number];
type EditTarget =
  | { kind: "title" }
  | { kind: "metric" }
  | { kind: "unit" }
  | { kind: "plot"; id: string }
  | { kind: "value"; id: string };

const candidates = [
  ["可販果収量", "kg"],
  ["1株あたり収量", "kg/株"],
  ["10aあたり収量", "kg/10a"],
  ["平均果重", "g"],
  ["平均糖度", "Brix"],
  ["可販果率", "%"],
  ["秀品率", "%"],
  ["裂果率", "%"],
  ["障害果率", "%"],
  ["発芽率", "%"],
  ["活着率", "%"],
  ["草丈", "cm"],
  ["茎径", "mm"],
  ["葉数", "枚"],
  ["葉色値（SPAD）", "SPAD"],
  ["根重", "g"],
  ["地上部重", "g"],
  ["日持ち日数", "日"],
  ["切り花長", "cm"],
  ["切り花重", "g"],
  ["上位階級率", "%"],
];
const units = [
  "g",
  "kg",
  "kg/10a",
  "t/10a",
  "kg/株",
  "%",
  "Brix",
  "cm",
  "mm",
  "枚",
  "本",
  "個",
  "日",
  "SPAD",
];
const row = css({ display: "flex", flexWrap: "wrap", gap: "2", alignItems: "center" });
const editButton = css({
  p: "2",
  borderRadius: "input",
  borderWidth: "1px",
  borderStyle: "dashed",
  borderColor: "border.strong",
  textAlign: "left",
  overflowWrap: "anywhere",
  _focusVisible: { outline: "2px solid", outlineColor: "brand.primary" },
});
const plotHint =
  "資材の使い方（施用方法・希釈倍率・使用量・回数など）と、あれば他の区と違う条件を記入してください。資材を使っていない区は「資材なし」と書き、他の区と違う条件があれば記入してください。";
export { plotHint };

export function ReportGraphEditor({
  measurement,
  graph,
  plots,
  graphNumber,
  onMeasurementChange,
  unitIsManual,
  onManualUnit,
  onPlotChange,
  onAddPlot,
  onRemovePlot,
  onAddPeriod,
  onRemove,
}: {
  measurement: Measurement;
  graph: Graph;
  plots: UsageReportInput["plots"];
  graphNumber: number;
  onMeasurementChange: (measurement: Measurement) => void;
  unitIsManual: boolean;
  onManualUnit: () => void;
  onPlotChange: (id: string, values: Partial<UsageReportInput["plots"][number]>) => void;
  onAddPlot: () => void;
  onRemovePlot: (id: string) => void;
  onAddPeriod: () => void;
  onRemove: () => void;
}) {
  const [target, setTarget] = useState<EditTarget | null>(null);
  const root = useRef<HTMLElement>(null);
  const parsed = plots.map((plot) =>
    parseReportNumber(graph.rows.find((r) => r.plotId === plot.id)?.value ?? ""),
  );
  const minimum = Math.min(0, ...parsed.map((p) => (p ? p.value - (p.error ?? 0) : 0)));
  const maximum = Math.max(
    measurement.unit === "%" ? 100 : 1,
    ...parsed.map((p) => (p ? p.value + (p.error ?? 0) : 0)),
  );
  const y = (value: number) => 180 - ((value - minimum) / (maximum - minimum)) * 160;
  const activePlot =
    target && (target.kind === "plot" || target.kind === "value")
      ? plots.find((p) => p.id === target.id)
      : undefined;
  function open(next: EditTarget | null) {
    setTarget(next);
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLInputElement>("[data-graph-input]")?.focus(),
    );
  }
  function updateGraph(next: Graph) {
    onMeasurementChange({
      ...measurement,
      graphs: measurement.graphs.map((item) => (item.id === graph.id ? next : item)),
    });
  }
  function next(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const first = plots[0];
    if (target?.kind === "metric") open({ kind: "unit" });
    else if (target?.kind === "unit")
      open(
        first ? { kind: plots.some((p) => !p.name.trim()) ? "plot" : "value", id: first.id } : null,
      );
    else if (target?.kind === "plot" || target?.kind === "value") {
      const after = plots[plots.findIndex((p) => p.id === target.id) + 1];
      open(
        after
          ? { kind: target.kind, id: after.id }
          : target.kind === "plot" && first
            ? { kind: "value", id: first.id }
            : null,
      );
    } else open(null);
  }
  return (
    <section
      ref={root}
      aria-label={`グラフ ${graphNumber}`}
      className={css({
        borderWidth: "1px",
        borderColor: "border.default",
        borderRadius: "card",
        p: "3",
        display: "grid",
        gap: "3",
        minW: "0",
      })}
    >
      <div className={css({ display: "flex", justifyContent: "space-between", gap: "2" })}>
        <button
          type="button"
          className={editButton}
          onClick={() => open({ kind: "title" })}
          aria-label={`グラフ${graphNumber}の題を編集`}
        >
          {graph.heading || measurement.name || "グラフの題（任意）"} ✎
        </button>
        <button type="button" onClick={onRemove} aria-label={`グラフ${graphNumber}を削除`}>
          ×
        </button>
      </div>
      <button
        type="button"
        className={editButton}
        onClick={() => open({ kind: "metric" })}
        aria-label={`グラフ${graphNumber}の調査項目を編集`}
      >
        調査項目 {measurement.name || "例）収量"}
        {measurement.unit ? `（${measurement.unit}）` : ""} ✎
      </button>
      <p className={css({ fontSize: "sm", color: "text.muted" })}>
        数値{measurement.unit ? `（${measurement.unit}）` : ""} ／ 目盛り {minimum}〜{maximum}
      </p>
      <div className={css({ overflowX: "auto", display: "flex", gap: "2", pb: "2" })}>
        {plots.map((plot, index) => {
          const value = graph.rows.find((r) => r.plotId === plot.id)?.value ?? "";
          const numeric = parsed[index];
          return (
            <div
              key={plot.id}
              className={css({ flex: "1 0", minW: "reportGraph.plot", display: "grid", gap: "2" })}
            >
              <button
                type="button"
                className={editButton}
                onClick={() => open({ kind: "value", id: plot.id })}
                aria-label={`グラフ${graphNumber}の区${index + 1}の数値を編集`}
              >
                {value || "数値"} ✎
              </button>
              <svg
                viewBox="0 0 100 200"
                className={css({ width: "100%", height: "reportGraph.vertical" })}
                role="img"
                aria-label={`${plot.name || `区 ${index + 1}`} ${value || "未入力"}`}
              >
                {[0, 1, 2, 3, 4].map((tick) => (
                  <line
                    key={tick}
                    x1="0"
                    x2="100"
                    y1={20 + tick * 40}
                    y2={20 + tick * 40}
                    className={css({ stroke: "border.default" })}
                  />
                ))}
                <line x1="0" x2="100" y1={y(0)} y2={y(0)} stroke="currentColor" />
                {numeric && (
                  <>
                    <rect
                      x="25"
                      y={Math.min(y(0), y(numeric.value))}
                      width="50"
                      height={Math.abs(y(numeric.value) - y(0))}
                      className={reportPlotColor(index)}
                    />
                    {numeric.error !== null && (
                      <g stroke="currentColor">
                        <line
                          x1="50"
                          x2="50"
                          y1={y(numeric.value - numeric.error)}
                          y2={y(numeric.value + numeric.error)}
                        />
                        <line
                          x1="40"
                          x2="60"
                          y1={y(numeric.value - numeric.error)}
                          y2={y(numeric.value - numeric.error)}
                        />
                        <line
                          x1="40"
                          x2="60"
                          y1={y(numeric.value + numeric.error)}
                          y2={y(numeric.value + numeric.error)}
                        />
                      </g>
                    )}
                  </>
                )}
              </svg>
              <button
                type="button"
                className={editButton}
                onClick={() => open({ kind: "plot", id: plot.id })}
                aria-label={`区${index + 1}の名前を編集`}
              >
                {plot.name ||
                  (index === 0 ? "例）無処理区" : index === 1 ? "例）処理区" : "例）○○区")}{" "}
                ✎
              </button>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={plots.length >= 20}
        onClick={onAddPlot}
      >
        ＋ 区を追加
      </Button>
      {target && (
        <div
          className={css({
            bg: "surface.panel",
            borderWidth: "1px",
            borderColor: "border.default",
            borderRadius: "input",
            p: "3",
            display: "grid",
            gap: "3",
          })}
        >
          {target.kind === "title" && (
            <>
              <label>
                グラフの題（任意）
                <Input
                  data-graph-input
                  value={graph.heading}
                  placeholder={
                    measurement.graphs.length > 1
                      ? "例）11月、定植30日後"
                      : "例）トマト重量のBS使用区と未使用区の比較"
                  }
                  onChange={(e) => updateGraph({ ...graph, heading: e.target.value })}
                  onKeyDown={next}
                />
              </label>
              <p>何と何を比べたグラフか。空欄の場合は調査項目を題にします。</p>
              <Button
                type="button"
                variant="ghost"
                disabled={measurement.graphs.length >= 20}
                onClick={onAddPeriod}
              >
                ＋ この調査項目で、別の時期のグラフを追加
              </Button>
            </>
          )}
          {(target.kind === "metric" || target.kind === "unit") && (
            <>
              <label>
                調査項目（必須）
                <Input
                  data-graph-input={target.kind === "metric" ? "" : undefined}
                  onFocus={() => setTarget({ kind: "metric" })}
                  list={`${graph.id}-metrics`}
                  value={measurement.name}
                  placeholder="例）収量"
                  onChange={(e) => {
                    const name = e.target.value;
                    const suggested = candidates.find(([candidate]) => candidate === name)?.[1];
                    onMeasurementChange({
                      ...measurement,
                      name,
                      unit: !unitIsManual && suggested ? suggested : measurement.unit,
                    });
                  }}
                  onKeyDown={next}
                />
              </label>
              <datalist id={`${graph.id}-metrics`}>
                {candidates.map(([name]) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <label>
                単位（任意）
                <Input
                  data-graph-input={target.kind === "unit" ? "" : undefined}
                  value={measurement.unit}
                  onFocus={() => setTarget({ kind: "unit" })}
                  onChange={(e) => {
                    onManualUnit();
                    onMeasurementChange({ ...measurement, unit: e.target.value });
                  }}
                  onKeyDown={next}
                />
              </label>
              <div className={row}>
                {units.map((unit) => (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    key={unit}
                    onClick={() => {
                      onManualUnit();
                      onMeasurementChange({ ...measurement, unit });
                    }}
                  >
                    {unit}
                  </Button>
                ))}
              </div>
            </>
          )}
          {target.kind === "plot" && activePlot && (
            <>
              <label>
                区の名前（必須）
                <Input
                  data-graph-input
                  value={activePlot.name}
                  onChange={(e) => onPlotChange(activePlot.id, { name: e.target.value })}
                  onKeyDown={next}
                />
              </label>
              <label>
                調査した範囲（必須）
                <Input
                  value={activePlot.scope}
                  placeholder="例）1区10株、3反復"
                  onChange={(e) => onPlotChange(activePlot.id, { scope: e.target.value })}
                />
              </label>
              <label>
                この区の説明（必須）
                <Textarea
                  value={activePlot.description}
                  placeholder={plotHint}
                  onChange={(e) => onPlotChange(activePlot.id, { description: e.target.value })}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                disabled={plots.length <= 2}
                onClick={() => {
                  onRemovePlot(activePlot.id);
                  open(null);
                }}
              >
                区を削除
              </Button>
            </>
          )}
          {target.kind === "value" && activePlot && (
            <label>
              {activePlot.name || "区"}の数値
              <Input
                data-graph-input
                aria-label={`グラフ${graphNumber}の区${plots.indexOf(activePlot) + 1}の数値`}
                value={graph.rows.find((r) => r.plotId === activePlot.id)?.value ?? ""}
                placeholder={
                  measurement.unit === "%"
                    ? "例）96"
                    : measurement.unit === "kg/10a"
                      ? "例）1,250"
                      : "例）120"
                }
                onChange={(e) =>
                  updateGraph({
                    ...graph,
                    rows: graph.rows.map((r) =>
                      r.plotId === activePlot.id ? { ...r, value: e.target.value } : r,
                    ),
                  })
                }
                onKeyDown={next}
              />
            </label>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={() => open(null)}>
            入力を閉じる
          </Button>
        </div>
      )}
    </section>
  );
}
