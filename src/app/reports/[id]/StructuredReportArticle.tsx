import { Fragment } from "react";

import { reportPlotColor } from "@/components/ReportPlotColor";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import {
  REPORT_SECTIONS,
  groupReportMeasurements,
  parseReportNumber,
  type UsageReportInput,
} from "@/lib/usage-report";

import { ReportBars, type ReportBarRow } from "./ReportBars";
import { ReportFigures } from "./ReportFigures";

type Section = (typeof REPORT_SECTIONS)[number]["value"];
type Graph = UsageReportInput["measurements"][number]["graphs"][number];

/** 先頭の数値が読めた行だけを、区の並び順の色で棒にする。 */
function graphRows(graph: Graph, plots: UsageReportInput["plots"]): ReportBarRow[] {
  return graph.rows.flatMap((row, index) => {
    const parsed = parseReportNumber(row.value);
    if (parsed === null) return [];
    const plotIndex = row.plotId ? plots.findIndex((plot) => plot.id === row.plotId) : -1;
    return [
      {
        id: row.id,
        label: (plotIndex >= 0 ? plots[plotIndex]?.name : "") || row.label || `区 ${index + 1}`,
        valueText: row.value.trim(),
        value: parsed.value,
        error: parsed.error,
        colorIndex: plotIndex >= 0 ? plotIndex : index,
      },
    ];
  });
}

function Prose({ text }: { text: string }) {
  return (
    <div className="a-body">
      <p>{text}</p>
    </div>
  );
}

/**
 * 実証詳細レポート（新形式）の記事。見本 S.reportArticle／report-full の公開記事と同じ構成とクラス。
 * 結果・感想 → 期待した効果 → 栽培条件・施用時期 → 比較した区 → 使用結果の詳細 → 関連資料。
 * 施用方法タグは出さない（usage-reports-SPEC）。
 */
export function StructuredReportArticle({
  input,
  cropLabel,
  documentUrls,
}: {
  input: UsageReportInput;
  /** 使用作物（品種つき）。作物は親レコードにあるため外から渡す。 */
  cropLabel: string;
  documentUrls: { id: string; url: string }[];
}) {
  const heading = (section: Section, fallback: string) =>
    input.headings.find((item) => item.section === section)?.title || fallback;
  const mediaOf = (section: Section) => input.media.filter((media) => media.section === section);
  const prefecture = PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name;
  const stages = input.timingStages.map((stage) => APPLICATION_TIMINGS[stage]).join("、");
  const conditionLines = [
    prefecture
      ? `地域：${prefecture}${input.showCity && input.city.trim() ? input.city.trim() : ""}`
      : null,
    `使用作物：${cropLabel}`,
    input.cultivationEnvironment.trim() ? `栽培環境：${input.cultivationEnvironment.trim()}` : null,
    stages ? `施用時期：${stages}` : null,
    input.timingNote.trim() || null,
  ].filter((line): line is string => line !== null);
  const numericGroups = groupReportMeasurements(input.measurements);
  const textMeasurements = input.measurements.filter(
    (measurement) => measurement.kind === "text" && measurement.body.trim(),
  );

  return (
    <>
      {REPORT_SECTIONS.map(({ value: section, title }) => {
        const media = mediaOf(section);
        const h = heading(section, title);
        switch (section) {
          case "results":
            return (
              <Fragment key={section}>
                <h2 className="a-h3">{h}</h2>
                <Prose text={input.observedChange} />
                <ReportFigures media={media} />
              </Fragment>
            );
          case "effects":
            return (
              <Fragment key={section}>
                <h2 className="a-h3">{h}</h2>
                <Prose
                  text={[input.purposeTags.join("、"), input.purposeNote.trim()]
                    .filter((text) => text.length > 0)
                    .join("\n")}
                />
                <ReportFigures media={media} />
              </Fragment>
            );
          case "conditions":
            return (
              <Fragment key={section}>
                <h2 className="a-h3">{h}</h2>
                <Prose text={conditionLines.join("\n")} />
                <ReportFigures media={media} />
              </Fragment>
            );
          case "plots":
            return (
              <Fragment key={section}>
                <h2 className="a-h3">{h}</h2>
                <div className="plot-list">
                  {input.plots.map((plot, index) => (
                    <div key={plot.id} className="plot-row">
                      <span
                        className={`plot-dot plot-color ${reportPlotColor(index)}`}
                        aria-hidden="true"
                      />
                      <div className="plot-txt">
                        <div className="plot-nm">
                          <b>{plot.name || "区名未入力"}</b>
                          {plot.scope ? <span className="plot-scope">{plot.scope}</span> : null}
                        </div>
                        <div className="plot-desc">{plot.description || "−"}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <ReportFigures media={media} />
              </Fragment>
            );
          case "measurements":
            return (
              <Fragment key={section}>
                {numericGroups.map((measurement) => {
                  const graphs = measurement.graphs
                    .map((graph) => ({ graph, rows: graphRows(graph, input.plots) }))
                    .filter(({ rows }) => rows.length > 0);
                  return (
                    <Fragment key={measurement.id}>
                      <h2 className="a-h3">
                        {h}：{measurement.name || "調査項目未入力"}
                      </h2>
                      {graphs.map(({ graph, rows }) => (
                        <ReportBars
                          key={graph.id}
                          title={graph.heading || measurement.name}
                          unit={measurement.unit}
                          rows={rows}
                        />
                      ))}
                      {graphs.length > 0 ? (
                        <div className="graph-cap">
                          グラフは投稿されたデータからFarmilleが自動生成しています
                        </div>
                      ) : null}
                    </Fragment>
                  );
                })}
                {textMeasurements.map((measurement) => (
                  <Fragment key={measurement.id}>
                    <h2 className="a-h3">
                      {h}：{measurement.name}
                    </h2>
                    <Prose text={measurement.body} />
                  </Fragment>
                ))}
                <ReportFigures media={media} />
              </Fragment>
            );
          case "documents":
            if (input.documents.length === 0 && media.length === 0) return null;
            return (
              <Fragment key={section}>
                <h2 className="a-h3">{h}</h2>
                {input.documents.length > 0 ? (
                  <ul className="rp-docs">
                    {input.documents.map((document) => {
                      const url = documentUrls.find((item) => item.id === document.id)?.url;
                      return (
                        <li key={document.id}>
                          {url ? (
                            <a href={url} target="_blank" rel="noreferrer">
                              {document.name}
                            </a>
                          ) : (
                            document.name
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <ReportFigures media={media} />
              </Fragment>
            );
        }
        return null;
      })}
    </>
  );
}
