"use client";

import { ReportFigures, ReportItemImages } from "@/app/reports/[id]/ReportFigures";
import { Chip } from "@/components/Chip";
import { Dialog } from "@/components/Dialog";
import { ReportBars, reportBarGroups, ReportGraphNote } from "@/components/ReportBars";
import { ReportPlotList } from "@/components/ReportPlotList";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import { reportVarietyNames, type UsageReportInput } from "@/lib/usage-report";
import { graphSections, reportPlotLayout } from "@/lib/usage-report-plots";

import { css } from "../../../../../../styled-system/css";

import { reportLegacyMedia, reportPageItemImages, type ReportPageItem } from "./report-page-state";

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

const chips = css({ display: "flex", flexWrap: "wrap", gap: "1.5", mt: "3" });

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
          <span>生産者</span>
        </div>
        <div className={chips}>
          {cropName !== null && (
            <Chip category="作物">
              {cropName}
              {variety ? `（${variety}）` : ""}
            </Chip>
          )}
          {input.purposeTags.map((tag) => (
            <Chip key={tag} category="効果">
              {tag}
            </Chip>
          ))}
        </div>
        <div className={materialRef}>
          <div className={css({ textStyle: "note", color: "text.muted" })}>対象資材</div>
          <b>{materialName}</b>
          <div className={css({ textStyle: "note", color: "text.muted" })}>{manufacturerName}</div>
        </div>

        <h2 className={h2}>結果・感想</h2>
        <Text value={input.observedChange} />
        {legacy("results")}

        <h2 className={h2}>期待した効果</h2>
        <Text value={input.purposeTags.join("、")} empty="（未選択）" />
        {input.purposeNote.trim() && <Text value={input.purposeNote} />}
        {legacy("effects")}

        <h2 className={h2}>栽培条件・施用時期</h2>
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
        {legacy("conditions")}

        <h2 className={h2}>比較・使用結果</h2>
        <h3 className={h3}>比べた区</h3>
        <ReportPlotList
          layout={layout}
          commonDescription={input.commonPlotDescription}
          emptyDescription="（説明が未記入）"
        />
        {legacy("plots")}
        {shown.length === 0 && <p className={none}>（調査項目ごとの結果が未記入）</p>}
        {shown.map((item) => (
          <section key={item.id}>
            <h3 className={h3}>使用結果の詳細：{item.name.trim() || "調査項目"}</h3>
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
            <h2 className={h2}>関連資料</h2>
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
