"use client";

import { useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/form";
import { reportPlotColor } from "@/components/ReportPlotColor";
import type { UsageReportInput } from "@/lib/usage-report";
import { graphWithPlots, type ReportPlotLayout } from "@/lib/usage-report-plots";

import { css, cx } from "../../../../../../styled-system/css";

import { REPORT_SHORT_MAX, type ReportPageNumericItem } from "./report-page-state";
import { labelStyle } from "./report-page-styles";
import { ReportLeaveWarning } from "./ReportLeaveWarning";

const graphBlock = css({
  mt: "5",
  pt: "3",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});

const rowLabel = css({ display: "inline-flex", alignItems: "center", gap: "1.5" });

const dot = css({ flex: "none", w: "2.5", h: "2.5", borderRadius: "pill", bg: "currentColor" });

const note = css({ m: "0", mt: "1", textStyle: "supporting", color: "text.muted" });

/** 数値のグラフの調査項目を直す一覧。値は原文の文字列（「1126±139 B」など）のまま直す。 */
export function ReportNumericItemDialog({
  item,
  plots,
  layout,
  onCommit,
  onClose,
}: {
  item: ReportPageNumericItem;
  plots: UsageReportInput["plots"];
  layout: ReportPlotLayout;
  onCommit: (item: ReportPageNumericItem) => void;
  onClose: () => void;
}) {
  // 開くたびに呼び出し側が作り直す（key）ので、最初の状態は区にそろえた調査項目
  const [initial] = useReducer(
    (value: ReportPageNumericItem) => value,
    null,
    () => ({
      ...item,
      graphs: item.graphs.map((graph) => graphWithPlots(graph, plots)),
    }),
  );
  const form = useForm({ defaultValues: { draft: initial } });
  const draft = useStore(form.store, (state) => state.values.draft);
  const setDraft = (next: (current: ReportPageNumericItem) => ReportPageNumericItem) =>
    form.setFieldValue("draft", next);
  const [asking, setAsking] = useReducer((_current: boolean, next: boolean) => next, false);
  const changed = JSON.stringify(draft) !== JSON.stringify(initial);
  const order = new Map(plots.map((plot, index) => [plot.id, index]));
  const updateGraph = (
    graphId: string,
    next: (
      graph: ReportPageNumericItem["graphs"][number],
    ) => ReportPageNumericItem["graphs"][number],
  ) =>
    setDraft((current) => ({
      ...current,
      graphs: current.graphs.map((graph) => (graph.id === graphId ? next(graph) : graph)),
    }));

  return (
    <>
      {changed && <ReportLeaveWarning />}
      <Dialog
        open
        onOpenChange={(open) => {
          if (open) return;
          // 直した値を確かめずに捨てないよう、変えたときだけ確かめる
          if (changed) setAsking(true);
          else onClose();
        }}
        size="sheet"
        title={`${item.name.trim() || "調査項目"}：数値を直す`}
        closeLabel="直さずに閉じる"
        footer={
          <Button variant="primary" size="sm" onClick={() => onCommit(draft)}>
            ページに入れる
          </Button>
        }
      >
        <Input
          label={<span className={labelStyle}>調査項目名</span>}
          maxLength={REPORT_SHORT_MAX}
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
        />
        <Input
          fieldClassName={css({ mt: "3" })}
          label={<span className={labelStyle}>単位</span>}
          maxLength={REPORT_SHORT_MAX}
          placeholder="例）g"
          value={draft.unit}
          onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
        />
        {draft.graphs.map((graph, graphIndex) => (
          <div key={graph.id} className={graphBlock}>
            <Input
              label={
                <span className={labelStyle}>
                  {draft.graphs.length > 1 ? `グラフ${graphIndex + 1}の題` : "グラフの題"}
                </span>
              }
              maxLength={REPORT_SHORT_MAX}
              placeholder={draft.name || "例）収穫時の可販重量"}
              value={graph.heading}
              onChange={(event) => {
                const heading = event.target.value;
                updateGraph(graph.id, (current) => ({ ...current, heading }));
              }}
            />
            <p className={note}>
              区ごとの値は、資料のとおりに書きます（例：1126±139
              B）。先頭の数値と±の誤差が棒になります。
            </p>
            {graph.rows.map((row) => {
              const index = order.get(row.plotId ?? "") ?? -1;
              const plot = plots[index];
              const name = plot?.name.trim() || `区${index + 1}`;
              return (
                <Input
                  key={row.id}
                  fieldClassName={css({ mt: "3" })}
                  label={
                    <span className={cx(labelStyle, rowLabel)}>
                      <span
                        className={cx(
                          dot,
                          reportPlotColor({ series: layout.series(row.plotId, index) }),
                        )}
                        aria-hidden="true"
                      />
                      {name}
                    </span>
                  }
                  maxLength={REPORT_SHORT_MAX}
                  value={row.value}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateGraph(graph.id, (current) => ({
                      ...current,
                      rows: current.rows.map((item) =>
                        item.id === row.id ? { ...item, value } : item,
                      ),
                    }));
                  }}
                />
              );
            })}
          </div>
        ))}
      </Dialog>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title="記入をやめますか？"
        description="ここで変えた内容は反映されず、変更前のままになります。"
        confirmLabel="記入をやめる"
        cancelLabel="記入を続ける"
        tone="primary"
        onConfirm={() => {
          setAsking(false);
          onClose();
        }}
      />
    </>
  );
}
