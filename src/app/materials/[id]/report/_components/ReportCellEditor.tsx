"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

import type { UsageReportInput } from "@/lib/usage-report";

import { editKey, readCell, type EditTarget } from "./ReportGraphEditor";

type Measurement = UsageReportInput["measurements"][number];
type Graph = Measurement["graphs"][number];
type Plot = UsageReportInput["plots"][number];

/** 単位の候補（見本 UNITS） */
export const UNITS = [
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
/** 調査項目 → 単位（見本 METRIC_UNIT。単位を手で入れていないときだけ自動で入れる） */
export const METRIC_UNIT = new Map<string, string>([
  ["可販果収量", "kg/10a"],
  ["1株あたり収量", "kg"],
  ["10aあたり収量", "kg/10a"],
  ["平均果重", "g"],
  ["平均糖度", "Brix"],
  ["糖度", "Brix"],
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
]);

const isEnter = (event: KeyboardEvent) => event.key === "Enter" && !event.nativeEvent.isComposing;

/** 見本ステップ4の書き込み枠 `.ed`。PC は押した場所の横、スマホは画面の下に出す */
export function ReportCellEditor({
  target,
  graphNumber,
  measurement,
  graph,
  plots,
  mobile,
  unitIsManual,
  onManualUnit,
  onMeasurementChange,
  onGraphChange,
  onPlotChange,
  onRangeAll,
  onRemovePlot,
  onNext,
  onClose,
}: {
  target: EditTarget;
  graphNumber: number;
  measurement: Measurement;
  graph: Graph;
  plots: Plot[];
  mobile: boolean;
  unitIsManual: boolean;
  onManualUnit: () => void;
  onMeasurementChange: (measurement: Measurement) => void;
  onGraphChange: (graph: Graph) => void;
  onPlotChange: (id: string, values: Partial<Plot>) => void;
  onRangeAll: (scope: string) => void;
  onRemovePlot: (id: string) => void;
  /** Enter で次の空いた欄へ（数値は同じグラフの次の区へ） */
  onNext: (from: EditTarget) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const key = editKey(target);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const anchor = box.parentElement?.querySelector<SVGGElement>(`[data-edit="${key}"]`) ?? null;
    if (mobile || !anchor) {
      box.style.left = "";
      box.style.top = "";
      if (anchor) {
        requestAnimationFrame(() => {
          const r = anchor.getBoundingClientRect();
          const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
          const limit = vh - box.offsetHeight - 16;
          const head = (document.querySelector(".fm-wiz .head")?.clientHeight ?? 100) + 10;
          if (r.bottom > limit) window.scrollBy({ top: r.bottom - limit, behavior: "smooth" });
          else if (r.top < head) window.scrollBy({ top: r.top - head, behavior: "smooth" });
        });
        const scroller = anchor.closest(".scroller");
        if (scroller) {
          const r = anchor.getBoundingClientRect();
          const s = scroller.getBoundingClientRect();
          if (r.left < s.left || r.right > s.right)
            scroller.scrollBy({
              left: r.left - s.left - s.width / 2 + r.width / 2,
              behavior: "smooth",
            });
        }
      }
    } else {
      // 右に入らなければ左に、左右とも入らなければ下（上）に置く（見本の place()）
      const r = anchor.getBoundingClientRect();
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      let left = r.right + 12;
      if (left + w > window.innerWidth - 8) left = r.left - w - 12;
      let top = Math.min(Math.max(70, r.top + r.height / 2 - h / 2), window.innerHeight - h - 70);
      if (left < 8) {
        left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
        top = r.bottom + 10;
        if (top + h > window.innerHeight - 70) top = Math.max(70, r.top - h - 10);
      }
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
    }
    const first = box.querySelector<HTMLInputElement>("[data-first]");
    first?.focus({ preventScroll: true });
    first?.select();
  }, [key, mobile]);

  // スマホでソフトキーボードが出たとき、書き込み枠をキーボードの上に出す（見本の --kb）
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      ref.current?.style.setProperty(
        "--kb",
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  const close = (
    <button type="button" className="x" aria-label="閉じる" onClick={onClose}>
      ×
    </button>
  );
  const done = (
    <button type="button" className="go" onClick={onClose}>
      完了
    </button>
  );
  const plot =
    target.k === "name" || target.k === "val" ? plots.find((p) => p.id === target.p) : undefined;
  const plotIndex = plot ? plots.indexOf(plot) : -1;

  let body = null;
  if (target.k === "val" && plot) {
    const raw = graph.rows.find((row) => row.plotId === plot.id)?.value ?? "";
    body = (
      <>
        <div className="t">
          {plot.name || `区${plotIndex + 1}`}の{measurement.name || "数値"}
          {close}
        </div>
        <div className="row">
          <input
            data-first
            className={readCell(raw).kind === "bad" ? "big bad" : "big"}
            aria-label={`グラフ${graphNumber}の区${plotIndex + 1}の数値`}
            inputMode="decimal"
            enterKeyHint="next"
            placeholder="数値"
            value={raw}
            onChange={(event) =>
              onGraphChange({
                ...graph,
                rows: graph.rows.map((row) =>
                  row.plotId === plot.id ? { ...row, value: event.target.value } : row,
                ),
              })
            }
            onKeyDown={(event) => {
              if (!isEnter(event)) return;
              event.preventDefault();
              onNext(target);
            }}
          />
          <span className="unit">{measurement.unit}</span>
        </div>
        <div className="hint">±や＊も一緒に書けます。例：41.7±0.8 a、82 ＊</div>
        <div className="nav">{done}</div>
      </>
    );
  } else if (target.k === "name" && plot) {
    body = (
      <>
        <div className="t">
          区の名前
          {close}
        </div>
        <div className="row">
          <input
            data-first
            className="big"
            style={{ fontSize: 17 }}
            aria-label="区の名前（必須）"
            enterKeyHint="done"
            placeholder={plotIndex === 0 ? "例）無処理区、対照区" : "例）処理区、使用区"}
            value={plot.name}
            onChange={(event) => onPlotChange(plot.id, { name: event.target.value })}
            onKeyDown={(event) => {
              if (!isEnter(event)) return;
              event.preventDefault();
              onNext(target);
            }}
          />
        </div>
        <div className="sub2">
          <label className="lbl" htmlFor={`ed-range-${plot.id}`}>
            調査した範囲（必須）
          </label>
          <div className="rangeline">
            <input
              id={`ed-range-${plot.id}`}
              className="input"
              placeholder="例）1区10株、3反復"
              value={plot.scope}
              onChange={(event) => onPlotChange(plot.id, { scope: event.target.value })}
              onKeyDown={(event) => {
                if (!isEnter(event)) return;
                event.preventDefault();
                ref.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
              }}
            />
            <button type="button" className="mini" onClick={() => onRangeAll(plot.scope)}>
              この範囲を全ての区に入れる
            </button>
          </div>
          <label className="lbl" htmlFor={`ed-desc-${plot.id}`}>
            この区の説明
          </label>
          <textarea
            id={`ed-desc-${plot.id}`}
            className="input"
            placeholder={
              plotIndex === 0
                ? "例）〇〇は使っていない。かん水と施肥は処理区と同じ。"
                : "例）〇〇を1,000倍に希釈し（希釈倍率）、10aあたり200L（使用量）を葉面散布（施用方法）。7日おきに3回（回数）。"
            }
            value={plot.description}
            onChange={(event) => onPlotChange(plot.id, { description: event.target.value })}
          />
        </div>
        <div className="nav">
          {plots.length > 2 && (
            <button type="button" className="rm" onClick={() => onRemovePlot(plot.id)}>
              この区を削除
            </button>
          )}
          {done}
        </div>
      </>
    );
  } else if (target.k === "axis") {
    const setName = (name: string) => {
      const suggested = METRIC_UNIT.get(name.trim());
      onMeasurementChange({
        ...measurement,
        name,
        unit: unitIsManual ? measurement.unit : (suggested ?? ""),
      });
    };
    const setUnit = (unit: string) => {
      onManualUnit();
      onMeasurementChange({ ...measurement, unit });
    };
    body = (
      <>
        <div className="t">
          調査項目と単位
          {close}
        </div>
        <div className="row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="lbl">調査項目</span>
            <input
              data-first
              className="big"
              style={{ fontSize: 17, width: "100%" }}
              list="metricList"
              aria-label="調査項目"
              enterKeyHint="next"
              placeholder="例）収量"
              value={measurement.name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (!isEnter(event)) return;
                event.preventDefault();
                ref.current?.querySelector<HTMLInputElement>("[data-unit-input]")?.focus();
              }}
            />
          </div>
          <div style={{ flex: "0 0 130px" }}>
            <span className="lbl">単位</span>
            <input
              data-unit-input
              className="big"
              style={{ fontSize: 17, width: "100%" }}
              list="unitList"
              aria-label="単位（任意）"
              enterKeyHint="done"
              placeholder="例）kg/10a"
              value={measurement.unit}
              onChange={(event) => setUnit(event.target.value)}
              onKeyDown={(event) => {
                if (!isEnter(event)) return;
                event.preventDefault();
                onNext(target);
              }}
            />
          </div>
        </div>
        <div className="units" role="group" aria-label="単位の候補">
          {UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              className={unit === measurement.unit ? "uchip on" : "uchip"}
              aria-pressed={unit === measurement.unit}
              onClick={() => setUnit(unit)}
            >
              {unit}
            </button>
          ))}
        </div>
        <div className="hint">
          {measurement.unit ? `数値の単位は「${measurement.unit}」になります。` : ""}
        </div>
        <div className="nav">{done}</div>
      </>
    );
  } else if (target.k === "title") {
    body = (
      <>
        <div className="t">
          グラフの題（任意）
          <span className="hint" style={{ margin: "0 0 0 6px", fontWeight: 400 }}>
            何と何を比べたグラフか
          </span>
          {close}
        </div>
        <div className="row">
          <input
            data-first
            className="big"
            style={{ fontSize: 17 }}
            aria-label="グラフの題（任意）"
            enterKeyHint="done"
            placeholder={
              measurement.graphs.length > 1
                ? "例）11月、定植30日後"
                : "例）トマト重量のBS使用区と未使用区の比較"
            }
            value={graph.heading}
            onChange={(event) => onGraphChange({ ...graph, heading: event.target.value })}
            onKeyDown={(event) => {
              if (!isEnter(event)) return;
              event.preventDefault();
              onNext(target);
            }}
          />
        </div>
        <div className="hint">
          グラフの上に出る題です。書かないときは、調査項目がそのまま題になります。
        </div>
        <div className="nav">{done}</div>
      </>
    );
  }

  return (
    <div
      ref={ref}
      className="ed"
      role="dialog"
      aria-label="書き込み"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      {body}
    </div>
  );
}
