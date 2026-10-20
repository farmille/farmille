import { reportPlotColor } from "@/components/ReportPlotColor";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import {
  REPORT_SECTIONS,
  groupReportMeasurements,
  type UsageReportInput,
} from "@/lib/usage-report";

import { css, cx } from "../../../../../../styled-system/css";

import { readCell } from "./ReportGraphEditor";

export type ReportSection = (typeof REPORT_SECTIONS)[number]["value"];

export function sectionHeading(input: UsageReportInput, section: ReportSection) {
  const custom = input.headings.find((item) => item.section === section)?.title;
  return custom ?? REPORT_SECTIONS.find((item) => item.value === section)?.title ?? "";
}

export function conditionLines(input: UsageReportInput, cropName: string) {
  const prefecture = PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name ?? "−";
  const variety = input.varietyUnknown ? "不明" : input.variety.trim() || "−";
  return [
    `地域：${prefecture}${input.showCity && input.city.trim() ? input.city.trim() : ""}`,
    `使用対象作目：${cropName}（品種：${variety}）`,
    `施用時期：${input.timingStages.map((stage) => APPLICATION_TIMINGS[stage]).join("、") || "−"}`,
  ].join("\n");
}

export function effectsText(input: UsageReportInput) {
  return [input.purposeTags.join("、"), input.purposeNote.trim()]
    .filter((text) => text.length > 0)
    .join("\n");
}

const plotList = css({ display: "flex", flexDirection: "column", gap: "2.5", mt: "2.5" });
const plotRow = css({
  display: "flex",
  gap: "2.5",
  alignItems: "flex-start",
  py: "2.5",
  px: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.card",
});
const plotDot = css({
  flex: "none",
  w: "3",
  h: "3",
  borderRadius: "pill",
  mt: "1",
  bg: "currentColor",
});
const plotName = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "2.5",
  rowGap: "1.5",
  textStyle: "body",
});
const plotScope = css({
  fontSize: "sm",
  color: "text.muted",
  bg: "surface.page",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "pill",
  py: "0.5",
  px: "2",
});
const plotDescription = css({
  textStyle: "prose",
  color: "text.muted",
  mt: "1",
  whiteSpace: "pre-wrap",
});

export function PlotList({ plots }: { plots: UsageReportInput["plots"] }) {
  return (
    <div className={plotList}>
      {plots.map((plot, index) => (
        <div key={plot.id} className={plotRow}>
          <span className={cx(plotDot, reportPlotColor(index))} />
          <div className={css({ minW: "0", flex: "1" })}>
            <div className={plotName}>
              <b>{plot.name || `区${index + 1}`}</b>
              {plot.scope && <span className={plotScope}>{plot.scope}</span>}
            </div>
            <div className={plotDescription}>{plot.description || "−"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const bars = css({ mt: "2", display: "flex", flexDirection: "column", gap: "1.5", maxW: "96" });
const bar = css({
  display: "grid",
  gridTemplateColumns: "token(sizes.reportGraph.plot) minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "2",
  fontSize: "sm",
  "& > span:first-child": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  "& > b": { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
});
const barFill = css({
  display: "block",
  w: "var(--bar-width)",
  h: "4",
  borderRadius: "bar",
  bg: "currentColor",
});

export function ReportBars({
  graph,
  plots,
}: {
  graph: UsageReportInput["measurements"][number]["graphs"][number];
  plots: UsageReportInput["plots"];
}) {
  const rows = plots.flatMap((plot, index) => {
    const cell = readCell(graph.rows.find((row) => row.plotId === plot.id)?.value ?? "");
    return cell.kind === "num" ? [{ plot, index, cell }] : [];
  });
  const max = Math.max(1, ...rows.map(({ cell }) => cell.value + cell.error));
  return (
    <div className={bars} role="list">
      {rows.map(({ plot, index, cell }) => (
        <div
          key={plot.id}
          role="listitem"
          className={bar}
          aria-label={`${plot.name || `区${index + 1}`} ${cell.label}`}
        >
          <span>{plot.name || `区${index + 1}`}</span>
          <span>
            <i
              className={cx(barFill, reportPlotColor(index))}
              style={{ "--bar-width": `${Math.max(4, (cell.value / max) * 100)}%` }}
            />
          </span>
          <b>{cell.label}</b>
        </div>
      ))}
    </div>
  );
}

export function numericGroups(input: UsageReportInput) {
  return groupReportMeasurements(input.measurements);
}
