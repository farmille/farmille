"use client";

import { Checkbox } from "@/components/Checkbox";
import { OptimizedImage } from "@/components/OptimizedImage";
import { SurfaceCard } from "@/components/SurfaceCard";
import {
  REPORT_SECTIONS,
  type UsageReportFieldErrors,
  type UsageReportInput,
} from "@/lib/usage-report";

import { css, cva, cx } from "../../../../../../styled-system/css";
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
import { pillButton } from "./reportStyles";

const groupHeading = cva({
  base: {
    fontSize: "md",
    fontWeight: "extrabold",
    display: "flex",
    alignItems: "baseline",
    gap: "2",
    pt: "3.5",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
  },
  variants: { first: { true: { mt: "0" }, false: { mt: "6.5" } } },
});
const bodyText = cva({
  base: {
    minH: "7",
    fontSize: "md",
    lineHeight: "loose",
    whiteSpace: "pre-wrap",
    py: "1.5",
    px: "2",
    mt: "1",
    mx: "-2",
    borderRadius: "input",
    _focus: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      bg: "primary.soft",
    },
  },
  variants: {
    preview: {
      true: { _empty: { display: "none" } },
      false: {
        _hover: { bg: "surface.panel" },
        _empty: { _before: { content: '"本文を入力"', color: "text.subtle" } },
      },
    },
  },
});
const bodyInput = css({
  display: "block",
  w: "calc(100% + token(spacing.4))",
  borderWidth: "0",
  bg: "transparent",
  resize: "none",
  fieldSizing: "content",
  fontFamily: "inherit",
  color: "inherit",
  fontSize: "md",
  lineHeight: "loose",
});
const subHeading = css({ fontSize: "sm", color: "text.subtle", fontWeight: "bold", mt: "2" });
const chartCaption = css({ fontSize: "xs", color: "text.subtle", mt: "1" });
const editor = css({
  mt: "3.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  pt: "5.5",
  px: "5.5",
  pb: "2.5",
});
const sectionBox = css({
  position: "relative",
  pt: "3",
  pb: "2",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});
const sectionTitle = cva({
  base: {
    display: "block",
    w: "full",
    fontFamily: "inherit",
    color: "inherit",
    fontSize: "lg",
    fontWeight: "extrabold",
    lineHeight: "prose",
    borderWidth: "0",
    outline: "none",
    bg: "transparent",
    py: "0.5",
  },
  variants: {
    preview: { true: { pointerEvents: "none" }, false: { _hover: { bg: "surface.panel" } } },
  },
});
const imageRow = cva({
  base: { display: "flex", flexWrap: "wrap", mt: "2" },
  variants: { preview: { true: { gap: "3" }, false: { gap: "2" } } },
});
const image = cva({
  base: {
    position: "relative",
    borderRadius: "input",
    bg: "primary.soft",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    display: "flex",
    flexDirection: "column",
    gap: "1.5",
    p: "1.5",
  },
  variants: { preview: { true: { w: "min(100%, token(sizes.96))" }, false: { w: "40" } } },
});
const thumb = cva({
  base: {
    borderRadius: "input",
    bg: "primary.100",
    display: "grid",
    placeItems: "center",
    color: "primary.800",
    fontWeight: "bold",
    "& :is(img, video)": { w: "full", h: "full", objectFit: "cover", borderRadius: "input" },
  },
  variants: {
    preview: { true: { aspectRatio: "image.landscape" }, false: { h: "20" } },
    kind: { image: { fontSize: "sm" }, document: { fontSize: "xs" } },
  },
  defaultVariants: { kind: "image" },
});
const caption = cva({
  base: {
    w: "full",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "input",
    py: "1",
    px: "2",
    fontFamily: "inherit",
    color: "inherit",
    fontSize: "sm",
  },
  variants: {
    preview: {
      true: {
        borderColor: "transparent",
        bg: "transparent",
        pointerEvents: "none",
        textAlign: "center",
        _placeholderShown: { display: "none" },
      },
      false: { borderColor: "border.strong", bg: "surface.card" },
    },
  },
});
const removeOverlay = cva({
  base: {
    position: "absolute",
    w: "5",
    h: "5",
    borderRadius: "pill",
    borderWidth: "0",
    bg: "scrim/45",
    color: "text.inverse",
    fontSize: "sm",
    cursor: "pointer",
  },
  variants: {
    inset: { image: { top: "1", right: "1" }, document: { top: "0.5", right: "0.5" } },
  },
});
const fileButton = css({
  position: "relative",
  _focusWithin: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
});
const addDocument = css({
  w: "24",
  h: "24",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "border.strong",
  borderRadius: "media",
  display: "grid",
  placeItems: "center",
  color: "text.subtle",
  fontSize: "sm",
  textAlign: "center",
  cursor: "pointer",
  bg: "surface.card",
});
const documentCard = css({
  position: "relative",
  w: "40",
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  p: "1.5",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "media",
  bg: "primary.soft",
  color: "text.subtle",
  fontSize: "sm",
  textAlign: "center",
});
const guide = css({ fontSize: "sm", color: "text.muted", mb: "1.5" });
const fieldLabel = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "extrabold",
});
const check = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2.5",
  fontSize: "md",
  fontWeight: "bold",
  py: "3",
  px: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.card",
  cursor: "pointer",
  tab: { flexWrap: "nowrap" },
  "& a": { textDecoration: "underline" },
});
const checkNote = css({
  ml: "7",
  flex: "1 1 100%",
  fontSize: "xs",
  fontWeight: "normal",
  color: "text.subtle",
  tab: { ml: "auto", flex: "0 1 auto" },
});
const visuallyHidden = css({ srOnly: true });

