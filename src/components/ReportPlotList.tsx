import { reportPlotColor } from "@/components/ReportPlotColor";
import type { ReportPlotLayout } from "@/lib/usage-report-plots";

import { css, cx } from "../../styled-system/css";

const styles = {
  common: css({ m: "0", mt: "2.5", textStyle: "prose", whiteSpace: "pre-wrap" }),
  group: css({ m: "0", mt: "3.5", fontSize: "md", fontWeight: "bold" }),
  list: css({ display: "flex", flexDirection: "column", gap: "2.5", mt: "2.5" }),
  row: css({
    display: "flex",
    alignItems: "flex-start",
    gap: "2.5",
    px: "3",
    py: "2.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "input",
    bg: "surface.card",
  }),
  dot: css({ flexShrink: "0", w: "3", h: "3", mt: "1", borderRadius: "pill", bg: "currentColor" }),
  name: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "2.5",
    rowGap: "1.5",
    textStyle: "body",
  }),
  scope: css({
    px: "2",
    py: "0.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "pill",
    bg: "surface.page",
    fontSize: "xs",
    color: "text.muted",
  }),
  description: css({
    mt: "1",
    textStyle: "prose",
    color: "text.muted",
    whiteSpace: "pre-wrap",
  }),
};

/** 記事の比べた区。品種ごとにまとめるときは品種の見出しを置き、印は区の系列色で塗る。 */
export function ReportPlotList({
  layout,
  commonDescription,
  emptyDescription = "−",
}: {
  layout: ReportPlotLayout;
  commonDescription: string;
  emptyDescription?: string;
}) {
  // 全区に共通の説明があれば、区ごとの説明が空でも未記入として出さない
  const common = commonDescription.trim();

  return (
    <>
      {common ? <p className={styles.common}>{common}</p> : null}
      {layout.groups.map((group) => (
        <div key={group.key}>
          {group.variety === null ? null : (
            <h3 className={styles.group}>品種：{group.variety || "（品種名未入力）"}</h3>
          )}
          <div className={styles.list}>
            {group.plots.map(({ plot, series }) => (
              <div key={plot.id} className={styles.row}>
                <span className={cx(styles.dot, reportPlotColor({ series }))} aria-hidden="true" />
                <div className={css({ minW: "0", flex: "1" })}>
                  <div className={styles.name}>
                    <b>{plot.name.trim() || "区名未入力"}</b>
                    {plot.scope ? <span className={styles.scope}>{plot.scope}</span> : null}
                  </div>
                  {plot.description.trim() || !common ? (
                    <div className={styles.description}>
                      {plot.description.trim() || emptyDescription}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
