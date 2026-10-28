"use client";

import { ReportFigures, ReportItemImages } from "@/app/reports/[id]/ReportFigures";
import { Dialog } from "@/components/Dialog";
import { ReportBars, reportBarGroups, ReportGraphNote } from "@/components/ReportBars";
import { ReportFacts } from "@/components/ReportFacts";
import { ReportPlotList } from "@/components/ReportPlotList";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import {
  reportSectionHeading,
  reportVarietyNames,
  type UsageReportInput,
} from "@/lib/usage-report";
import { graphSections, reportPlotLayout } from "@/lib/usage-report-plots";

import { css } from "../../../../../../styled-system/css";

import { ReportPdfReadingMark } from "./ReportPdfReadingMark";
import {
  itemMarkFields,
  plotMarkFields,
  reportLegacyMedia,
  reportPageItemImages,
  type ReportMarkField,
  type ReportPageItem,
} from "./report-page-state";

const wrap = css({
  maxW: "content.form",
  mx: "auto",
  px: "4",
  pt: "3.5",
  pb: "16",
  bg: "surface.card",
  minH: "full",
});

const missingBox = css({
  mb: "3",
  px: "3",
  py: "2",
  borderRadius: "input",
  bg: "accent.dangerSoft",
  color: "accent.danger",
  textStyle: "supporting",
  fontWeight: "bold",
});

const title = css({ m: "0", fontSize: "2xl", lineHeight: "snug" });

const byline = css({
  mt: "2",
  display: "flex",
  flexWrap: "wrap",
  rowGap: "1",
  columnGap: "2.5",
  textStyle: "note",
  color: "text.muted",
});

const author = css({ fontWeight: "bold", color: "text.default" });

const summary = css({ mt: "3" });

const materialRef = css({
  mt: "3.5",
  px: "3",
  py: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
});

