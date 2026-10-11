"use client";

import { Checkbox, Field, Fieldset, Input, Notice } from "@/components/form";
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
import { pillButtonRecipe } from "./ReportFormParts";

const groupHeading = cva({
  base: {
    textStyle: "title",
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
  color: "inherit",
  fontSize: "md",
  lineHeight: "loose",
});
const subHeading = css({ textStyle: "body", color: "text.subtle", fontWeight: "bold", mt: "2" });
const chartCaption = css({ textStyle: "note", color: "text.subtle", mt: "1" });
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
const captionText = css({ m: "0", py: "1", px: "2", fontSize: "sm", textAlign: "center" });
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
const visuallyHidden = css({ srOnly: true });

type Upload = (file: File | undefined, section: ReportSection, document: boolean) => void;

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
              <div className={css({ textStyle: "body", mt: "2", fontWeight: "bold" })}>
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
          <p className={css({ textStyle: "supporting", color: "text.muted" })}>
            入力内容から記事を組み立てています。見出しや本文は直接編集できます（前のステップを直すと、編集していない部分は自動で更新されます）。写真は各セクションの「＋
            写真を挿入」から選び、その場に置きます。
          </p>
        </>
      )}
      {preview && missingLabels.length > 0 && (
        <Notice tone="warn" className={css({ mb: "2.5" })}>
          未入力の項目が{missingLabels.length}件あります（{missingLabels.join("、")}
          ）。公開に進むときに確認します。
        </Notice>
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
        <div className={css({ textStyle: "supporting", color: "text.subtle", mt: "2", mb: "4.5" })}>
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
                    {preview ? (
                      media.caption ? (
                        <p className={captionText}>{media.caption}</p>
                      ) : null
                    ) : (
                      <Input
                        size="sm"
                        aria-label="写真の説明"
                        placeholder="処理区の株全体"
                        value={media.caption}
                        onChange={(event) =>
                          onChange({
                            ...input,
                            media: input.media.map((item) =>
                              item.id === media.id
                                ? { ...item, caption: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    )}
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
                <label className={cx(pillButtonRecipe(), fileButton)}>
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
        <Fieldset
          legend="関連資料"
          requirement="optional"
          lead="試験成績書や配布資料などのPDFを添付します。記事の末尾に「関連資料」として掲載されます。"
        >
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
            <Field error={errors.documentsAck}>
              <Checkbox
                variant="row"
                description="資料を添付する場合は必須"
                checked={input.documentsAck}
                onCheckedChange={(documentsAck) => onChange({ ...input, documentsAck })}
              >
                添付する資料は、秘密保持契約に反しないことを確認しました
              </Checkbox>
            </Field>
          )}
        </Fieldset>
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
        <Field requirement="required" error={errors.guidelineAck}>
          <Checkbox
            variant="row"
            checked={input.guidelineAck}
            onCheckedChange={(guidelineAck) => onChange({ ...input, guidelineAck })}
          >
            <a href="/legal/posting" target="_blank" rel="noreferrer">
              投稿ガイドライン
            </a>
            を確認し、上の内容に同意して公開します
          </Checkbox>
        </Field>
      </SurfaceCard>
    </>
  );
}
