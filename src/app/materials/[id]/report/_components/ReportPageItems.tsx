"use client";

import { Input, Textarea } from "@/components/form";
import { Icon } from "@/components/Icon";
import { OptimizedImage } from "@/components/OptimizedImage";
import { ReportBars, reportBarGroups } from "@/components/ReportBars";
import type { UsageReportInput } from "@/lib/usage-report";
import { graphSections, type ReportPlotLayout } from "@/lib/usage-report-plots";

import { css, cva } from "../../../../../../styled-system/css";

import {
  createReportPageItem,
  REPORT_BODY_MAX,
  REPORT_SHORT_MAX,
  reportLengthNote,
  reportPageItemDone,
  type ReportPageItem,
  type ReportPageNumericItem,
} from "./report-page-state";
import { addButton, docLead, labelStyle, removeButton } from "./report-page-styles";

const block = css({
  mt: "4",
  pb: "3.5",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const head = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  rowGap: "0.5",
  columnGap: "2",
  fontWeight: "bold",
  "& > *": { flex: "none", whiteSpace: "nowrap" },
});

const modeName = css({ fontWeight: "normal", color: "text.muted", fontSize: "sm" });

const unfinished = css({
  px: "2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "accent.danger",
  borderRadius: "pill",
  fontSize: "xs",
  color: "accent.danger",
});

const spacer = css({ flex: "[1 1 0]" });

const changeButton = css({
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "primary.600",
  borderRadius: "pill",
  bg: "primary.soft",
  px: "3.5",
  py: "1",
  fontSize: "sm",
  fontWeight: "bold",
  color: "text.brandOnSoft",
  cursor: "pointer",
});

const choose = css({ m: "0", mt: "3", mb: "1.5", textStyle: "supporting", color: "text.muted" });

const options = css({ display: "grid", gap: "2" });

const option = css({
  position: "relative",
  display: "block",
  w: "full",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "card",
  bg: "surface.card",
  py: "2.5",
  pl: "3",
  pr: "10",
  textAlign: "start",
  cursor: "pointer",
  _hover: { bg: "surface.panel" },
});

const optionTitle = css({ display: "block", fontWeight: "bold", textStyle: "body" });

const optionText = css({
  display: "block",
  mt: "0.5",
  textStyle: "supporting",
  color: "text.muted",
});

const optionChevron = css({
  position: "absolute",
  right: "3",
  top: "[50%]",
  transform: "translateY(-50%)",
  color: "text.muted",
});

const figures = css({ display: "grid", gap: "2.5", mt: "2" });

const figure = css({ m: "0", "& img": { w: "full", h: "auto", maxH: "96", objectFit: "contain" } });

const caption = css({ textAlign: "center", textStyle: "supporting", color: "text.muted" });

const errorText = css({ m: "0", mt: "1", textStyle: "supporting", color: "accent.danger" });

const nameRecipe = cva({ base: { mt: "1" } });

const MODE_NAMES = {
  file: "資料のグラフ・表",
  text: "文章",
  numeric: "数値のグラフ",
} as const;

const TEXT_EXAMPLE =
  "区ごとの数値（単位も）と、区の間の違い。調べた時期や株数も。差がなかった場合もそのまま記入\n例）収穫時（3月9日）の切り花長は、試験区1（減肥・処理）が109.2cm、試験区2（減肥・無処理）が110.9cm、試験区3（慣行・無処理）が109.4cmで、区の間に大きな差はなかった。一方、70g以上の上位階級の割合は試験区1が69%で、試験区2（57%）や試験区3（58%）より10ポイント以上高かった。";

const NOTE_EXAMPLE =
  "グラフ・表だけでは伝わらないこと\n例）表1の「区A」が無処理区、「区B」が処理区。処理区は〇〇の1,000倍液を7日おきに3回散布した。";