const h2 = css({
  m: "0",
  mt: "6.5",
  mb: "1.5",
  pb: "1",
  fontSize: "xl",
  borderBottomWidth: "2px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const h3 = css({ m: "0", mt: "4.5", mb: "1", fontSize: "lg" });

const prose = css({ m: "0", textStyle: "prose", whiteSpace: "pre-wrap" });

const none = css({ m: "0", textStyle: "prose", color: "text.muted" });

const documentList = css({
  m: "0",
  pl: "4.5",
  textStyle: "prose",
  color: "text.muted",
  "& a": { color: "text.brand" },
});

const facts = css({
  display: "grid",
  gridTemplateColumns: "[7.5em minmax(0, 1fr)]",
  rowGap: "1",
  columnGap: "2.5",
  m: "0",
  textStyle: "prose",
  "& dt": { color: "text.muted" },
  "& dd": { m: "0", whiteSpace: "pre-wrap" },
});

function Text({ value, empty = "（未記入）" }: { value: string; empty?: string }) {
  return value.trim() ? <p className={prose}>{value.trim()}</p> : <p className={none}>{empty}</p>;
}

/** プレビュー：投稿したあと、資材ページから開いたときの記事の見え方。 */
export function ReportPagePreview({
  open,
  onOpenChange,
  input,
  items,
  title: heading,
  materialName,
  manufacturerName,
  cropName,
  authorName,
  documentUrls,
  missing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: UsageReportInput;
  items: ReportPageItem[];
  title: string;
  materialName: string;
  manufacturerName: string;
  cropName: string | null;
  authorName: string;
  documentUrls: { id: string; url: string }[];
  missing: string[];
}) {
  const today = new Date();
  const variety = input.varietyUnknown ? "" : reportVarietyNames(input);
  const prefecture =
    PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name ?? "（未選択）";
  const city = input.showCity && input.city.trim() ? ` ${input.city.trim()}` : "";
  const stages = input.timingStages
    .toSorted((a, b) => a - b)
    .map((stage) => APPLICATION_TIMINGS[stage])
    .join("、");
  const shown = items.filter((item) => item.mode !== "");
  const layout = reportPlotLayout(input, materialName);
  // 以前の入力画面で節ごとに添えた写真は、公開記事と同じく節の最後に出す
  const legacy = (section: UsageReportInput["media"][number]["section"]) => (
    <ReportFigures media={reportLegacyMedia(input).filter((media) => media.section === section)} />
  );
  const documentMedia = reportLegacyMedia(input).filter((media) => media.section === "documents");
  // 印は投稿者のプレビューにだけ出す（公開記事の部品には渡さない）
  const conditionMarks: ReportMarkField[] = [
    { key: "prefectureCode", label: "地域" },
    { key: "cropId", label: "使用作物" },
    ...input.varieties.map(
      ({ id }): ReportMarkField => ({ key: `varieties.${id}.name`, label: "品種" }),
    ),
    { key: "cultivationEnvironment", label: "栽培環境" },
    { key: "timingStages", label: "施用時期" },
    { key: "timingNote", label: "処理日と生育状況" },
  ];
  const plotMarks: ReportMarkField[] = [
    { key: "commonPlotDescription", label: "全区に共通の説明" },
    ...input.comparedMaterials.map(
      ({ id }): ReportMarkField => ({
        key: `comparedMaterials.${id}.name`,
        label: "比較した資材",
      }),
    ),
    ...input.plots.flatMap((plot, index) =>
      plotMarkFields(plot.id).map((field) => ({
        ...field,
        label: `${plot.name.trim() || `区${index + 1}`}の${field.label ?? ""}`,
      })),
    ),
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="fullscreen"
      title="プレビュー（公開後の見え方）"
      closeLabel="編集に戻る"
    >
      <article className={wrap}>
        {missing.length > 0 && (
          <p className={missingBox}>
            未記入の項目が{missing.length}件あります（{missing.join("、")}
            ）。投稿するときに確認します。
          </p>
        )}
        <h1 className={title}>{heading}</h1>
        <div className={byline}>
          <span className={author}>{authorName}</span>
          <span>
            {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
          </span>
        </div>
        <ReportFacts
          crop={cropName === null ? null : `${cropName}${variety ? `（${variety}）` : ""}`}
          effects={input.purposeTags}
          standpoint="生産者"
          className={summary}
        />
        <div className={materialRef}>
          <div className={css({ textStyle: "note", color: "text.muted" })}>対象資材</div>
          <b>{materialName}</b>
          <div className={css({ textStyle: "note", color: "text.muted" })}>{manufacturerName}</div>
        </div>

        <h2 className={h2}>{reportSectionHeading(input, "results")}</h2>
        <Text value={input.observedChange} />
        <ReportPdfReadingMark fields={[{ key: "observedChange" }]} />
        {legacy("results")}

        <h2 className={h2}>{reportSectionHeading(input, "effects")}</h2>
        <Text value={input.purposeTags.join("、")} empty="（未選択）" />
        <ReportPdfReadingMark fields={[{ key: "purposeTags" }]} />
        {input.purposeNote.trim() && <Text value={input.purposeNote} />}
        {legacy("effects")}

        <h2 className={h2}>{reportSectionHeading(input, "conditions")}</h2>
        <dl className={facts}>
          <dt>地域</dt>
          <dd>
            {prefecture}
            {city}
          </dd>
          <dt>使用作物</dt>
          <dd>
            {cropName ?? "（未選択）"}
            {variety ? `（${variety}）` : ""}
          </dd>
          <dt>栽培環境</dt>
          <dd>{input.cultivationEnvironment.trim() || "（未記入）"}</dd>
          <dt>施用時期</dt>
          <dd>{stages || "（未選択）"}</dd>
          <dt>処理日と生育状況</dt>
          <dd>{input.timingNote.trim() || "（未記入）"}</dd>
        </dl>
        <ReportPdfReadingMark fields={conditionMarks} />
        {legacy("conditions")}

        <h2 className={h2}>比較・使用結果</h2>
        <h3 className={h3}>{reportSectionHeading(input, "plots")}</h3>
        <ReportPlotList
          layout={layout}
          commonDescription={input.commonPlotDescription}
          emptyDescription="（説明が未記入）"
        />
        <ReportPdfReadingMark fields={plotMarks} />
        {legacy("plots")}
        {shown.length === 0 && <p className={none}>（調査項目ごとの結果が未記入）</p>}
        {shown.map((item) => (
          <section key={item.id}>
            <h3 className={h3}>
              {reportSectionHeading(input, "measurements")}：{item.name.trim() || "調査項目"}
            </h3>
            <ReportPdfReadingMark fields={itemMarkFields(item, input.plots)} />
            <ReportItemImages media={reportPageItemImages(item)} alt={item.name} />
            {item.mode === "numeric" && (
              <>
                {item.graphs.map((graph) => (
                  <ReportBars
                    key={graph.id}
                    title={graph.heading || item.name}
                    unit={item.unit}
                    groups={reportBarGroups(graphSections(graph, input.plots, layout))}
                    legend={layout.legend}
                  />
                ))}
                <ReportGraphNote>
                  グラフは投稿されたデータからFarmilleが自動生成しています
                </ReportGraphNote>
              </>
            )}
            {(item.mode === "text" || item.body.trim() !== "") && <Text value={item.body} />}
          </section>
        ))}
        {legacy("measurements")}
        {(input.documents.length > 0 || documentMedia.length > 0) && (
          <>
            <h2 className={h2}>{reportSectionHeading(input, "documents")}</h2>
            {input.documents.length > 0 && (
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
            )}
            <ReportFigures media={documentMedia} />
          </>
        )}
      </article>
    </Dialog>
  );
}
