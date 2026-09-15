import { StarRating } from "@/components";
import type { ReviewRatingDistribution } from "@/server/queries/material-content";
import { css } from "../../../../../styled-system/css";

const summaryCard = css({
  p: "3.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

const progressStyle = css({
  appearance: "none",
  w: "100%",
  h: "6px",
  borderWidth: "0",
  borderRadius: "pill",
  overflow: "hidden",
  bg: "border.default",
  "&::-webkit-progress-bar": {
    bg: "border.default",
    borderRadius: "pill",
  },
  "&::-webkit-progress-value": {
    bg: "accent.star",
    borderRadius: "pill",
  },
  "&::-moz-progress-bar": {
    bg: "accent.star",
    borderRadius: "pill",
  },
});

type RatingSummaryProps = {
  average: number | null;
  reviewCount: number;
  controlPlotRatio: number | null;
  distribution: ReviewRatingDistribution;
};

export function RatingSummary({
  average,
  reviewCount,
  controlPlotRatio,
  distribution,
}: RatingSummaryProps) {
  const controlPlotLabel =
    controlPlotRatio === null ? "まだ算出できません" : `${Math.round(controlPlotRatio * 100)}%`;

  return (
    <div className={summaryCard}>
      <div className={css({ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5" })}>
        <div className={css({ textAlign: "center" })}>
          <div
            className={css({
              fontSize: "3xl",
              fontWeight: "800",
              fontVariantNumeric: "tabular-nums",
            })}
          >
            {average?.toFixed(1) ?? "—"}
          </div>
          <StarRating value={average ?? 0} />
          <div
            className={css({
              mt: "1",
              fontSize: "xs",
              color: "text.subtle",
              fontVariantNumeric: "tabular-nums",
            })}
          >
            {reviewCount}件
          </div>
        </div>
        <div className={css({ display: "flex", flexDirection: "column", gap: "1.5" })}>
          {distribution.stars.map(({ rating, count }) => (
            <div
              key={rating}
              className={css({
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: "2",
                fontSize: "xs",
                color: "text.muted",
              })}
            >
              <span>{rating}</span>
              <progress
                className={progressStyle}
                value={count}
                max={Math.max(distribution.total, 1)}
                aria-label={`星${rating}の感想口コミ ${count}件`}
              />
              <span
                className={css({
                  minW: "20px",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                })}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "3",
          mt: "3.5",
          pt: "3",
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: "border.default",
          fontSize: "sm",
        })}
      >
        <span className={css({ color: "text.muted" })}>対照区あり率</span>
        <strong className={css({ fontVariantNumeric: "tabular-nums" })}>{controlPlotLabel}</strong>
      </div>
    </div>
  );
}
