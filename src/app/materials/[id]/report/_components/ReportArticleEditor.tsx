"use client";

import { OptimizedImage } from "@/components/OptimizedImage";
import {
  REPORT_SECTIONS,
  type UsageReportFieldErrors,
  type UsageReportInput,
} from "@/lib/usage-report";

import {
  PlotList,
  ReportBars,
  conditionLines,
  effectsText,
  numericGroups,
  sectionHeading,
  type ReportSection,
} from "./ReportArticleParts";
import { Badge, Need } from "./ReportFormParts";

type Upload = (file: File | undefined, section: ReportSection, document: boolean) => void;

/** 本文欄。編集中は textarea、プレビュー中は文字だけを出す（見本の contenteditable の .sec-b） */
function Body({
  value,
  label,
  preview,
  onChange,
}: {
  value: string;
  label: string;
  preview: boolean;
  onChange: (value: string) => void;
}) {
  return preview ? (
    value ? (
      <div className="sec-b">{value}</div>
    ) : null
  ) : (
    <textarea
      className="sec-b"
      aria-label={label}
      placeholder="本文を入力"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** 見本 pane 5「写真・記事の確認」の記事エディター `.editor` と、その下の関連資料・公開前の確認 */
export function ReportArticleEditor({
  input,
  onChange,
  errors,
  preview,
  missingLabels,
  materialName,
  cropName,
  documentUrls,
  uploading,
  onUpload,
}: {
  input: UsageReportInput;
  onChange: (input: UsageReportInput) => void;
  errors: UsageReportFieldErrors;
  preview: boolean;
  /** プレビュー中に出す未入力の項目名 */
  missingLabels: string[];
  materialName: string;
  cropName: string;
  documentUrls: { id: string; url: string }[];
  uploading: boolean;
  onUpload: Upload;
}) {
  const sections = REPORT_SECTIONS.filter(
    (section) => section.value !== "documents" || input.documents.length > 0,
  );
  const prefecture = conditionLines(input, cropName).split("\n")[0]?.replace("地域：", "") ?? "";
  function setHeading(section: ReportSection, title: string) {
    onChange({
      ...input,
      headings: [...input.headings.filter((item) => item.section !== section), { section, title }],
    });
  }
  function sectionBody(section: ReportSection) {
    if (section === "results")
      return (
        <Body
          value={input.observedChange}
          label="結果・感想の本文"
          preview={preview}
          onChange={(observedChange) => onChange({ ...input, observedChange })}
        />
      );
    if (section === "effects") return <div className="sec-b">{effectsText(input)}</div>;
    if (section === "conditions")
      return (
        <>
          <div className="sec-b">{conditionLines(input, cropName)}</div>
          {!preview && <div className="sec-sub">栽培環境</div>}
          <Body
            value={input.cultivationEnvironment}
            label="栽培環境の本文"
            preview={preview}
            onChange={(cultivationEnvironment) => onChange({ ...input, cultivationEnvironment })}
          />
          {!preview && <div className="sec-sub">処理日・定植日・生育状況</div>}
          <Body
            value={input.timingNote}
            label="施用時期の本文"
            preview={preview}
            onChange={(timingNote) => onChange({ ...input, timingNote })}
          />
        </>
      );
    if (section === "plots") return <PlotList plots={input.plots} />;
    if (section === "measurements")
      return (
        <>
          {numericGroups(input).map((measurement) => (
            <div key={measurement.id}>
              <div
                className="chart-cap"
                style={{ marginTop: 8, fontWeight: 700, color: "var(--ink)" }}
              >
                {measurement.name || "調査項目未入力"}
                {measurement.unit ? `（${measurement.unit}）` : ""}
              </div>
              {measurement.graphs.map((graph) => (
                <div key={graph.id}>
                  {graph.heading && <div className="chart-cap">{graph.heading}</div>}
                  <ReportBars graph={graph} plots={input.plots} />
                </div>
              ))}
            </div>
          ))}
          {numericGroups(input).length > 0 && (
            <div className="chart-cap">グラフは投稿されたデータからFarmilleが自動生成します</div>
          )}
          {input.measurements
            .filter((measurement) => measurement.kind === "text")
            .map((measurement) => (
              <div key={measurement.id}>
                <div className="sec-sub">{measurement.name}</div>
                <Body
                  value={measurement.body}
                  label={`${measurement.name}の本文`}
                  preview={preview}
                  onChange={(body) =>
                    onChange({
                      ...input,
                      measurements: input.measurements.flatMap((item) =>
                        item.id !== measurement.id
                          ? [item]
                          : body.trim()
                            ? [{ ...item, body }]
                            : [],
                      ),
                    })
                  }
                />
              </div>
            ))}
        </>
      );
    return (
      <div className="sec-b">
        {input.documents.map((document) => {
          const url = documentUrls.find((item) => item.id === document.id)?.url;
          return (
            <div key={document.id}>
              ・
              {url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {document.name}
                </a>
              ) : (
                document.name
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <h3 className="grp" style={{ marginTop: 0 }}>
        記事の確認
      </h3>
      <div className="ed-bar">
        <span className="guide" style={{ margin: 0 }}>
          入力内容から記事を組み立てています。見出しや本文は直接編集できます（前のステップを直すと、編集していない部分は自動で更新されます）。写真は各セクションの「＋
          写真を挿入」から選び、その場に置きます。
        </span>
      </div>
      {preview && missingLabels.length > 0 && (
        <div className="guide" style={{ margin: "0 0 10px", color: "var(--red)" }}>
          未入力の項目が{missingLabels.length}件あります（{missingLabels.join("、")}
          ）。公開に進むときに確認します。
        </div>
      )}
      <div className={preview ? "editor preview" : "editor"}>
        <span className="pv-tag">{materialName}</span>
        <div className="ed-title ro" role="heading" aria-level={2}>
          {materialName} 実証詳細レポート｜{cropName}
        </div>
        <div className="ed-meta">
          {cropName}・{prefecture}
        </div>
        {sections.map((section) => (
          <div key={section.value} className="sec" data-k={section.value}>
            <input
              className="sec-h"
              aria-label={`${section.title}の見出し`}
              placeholder="見出し"
              readOnly={preview}
              value={sectionHeading(input, section.value)}
              onChange={(event) => setHeading(section.value, event.target.value)}
            />
            {sectionBody(section.value)}
            <div className="sec-imgs">
              {input.media
                .filter((media) => media.section === section.value)
                .map((media) => (
                  <div key={media.id} className="sec-img">
                    <div className="si-thumb">
                      {media.mediaType === "photo" ? (
                        <OptimizedImage
                          src={media.url}
                          alt={media.caption}
                          width={360}
                          height={270}
                          sizes="(max-width: 640px) 90vw, 360px"
                        />
                      ) : (
                        <video controls src={media.url} />
                      )}
                    </div>
                    <input
                      className="cap"
                      aria-label="写真の説明"
                      placeholder="名前　例）処理区の株全体"
                      readOnly={preview}
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
                    <button
                      type="button"
                      className="rmimg"
                      title="外す"
                      aria-label="写真を削除"
                      onClick={() =>
                        onChange({
                          ...input,
                          media: input.media.filter((item) => item.id !== media.id),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
            {section.value !== "documents" && (
              <div className="sec-tools">
                <label className="mini ins-btn">
                  ＋ 写真を挿入
                  <input
                    className="vh"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(event) => {
                      onUpload(event.target.files?.[0], section.value, false);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="field" id="docs" style={{ marginTop: 18 }}>
        <label>
          関連資料 <Badge />
        </label>
        <div className="guide">
          試験成績書や配布資料などのPDFを添付します。記事の末尾に「関連資料」として掲載されます。
        </div>
        <div className="photos">
          {input.documents.map((document, index) => (
            <div key={document.id} className="photo has">
              <button
                type="button"
                className="ph-x"
                title="外す"
                aria-label={`${document.name}を削除`}
                onClick={() =>
                  onChange({
                    ...input,
                    documents: input.documents.filter((item) => item.id !== document.id),
                    documentsAck: input.documents.length > 1 ? input.documentsAck : false,
                  })
                }
              >
                ×
              </button>
              <div className="ph-thumb">PDF {index + 1}</div>
              <div className="ph-name ro">{document.name}</div>
            </div>
          ))}
          <label className="photo">
            ＋ 資料を追加
            <input
              className="vh"
              type="file"
              aria-label="関連資料を添付"
              accept="application/pdf"
              disabled={uploading}
              onChange={(event) => {
                onUpload(event.target.files?.[0], "documents", true);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {input.documents.length > 0 && (
          <label className="check" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={input.documentsAck}
              onChange={(event) => onChange({ ...input, documentsAck: event.target.checked })}
            />{" "}
            添付する資料は、秘密保持契約に反しないことを確認しました
            <span className="muted">資料を添付する場合は必須</span>
            <Need message={errors.documentsAck} />
          </label>
        )}
      </div>
      <h3 className="grp">公開前の確認</h3>
      <div className="card" style={{ marginTop: 8 }}>
        <ul className="pub-list">
          <li>記事の内容は、実際に使用して観察した事実と感じた変化にもとづいています。</li>
          <li>
            農薬として登録されていない資材について、病害虫や雑草への効果を断定する表現は使っていません。
          </li>
          <li>記事・写真・関連資料に、他者の権利や秘密保持契約に反するものは含まれていません。</li>
          <li>
            投稿はFarmille運営が内容を確認したうえで公開されます。確認の結果、修正をお願いすることがあります。
          </li>
        </ul>
        <label className="check" style={{ marginTop: 10 }}>
          <input
            type="checkbox"
            checked={input.guidelineAck}
            onChange={(event) => onChange({ ...input, guidelineAck: event.target.checked })}
          />{" "}
          <span>
            <a href="/legal/posting" target="_blank" rel="noreferrer">
              投稿ガイドライン
            </a>
            を確認し、上の内容に同意して公開します
          </span>
          <span className="badge req" style={{ marginLeft: 8 }}>
            必須
          </span>
          <Need message={errors.guidelineAck} />
        </label>
      </div>
    </>
  );
}
