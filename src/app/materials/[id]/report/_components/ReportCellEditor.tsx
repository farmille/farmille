"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

import { inputRecipe } from "@/components/Input";
import { textareaRecipe } from "@/components/Textarea";
import type { UsageReportInput } from "@/lib/usage-report";

import { css, cva, cx } from "../../../../../../styled-system/css";

import { editKey, readCell, type EditTarget } from "./ReportGraphEditor";
import { pillButton } from "./reportStyles";

type Measurement = UsageReportInput["measurements"][number];
type Graph = Measurement["graphs"][number];
type Plot = UsageReportInput["plots"][number];

/** 単位の候補 */
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
/** 調査項目 → 単位（単位を手で入れていないときだけ自動で入れる） */
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

const panel = cva({
  base: {
    position: "fixed",
    zIndex: "20",
    bg: "surface.card",
    borderStyle: "solid",
    borderColor: "primary.700",
    boxShadow: "shadow.lift",
    py: "3",
    px: "3.5",
  },
  variants: {
    mobile: {
      true: {
        left: "0",
        right: "0",
        bottom: "var(--kb, 0)",
        borderWidth: "0",
        borderTopWidth: "1.5px",
        borderTopRadius: "banner",
        pb: "calc(token(spacing.3) + env(safe-area-inset-bottom))",
      },
      false: { w: "80", borderWidth: "1.5px", borderRadius: "card" },
    },
  },
});
const heading = css({
  fontSize: "sm",
  fontWeight: "extrabold",
  color: "primary.800",
  mb: "1.5",
  display: "flex",
  gap: "1.5",
  alignItems: "center",
});
const closeButton = css({
  ml: "auto",
  w: "8",
  h: "8",
  borderRadius: "pill",
  borderWidth: "0",
  bg: "transparent",
  color: "text.subtle",
  fontSize: "xl",
  lineHeight: "none",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  _hover: { bg: "surface.panel", color: "text.default" },
});
const row = css({ display: "flex", gap: "2", alignItems: "center" });
const bigInput = cva({
  base: {
    flex: "1",
    minW: "0",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "input",
    py: "2",
    px: "2.5",
    fontWeight: "extrabold",
    fontVariantNumeric: "tabular-nums",
    color: "inherit",
    bg: "surface.card",
    _focus: {
      borderColor: "primary.700",
      outlineWidth: "3px",
      outlineStyle: "solid",
      outlineColor: "primary.100",
      outlineOffset: "0",
    },
  },
  variants: {
    size: { value: { fontSize: "2xl" }, text: { fontSize: "lg", w: "full" } },
    bad: { true: { bg: "accent.dangerSoft", borderColor: "accent.danger" } },
  },
  defaultVariants: { size: "text" },
});
const fieldLabel = css({
  fontSize: "sm",
  color: "text.subtle",
  fontWeight: "bold",
  display: "block",
  mb: "0.5",
});
const hint = css({ fontSize: "sm", color: "text.subtle", mt: "1.5" });
const smallInput = css(inputRecipe.raw(), { py: "2", px: "2.5", borderRadius: "input" });
const nav = css({ display: "flex", gap: "1.5", mt: "2.5", alignItems: "center" });
const doneButton = cx(pillButton({ tone: "primary", strong: true }), css({ ml: "auto" }));
const removeButton = css({
  borderWidth: "0",
  bg: "transparent",
  color: "text.subtle",
  py: "1.5",
  px: "1",
  fontSize: "sm",
  fontWeight: "bold",
  cursor: "pointer",
  _hover: { color: "accent.danger" },
});
const unitChip = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    borderRadius: "pill",
    py: "0.5",
    px: "2.5",
    fontSize: "sm",
    cursor: "pointer",
    color: "text.muted",
  },
  variants: {
    on: {
      true: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "bold",
      },
    },
  },
});

