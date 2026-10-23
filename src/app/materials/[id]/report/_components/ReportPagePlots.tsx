"use client";

import { Input, Textarea } from "@/components/form";
import { Icon } from "@/components/Icon";
import { reportPlotColor } from "@/components/ReportPlotColor";
import { createReportPlot, type UsageReportInput } from "@/lib/usage-report";

import { css, cx } from "../../../../../../styled-system/css";

import { addButton, docLead, docLeadMark, labelStyle, removeButton } from "./report-page-styles";

const plotStyle = css({ mt: "4" });

const plotHead = css({ display: "flex", alignItems: "center", gap: "2", fontWeight: "bold" });

const dot = css({ w: "2.5", h: "2.5", borderRadius: "pill", bg: "[currentColor]" });

const fields = css({ pl: "4.5", mt: "1" });

const EXAMPLES = [
  "調査した範囲と、資材の使い方（使っていなければ「資材なし」）\n例）1区10株、3反復。資材なし。かん水と施肥は処理区と同じ。",
  "調査した範囲と、施用方法・希釈倍率・使用量・回数など\n例）1区10株、3反復。〇〇を1,000倍に希釈し、10aあたり200Lを葉面散布。7日おきに3回。",
];

/** 比べた区：区ごとに「区の名前」と「区の説明」の2欄。 */
export function ReportPagePlots({
  plots,
  onChange,
  missing,
}: {
  plots: UsageReportInput["plots"];
  onChange: (next: (current: UsageReportInput) => UsageReportInput) => void;
  missing: boolean;
}) {
  const update = (id: string, patch: Partial<UsageReportInput["plots"][number]>) =>
    onChange((current) => ({
      ...current,
      plots: current.plots.map((plot) => (plot.id === id ? { ...plot, ...patch } : plot)),
    }));
  return (
    <>
      <p className={docLead}>
        区ごとに、名前と説明を書きます。
        <br />
        説明には、調査した範囲と、資材の使い方（施用方法・希釈倍率・使用量・回数など）を書いてください。
        <br />
        <span className={docLeadMark}>
          差し込む資料を見ればわかる場合は「資料を参照」と書いてもかまいません。
        </span>
      </p>
      {plots.map((plot, index) => (
        <div key={plot.id} className={plotStyle}>
          <div className={plotHead}>
            <span className={cx(dot, reportPlotColor(index))} aria-hidden="true" />
            区{index + 1}
            {index >= 2 && (
              <button
                type="button"
                className={removeButton}
                aria-label={`区${index + 1}を削除`}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    plots: current.plots.filter((item) => item.id !== plot.id),
                  }))
                }
              >
                <Icon name="close" />
              </button>
            )}
          </div>
          <div className={fields}>
            <Input
              label={<span className={labelStyle}>区の名前</span>}
              placeholder={index === 0 ? "例）無処理区" : index === 1 ? "例）処理区" : "例）〇〇区"}
              value={plot.name}
              error={missing && plot.name.trim() === "" ? "区の名前を記入してください" : undefined}
              onChange={(event) => update(plot.id, { name: event.target.value })}
            />
            <Textarea
              fieldClassName={css({ mt: "3" })}
              label={<span className={labelStyle}>区の説明</span>}
              size="document"
              example={EXAMPLES[Math.min(index, 1)]}
              value={plot.description}
              error={
                missing && plot.description.trim() === "" ? "区の説明を記入してください" : undefined
              }
              onChange={(event) => update(plot.id, { description: event.target.value })}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className={addButton}
        onClick={() => onChange((current) => ({ ...current, plots: [...current.plots, createReportPlot()] }))}
      >
        <Icon name="add" size="sm" />
        区を追加
      </button>
    </>
  );
}
