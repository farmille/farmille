"use client";

import { Chip } from "@/components/Chip";
import { Dialog } from "@/components/Dialog";
import { OptimizedImage } from "@/components/OptimizedImage";
import { reportPlotColor } from "@/components/ReportPlotColor";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import type { UsageReportInput } from "@/lib/usage-report";

import { css, cx } from "../../../../../../styled-system/css";

import type { ReportPageItem } from "./report-page-state";

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

const plot = css({ display: "flex", gap: "2", mt: "2" });

const plotDot = css({
  flex: "none",
  w: "2.5",
  h: "2.5",
  mt: "2.5",
  borderRadius: "pill",
  bg: "currentColor",
});

const figure = css({ m: "0", my: "2", "& img": { w: "full", h: "auto" } });

const caption = css({ textAlign: "center", textStyle: "supporting", color: "text.muted" });

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
  missing: string[];
}) {
  const today = new Date();
  const variety = input.varietyUnknown ? "" : input.variety.trim();
  const prefecture =
    PREFECTURES.find(({ code }) => code === input.prefectureCode)?.name ?? "（未選択）";
  const city = input.showCity && input.city.trim() ? ` ${input.city.trim()}` : "";
  const stages = input.timingStages
    .toSorted((a, b) => a - b)
    .map((stage) => APPLICATION_TIMINGS[stage])
    .join("、");
  const shown = items.filter((item) => item.mode !== "");
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

        <h2 className={h2}>期待した効果</h2>
        <Text value={input.purposeTags.join("、")} empty="（未選択）" />
        {input.purposeNote.trim() && <Text value={input.purposeNote} />}

        <h2 className={h2}>栽培条件・施用時期</h2>
        <dl className={facts}>
          <dt>地域</dt>
          <dd>
            {prefecture}
            {city}
          </dd>
          <dt>使用対象作目</dt>
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

        <h2 className={h2}>比較・使用結果</h2>
        <h3 className={h3}>比べた区</h3>
        {input.plots.map((item, index) => (
          <div key={item.id} className={plot}>
            <span className={cx(plotDot, reportPlotColor(index))} aria-hidden="true" />
            <div>
              <b>{item.name.trim() || `区${index + 1}`}</b>
              <Text value={item.description} empty="（説明が未記入）" />
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className={none}>（調査項目ごとの結果が未記入）</p>}
        {shown.map((item) => (
          <section key={item.id}>
            <h3 className={h3}>使用結果の詳細：{item.name.trim() || "調査項目"}</h3>
            {item.images.map((image) => (
              <figure key={image.id} className={figure}>
                <OptimizedImage
                  src={image.url}
                  alt={image.caption || item.name}
                  width={720}
                  height={540}
                  sizes="(max-width: 720px) 100vw, 720px"
                />
                {image.caption && <figcaption className={caption}>{image.caption}</figcaption>}
              </figure>
            ))}
            {(item.mode === "text" || item.body.trim() !== "") && <Text value={item.body} />}
          </section>
        ))}
      </article>
    </Dialog>
  );
}
