import { Fragment } from "react";

import { css } from "../../styled-system/css";

export type MetricBarItem = {
  id: string;
  metricName: string;
  treatedValue: number | null;
  untreatedValue: number | null;
  unit: string | null;
};

type MetricBarsProps = {
  metrics: MetricBarItem[];
};

function formatValue(value: number, unit: string | null): string {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unit === null || unit.length === 0 ? text : `${text}${unit}`;
}

function barWidthPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(4, Math.round((value / max) * 100));
}

/**
 * 収穫調査（usage_report_metrics）から表示時に横棒を生成する。
 * ラベルは D8：処理区／対照区。
 */
export function MetricBars({ metrics }: MetricBarsProps) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <div
      className={css({
        display: "grid",
        // 値の列は単位付きの最長の値に合わせ、横棒の長さを同じ基準で比べられるよう全行の幅をそろえる
        gridTemplateColumns: "54px minmax(0, 1fr) minmax(46px, max-content)",
        alignItems: "center",
        columnGap: "2",
        rowGap: "1.5",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "card",
        p: "3.5",
        mt: "3",
        bg: "surface.card",
      })}
    >
      {metrics.map((metric) => {
        const treated = metric.treatedValue;
        const untreated = metric.untreatedValue;
        const candidates = [treated, untreated].filter((v): v is number => v !== null);
        const max = candidates.length === 0 ? 0 : Math.max(...candidates);

        return (
          <Fragment key={metric.id}>
            <div
              className={css({
                gridColumn: "1 / -1",
                mt: "2",
                _first: { mt: "0" },
                fontSize: "xs",
                fontWeight: "bold",
              })}
            >
              {metric.metricName}
            </div>
            {treated !== null ? (
              <MetricRow
                label="処理区"
                valueLabel={formatValue(treated, metric.unit)}
                widthPercent={barWidthPercent(treated, max)}
                variant="treated"
              />
            ) : null}
            {untreated !== null ? (
              <MetricRow
                label="対照区"
                valueLabel={formatValue(untreated, metric.unit)}
                widthPercent={barWidthPercent(untreated, max)}
                variant="untreated"
              />
            ) : null}
          </Fragment>
        );
      })}
      <div
        className={css({
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          gap: "1.5",
          mt: "2",
          textStyle: "note",
          color: "text.subtle",
        })}
      >
        グラフは Farmille編集部が作成しています
      </div>
    </div>
  );
}

function MetricRow({
  label,
  valueLabel,
  widthPercent,
  variant,
}: {
  label: string;
  valueLabel: string;
  widthPercent: number;
  variant: "treated" | "untreated";
}) {
  return (
    <>
      <span className={css({ color: "text.muted", fontSize: "2xs" })}>{label}</span>
      <div
        className={css({
          h: "17px",
          bg: "surface.page",
          borderRadius: "bar",
          overflow: "hidden",
        })}
      >
        <div
          className={css({
            w: "var(--bar-width)",
            h: "100%",
            borderRadius: "bar",
            bg: variant === "treated" ? "primary.600" : "border.strong",
          })}
          style={{ "--bar-width": `${widthPercent}%` }}
        />
      </div>
      <span
        className={css({
          textAlign: "right",
          whiteSpace: "nowrap",
          fontWeight: "bold",
          fontSize: "xs",
          fontVariantNumeric: "tabular-nums",
        })}
      >
        {valueLabel}
      </span>
    </>
  );
}
