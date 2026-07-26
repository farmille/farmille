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
          <div
            key={metric.id}
            className={css({
              _first: { mt: "0" },
              mt: "3.5",
            })}
          >
            <div
              className={css({
                fontSize: "xs",
                fontWeight: "700",
                mb: "1.5",
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
          </div>
        );
      })}
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "1.5",
          mt: "3.5",
          fontSize: "2xs",
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
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "2",
        mt: "1.5",
      })}
    >
      <span
        className={css({
          w: "54px",
          flexShrink: "0",
          color: "text.muted",
          fontSize: "2xs",
        })}
      >
        {label}
      </span>
      <div
        className={css({
          flex: "1",
          h: "17px",
          bg: "surface.page",
          borderRadius: "1",
          overflow: "hidden",
        })}
      >
        <div
          className={css({
            h: "100%",
            borderRadius: "1",
            bg: variant === "treated" ? "brand.primary" : "border.strong",
          })}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span
        className={css({
          w: "46px",
          flexShrink: "0",
          textAlign: "right",
          fontWeight: "700",
          fontSize: "xs",
          fontVariantNumeric: "tabular-nums",
        })}
      >
        {valueLabel}
      </span>
    </div>
  );
}
