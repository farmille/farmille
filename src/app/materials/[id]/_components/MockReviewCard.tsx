import Link from "next/link";
import type { ReactNode } from "react";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { ReportDialog } from "@/components/ReportDialog";
import { ReviewOwnerActions } from "@/components/ReviewOwnerActions";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";
import type { ReviewListItem } from "@/server/queries/reviews";

import { MockAvatar, MockChip, MockStars } from "./MockParts";

type MockReviewCardProps = {
  review: ReviewListItem;
  /** 投稿者本人が見ているとき（編集・削除を出し、通報は出さない）。 */
  canManage: boolean;
  currentPath: string;
  /** 参考になった・保存・閲覧数（PostActionsLoader）。 */
  actions: ReactNode;
};

/**
 * 見本の reviewCard（`.card.rc`）。
 * 通報・本人の編集削除は既存の ReviewCard と同じ部品をそのまま使う。
 */
export function MockReviewCard({ review, canManage, currentPath, actions }: MockReviewCardProps) {
  const handle = review.author?.handle ?? "退会したユーザー";
  const details = publicProfileLabel(review.author);
  const author = (
    <>
      <MockAvatar name={handle} src={review.author?.avatar_url} size={30} />
      <span className="rc-name">{handle}</span>
    </>
  );
  return (
    <article className="card rc" id={`review-${review.id}`} style={{ scrollMarginTop: 64 }}>
      <div className="rc-head">
        {review.author?.user_id ? (
          <Link
            href={`/users/${review.author.user_id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {author}
          </Link>
        ) : (
          author
        )}
        {details ? (
          <span className="type-label" style={{ fontSize: 9.5 }}>
            {details}
          </span>
        ) : null}
      </div>
      <div className="rc-stars">
        <MockStars value={review.rating} />
        <span className="score-num">{review.rating.toFixed(1)}</span>
      </div>
      {review.crops.length > 0 ? (
        <div className="rc-crops">
          {review.crops.map((crop) => (
            <MockChip key={crop.id}>{crop.name}</MockChip>
          ))}
        </div>
      ) : null}
      <div className="rc-text" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {review.body}
      </div>
      {review.photos.length > 0 ? (
        <div className="review-photos">
          {review.photos.map((photo) => (
            <div key={photo.id} className="rphoto">
              <Image
                src={photo.url}
                alt={photo.caption ?? "感想口コミ写真"}
                width={140}
                height={140}
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : null}
      <div className="rc-foot" style={{ flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>{actions}</div>
        {canManage ? (
          <ReviewOwnerActions reviewId={review.id} materialId={review.material_id} />
        ) : (
          <ReportDialog
            action={createReportAction.bind(null, "review", review.id, currentPath)}
            reasonOptions={REPORT_REASON_OPTIONS}
            title="この感想口コミを通報する"
          />
        )}
      </div>
    </article>
  );
}