/** 調査項目ごとの結果：調査項目を先に書き、項目ごとに入れ方を選ぶ。 */
export function ReportPageItems({
  items,
  plots,
  layout,
  onChange,
  onOpenFile,
  onEditNumeric,
  missing,
}: {
  items: ReportPageItem[];
  plots: UsageReportInput["plots"];
  layout: ReportPlotLayout;
  onChange: (next: (current: ReportPageItem[]) => ReportPageItem[]) => void;
  onOpenFile: (item: ReportPageItem, isNew: boolean) => void;
  onEditNumeric: (item: ReportPageNumericItem) => void;
  missing: boolean;
}) {
  const update = (id: string, next: (item: ReportPageItem) => ReportPageItem) =>
    onChange((current) => current.map((item) => (item.id === id ? next(item) : item)));
  const remove = (id: string) =>
    onChange((current) => {
      const rest = current.filter((item) => item.id !== id);
      return rest.length > 0 ? rest : [createReportPageItem()];
    });
  return (
    <>
      <p className={docLead}>
        調査項目ごとに、結果を「資料のグラフ・表」か「文章」で記入してください。
        <br />
        調査項目は「＋ 調査項目を追加」で増やせます。
      </p>
      {items.map((item, index) => {
        const done = reportPageItemDone(item);
        return (
          <div key={item.id} className={block}>
            <div className={head}>
              <span>調査項目{index + 1}</span>
              {item.mode !== "" && <span className={modeName}>・{MODE_NAMES[item.mode]}</span>}
              {item.mode !== "" && !done && <span className={unfinished}>書きかけ</span>}
              <span className={spacer} />
              {item.mode === "file" ? (
                <button
                  type="button"
                  className={changeButton}
                  onClick={() => onOpenFile(item, false)}
                >
                  画像・PDFの変更
                </button>
              ) : (
                <>
                  {item.mode === "numeric" && (
                    <button
                      type="button"
                      className={changeButton}
                      onClick={() => onEditNumeric(item)}
                    >
                      数値を直す
                    </button>
                  )}
                  {(items.length > 1 || item.mode !== "") && (
                    <button
                      type="button"
                      className={removeButton}
                      aria-label={`調査項目${index + 1}を削除`}
                      onClick={() => remove(item.id)}
                    >
                      <Icon name="close" />
                    </button>
                  )}
                </>
              )}
            </div>
            <Input
              fieldClassName={nameRecipe()}
              label={`調査項目${index + 1}の名前`}
              hideLabel
              placeholder="例）可販果率"
              maxLength={REPORT_SHORT_MAX}
              value={item.name}
              error={missing && item.name.trim() === "" ? "調査項目を記入してください" : undefined}
              onChange={(event) =>
                update(item.id, (current) => ({ ...current, name: event.target.value }))
              }
            />
            {item.mode === "" && (
              <>
                <p className={choose}>結果の入れ方を選ぶ</p>
                <div className={options}>
                  <button type="button" className={option} onClick={() => onOpenFile(item, true)}>
                    <span className={optionTitle}>資料のグラフ・表を差し込む</span>
                    <span className={optionText}>
                      試験成績書など、まとめた資料がすでにある場合。グラフ・表の写真・PDFを差し込みます
                    </span>
                    <Icon name="chevron_right" className={optionChevron} />
                  </button>
                  <button
                    type="button"
                    className={option}
                    onClick={() =>
                      update(item.id, (current) => ({
                        id: current.id,
                        mode: "text",
                        name: current.name,
                        body: current.body,
                      }))
                    }
                  >
                    <span className={optionTitle}>文章で書く</span>
                    <span className={optionText}>区ごとの数値と違いを文章で書きます</span>
                    <Icon name="chevron_right" className={optionChevron} />
                  </button>
                </div>
                {missing && <p className={errorText}>結果の入れ方を選んで記入してください</p>}
              </>
            )}
            {item.mode === "text" && (
              <Textarea
                id={`report-item-text-${item.id}`}
                fieldClassName={css({ mt: "3" })}
                label={<span className={labelStyle}>区ごとの結果</span>}
                requirement="required"
                size="document"
                example={TEXT_EXAMPLE}
                maxLength={REPORT_BODY_MAX}
                description={reportLengthNote(item.body, REPORT_BODY_MAX)}
                value={item.body}
                error={
                  missing && item.body.trim() === "" ? "区ごとの結果を記入してください" : undefined
                }
                onChange={(event) =>
                  update(item.id, (current) => ({ ...current, body: event.target.value }))
                }
              />
            )}
            {item.mode === "file" && (
              <>
                <div className={figures}>
                  {item.images.length === 0 && (
                    <p className={errorText}>グラフ・表が入っていません</p>
                  )}
                  {item.images.map((image) => (
                    <figure key={image.id} className={figure}>
                      <OptimizedImage
                        src={image.url}
                        alt={image.caption || item.name}
                        width={720}
                        height={540}
                        sizes="(max-width: 720px) 100vw, 720px"
                      />
                      {image.caption && (
                        <figcaption className={caption}>{image.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
                <Textarea
                  fieldClassName={css({ mt: "3" })}
                  label={<span className={labelStyle}>補足説明</span>}
                  requirement="optional"
                  size="document"
                  example={NOTE_EXAMPLE}
                  maxLength={REPORT_BODY_MAX}
                  description={reportLengthNote(item.body, REPORT_BODY_MAX)}
                  value={item.body}
                  onChange={(event) =>
                    update(item.id, (current) => ({ ...current, body: event.target.value }))
                  }
                />
              </>
            )}
            {item.mode === "numeric" && (
              <>
                {item.graphs.map((graph) => (
                  <ReportBars
                    key={graph.id}
                    title={graph.heading || item.name}
                    unit={item.unit}
                    groups={reportBarGroups(graphSections(graph, plots, layout))}
                    legend={layout.legend}
                  />
                ))}
                {item.graphs.every(
                  (graph) => reportBarGroups(graphSections(graph, plots, layout)).length === 0,
                ) && <p className={errorText}>グラフにできる数値が入っていません</p>}
                <Textarea
                  fieldClassName={css({ mt: "3" })}
                  label={<span className={labelStyle}>補足説明</span>}
                  requirement="optional"
                  size="document"
                  example={NOTE_EXAMPLE}
                  maxLength={REPORT_BODY_MAX}
                  description={reportLengthNote(item.body, REPORT_BODY_MAX)}
                  value={item.body}
                  onChange={(event) =>
                    update(item.id, (current) => ({ ...current, body: event.target.value }))
                  }
                />
              </>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className={addButton}
        onClick={() => onChange((current) => [...current, createReportPageItem()])}
      >
        <Icon name="add" size="sm" />
        調査項目を追加
      </button>
    </>
  );
}