/** グラフの書き込み枠。PC は押した場所の横、スマホは画面の下に出す */
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
          const head = (document.querySelector("[data-report-head]")?.clientHeight ?? 100) + 10;
          if (r.bottom > limit) window.scrollBy({ top: r.bottom - limit, behavior: "smooth" });
          else if (r.top < head) window.scrollBy({ top: r.top - head, behavior: "smooth" });
        });
        const scroller = anchor.closest("[data-scroller]");
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
      // 右に入らなければ左に、左右とも入らなければ下（上）に置く
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

  // スマホでソフトキーボードが出たとき、書き込み枠をキーボードの上に出す
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
    <button type="button" className={closeButton} aria-label="閉じる" onClick={onClose}>
      ×
    </button>
  );
  const done = (
    <button type="button" className={doneButton} onClick={onClose}>
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
        <div className={heading}>
          {plot.name || `区${plotIndex + 1}`}の{measurement.name || "数値"}
          {close}
        </div>
        <div className={row}>
          <input
            data-first
            className={bigInput({ size: "value", bad: readCell(raw).kind === "bad" })}
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
          <span
            className={css({
              flex: "1",
              fontWeight: "extrabold",
              color: "text.muted",
              whiteSpace: "nowrap",
            })}
          >
            {measurement.unit}
          </span>
        </div>
        <div className={hint}>±や＊も一緒に書けます。例：41.7±0.8 a、82 ＊</div>
        <div className={nav}>{done}</div>
      </>
    );
  } else if (target.k === "name" && plot) {
    body = (
      <>
        <div className={heading}>
          区の名前
          {close}
        </div>
        <div className={row}>
          <input
            data-first
            className={bigInput()}
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
        <div
          className={css({
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            borderTopColor: "border.default",
            mt: "2.5",
            pt: "2",
          })}
        >
          <label className={cx(fieldLabel, css({ mt: "1" }))} htmlFor={`ed-range-${plot.id}`}>
            調査した範囲（必須）
          </label>
          <div
            className={css({ display: "flex", gap: "1.5", alignItems: "center", flexWrap: "wrap" })}
          >
            <input
              id={`ed-range-${plot.id}`}
              className={cx(smallInput, css({ flex: "1 1 token(sizes.44)" }))}
              placeholder="例）1区10株、3反復"
              value={plot.scope}
              onChange={(event) => onPlotChange(plot.id, { scope: event.target.value })}
              onKeyDown={(event) => {
                if (!isEnter(event)) return;
                event.preventDefault();
                ref.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
              }}
            />
            <button
              type="button"
              className={pillButton({ size: "xs" })}
              onClick={() => onRangeAll(plot.scope)}
            >
              この範囲を全ての区に入れる
            </button>
          </div>
          <label className={cx(fieldLabel, css({ mt: "1" }))} htmlFor={`ed-desc-${plot.id}`}>
            この区の説明
          </label>
          <textarea
            id={`ed-desc-${plot.id}`}
            className={css(textareaRecipe.raw(), {
              py: "2",
              px: "2.5",
              minH: "14",
              fontSize: "md",
              lineHeight: "relaxed",
            })}
            placeholder={
              plotIndex === 0
                ? "例）〇〇は使っていない。かん水と施肥は処理区と同じ。"
                : "例）〇〇を1,000倍に希釈し（希釈倍率）、10aあたり200L（使用量）を葉面散布（施用方法）。7日おきに3回（回数）。"
            }
            value={plot.description}
            onChange={(event) => onPlotChange(plot.id, { description: event.target.value })}
          />
        </div>
        <div className={nav}>
          {plots.length > 2 && (
            <button type="button" className={removeButton} onClick={() => onRemovePlot(plot.id)}>
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
        <div className={heading}>
          調査項目と単位
          {close}
        </div>
        <div className={row}>
          <div className={css({ flex: "1", minW: "0" })}>
            <span className={fieldLabel}>調査項目</span>
            <input
              data-first
              className={bigInput()}
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
          <div className={css({ flex: "0 0 token(sizes.32)" })}>
            <span className={fieldLabel}>単位</span>
            <input
              data-unit-input
              className={bigInput()}
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
        <div
          className={css({ display: "flex", flexWrap: "wrap", gap: "1", mt: "2" })}
          role="group"
          aria-label="単位の候補"
        >
          {UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              className={unitChip({ on: unit === measurement.unit })}
              aria-pressed={unit === measurement.unit}
              onClick={() => setUnit(unit)}
            >
              {unit}
            </button>
          ))}
        </div>
        <div className={hint}>
          {measurement.unit ? `数値の単位は「${measurement.unit}」になります。` : ""}
        </div>
        <div className={nav}>{done}</div>
      </>
    );
  } else if (target.k === "title") {
    body = (
      <>
        <div className={heading}>
          グラフの題（任意）
          <span
            className={css({
              fontSize: "sm",
              color: "text.subtle",
              ml: "1.5",
              fontWeight: "normal",
            })}
          >
            何と何を比べたグラフか
          </span>
          {close}
        </div>
        <div className={row}>
          <input
            data-first
            className={bigInput()}
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
        <div className={hint}>
          グラフの上に出る題です。書かないときは、調査項目がそのまま題になります。
        </div>
        <div className={nav}>{done}</div>
      </>
    );
  }

  return (
    <div
      ref={ref}
      className={panel({ mobile })}
      data-cell-editor
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
