"use client";

import type { KeyboardEvent, ReactNode } from "react";

import { parseReportNumber, type UsageReportInput } from "@/lib/usage-report";

import { plotColorClass } from "./ReportFormParts";

type Measurement = UsageReportInput["measurements"][number];
type Graph = Measurement["graphs"][number];
type Plot = UsageReportInput["plots"][number];

/** グラフの中で書き込める場所。g は書き込み枠を出すグラフ（区の名前は全グラフで共有） */
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

/** 見本の parse()：空欄・数字が読めない（bad）・数値を区別する */
export type Cell =
  | { kind: "empty" }
  | { kind: "bad" }
  | { kind: "num"; value: number; error: number; label: string };
export function readCell(raw: string): Cell {
  const label = raw.trim();
  if (!label) return { kind: "empty" };
  // 見本と同じく全角の数字・記号を半角にしてから読む
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

/** 見本の nice()：目盛りの上端と刻み。% は 100 まで（spec：% の目盛りは100以上） */
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

/** 単位に合った数値の記入例（見本の exVals） */
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

/**
 * 見本ステップ4（試作C2）のグラフカード `.gc`。svgCompare() をそのまま React に写したもの。
 * 調査項目・単位は measurement（同じ調査項目の時期別グラフで共有）、題と数値は graph に入る。
 */
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
  /** 同じ調査項目のグラフが複数あるとき、題の記入例を時期にする */
  periodHint: boolean;
  /** 書き込み枠（このグラフで開いているとき） */
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

  // 1行目：グラフの題（任意）
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
  // 2行目：調査項目（単位）
  const y0 = 36;
  const axisShown = measurement.name + (measurement.unit ? `（${measurement.unit}）` : "");
  const axisSize = Math.max(10, Math.min(13.5, (W - 20 - 90) / Math.max(1, axisShown.length)));
  const axisWidth = Math.min(W - 20, axisSize * 1.1 * axisShown.length + 94);
  const axisSlot = Math.min(W - 20, 260);
  const examples = exampleValues(measurement.unit);
  const addX = L + slot * n + slot / 2;

  return (
    <section className="gc" aria-label={`グラフ ${graphNumber}`} data-card={graph.id}>
      <button
        type="button"
        className="cdel"
        aria-label={`グラフ${graphNumber}を削除`}
        title="このグラフを削除"
        onClick={onRemove}
      >
        ×
      </button>
      <div className="scroller">
        <div className="fig">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ minWidth: mobile ? W : 0 }}
            role="group"
            aria-label={`グラフ${graphNumber}の入力`}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" />
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
                  <rect className="hov" x="6" y="4" width={titleWidth} height="26" rx="7" />
                  <text x="14" y="22" className="cap">
                    グラフの題
                  </text>
                  <text style={{ fontWeight: 800, fontSize: titleSize }} x="80" y="23">
                    {graph.heading}
                  </text>
                  {on(`title:${graph.id}`) && (
                    <rect className="ring" x="4" y="2" width={titleWidth + 4} height="30" rx="8" />
                  )}
                </>
              ) : (
                <>
                  <rect className="slot" x="6" y="3" width={sw} height="28" rx="7" />
                  <text x="14" y="22" className="cap">
                    グラフの題
                  </text>
                  <text style={{ fontSize: titleFont }} x="80" y="22" className="ghx">
                    {titleExample}
                  </text>
                  <text x={sw - 2} y="22" textAnchor="end" className="pen">
                    ✎
                  </text>
                  {on(`title:${graph.id}`) && (
                    <rect className="ring" x="4" y="1" width={sw + 4} height="32" rx="8" />
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
                  <rect className="hov" x="6" y={y0 + 1} width={axisWidth} height="26" rx="7" />
                  <text x="14" y={y0 + 19} className="cap">
                    調査項目
                  </text>
                  <text style={{ fontWeight: 700, fontSize: axisSize }} x="80" y={y0 + 19}>
                    {axisShown}
                  </text>
                  {on(`axis:${graph.id}`) && (
                    <rect
                      className="ring"
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
                  <rect className="slot" x="6" y={y0} width={axisSlot} height="28" rx="7" />
                  <text x="14" y={y0 + 19} className="cap">
                    調査項目
                  </text>
                  <text style={{ fontSize: 13.5 }} x="80" y={y0 + 19} className="ghx">
                    例）収量
                  </text>
                  <text x={axisSlot - 2} y={y0 + 19} textAnchor="end" className="pen">
                    ✎
                  </text>
                  {on(`axis:${graph.id}`) && (
                    <rect
                      className="ring"
                      x="4"
                      y={y0 - 2}
                      width={axisSlot + 4}
                      height="32"
                      rx="8"
                    />
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
                          className="hov"
                          x={cx - slot / 2 + 3}
                          y={yy - 28}
                          width={slot - 6}
                          height={T + ch - yy + 28}
                          rx="8"
                        />
                        <rect
                          className={plotColorClass(k)}
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
                              stroke="var(--ink-2)"
                              strokeWidth="1.4"
                            />
                            <line
                              x1={cx - 6}
                              x2={cx + 6}
                              y1={y(cell.value + cell.error)}
                              y2={y(cell.value + cell.error)}
                              stroke="var(--ink-2)"
                              strokeWidth="1.4"
                            />
                          </>
                        )}
                        <text
                          className="vl"
                          x={cx}
                          y={y(cell.value + cell.error) - 8}
                          textAnchor="middle"
                          style={{ fontSize: cell.label.length > 7 ? 11.5 : 14 }}
                        >
                          {cell.label}
                        </text>
                        {valueOn && (
                          <rect
                            className="ring"
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
                          fill="var(--panel)"
                          stroke={cell.kind === "bad" ? "var(--red)" : "var(--line-strong)"}
                          strokeWidth="1.2"
                          className="dash"
                        />
                        <rect
                          className="slot"
                          x={sx}
                          y={T + ch - gh - 34}
                          width={sWidth}
                          height="28"
                          rx="7"
                          style={valueOn ? { stroke: "var(--hi)", strokeWidth: 3 } : undefined}
                        />
                        <text
                          style={{ fontSize: 11.5 }}
                          x={sx + 7}
                          y={T + ch - gh - 15}
                          className="ghx"
                        >
                          {examples ? `例）${examples[k === 0 ? 1 : 0]}` : "数値"}
                        </text>
                        <text
                          x={sx + sWidth - 6}
                          y={T + ch - gh - 15}
                          textAnchor="end"
                          className="pen"
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
                      className={plot.name ? "hov" : "slot"}
                      x={cx - slot / 2 + 3}
                      y={T + ch + 5}
                      width={slot - 6}
                      height={lines.length * 16 + 10}
                      rx="7"
                    />
                    {plot.name ? (
                      lines.map((line, j) => (
                        <text
                          style={{ fontSize: 12 }}
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
                          style={{ fontSize: mobile ? 10.5 : 11.5 }}
                          x={cx - slot / 2 + 8}
                          y={T + ch + 21}
                          className="ghx"
                        >
                          {nm}
                        </text>
                        <text
                          x={cx + slot / 2 - 7}
                          y={T + ch + 21}
                          textAnchor="end"
                          className="pen"
                        >
                          ✎
                        </text>
                      </>
                    )}
                    {nameOn(plot.id) && active?.g === graph.id && (
                      <rect
                        className="ring"
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
                        className="hov"
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
                        className="rmx"
                      >
                        × 削除
                      </text>
                    </Hit>
                  )}
                </g>
              );
            })}
            <text style={{ fontSize: 10 }} x="4" y={T - 12} className="cap">
              数値{measurement.unit ? `（${measurement.unit}）` : ""}
            </text>
            <text style={{ fontSize: 10 }} x="2" y={T + ch + 21} className="cap">
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
                  fill="transparent"
                  stroke="var(--line-strong)"
                  className="dash"
                />
                <text
                  style={{ fill: "var(--green-deep)", fontWeight: 800, fontSize: 15 }}
                  x={addX}
                  y={T + ch - ch * 0.19 + 2}
                  textAnchor="middle"
                >
                  ＋
                </text>
                <text
                  style={{ fill: "var(--green-deep)", fontWeight: 700, fontSize: 12 }}
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
              stroke="var(--line-strong)"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
      {measurement.name.trim() && measurement.graphs.length < 20 && (
        <button type="button" className="linkbtn" onClick={onAddPeriod}>
          ＋ この調査項目で、別の時期のグラフを追加
        </button>
      )}
      {children}
    </section>
  );
}
