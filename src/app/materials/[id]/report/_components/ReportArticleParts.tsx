import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import {
  REPORT_SECTIONS,
  groupReportMeasurements,
  type UsageReportInput,
} from "@/lib/usage-report";

import { plotColorClass } from "./ReportFormParts";
import { readCell } from "./ReportGraphEditor";

export type ReportSection = (typeof REPORT_SECTIONS)[number]["value"];

export function sectionHeading(input: UsageReportInput, section: ReportSection) {
  const custom = input.headings.find((item) => item.section === section)?.title;
  return custom ?? REPORT_SECTIONS.find((item) => item.value === section)?.title ?? "";
}

/** 記事の「栽培条件・施用時期」の先頭に出す行（地域・作物・施用時期） */
export function conditionLines(input: UsageReportInput, cropName: string) {
  const prefecture = PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name ?? "−";
  const variety = input.varietyUnknown ? "不明" : input.variety.trim() || "−";
  return [
    `地域：${prefecture}${input.showCity && input.city.trim() ? ` ${input.city.trim()}` : ""}`,
    `使用作物：${cropName}（品種：${variety}）`,
    `施用時期：${input.timingStages.map((stage) => APPLICATION_TIMINGS[stage]).join("、") || "−"}`,
  ].join("\n");
}

/** 見本の `.plot-list`（比較した区の静的なカード） */
export function PlotList({ plots }: { plots: UsageReportInput["plots"] }) {
  return (
    <div className="plot-list">
      {plots.map((plot, index) => (
        <div key={plot.id} className="plot-row">
          <span className={`plot-dot ${plotColorClass(index)}`} />
          <div className="plot-txt">
            <div className="plot-nm">
              <b>{plot.name || `区${index + 1}`}</b>
              {plot.scope && <span className="plot-scope">{plot.scope}</span>}
            </div>
            <div className="plot-desc">{plot.description || "−"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 見本の `.bars`（記事の横棒グラフ）。区の色は入力の縦棒と揃える */
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
    <div className="bars" role="list">
      {rows.map(({ plot, index, cell }) => (
        <div
          key={plot.id}
          role="listitem"
          className={index === 0 ? "bar ctrl" : "bar"}
          aria-label={`${plot.name || `区${index + 1}`} ${cell.label}`}
        >
          <span>{plot.name || `区${index + 1}`}</span>
          <span>
            <i
              className={plotColorClass(index)}
              style={{ width: `${Math.max(4, (cell.value / max) * 100)}%` }}
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
