import type { ReactNode } from "react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { APPLICATION_METHODS, APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import { REPORT_SECTIONS, parseReportNumber, type UsageReportInput } from "@/lib/usage-report";
import { css } from "../../styled-system/css";

const sectionStyle = css({ py: "5", borderBottomWidth: "1px", borderColor: "border.default" });
const prose = css({ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: "1.8" });
const headingStyle = css({ fontSize: "lg", fontWeight: "700", mb: "3" });
const photoGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: "3",
  mt: "3",
});
const muted = css({ color: "text.muted", fontSize: "sm" });
const barStyle = css({ fill: "brand.primary", color: "brand.primary" });
const firstBarStyle = css({ fill: "text.subtle", color: "text.subtle" });
const chart = css({ width: "100%", height: "10", display: "block", overflow: "visible" });

export function ReportGraph({
  graph,
  plots,
  unit,
}: {
  graph: UsageReportInput["measurements"][number]["graphs"][number];
  plots: UsageReportInput["plots"];
  unit: string;
}) {
  const rows = graph.rows.flatMap((row, index) => {
    const parsed = parseReportNumber(row.value);
    return parsed === null
      ? []
      : [
          {
            ...row,
            index,
            parsed,
            label:
              row.label || plots.find((plot) => plot.id === row.plotId)?.name || `区 ${index + 1}`,
          },
        ];
  });
  const minimum = Math.min(0, ...rows.map(({ parsed }) => parsed.value - (parsed.error ?? 0)));
  const maximum = Math.max(0, ...rows.map(({ parsed }) => parsed.value + (parsed.error ?? 0)));
  const range = maximum - minimum || 1;
  const x = (value: number) => 5 + ((value - minimum) / range) * 290;
  return (
    <figure>
      {graph.heading && <figcaption className={headingStyle}>{graph.heading}</figcaption>}
      {rows.map((row) => (
        <div key={row.id}>
          <div
            className={css({
              display: "flex",
              justifyContent: "space-between",
              gap: "2",
              fontSize: "sm",
            })}
          >
            <span className={css({ lineClamp: "2", overflowWrap: "anywhere" })}>{row.label}</span>
            <span>
              {row.value} {unit}
            </span>
          </div>
          <svg
            className={chart}
            viewBox="0 0 300 30"
            role="img"
            aria-label={`${row.label} ${row.value} ${unit}`}
          >
            <line x1={x(0)} x2={x(0)} y1="0" y2="30" stroke="currentColor" />
            <rect
              className={row.index === 0 ? firstBarStyle : barStyle}
              x={Math.min(x(0), x(row.parsed.value))}
              y="5"
              width={Math.abs(x(row.parsed.value) - x(0))}
              height="20"
            />
            {row.parsed.error !== null && (
              <g stroke="currentColor">
                <line
                  x1={x(row.parsed.value - row.parsed.error)}
                  x2={x(row.parsed.value + row.parsed.error)}
                  y1="15"
                  y2="15"
                />
                <line
                  x1={x(row.parsed.value - row.parsed.error)}
                  x2={x(row.parsed.value - row.parsed.error)}
                  y1="9"
                  y2="21"
                />
                <line
                  x1={x(row.parsed.value + row.parsed.error)}
                  x2={x(row.parsed.value + row.parsed.error)}
                  y1="9"
                  y2="21"
                />
              </g>
            )}
          </svg>
        </div>
      ))}
      {rows.length > 0 && (
        <p className={muted}>グラフは投稿されたデータからFarmilleが自動生成しています。</p>
      )}
    </figure>
  );
}

