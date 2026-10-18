"use client";

import type { KeyboardEvent, ReactNode } from "react";

import { reportPlotColor } from "@/components/ReportPlotColor";
import { parseReportNumber, type UsageReportInput } from "@/lib/usage-report";

import { css, cva, cx } from "../../../../../../styled-system/css";

type Measurement = UsageReportInput["measurements"][number];
type Graph = Measurement["graphs"][number];
type Plot = UsageReportInput["plots"][number];

export type EditTarget =
  | { k: "title"; g: string }
  | { k: "axis"; g: string }
  | { k: "name"; g: string; p: string }
  | { k: "val"; g: string; p: string };

export function editKey(target: EditTarget) {
  if (target.k === "name") return `name:${target.p}`;
  if (target.k === "val") return `val:${target.g}:${target.p}`;
  return `${target.k}:${target.g}`;
}

export type Cell =
  | { kind: "empty" }
  | { kind: "bad" }
  | { kind: "num"; value: number; error: number; label: string };
export function readCell(raw: string): Cell {
  const label = raw.trim();
  if (!label) return { kind: "empty" };
  const half = label.replace(/[０-９．－，]/g, (c) =>
    c === "．"
      ? "."
      : c === "－"
        ? "-"
        : c === "，"
          ? ","
          : String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
  const parsed = parseReportNumber(half);
  return parsed === null
    ? { kind: "bad" }
    : { kind: "num", value: parsed.value, error: parsed.error ?? 0, label };
}

function niceScale(max: number, unit: string) {
  if (/^[%％]$/.test(unit.trim()) && max <= 100) return { top: 100, step: 25, none: !(max > 0) };
  if (!(max > 0)) return { top: 100, step: 25, none: true };
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  return { top: Math.ceil((max * 1.12) / step) * step, step, none: false };
}
const fmt = (x: number) => (Math.round(x * 100) / 100).toLocaleString("ja-JP");

export function exampleValues(unit: string): [string, string] | null {
  const u = unit.trim().toLowerCase();
  const table: [RegExp, [string, string]][] = [
    [/^[%％]$/, ["96", "88"]],
    [/kg\/10a|ｋｇ\/10a/, ["1,250", "1,100"]],
    [/^t\/10a|^t$|トン/, ["5.2", "4.8"]],
    [/brix|度/, ["12.5", "11.8"]],
    [/^cm$/, ["110", "105"]],
    [/^mm$/, ["12", "11"]],
    [/^g$|^ｇ$/, ["65", "60"]],
    [/^kg$|kg\/株/, ["2.1", "1.9"]],
    [/^本$|^個$|^枚$|^節$/, ["42", "38"]],
    [/^日$/, ["14", "10"]],
    [/spad/, ["48", "44"]],
  ];
  return table.find(([re]) => re.test(u))?.[1] ?? null;
}
const exampleName = (k: number) => (k === 0 ? "例）無処理区" : k === 1 ? "例）処理区" : "例）○○区");

const hitArea = cx("group", css({ cursor: "pointer", _focus: { outline: "none" } }));
const hover = css({
  fill: "transparent",
  stroke: "transparent",
  _groupHover: { stroke: "primary.700", strokeWidth: "2" },
  _groupFocusVisible: { stroke: "primary.700", strokeWidth: "2.5" },
});
const slotBox = cva({
  base: {
    fill: "surface.card",
    stroke: "border.strong",
    strokeWidth: "1.4",
    _groupHover: { stroke: "primary.700" },
    _groupFocusVisible: { stroke: "primary.700", strokeWidth: "2.5" },
  },
  variants: {
    on: {
      true: { stroke: "accent.star", strokeWidth: "3", _groupHover: { stroke: "accent.star" } },
    },
  },
});
const ring = css({ fill: "none", stroke: "accent.star", strokeWidth: "3" });
const label = css({ fill: "text.subtle", fontSize: "xs", fontWeight: "semibold", opacity: "0.85" });
const ghost = cva({
  base: { fill: "text.subtle", fontWeight: "semibold", opacity: "0.8" },
  variants: { size: { xs: { fontSize: "xs" }, sm: { fontSize: "sm" }, md: { fontSize: "md" } } },
});
const pen = css({ fill: "primary.800", fontSize: "sm", fontWeight: "extrabold" });
const valueLabel = cva({
  base: { fill: "text.default", fontWeight: "extrabold" },
  variants: { long: { true: { fontSize: "sm" }, false: { fontSize: "md" } } },
});
const errorBar = css({ stroke: "text.muted", strokeWidth: "1.4" });
const emptyBar = cva({
  base: { fill: "surface.panel", strokeWidth: "1.2", strokeDasharray: "5 4" },
  variants: { bad: { true: { stroke: "accent.danger" }, false: { stroke: "border.strong" } } },
});
const removeLabel = css({
  fill: "text.subtle",
  fontSize: "xs",
  fontWeight: "bold",
  _groupHover: { fill: "accent.danger" },
});
const addText = cva({
  base: { fill: "primary.800" },
  variants: {
    size: {
      sign: { fontWeight: "extrabold", fontSize: "lg" },
      label: { fontWeight: "bold", fontSize: "sm" },
    },
  },
});
const graphCard = cva({
  base: {
    position: "relative",
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "banner",
    mt: "3",
  },
  variants: { mobile: { true: { p: "2.5" }, false: { py: "3", px: "3.5" } } },
});
const removeGraph = css({
  position: "absolute",
  top: "2",
  right: "2",
  w: "7.5",
  h: "7.5",
  borderRadius: "pill",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  color: "text.subtle",
  fontSize: "xl",
  lineHeight: "none",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  p: "0",
  _hover: { borderColor: "accent.danger", color: "accent.danger" },
  _focusVisible: { borderColor: "accent.danger", color: "accent.danger" },
});
const chart = css({
  display: "block",
  w: "full",
  h: "auto",
  overflow: "visible",
  fill: "text.muted",
  fontSize: "sm",
});
const linkButton = css({
  borderWidth: "0",
  bg: "transparent",
  color: "text.brand",
  fontSize: "sm",
  fontWeight: "bold",
  cursor: "pointer",
  pt: "1.5",
  px: "0.5",
  pb: "0",
  _hover: { textDecoration: "underline" },
});

function Hit({
  edit,
  label,
  onActivate,
  children,
}: {
  edit: string;
  label: string;
  onActivate: () => void;
  children: ReactNode;
}) {
  return (
    <g
      className={hitArea}
      data-edit={edit}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
    >
      {children}
    </g>
  );
}

export function ReportGraphEditor({
  measurement,
  graph,
  plots,
  graphNumber,
  mobile,
  active,
  onEdit,
  onAddPlot,
  onRemovePlot,
  onRemove,
  onAddPeriod,
  periodHint,
  children,
}: {
  measurement: Measurement;
  graph: Graph;
  plots: Plot[];
  graphNumber: number;
  mobile: boolean;
  active: EditTarget | null;
  onEdit: (target: EditTarget) => void;
  onAddPlot: () => void;
  onRemovePlot: (plotId: string) => void;
  onRemove: () => void;
  onAddPeriod: () => void;
  periodHint: boolean;
  children?: ReactNode;
}) {
  const on = (key: string) => active !== null && editKey(active) === key && active.g === graph.id;
  const nameOn = (plotId: string) => active !== null && active.k === "name" && active.p === plotId;
  const n = plots.length;
  const slotMin = mobile ? 78 : 96;
  const L = 52;
  const R = 14;
  const T = 90;
  const B = 96;
  const W = Math.max(mobile ? 320 : 640, L + R + (n + 1) * slotMin);
  const H = mobile ? 390 : 420;
  const cw = W - L - R;
  const ch = H - T - B;
  const cells = plots.map((plot) =>
    readCell(graph.rows.find((row) => row.plotId === plot.id)?.value ?? ""),
  );
  const nums = cells.flatMap((cell) => (cell.kind === "num" ? [cell.value + cell.error] : []));
  const { top, step, none } = niceScale(Math.max(0, ...nums), measurement.unit);
  const y = (t: number) => T + ch - (t / top) * ch;
  const slot = cw / (n + 1);
  const bw = Math.min(64, slot * 0.56);
  const ticks: number[] = [];
  for (let t = 0; t <= top + 1e-9; t += step) ticks.push(t);

  const sw = Math.min(W - 44, 440);
  const titleExample =
    periodHint && measurement.name
      ? `例）${measurement.name}（12月）`
      : (sw - 112) / "例）トマト重量のBS使用区と未使用区の比較".length < 10.5
        ? "例）BS使用区と未使用区の比較"
        : "例）トマト重量のBS使用区と未使用区の比較";
  const titleFont = Math.max(10, Math.min(13.5, (sw - 112) / titleExample.length));
  const titleSize = Math.max(10, Math.min(15, (W - 64 - 90) / Math.max(1, graph.heading.length)));
  const titleWidth = Math.min(W - 64, titleSize * 1.05 * graph.heading.length + 94);
  const y0 = 36;
  const axisShown = measurement.name + (measurement.unit ? `（${measurement.unit}）` : "");
  const axisSize = Math.max(10, Math.min(13.5, (W - 20 - 90) / Math.max(1, axisShown.length)));
  const axisWidth = Math.min(W - 20, axisSize * 1.1 * axisShown.length + 94);
  const axisSlot = Math.min(W - 20, 260);
  const examples = exampleValues(measurement.unit);
  const addX = L + slot * n + slot / 2;

  return (
    <section
      className={graphCard({ mobile })}
      aria-label={`グラフ ${graphNumber}`}
      data-card={graph.id}
    >
      <button
        type="button"
        className={removeGraph}
        aria-label={`グラフ${graphNumber}を削除`}
        title="このグラフを削除"
        onClick={onRemove}
      >
        ×
      </button>
      <div className={css({ overflowX: "auto", mt: "1.5" })} data-scroller>
        <svg
          className={chart}
          viewBox={`0 0 ${W} ${H}`}
          style={{ minWidth: mobile ? W : 0 }}
          role="group"
          aria-label={`グラフ${graphNumber}の入力`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={L}
                x2={W - R}
                y1={y(t)}
                y2={y(t)}
                className={css({ stroke: "border.default" })}
              />
              {!none && (
                <text x={L - 8} y={y(t) + 4} textAnchor="end">
                  {fmt(t)}
                </text>
              )}
            </g>
          ))}
          <Hit
            edit={`title:${graph.id}`}
            label={`グラフ${graphNumber}の題を編集`}
            onActivate={() => onEdit({ k: "title", g: graph.id })}
          >
            {graph.heading ? (
              <>
                <rect className={hover} x="6" y="4" width={titleWidth} height="26" rx="7" />
                <text x="14" y="22" className={label}>
                  グラフの題
                </text>
                <text
                  className={css({ fontWeight: "extrabold" })}
                  style={{ fontSize: titleSize }}
                  x="80"
                  y="23"
                >
                  {graph.heading}
                </text>
                {on(`title:${graph.id}`) && (
                  <rect className={ring} x="4" y="2" width={titleWidth + 4} height="30" rx="8" />
                )}
              </>
            ) : (
              <>
                <rect className={slotBox()} x="6" y="3" width={sw} height="28" rx="7" />
                <text x="14" y="22" className={label}>
                  グラフの題
                </text>
                <text style={{ fontSize: titleFont }} x="80" y="22" className={ghost()}>
                  {titleExample}
                </text>
                <text x={sw - 2} y="22" textAnchor="end" className={pen}>
                  ✎
                </text>
                {on(`title:${graph.id}`) && (
                  <rect className={ring} x="4" y="1" width={sw + 4} height="32" rx="8" />
                )}
              </>
            )}
          </Hit>
          <Hit
            edit={`axis:${graph.id}`}
            label={`グラフ${graphNumber}の調査項目を編集`}
            onActivate={() => onEdit({ k: "axis", g: graph.id })}
          >
            {measurement.name ? (
              <>
                <rect className={hover} x="6" y={y0 + 1} width={axisWidth} height="26" rx="7" />
                <text x="14" y={y0 + 19} className={label}>
                  調査項目
                </text>
                <text
                  className={css({ fontWeight: "bold" })}
                  style={{ fontSize: axisSize }}
                  x="80"
                  y={y0 + 19}
                >
                  {axisShown}
                </text>
                {on(`axis:${graph.id}`) && (
                  <rect
                    className={ring}
                    x="4"
                    y={y0 - 1}
                    width={axisWidth + 4}
                    height="30"
                    rx="8"
                  />
                )}
              </>
            ) : (
              <>
                <rect className={slotBox()} x="6" y={y0} width={axisSlot} height="28" rx="7" />
                <text x="14" y={y0 + 19} className={label}>
                  調査項目
                </text>
                <text x="80" y={y0 + 19} className={ghost({ size: "md" })}>
                  例）収量
                </text>
                <text x={axisSlot - 2} y={y0 + 19} textAnchor="end" className={pen}>
                  ✎
                </text>
                {on(`axis:${graph.id}`) && (
                  <rect className={ring} x="4" y={y0 - 2} width={axisSlot + 4} height="32" rx="8" />
                )}
              </>
            )}
          </Hit>
          {plots.map((plot, k) => {
            const cx = L + slot * k + slot / 2;
            const cell: Cell = cells[k] ?? { kind: "empty" };
            const valueOn = on(`val:${graph.id}:${plot.id}`);
            const nm = plot.name || exampleName(k);
            const per = mobile ? 6 : 8;
            const lines = plot.name
              ? [
                  nm.slice(0, per),
                  nm.slice(per, per * 2) + (nm.length > per * 2 ? "…" : ""),
                ].filter(Boolean)
              : [nm];
            const gh = ch * 0.38;
            const sx = cx - Math.min(slot - 8, 84) / 2;
            const sWidth = Math.min(slot - 8, 84);
            const yy = cell.kind === "num" ? y(Math.max(0, cell.value)) : 0;
            return (
              <g key={plot.id}>
                <Hit
                  edit={`val:${graph.id}:${plot.id}`}
                  label={`グラフ${graphNumber}の区${k + 1}の数値を編集`}
                  onActivate={() => onEdit({ k: "val", g: graph.id, p: plot.id })}
                >
                  {cell.kind === "num" ? (
                    <>
                      <rect
                        className={hover}
                        x={cx - slot / 2 + 3}
                        y={yy - 28}
                        width={slot - 6}
                        height={T + ch - yy + 28}
                        rx="8"
                      />
                      <rect
                        className={reportPlotColor(k)}
                        x={cx - bw / 2}
                        y={yy}
                        width={bw}
                        height={T + ch - yy}
                        rx="4"
                      />
                      {cell.error > 0 && (
                        <>
                          <line
                            x1={cx}
                            x2={cx}
                            y1={y(cell.value + cell.error)}
                            y2={y(Math.max(0, cell.value - cell.error))}
                            className={errorBar}
                          />
                          <line
                            x1={cx - 6}
                            x2={cx + 6}
                            y1={y(cell.value + cell.error)}
                            y2={y(cell.value + cell.error)}
                            className={errorBar}
                          />
                        </>
                      )}
                      <text
                        className={valueLabel({ long: cell.label.length > 7 })}
                        x={cx}
                        y={y(cell.value + cell.error) - 8}
                        textAnchor="middle"
                      >
                        {cell.label}
                      </text>
                      {valueOn && (
                        <rect
                          className={ring}
                          x={cx - slot / 2 + 3}
                          y={yy - 28}
                          width={slot - 6}
                          height={T + ch - yy + 28}
                          rx="8"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <rect
                        x={cx - bw / 2}
                        y={T + ch - gh}
                        width={bw}
                        height={gh}
                        rx="4"
                        className={emptyBar({ bad: cell.kind === "bad" })}
                      />
                      <rect
                        className={slotBox({ on: valueOn })}
                        x={sx}
                        y={T + ch - gh - 34}
                        width={sWidth}
                        height="28"
                        rx="7"
                      />
                      <text x={sx + 7} y={T + ch - gh - 15} className={ghost({ size: "sm" })}>
                        {examples ? `例）${examples[k === 0 ? 1 : 0]}` : "数値"}
                      </text>
                      <text
                        x={sx + sWidth - 6}
                        y={T + ch - gh - 15}
                        textAnchor="end"
                        className={pen}
                      >
                        ✎
                      </text>
                    </>
                  )}
                </Hit>
                <Hit
                  edit={`name:${plot.id}`}
                  label={`区${k + 1}の名前を編集`}
                  onActivate={() => onEdit({ k: "name", g: graph.id, p: plot.id })}
                >
                  <rect
                    className={plot.name ? hover : slotBox()}
                    x={cx - slot / 2 + 3}
                    y={T + ch + 5}
                    width={slot - 6}
                    height={lines.length * 16 + 10}
                    rx="7"
                  />
                  {plot.name ? (
                    lines.map((line, j) => (
                      <text
                        className={css({ fontSize: "sm" })}
                        key={line}
                        x={cx}
                        y={T + ch + 21 + j * 16}
                        textAnchor="middle"
                      >
                        {line}
                      </text>
                    ))
                  ) : (
                    <>
                      <text
                        x={cx - slot / 2 + 8}
                        y={T + ch + 21}
                        className={ghost({ size: mobile ? "xs" : "sm" })}
                      >
                        {nm}
                      </text>
                      <text x={cx + slot / 2 - 7} y={T + ch + 21} textAnchor="end" className={pen}>
                        ✎
                      </text>
                    </>
                  )}
                  {nameOn(plot.id) && active?.g === graph.id && (
                    <rect
                      className={ring}
                      x={cx - slot / 2 + 2}
                      y={T + ch + 4}
                      width={slot - 4}
                      height={lines.length * 16 + 12}
                      rx="8"
                    />
                  )}
                </Hit>
                {n > 2 && (
                  <Hit
                    edit={`rmrow:${plot.id}`}
                    label={`${plot.name || `区${k + 1}`}を削除`}
                    onActivate={() => onRemovePlot(plot.id)}
                  >
                    <rect
                      className={hover}
                      x={cx - 26}
                      y={T + ch + lines.length * 16 + 30 - 13}
                      width="52"
                      height="18"
                      rx="9"
                    />
                    <text
                      x={cx}
                      y={T + ch + lines.length * 16 + 30}
                      textAnchor="middle"
                      className={removeLabel}
                    >
                      × 削除
                    </text>
                  </Hit>
                )}
              </g>
            );
          })}
          <text x="4" y={T - 12} className={label}>
            数値{measurement.unit ? `（${measurement.unit}）` : ""}
          </text>
          <text x="2" y={T + ch + 21} className={label}>
            区の名前
          </text>
          {n < 20 && (
            <Hit edit="addrow" label="区を追加" onActivate={onAddPlot}>
              <rect
                x={addX - bw / 2}
                y={T + ch - ch * 0.38}
                width={bw}
                height={ch * 0.38}
                rx="6"
                className={css({
                  fill: "transparent",
                  stroke: "border.strong",
                  strokeDasharray: "5 4",
                })}
              />
              <text
                className={addText({ size: "sign" })}
                x={addX}
                y={T + ch - ch * 0.19 + 2}
                textAnchor="middle"
              >
                ＋
              </text>
              <text
                className={addText({ size: "label" })}
                x={addX}
                y={T + ch + 21}
                textAnchor="middle"
              >
                区を追加
              </text>
            </Hit>
          )}
          <line
            x1={L}
            x2={W - R}
            y1={T + ch}
            y2={T + ch}
            className={css({ stroke: "border.strong", strokeWidth: "1.5" })}
          />
        </svg>
      </div>
      {measurement.name.trim() && measurement.graphs.length < 20 && (
        <button type="button" className={linkButton} onClick={onAddPeriod}>
          ＋ この調査項目で、別の時期のグラフを追加
        </button>
      )}
      {children}
    </section>
  );
}
