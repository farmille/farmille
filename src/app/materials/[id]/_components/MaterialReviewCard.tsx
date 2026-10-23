import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/Avatar";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { ReportDialog } from "@/components/ReportDialog";
import { ReviewOwnerActions } from "@/components/ReviewOwnerActions";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";
import type { ReviewListItem } from "@/server/queries/reviews";

import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css, cx } from "../../../../../styled-system/css";

import { Chip, Stars } from "./CardParts";

const cardStyle = css({ scrollMarginTop: "16" });
/** 1枚目の写真は大きく見せ、畑の様子から読めるようにする。 */
const coverStyle = css({
  position: "relative",
  mb: "3",
  overflow: "hidden",
  aspectRatio: "image.landscape",
  bg: "primary.soft",
  borderRadius: "media",
});
const authorRowStyle = css({
  mt: "3",
  pt: "2.5",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  rowGap: "1",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});
const authorLinkStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  color: "[inherit]",
  textDecoration: "none",
});
const nameStyle = css({ textStyle: "body", fontWeight: "bold", overflowWrap: "anywhere" });
const detailsStyle = css({
  maxW: "full",
  px: "2",
  py: "0.5",
  fontSize: "2xs",
  fontWeight: "bold",
  color: "text.brandOnSoft",
  bg: "primary.100",
  borderRadius: "pill",
  overflowWrap: "anywhere",
});
const ratingStyle = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1.5",
  rowGap: "1",
});
const scoreStyle = css({
  color: "accent.warn",
  fontSize: "md",
  fontWeight: "extrabold",
  fontVariantNumeric: "tabular-nums",
});
/** 本文は生産者の言葉として、左に線を引いた引用の形で組む。 */
const bodyStyle = css({
  m: "0",
  mt: "2",
  pl: "3",
  borderLeftWidth: "2px",
  borderLeftStyle: "solid",
  borderLeftColor: "primary.200",
  textStyle: "prose",
  color: "text.default",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});
const photosStyle = css({
  mt: "2.5",
  display: "flex",
  gap: "1.5",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});
const photoStyle = css({
  w: "16",
  h: "16",
  flex: "none",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  bg: "primary.soft",
  borderRadius: "input",
});
const photoImageStyle = css({ display: "block", w: "full", h: "full", objectFit: "cover" });
const footStyle = css({
  mt: "2.5",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "2.5",
});
const actionsStyle = css({ flex: "1", minW: "0" });

type MaterialReviewCardProps = {
  review: ReviewListItem;
  canManage: boolean;
  currentPath: string;
  actions: ReactNode;
};

export function MaterialReviewCard({
  review,
  canManage,
  currentPath,
  actions,
}: MaterialReviewCardProps) {
  const handle = review.author?.handle ?? "退会したユーザー";
  const details = publicProfileLabel(review.author);
  const author = (
    <>
      <Avatar name={handle} src={review.author?.avatar_url} size="sm" />
      <span className={nameStyle}>{handle}</span>
    </>
  );
  const [cover, ...photos] = review.photos;
  return (
    <article
      className={cx(surfaceCardRecipe({ padding: "cozy" }), cardStyle)}
      id={`review-${review.id}`}
    >
      {cover ? (
        <div className={coverStyle}>
          <Image
            src={cover.url}
            alt={cover.caption ?? "感想口コミ写真"}
            fill
            sizes="(min-width: 1024px) 420px, 92vw"
            className={photoImageStyle}
            unoptimized
          />
        </div>
      ) : null}
      <div className={ratingStyle}>
        <Stars value={review.rating} />
        <span className={scoreStyle}>{review.rating.toFixed(1)}</span>
        {review.crops.map((crop) => (
          <Chip key={crop.id}>{crop.name}</Chip>
        ))}
      </div>
      <blockquote className={bodyStyle}>{review.body}</blockquote>
      {photos.length > 0 ? (
        <div className={photosStyle}>
          {photos.map((photo) => (
            <div key={photo.id} className={photoStyle}>
              <Image
                src={photo.url}
                alt={photo.caption ?? "感想口コミ写真"}
                width={140}
                height={140}
                className={photoImageStyle}
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : null}
      <div className={authorRowStyle}>
        {review.author?.user_id ? (
          <Link href={`/users/${review.author.user_id}`} className={authorLinkStyle}>
            {author}
          </Link>
        ) : (
          author
        )}
        {details ? <span className={detailsStyle}>{details}</span> : null}
      </div>
      <div className={footStyle}>
        <div className={actionsStyle}>{actions}</div>
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
