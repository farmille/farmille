import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/Avatar";
import { badgeRecipe } from "@/components/Badge";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { ReviewViewerActions } from "@/components/ReviewViewerActions";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css } from "../../styled-system/css";

import { Chip, Stars } from "@/app/materials/[id]/_components/CardParts";

const card = css(surfaceCardRecipe.raw({ padding: "cozy" }));

const materialLine = css({ mb: "1", color: "text.subtle", textStyle: "note" });

const headRow = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  columnGap: "2",
  rowGap: "1",
});

const authorLink = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  color: "[inherit]",
  textDecoration: "none",
});

const authorName = css({ textStyle: "body", fontWeight: "bold", overflowWrap: "anywhere" });

const authorLabel = css(badgeRecipe.raw({ variant: "type" }), {
  maxW: "full",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
});

const rating = css({ display: "flex", alignItems: "center", gap: "2", mt: "2" });

const score = css({
  color: "accent.warn",
  fontSize: "md",
  fontWeight: "extrabold",
  fontVariantNumeric: "tabular-nums",
});

const crops = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1.5",
  mt: "1",
  mb: "1.5",
});

const text = css({
  color: "text.muted",
  textStyle: "body",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

const photos = css({
  display: "flex",
  gap: "2",
  mt: "2.5",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

const photo = css({
  flex: "none",
  w: "16",
  h: "16",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  borderRadius: "media",
  bg: "primary.soft",
  "& img": { display: "block", w: "full", h: "full", objectFit: "cover" },
});

const foot = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "2.5",
  mt: "3",
});

type ProfileReviewCardProps = {
  review: {
    id: string;
    materialId: string;
    materialName: string;
    cropName: string;
    rating: number;
    body: string;
    photos?: ReadonlyArray<{ id: string; url: string; alt: string }>;
  };
  author: { handle: string; avatarUrl?: string | null; href?: string; label?: string };
  actions: ReactNode;
  /** 閲覧者が投稿者本人のとき true。本人には編集・削除、それ以外には通報を出す。 */
  canManage: boolean;
  /** 通報の後に戻る画面のパス。 */
  reportReturnPath: string;
};

export function ProfileReviewCard({
  review,
  author,
  actions,
  canManage,
  reportReturnPath,
}: ProfileReviewCardProps) {
  const head = (
    <>
      <Avatar name={author.handle} src={author.avatarUrl} size="sm" />
      <span className={authorName}>{author.handle}</span>
    </>
  );
  return (
    <article className={card}>
      <div className={materialLine}>
        <Link href={`/materials/${review.materialId}#review-${review.id}`}>
          {review.materialName} の感想口コミ
        </Link>
      </div>
      <div className={headRow}>
        {author.href ? (
          <Link href={author.href} className={authorLink}>
            {head}
          </Link>
        ) : (
          head
        )}
        {author.label ? <span className={authorLabel}>{author.label}</span> : null}
      </div>
      <div className={rating}>
        <Stars value={review.rating} />
        <span className={score}>{review.rating.toFixed(1)}</span>
      </div>
      {review.cropName ? (
        <div className={crops}>
          <Chip>{review.cropName}</Chip>
        </div>
      ) : null}
      {review.body ? <div className={text}>{review.body}</div> : null}
      {review.photos && review.photos.length > 0 ? (
        <div className={photos}>
          {review.photos.map((item) => (
            <div key={item.id} className={photo}>
              <Image src={item.url} alt={item.alt} width={140} height={140} unoptimized />
            </div>
          ))}
        </div>
      ) : null}
      <div className={foot}>
        <div className={css({ flex: "1", minW: "0" })}>{actions}</div>
        <ReviewViewerActions
          reviewId={review.id}
          materialId={review.materialId}
          canManage={canManage}
          reportReturnPath={reportReturnPath}
        />
      </div>
    </article>
  );
}
