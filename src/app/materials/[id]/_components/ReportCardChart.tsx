import { reportPlotColor } from "@/components/ReportPlotColor";
import { reportBarDomain } from "@/components/ReportBars";
import type { ReportChartPreview } from "@/lib/usage-report-plots";

import { css } from "../../../../../styled-system/css";

const frame = css({
  m: "0",
  mt: "2",
  p: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.panel",
});

const caption = css({ textStyle: "note", fontWeight: "bold", color: "text.muted" });
const unitStyle = css({ fontWeight: "normal", color: "text.subtle" });

const rowStyle = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, token(sizes.16)) minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "2",
  mt: "1.5",
  textStyle: "note",
});

const labelStyle = css({ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
/** 棒は SVG の属性で描き、実行時の値を style に流さない。横 0〜100 を目盛りの範囲に当てる。 */
const trackStyle = css({
  display: "block",
  w: "full",
  h: "2.5",
  overflow: "hidden",
  borderRadius: "bar",
});
const valueStyle = css({ fontWeight: "bold", fontVariantNumeric: "tabular-nums" });
const moreStyle = css({ m: "0", mt: "1.5", textStyle: "note", color: "text.subtle" });

/** 一覧カード用の小さな横棒。区の色はレポート本文のグラフと揃える。 */
export function ReportCardChart({ chart }: { chart: ReportChartPreview }) {
  const { min, max } = reportBarDomain(chart.rows, chart.unit);
  const position = (value: number) => ((value - min) / (max - min)) * 100;
  return (
    <figure className={frame}>
      <figcaption className={caption}>
        {chart.title}
        {chart.unit ? <span className={unitStyle}>（{chart.unit}）</span> : null}
      </figcaption>
      {chart.rows.map((row) => {
        const zero = position(0);
        const end = position(row.value);
        return (
          <div
            key={row.id}
            className={rowStyle}
            role="img"
            aria-label={`${row.label} ${row.valueText}${chart.unit ? ` ${chart.unit}` : ""}`}
          >
            <span className={labelStyle}>{row.label}</span>
            <svg
              aria-hidden="true"
              className={trackStyle}
              preserveAspectRatio="none"
              viewBox="0 0 100 1"
            >
              <rect
                className={reportPlotColor({ series: row.series })}
                height="1"
                width={Math.abs(end - zero)}
                x={Math.min(zero, end)}
                y="0"
              />
            </svg>
            <b className={valueStyle} aria-hidden="true">
              {row.valueText}
            </b>
          </div>
        );
      })}
      {chart.hiddenRowCount > 0 ? (
        <p className={moreStyle}>ほか{chart.hiddenRowCount}区はレポートで読めます</p>
      ) : null}
    </figure>
  );
}
