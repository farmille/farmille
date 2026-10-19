import { reportPlotColor } from "@/components/ReportPlotColor";
import { reportBarDomain, type ReportChartPreview } from "@/lib/usage-report";

import { css, cx } from "../../../../../styled-system/css";

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
const trackStyle = css({ position: "relative", display: "block", h: "2.5" });
const barStyle = css({
  position: "absolute",
  top: "0",
  bottom: "0",
  display: "block",
  borderRadius: "bar",
  bg: "currentColor",
});
const valueStyle = css({ fontWeight: "bold", fontVariantNumeric: "tabular-nums" });

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
            <span className={trackStyle} aria-hidden="true">
              <i
                className={cx(barStyle, reportPlotColor(row.colorIndex))}
                style={{ left: `${Math.min(zero, end)}%`, width: `${Math.abs(end - zero)}%` }}
              />
            </span>
            <b className={valueStyle} aria-hidden="true">
              {row.valueText}
            </b>
          </div>
        );
      })}
    </figure>
  );
}
