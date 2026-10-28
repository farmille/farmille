import { Icon } from "@/components/Icon";
import type { ReviewRatingDistribution } from "@/server/queries/material-content";

import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css, cx } from "../../../../../styled-system/css";

import { Stars } from "./CardParts";

const summaryStyle = css({ display: "flex", alignItems: "center", gap: "4" });
const averageColumnStyle = css({ textAlign: "center" });
const averageStyle = css({
  fontSize: "display",
  fontWeight: "extrabold",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
});
const countStyle = css({
  textStyle: "note",
  color: "text.subtle",
  fontVariantNumeric: "tabular-nums",
});
const barsStyle = css({ flex: "1", minW: "0", display: "flex", flexDirection: "column", gap: "1" });
const rowStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  fontSize: "xs",
  color: "text.subtle",
  fontVariantNumeric: "tabular-nums",
});
const trackStyle = css({
  flex: "1",
  h: "1.5",
  bg: "surface.page",
  borderRadius: "pill",
  overflow: "hidden",
});
const fillStyle = css({
  display: "block",
  w: "var(--bar-width)",
  h: "full",
  bg: "accent.star",
  borderRadius: "pill",
});
const percentStyle = css({ w: "6.5", textAlign: "right" });

type RatingSummaryProps = {
  average: number | null;
  reviewCount: number;
  distribution: ReviewRatingDistribution;
};

function BarRow({ rating, count, total }: { rating: number; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={rowStyle} role="img" aria-label={`星${rating}の感想口コミ ${count}件`}>
      <span>
        <Icon name="star_filled" size="sm" />
        {rating}
      </span>
      <div className={trackStyle}>
        <span className={fillStyle} style={{ "--bar-width": `${percent}%` }} />
      </div>
      <span className={percentStyle}>{percent}%</span>
    </div>
  );
}

export function RatingSummary({ average, reviewCount, distribution }: RatingSummaryProps) {
  if (reviewCount === 0) return null;

  return (
    <div className={cx(surfaceCardRecipe({ padding: "cozy" }), summaryStyle)}>
      <div className={averageColumnStyle}>
        <div className={averageStyle}>{average?.toFixed(1) ?? "−"}</div>
        <Stars value={average ?? 0} />
        <div className={countStyle}>{reviewCount}件</div>
      </div>
      <div className={barsStyle}>
        {distribution.stars
          .toSorted((left, right) => right.rating - left.rating)
          .map(({ rating, count }) => (
            <BarRow key={rating} rating={rating} count={count} total={distribution.total} />
          ))}
      </div>
    </div>
  );
}
