"use client";

import { OptimizedImage } from "@/components/OptimizedImage";
import { REPORT_SECTIONS, type UsageReportInput } from "@/lib/usage-report";

import {
  PlotList,
  ReportBars,
  conditionLines,
  effectsText,
  numericGroups,
  sectionHeading,
  type ReportSection,
} from "./ReportArticleParts";

/** 見本の「公開後の見え方」（#published）。資材ページや検索から開いたときの記事の形で出す */
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
    <div id="published">
      <div className="pub-wrap">
        <div className="pub-bar">
          <span>公開後の見え方（資材ページや検索から開いたときの記事）</span>
          <button type="button" className="hb" onClick={onBack}>
            プレビューに戻る
          </button>
        </div>
        <div className="pub-body">
          <h1 className="art-title">
            {materialName} 実証詳細レポート｜{cropName}
          </h1>
          <div className="byline">
            <span className="muted" style={{ fontSize: 12 }}>
              {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
            <span className="chip-sel">
              <span className="cat-mini">作物</span>
              {cropName}
              {variety ? `（${variety}）` : ""}
            </span>
            {input.purposeTags.map((tag) => (
              <span key={tag} className="chip-sel">
                <span className="cat-mini">効果</span>
                {tag}
              </span>
            ))}
          </div>
          <div className="ref">
            <div>
              <div className="muted" style={{ fontSize: 10.5 }}>
                対象資材
              </div>
              <div className="t-name">{materialName}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {manufacturerName}
              </div>
            </div>
          </div>
          {sections.map((section) => {
            const media = input.media.filter((item) => item.section === section.value);
            const text = body(section.value);
            return (
              <div key={section.value}>
                <h3 className="a-h3">{sectionHeading(input, section.value)}</h3>
                {section.value === "plots" ? (
                  <PlotList plots={input.plots} />
                ) : (
                  text && (
                    <div className="a-body">
                      <p>{text}</p>
                    </div>
                  )
                )}
                {section.value === "measurements" &&
                  numericGroups(input).map((measurement) =>
                    measurement.graphs.map((graph) => (
                      <div key={graph.id} className="hgraph">
                        <div style={{ fontSize: 12.5, fontWeight: 800 }}>
                          {graph.heading || measurement.name}
                          {measurement.unit && (
                            <span className="muted" style={{ fontWeight: 400 }}>
                              （{measurement.unit}）
                            </span>
                          )}
                        </div>
                        <ReportBars graph={graph} plots={input.plots} />
                      </div>
                    )),
                  )}
                {section.value === "measurements" && numericGroups(input).length > 0 && (
                  <div className="graph-cap">
                    グラフは投稿されたデータからFarmilleが自動生成しています
                  </div>
                )}
                {media.map((item) => (
                  <div key={item.id} className="figure">
                    <div className="fimg">
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
                    {item.caption && <div className="figcap">{item.caption}</div>}
                  </div>
                ))}
              </div>
            );
          })}
          <div className="compliance">
            <span className="ck">✓</span>
            この実証詳細レポートは、投稿した生産者個人の圃場・条件での体験と見解です。ほかの圃場・作物・気象条件で同じ結果が得られることや、薬害等が生じないことを保証するものではありません。
          </div>
        </div>
      </div>
    </div>
  );
}
