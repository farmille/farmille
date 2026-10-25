import { Fragment } from "react";

import { ReportBars, reportBarGroups, ReportGraphNote } from "@/components/ReportBars";
import { ReportPlotList } from "@/components/ReportPlotList";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import {
  REPORT_SECTIONS,
  reportMeasurementGroups,
  type UsageReportInput,
} from "@/lib/usage-report";
import { graphSections, reportPlotLayout } from "@/lib/usage-report-plots";

import { css } from "../../../../styled-system/css";
import { ReadingHeading, ReadingProse } from "../../articles/_components/Reading";
import { ReportFigures, ReportItemImages } from "./ReportFigures";

type Section = (typeof REPORT_SECTIONS)[number]["value"];

const documentList = css({
  m: "0",
  pl: "4.5",
  fontSize: "md",
  color: "text.muted",
  lineHeight: "prose",
  "& a": { color: "text.brand" },
});

export function StructuredReportArticle({
  input,
  materialName,
  cropLabel,
  documentUrls,
}: {
  input: UsageReportInput;
  /** 投稿した資材の名前。区の資材の表示に使う。 */
  materialName: string;
  cropLabel: string;
  documentUrls: { id: string; url: string }[];
}) {
  const layout = reportPlotLayout(input, materialName);
  const heading = (section: Section, fallback: string) =>
    input.headings.find((item) => item.section === section)?.title || fallback;
  // 調査項目に差し込んだ画像は項目ごとに出し、節の最後には調査項目に属さない旧形式の写真だけを出す
  const mediaOf = (section: Section) =>
    input.media.filter((media) => media.section === section && !media.measurementId);
  const prefecture = PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name;
  const stages = input.timingStages.map((stage) => APPLICATION_TIMINGS[stage]).join("、");
  const conditionLines = [
    prefecture
      ? `地域：${prefecture}${input.showCity && input.city.trim() ? input.city.trim() : ""}`
      : null,
    `使用対象作目：${cropLabel}`,
    input.cultivationEnvironment.trim() ? `栽培環境：${input.cultivationEnvironment.trim()}` : null,
    stages ? `施用時期：${stages}` : null,
    input.timingNote.trim() || null,
  ].filter((line): line is string => line !== null);

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
                <ReportPlotList layout={layout} commonDescription={input.commonPlotDescription} />
                <ReportFigures media={media} />
              </Fragment>
            );
          case "measurements":
            return (
              <Fragment key={section}>
                {reportMeasurementGroups(input.measurements).map((group) => {
                  const [first] = group;
                  if (first === undefined || (first.kind === "text" && !first.body.trim()))
                    return null;
                  return (
                    <Fragment key={first.id}>
                      <ReadingHeading>
                        {h}：{first.name || "調査項目未入力"}
                      </ReadingHeading>
                      {group.map((measurement) => {
                        const graphs = measurement.graphs
                          .map((graph) => ({
                            graph,
                            groups: reportBarGroups(graphSections(graph, input.plots, layout)),
                          }))
                          .filter(({ groups }) => groups.length > 0);
                        return (
                          <Fragment key={measurement.id}>
                            <ReportItemImages
                              media={input.media.filter(
                                (media) => media.measurementId === measurement.id,
                              )}
                              alt={measurement.name}
                            />
                            {graphs.map(({ graph, groups }) => (
                              <ReportBars
                                key={graph.id}
                                title={graph.heading || measurement.name}
                                unit={measurement.unit}
                                groups={groups}
                                legend={layout.legend}
                              />
                            ))}
                            {graphs.length > 0 ? (
                              <ReportGraphNote>
                                グラフは投稿されたデータからFarmilleが自動生成しています
                              </ReportGraphNote>
                            ) : null}
                            {measurement.body.trim() ? (
                              <ReadingProse text={measurement.body} />
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })}
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
