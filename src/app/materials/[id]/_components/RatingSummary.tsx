import type { ReviewRatingDistribution } from "@/server/queries/material-content";

import { MockStars } from "./MockParts";

type RatingSummaryProps = {
  average: number | null;
  reviewCount: number;
  distribution: ReviewRatingDistribution;
};

/** 見本の barRow：星ごとの割合（%）。 */
function BarRow({ rating, count, total }: { rating: number; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bar-row" role="img" aria-label={`星${rating}の感想口コミ ${count}件`}>
      <span className="tnum">★{rating}</span>
      <div className="bar">
        <span style={{ width: `${percent}%` }} />
      </div>
      <span className="tnum" style={{ width: 26, textAlign: "right" }}>
        {percent}%
      </span>
    </div>
  );
}

/** 見本 S.material の `.rating-summary`。感想口コミが無い資材では出さない。 */
export function RatingSummary({ average, reviewCount, distribution }: RatingSummaryProps) {
  if (reviewCount === 0) return null;

  return (
    <div className="card rating-summary">
      <div style={{ textAlign: "center" }}>
        <div className="big tnum">{average?.toFixed(1) ?? "−"}</div>
        <MockStars value={average ?? 0} />
        <div className="muted tnum" style={{ fontSize: 10 }}>
          {reviewCount}件
        </div>
      </div>
      <div className="bars">
        {distribution.stars
          .toSorted((left, right) => right.rating - left.rating)
          .map(({ rating, count }) => (
            <BarRow key={rating} rating={rating} count={count} total={distribution.total} />
          ))}
      </div>
    </div>
  );
}