type Upload = (file: File | undefined, section: ReportSection, document: boolean) => void;

/** 本文欄。編集中は textarea、プレビュー中は文字だけを出す */
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
      <div className={bodyText({ preview })}>{value}</div>
    ) : null
  ) : (
    <textarea
      className={cx(bodyText({ preview }), bodyInput)}
      aria-label={label}
      placeholder="本文を入力"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** 「写真・記事の確認」の記事エディターと、その下の関連資料・公開前の確認 */
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
    if (section === "effects")
      return <div className={bodyText({ preview })}>{effectsText(input)}</div>;
    if (section === "conditions")
      return (
        <>
          <div className={bodyText({ preview })}>{conditionLines(input, cropName)}</div>
          {!preview && <div className={subHeading}>栽培環境</div>}
          <Body
            value={input.cultivationEnvironment}
            label="栽培環境の本文"
            preview={preview}
            onChange={(cultivationEnvironment) => onChange({ ...input, cultivationEnvironment })}
          />
          {!preview && <div className={subHeading}>処理日・定植日・生育状況</div>}
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
              <div className={css({ fontSize: "xs", mt: "2", fontWeight: "bold" })}>
                {measurement.name || "調査項目未入力"}
                {measurement.unit ? `（${measurement.unit}）` : ""}
              </div>
              {measurement.graphs.map((graph) => (
                <div key={graph.id}>
                  {graph.heading && <div className={chartCaption}>{graph.heading}</div>}
                  <ReportBars graph={graph} plots={input.plots} />
                </div>
              ))}
            </div>
          ))}
          {numericGroups(input).length > 0 && (
            <div className={chartCaption}>グラフは投稿されたデータからFarmilleが自動生成します</div>
          )}
          {input.measurements
            .filter((measurement) => measurement.kind === "text")
            .map((measurement) => (
              <div key={measurement.id}>
                <div className={subHeading}>{measurement.name}</div>
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
      <div className={bodyText({ preview })}>
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
      {!preview && (
        <>
          <h3 className={groupHeading({ first: true })}>記事の確認</h3>
          <p className={css({ fontSize: "sm", color: "text.muted" })}>
            入力内容から記事を組み立てています。見出しや本文は直接編集できます（前のステップを直すと、編集していない部分は自動で更新されます）。写真は各セクションの「＋
            写真を挿入」から選び、その場に置きます。
          </p>
        </>
      )}
      {preview && missingLabels.length > 0 && (
        <div className={css({ fontSize: "sm", color: "accent.danger", mb: "2.5" })}>
          未入力の項目が{missingLabels.length}件あります（{missingLabels.join("、")}
          ）。公開に進むときに確認します。
        </div>
      )}
      <div className={editor}>
        <span
          className={css({
            display: "inline-block",
            fontSize: "xs",
            fontWeight: "extrabold",
            color: "primary.800",
            bg: "primary.100",
            borderRadius: "pill",
            py: "0.5",
            px: "2",
            mb: "2.5",
          })}
        >
          {materialName}
        </span>
        <div
          className={css({
            fontSize: "2xl",
            fontWeight: "extrabold",
            lineHeight: "normal",
            py: "1",
          })}
          role="heading"
          aria-level={2}
        >
          {materialName} 実証詳細レポート｜{cropName}
        </div>
        <div className={css({ fontSize: "sm", color: "text.subtle", mt: "2", mb: "4.5" })}>
          {cropName}・{prefecture}
        </div>
        {sections.map((section) => (
          <div key={section.value} className={sectionBox}>
            <input
              className={sectionTitle({ preview })}
              aria-label={`${section.title}の見出し`}
              placeholder="見出し"
              readOnly={preview}
              value={sectionHeading(input, section.value)}
              onChange={(event) => setHeading(section.value, event.target.value)}
            />
            {sectionBody(section.value)}
            <div className={imageRow({ preview })}>
              {input.media
                .filter((media) => media.section === section.value)
                .map((media) => (
                  <div key={media.id} className={image({ preview })}>
                    <div className={thumb({ preview })}>
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
                      className={caption({ preview })}
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
                    {!preview && (
                      <button
                        type="button"
                        className={removeOverlay({ inset: "image" })}
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
                    )}
                  </div>
                ))}
            </div>
            {!preview && section.value !== "documents" && (
              <div className={css({ display: "flex", alignItems: "center", gap: "2", mt: "2" })}>
                <label className={cx(pillButton(), fileButton)}>
                  ＋ 写真を挿入
                  <input
                    className={visuallyHidden}
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

      {!preview && (
        <div className={css({ mt: "4.5" })}>
          <div className={fieldLabel}>
            関連資料 <Badge />
          </div>
          <div className={guide}>
            試験成績書や配布資料などのPDFを添付します。記事の末尾に「関連資料」として掲載されます。
          </div>
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
            {input.documents.map((document, index) => (
              <div key={document.id} className={documentCard}>
                <button
                  type="button"
                  className={removeOverlay({ inset: "document" })}
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
                <div className={thumb({ preview: false, kind: "document" })}>PDF {index + 1}</div>
                <div className={css({ py: "1", px: "2", overflowWrap: "anywhere" })}>
                  {document.name}
                </div>
              </div>
            ))}
            <label className={cx(addDocument, fileButton)}>
              ＋ 資料を追加
              <input
                className={visuallyHidden}
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
            <label className={cx(check, css({ mt: "2.5" }))}>
              <Checkbox
                checked={input.documentsAck}
                onChange={(event) => onChange({ ...input, documentsAck: event.target.checked })}
              />
              添付する資料は、秘密保持契約に反しないことを確認しました
              <span className={checkNote}>資料を添付する場合は必須</span>
              <Need message={errors.documentsAck} />
            </label>
          )}
        </div>
      )}
      {!preview && <h3 className={groupHeading({ first: false })}>公開前の確認</h3>}
      <SurfaceCard padding="compact" className={css({ mt: "2" })}>
        <ul
          className={css({
            m: "0",
            pl: "4.5",
            listStyle: "disc",
            fontSize: "sm",
            color: "text.muted",
            lineHeight: "prose",
            "& li + li": { mt: "1" },
          })}
        >
          <li>記事の内容は、実際に使用して観察した事実と感じた変化にもとづいています。</li>
          <li>
            農薬として登録されていない資材について、病害虫や雑草への効果を断定する表現は使っていません。
          </li>
          <li>記事・写真・関連資料に、他者の権利や秘密保持契約に反するものは含まれていません。</li>
          <li>
            投稿はFarmille運営が内容を確認したうえで公開されます。確認の結果、修正をお願いすることがあります。
          </li>
        </ul>
        <label className={cx(check, css({ mt: "2.5" }))}>
          <Checkbox
            checked={input.guidelineAck}
            onChange={(event) => onChange({ ...input, guidelineAck: event.target.checked })}
          />
          <span>
            <a href="/legal/posting" target="_blank" rel="noreferrer">
              投稿ガイドライン
            </a>
            を確認し、上の内容に同意して公開します
          </span>
          <span className={css({ ml: "2" })}>
            <Badge required />
          </span>
          <Need message={errors.guidelineAck} />
        </label>
      </SurfaceCard>
    </>
  );
}
