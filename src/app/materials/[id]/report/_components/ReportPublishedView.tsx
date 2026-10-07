"use client";

import { OptimizedImage } from "@/components/OptimizedImage";
import { REPORT_SECTIONS, type UsageReportInput } from "@/lib/usage-report";

import { css } from "../../../../../../styled-system/css";
import {
  PlotList,
  ReportBars,
  conditionLines,
  effectsText,
  numericGroups,
  sectionHeading,
  type ReportSection,
} from "./ReportArticleParts";
import { pillButtonRecipe } from "./ReportFormParts";

const overlay = css({
  position: "fixed",
  inset: "0",
  zIndex: "30",
  bg: "surface.page",
  overflow: "auto",
});
const wrap = css({ maxW: "content.form", mx: "auto", px: "4", pb: "16" });
const topBar = css({
  position: "sticky",
  top: "0",
  zIndex: "2",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2.5",
  bg: "surface.card",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  py: "2.5",
  px: "4",
  mx: "-4",
  mb: "3.5",
  fontSize: "sm",
  color: "text.muted",
});
const title = css({ fontSize: "2xl", lineHeight: "snug", fontWeight: "extrabold", m: "0" });
const subtle = css({ color: "text.subtle", fontSize: "sm" });
const chip = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  bg: "primary.100",
  color: "primary.800",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "primary.700/30",
  borderRadius: "pill",
  py: "1",
  px: "3",
  fontSize: "sm",
  fontWeight: "semibold",
});
const chipCategory = css({ fontSize: "2xs", opacity: "0.65", fontWeight: "bold" });
const materialRef = css({
  mt: "3.5",
  py: "3",
  px: "3.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "media",
  bg: "surface.card",
});
const sectionHeadingStyle = css({
  fontSize: "lg",
  mt: "6",
  mb: "2",
  pl: "2.5",
  borderLeftWidth: "3px",
  borderLeftStyle: "solid",
  borderLeftColor: "primary.700",
  fontWeight: "extrabold",
});
const paragraph = css({
  fontSize: "md",
  color: "text.muted",
  lineHeight: "prose",
  whiteSpace: "pre-wrap",
});
const graphCard = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "media",
  p: "3.5",
  mt: "3",
  bg: "surface.card",
});
const graphCaption = css({
  fontSize: "xs",
  color: "text.subtle",
  mt: "3",
  pt: "2.5",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});
const figureImage = css({
  w: "full",
  borderRadius: "media",
  bg: "primary.soft",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  aspectRatio: "image.landscape",
  "& :is(img, video)": { w: "full", h: "full", objectFit: "cover", display: "block" },
});
const figureCaption = css({ fontSize: "sm", color: "text.subtle", mt: "2", lineHeight: "normal" });
const compliance = css({
  display: "flex",
  gap: "2",
  alignItems: "flex-start",
  mt: "5.5",
  py: "3",
  px: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.page",
  fontSize: "sm",
  color: "text.muted",
  lineHeight: "normal",
});

/** 公開後の見え方。資材ページや検索から開いたときの記事の形で出す */
export function ReportPublishedView({
  input,
  materialName,
  manufacturerName,
  cropName,
  onBack,
}: {
  input: UsageReportInput;
  materialName: string;
  manufacturerName: string;
  cropName: string;
  onBack: () => void;
}) {
  const variety = input.varietyUnknown ? "" : input.variety.trim();
  const today = new Date();
  function body(section: ReportSection) {
    if (section === "results") return input.observedChange;
    if (section === "effects") return effectsText(input);
    if (section === "conditions")
      return [conditionLines(input, cropName), input.cultivationEnvironment, input.timingNote]
        .filter((text) => text.trim())
        .join("\n");
    if (section === "documents") return input.documents.map((item) => `・${item.name}`).join("\n");
    return input.measurements
      .filter((item) => item.kind === "text")
      .map((item) => item.body)
      .join("\n");
  }
  const sections = REPORT_SECTIONS.filter(
    (section) => section.value !== "documents" || input.documents.length > 0,
  );
  return (
    <div className={overlay}>
      <div className={wrap}>
        <div className={topBar}>
          <span>公開後の見え方（資材ページや検索から開いたときの記事）</span>
          <button type="button" className={pillButtonRecipe({ strong: true })} onClick={onBack}>
            プレビューに戻る
          </button>
        </div>
        <div>
          <h1 className={title}>
            {materialName} 実証詳細レポート｜{cropName}
          </h1>
          <div className={css({ mt: "3" })}>
            <span className={subtle}>
              {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
            </span>
          </div>
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5", mt: "3" })}>
            <span className={chip}>
              <span className={chipCategory}>作物</span>
              {cropName}
              {variety ? `（${variety}）` : ""}
            </span>
            {input.purposeTags.map((tag) => (
              <span key={tag} className={chip}>
                <span className={chipCategory}>効果</span>
                {tag}
              </span>
            ))}
          </div>
          <div className={materialRef}>
            <div className={css({ color: "text.subtle", fontSize: "xs" })}>対象資材</div>
            <div className={css({ fontWeight: "extrabold", fontSize: "md" })}>{materialName}</div>
            <div className={subtle}>{manufacturerName}</div>
          </div>
          {sections.map((section) => {
            const media = input.media.filter((item) => item.section === section.value);
            const text = body(section.value);
            return (
              <div key={section.value}>
                <h3 className={sectionHeadingStyle}>{sectionHeading(input, section.value)}</h3>
                {section.value === "plots" ? (
                  <PlotList plots={input.plots} />
                ) : (
                  text && <p className={paragraph}>{text}</p>
                )}
                {section.value === "measurements" &&
                  numericGroups(input).map((measurement) =>
                    measurement.graphs.map((graph) => (
                      <div key={graph.id} className={graphCard}>
                        <div className={css({ fontSize: "sm", fontWeight: "extrabold" })}>
                          {graph.heading || measurement.name}
                          {measurement.unit && (
                            <span className={css({ color: "text.subtle", fontWeight: "normal" })}>
                              （{measurement.unit}）
                            </span>
                          )}
                        </div>
                        <ReportBars graph={graph} plots={input.plots} />
                      </div>
                    )),
                  )}
                {section.value === "measurements" && numericGroups(input).length > 0 && (
                  <div className={graphCaption}>
                    グラフは投稿されたデータからFarmilleが自動生成しています
                  </div>
                )}
                {media.map((item) => (
                  <div key={item.id} className={css({ mt: "3.5" })}>
                    <div className={figureImage}>
                      {item.mediaType === "photo" ? (
                        <OptimizedImage
                          src={item.url}
                          alt={item.caption}
                          width={720}
                          height={540}
                          sizes="(max-width: 720px) 100vw, 720px"
                        />
                      ) : (
                        <video controls src={item.url} />
                      )}
                    </div>
                    {item.caption && <div className={figureCaption}>{item.caption}</div>}
                  </div>
                ))}
              </div>
            );
          })}
          <div className={compliance}>
            <span className={css({ color: "primary.700", flex: "0 0 auto", display: "flex" })}>
              ✓
            </span>
            この実証詳細レポートは、投稿した生産者個人の圃場・条件での体験と見解です。ほかの圃場・作物・気象条件で同じ結果が得られることや、薬害等が生じないことを保証するものではありません。
          </div>
        </div>
      </div>
    </div>
  );
}