export function UsageReportArticle({
  input,
  onChange,
  renderSectionTools,
  documentUrls,
}: {
  input: UsageReportInput;
  onChange?: (input: UsageReportInput) => void;
  renderSectionTools?: (section: UsageReportInput["media"][number]["section"]) => ReactNode;
  documentUrls?: { id: string; url: string }[];
}) {
  function text(value: string, label: string, update: (value: string) => UsageReportInput) {
    return onChange ? (
      <Textarea
        aria-label={label}
        value={value}
        onChange={(event) => onChange(update(event.target.value))}
      />
    ) : (
      <p className={prose}>{value}</p>
    );
  }
  return (
    <div>
      {REPORT_SECTIONS.map((section) => (
        <section key={section.value} className={sectionStyle}>
          {onChange ? (
            <Input
              aria-label={`${section.title}の見出し`}
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
            <h2 className={headingStyle}>
              {input.headings.find((item) => item.section === section.value)?.title ||
                section.title}
            </h2>
          )}
          {section.value === "results" &&
            text(input.observedChange, "結果・感想の本文", (observedChange) => ({
              ...input,
              observedChange,
            }))}
          {section.value === "effects" && <p>{input.purposeTags.join(" ／ ")}</p>}
          {section.value === "conditions" && (
            <>
              <p>
                {PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name}{" "}
                {input.showCity ? input.city : ""}
              </p>
              {text(input.cultivationEnvironment, "栽培環境の本文", (cultivationEnvironment) => ({
                ...input,
                cultivationEnvironment,
              }))}
              <p>{input.timingStages.map((stage) => APPLICATION_TIMINGS[stage]).join(" ／ ")}</p>
              {text(input.timingNote, "施用時期の本文", (timingNote) => ({ ...input, timingNote }))}
            </>
          )}
          {section.value === "plots" &&
            input.plots.map((plot) => (
              <div key={plot.id} className={css({ mt: "3" })}>
                {onChange ? (
                  <Input
                    aria-label="記事内の区の名前"
                    value={plot.name}
                    onChange={(event) =>
                      onChange({
                        ...input,
                        plots: input.plots.map((item) =>
                          item.id === plot.id ? { ...item, name: event.target.value } : item,
                        ),
                      })
                    }
                  />
                ) : (
                  <h3 className={headingStyle}>
                    {plot.name || "区名未入力"}（{plot.scope}）
                  </h3>
                )}
                {onChange && (
                  <label>
                    調査した範囲
                    <Input
                      value={plot.scope}
                      onChange={(event) =>
                        onChange({
                          ...input,
                          plots: input.plots.map((item) =>
                            item.id === plot.id ? { ...item, scope: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </label>
                )}
                {text(plot.description, `${plot.name}の説明`, (description) => ({
                  ...input,
                  plots: input.plots.map((item) =>
                    item.id === plot.id ? { ...item, description } : item,
                  ),
                }))}
                <p className={muted}>
                  {plot.steps
                    .filter((step) => step.method !== "")
                    .map(
                      (step) =>
                        `${APPLICATION_METHODS.find((method) => method.value === step.method)?.label}：${step.method === "other" ? step.otherText : step.targets.join("・")}`,
                    )
                    .join(" ／ ")}
                </p>
              </div>
            ))}
          {section.value === "measurements" &&
            input.measurements.map((measurement) => (
              <div key={measurement.id} className={css({ mt: "5" })}>
                {onChange && (
                  <Input
                    aria-label="記事内の調査項目の見出し"
                    value={measurement.name}
                    onChange={(event) =>
                      onChange({
                        ...input,
                        measurements: input.measurements.map((item) =>
                          item.id === measurement.id ? { ...item, name: event.target.value } : item,
                        ),
                      })
                    }
                  />
                )}
                <h3 className={headingStyle}>
                  {measurement.name || "指標名未入力"}
                  {measurement.kind === "numeric" && measurement.unit
                    ? `（${measurement.unit}）`
                    : ""}
                </h3>
                {measurement.kind === "text"
                  ? text(measurement.body, `${measurement.name}の本文`, (body) => ({
                      ...input,
                      measurements: input.measurements.map((item) =>
                        item.id === measurement.id ? { ...item, body } : item,
                      ),
                    }))
                  : measurement.graphs.map((graph) => (
                      <ReportGraph
                        key={graph.id}
                        graph={graph}
                        plots={input.plots}
                        unit={measurement.unit}
                      />
                    ))}
              </div>
            ))}
          {section.value === "documents" && (
            <ul>
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
                      className={css({ w: "100%", height: "auto", borderRadius: "card" })}
                    />
                  ) : (
                    <video controls src={media.url} className={css({ w: "100%" })} />
                  )}
                  {onChange ? (
                    <Input
                      aria-label="写真の説明"
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
