import type { ReactNode } from "react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Input, Textarea } from "@/components/form";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { ReportBars, reportBarGroups, ReportGraphNote } from "@/components/ReportBars";
import { ReportPlotList } from "@/components/ReportPlotList";
import { PREFECTURES } from "@/lib/prefectures";
import {
  REPORT_SECTIONS,
  groupReportMeasurements,
  type UsageReportInput,
} from "@/lib/usage-report";
import { graphSections, reportPlotLayout } from "@/lib/usage-report-plots";
import { css } from "../../styled-system/css";

const sectionStyle = css({ py: "5", borderBottomWidth: "1px", borderColor: "border.default" });
const prose = css({ whiteSpace: "pre-wrap", overflowWrap: "anywhere", textStyle: "prose" });
const body = css({ textStyle: "body" });
const sectionHeading = css({ textStyle: "title", mb: "3" });
const subHeading = css({ textStyle: "body", fontWeight: "bold", mb: "3" });
const photoGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: "3",
  mt: "3",
});
const muted = css({ color: "text.muted", fontSize: "sm" });
export function UsageReportArticle({
  input,
  materialName,
  onChange,
  renderSectionTools,
  documentUrls,
}: {
  input: UsageReportInput;
  /** 投稿した資材の名前。区の資材の表示に使う。 */
  materialName: string;
  onChange?: (input: UsageReportInput) => void;
  renderSectionTools?: (section: UsageReportInput["media"][number]["section"]) => ReactNode;
  documentUrls?: { id: string; url: string }[];
}) {
  function text(value: string, label: string, update: (value: string) => UsageReportInput) {
    return onChange ? (
      <Textarea
        hideLabel
        label={label}
        value={value}
        onChange={(event) => onChange(update(event.target.value))}
      />
    ) : (
      <p className={prose}>{value}</p>
    );
  }
  const layout = reportPlotLayout(input, materialName);
  return (
    <div>
      {REPORT_SECTIONS.map((section) => (
        <section key={section.value} className={sectionStyle}>
          {onChange ? (
            <Input
              hideLabel
              label={`${section.title}の見出し`}
              value={
                input.headings.find((item) => item.section === section.value)?.title ??
                section.title
              }
              onChange={(event) =>
                onChange({
                  ...input,
                  headings: [
                    ...input.headings.filter((item) => item.section !== section.value),
                    { section: section.value, title: event.target.value },
                  ],
                })
              }
            />
          ) : (
            <h2 className={sectionHeading}>
              {input.headings.find((item) => item.section === section.value)?.title ||
                section.title}
            </h2>
          )}
          {section.value === "results" &&
            text(input.observedChange, "結果・感想の本文", (observedChange) => ({
              ...input,
              observedChange,
            }))}
          {section.value === "effects" && <p className={body}>{input.purposeTags.join(" ／ ")}</p>}
          {section.value === "conditions" && (
            <>
              <p className={body}>
                {PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name}{" "}
                {input.showCity ? input.city : ""}
              </p>
              {text(input.cultivationEnvironment, "栽培環境の本文", (cultivationEnvironment) => ({
                ...input,
                cultivationEnvironment,
              }))}
              <p className={body}>
                {input.timingStages.map((stage) => APPLICATION_TIMINGS[stage]).join(" ／ ")}
              </p>
              {text(input.timingNote, "施用時期の本文", (timingNote) => ({ ...input, timingNote }))}
            </>
          )}
          {section.value === "plots" && (
            <ReportPlotList layout={layout} commonDescription={input.commonPlotDescription} />
          )}
          {section.value === "measurements" && (
            <>
              {groupReportMeasurements(input.measurements).map((measurement) => (
                <div key={measurement.id} className={css({ mt: "5" })}>
                  <h3 className={subHeading}>
                    使用結果の詳細：{measurement.name || "調査項目未入力"}
                    {measurement.unit ? `（${measurement.unit}）` : ""}
                  </h3>
                  {measurement.graphs.map((graph) => (
                    <ReportBars
                      key={graph.id}
                      title={graph.heading || measurement.name}
                      unit={measurement.unit}
                      groups={reportBarGroups(graphSections(graph, input.plots, layout))}
                      legend={layout.legend}
                    />
                  ))}
                  {measurement.graphs.length > 0 && (
                    <ReportGraphNote>
                      グラフは投稿されたデータからFarmilleが自動生成しています。
                    </ReportGraphNote>
                  )}
                </div>
              ))}
              {input.measurements
                .filter((measurement) => measurement.kind === "text")
                .map((measurement) => (
                  <div key={measurement.id} className={css({ mt: "5" })}>
                    <h3 className={subHeading}>{measurement.name}</h3>
                    {text(measurement.body, `${measurement.name}の本文`, (body) => ({
                      ...input,
                      measurements: input.measurements.flatMap((item) =>
                        item.id !== measurement.id
                          ? [item]
                          : body.trim()
                            ? [{ ...item, body }]
                            : [],
                      ),
                    }))}
                  </div>
                ))}
            </>
          )}
          {section.value === "documents" && (
            <ul className={body}>
              {input.documents.map((document) => (
                <li key={document.id}>
                  {documentUrls?.find((item) => item.id === document.id) ? (
                    <a
                      href={documentUrls.find((item) => item.id === document.id)?.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {document.name}
                    </a>
                  ) : (
                    document.name
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className={photoGrid}>
            {input.media
              .filter((media) => media.section === section.value)
              .map((media) => (
                <figure key={media.id}>
                  {media.mediaType === "photo" ? (
                    <OptimizedImage
                      src={media.url}
                      alt={media.caption}
                      width={600}
                      height={400}
                      sizes="(max-width: 640px) 45vw, 300px"
                      className={css({ w: "full", height: "auto", borderRadius: "card" })}
                    />
                  ) : (
                    <video controls src={media.url} className={css({ w: "full" })} />
                  )}
                  {onChange ? (
                    <Input
                      hideLabel
                      label="写真の説明"
                      value={media.caption}
                      onChange={(event) =>
                        onChange({
                          ...input,
                          media: input.media.map((item) =>
                            item.id === media.id ? { ...item, caption: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  ) : (
                    <figcaption className={muted}>{media.caption}</figcaption>
                  )}
                  {onChange && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...input,
                          media: input.media.filter((item) => item.id !== media.id),
                        })
                      }
                    >
                      写真を削除
                    </button>
                  )}
                </figure>
              ))}
          </div>
          {renderSectionTools?.(section.value)}
        </section>
      ))}
    </div>
  );
}
