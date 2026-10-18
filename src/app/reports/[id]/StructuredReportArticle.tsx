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

import { css, cx } from "../../../../styled-system/css";
import { ReadingHeading, ReadingProse } from "../../articles/_components/Reading";
import { ReportBars, ReportGraphNote, type ReportBarRow } from "./ReportBars";
import { ReportFigures } from "./ReportFigures";

type Section = (typeof REPORT_SECTIONS)[number]["value"];
type Graph = UsageReportInput["measurements"][number]["graphs"][number];

const plotStyles = {
  list: css({ display: "flex", flexDirection: "column", gap: "2.5", mt: "2.5" }),
  row: css({
    display: "flex",
    alignItems: "flex-start",
    gap: "2.5",
    px: "3",
    py: "2.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "input",
    bg: "surface.card",
  }),
  dot: css({ flexShrink: "0", w: "3", h: "3", mt: "1", borderRadius: "pill", bg: "currentColor" }),
  name: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "2.5",
    rowGap: "1.5",
    textStyle: "body",
  }),
  scope: css({
    px: "2",
    py: "0.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "pill",
    bg: "surface.page",
    fontSize: "xs",
    color: "text.muted",
  }),
  description: css({
    mt: "1",
    textStyle: "prose",
    color: "text.muted",
    whiteSpace: "pre-wrap",
  }),
};

const documentList = css({
  m: "0",
  pl: "4.5",
  fontSize: "md",
  color: "text.muted",
  lineHeight: "prose",
  "& a": { color: "text.brand" },
});

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

export function StructuredReportArticle({
  input,
  cropLabel,
  documentUrls,
}: {
  input: UsageReportInput;
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
                <ReadingHeading>{h}</ReadingHeading>
                <ReadingProse text={input.observedChange} />
                <ReportFigures media={media} />
              </Fragment>
            );
          case "effects":
            return (
              <Fragment key={section}>
                <ReadingHeading>{h}</ReadingHeading>
                <ReadingProse
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
                <ReadingHeading>{h}</ReadingHeading>
                <ReadingProse text={conditionLines.join("\n")} />
                <ReportFigures media={media} />
              </Fragment>
            );
          case "plots":
            return (
              <Fragment key={section}>
                <ReadingHeading>{h}</ReadingHeading>
                <div className={plotStyles.list}>
                  {input.plots.map((plot, index) => (
                    <div key={plot.id} className={plotStyles.row}>
                      <span
                        className={cx(plotStyles.dot, reportPlotColor(index))}
                        aria-hidden="true"
                      />
                      <div className={css({ minW: "0", flex: "1" })}>
                        <div className={plotStyles.name}>
                          <b>{plot.name || "区名未入力"}</b>
                          {plot.scope ? (
                            <span className={plotStyles.scope}>{plot.scope}</span>
                          ) : null}
                        </div>
                        <div className={plotStyles.description}>{plot.description || "−"}</div>
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
                      <ReadingHeading>
                        {h}：{measurement.name || "調査項目未入力"}
                      </ReadingHeading>
                      {graphs.map(({ graph, rows }) => (
                        <ReportBars
                          key={graph.id}
                          title={graph.heading || measurement.name}
                          unit={measurement.unit}
                          rows={rows}
                        />
                      ))}
                      {graphs.length > 0 ? (
                        <ReportGraphNote>
                          グラフは投稿されたデータからFarmilleが自動生成しています
                        </ReportGraphNote>
                      ) : null}
                    </Fragment>
                  );
                })}
                {textMeasurements.map((measurement) => (
                  <Fragment key={measurement.id}>
                    <ReadingHeading>
                      {h}：{measurement.name}
                    </ReadingHeading>
                    <ReadingProse text={measurement.body} />
                  </Fragment>
                ))}
                <ReportFigures media={media} />
              </Fragment>
            );
          case "documents":
            if (input.documents.length === 0 && media.length === 0) return null;
            return (
              <Fragment key={section}>
                <ReadingHeading>{h}</ReadingHeading>
                {input.documents.length > 0 ? (
                  <ul className={documentList}>
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
