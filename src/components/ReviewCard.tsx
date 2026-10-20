import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";

import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";
import { css, cx } from "../../styled-system/css";
import { surfaceCardRecipe } from "./SurfaceCard";
import { PostActions } from "./PostActions";
import { Icon } from "@/components/Icon";
import { ReportDialog } from "./ReportDialog";
import { ReviewOwnerActions } from "./ReviewOwnerActions";
import { StarRating } from "./StarRating";

const cropChip = css({
  fontSize: "xs",
  px: "2.5",
  py: "0.5",
  borderRadius: "pill",
  bg: "primary.200",
  color: "text.brandOnSoft",
  fontWeight: "semibold",
  whiteSpace: "nowrap",
});

export type ReviewCardProps = {
  handle: string;
  authorDetails?: string;
  authorHref?: string;
  avatarSrc?: string;
  crop: string;
  rating: number;
  helpfulCount: number;
  viewCount?: number;
  body: string;
  reviewId?: string;
  materialId?: string;
  canManage?: boolean;
  /**
   * 閲覧者の「参考になった」押下状態。reviewId があり canManage が false のときだけ
   * 押せるボタンとして表示する（自分の感想口コミは押せない・T-34）。
   */
  helpfulVoted?: boolean;
  /** ログイン誘導・revalidatePath の対象パス（未指定時は資材詳細ページにフォールバック）。 */
  currentPath?: string;
  /** 資材名を付ける場合（ホームの新着など） */
  materialName?: string;
  photoCount?: number;
  photos?: ReadonlyArray<{
    id: string;
    src: string;
    alt: string;
  }>;
  actions?: ReactNode;
  className?: string;
};

/**
 * 感想口コミカード。
 */
export function ReviewCard({
  handle,
  authorDetails,
  authorHref,
  avatarSrc,
  crop,
  rating,
  helpfulCount,
  viewCount = 0,
  body,
  reviewId,
  materialId,
  canManage = false,
  helpfulVoted = false,
  currentPath,
  materialName,
  photoCount = 0,
  photos = [],
  actions,
  className,
}: ReviewCardProps) {
  const interactive = reviewId !== undefined && !canManage;
  const resolvedPath = currentPath ?? (materialId !== undefined ? `/materials/${materialId}` : "/");
  const author = (
    <>
      <Avatar name={handle} src={avatarSrc} size="sm" />
      <span className={css({ textStyle: "body", fontWeight: "bold" })}>{handle}</span>
      {authorDetails ? (
        <span className={css({ color: "text.subtle", textStyle: "note" })}>{authorDetails}</span>
      ) : null}
    </>
  );
  const displayedPhotoCount = photos.length > 0 ? photos.length : photoCount;

  return (
    <article className={cx(surfaceCardRecipe({ padding: "cozy" }), className)}>
      {materialName ? (
        <div className={css({ textStyle: "note", color: "text.subtle", mb: "1" })}>
          {materialName} の感想口コミ
        </div>
      ) : null}
      <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
        {authorHref ? (
          <Link
            href={authorHref}
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "2",
              color: "[inherit]",
              textDecoration: "none",
            })}
          >
            {author}
          </Link>
        ) : (
          <span className={css({ display: "inline-flex", alignItems: "center", gap: "2" })}>
            {author}
          </span>
        )}
      </div>
      <div className={css({ mt: "2" })}>
        <StarRating value={rating} showValue />
      </div>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "1.5",
          flexWrap: "wrap",
          my: "1.5",
        })}
      >
        <span className={cropChip}>{crop}</span>
      </div>
      <p className={css({ textStyle: "body", color: "text.muted" })}>{body}</p>
      {displayedPhotoCount > 0 ? (
        <div
          className={css({
            display: "flex",
            gap: "1.5",
            mt: "2.5",
            overflowX: "auto",
          })}
        >
          {photos.length > 0
            ? photos.map((photo) => (
                <Image
                  key={photo.id}
                  src={photo.src}
                  alt={photo.alt}
                  width={72}
                  height={72}
                  unoptimized
                  className={css({
                    w: "[72px]",
                    aspectRatio: "image.square",
                    display: "block",
                    borderRadius: "media",
                    objectFit: "cover",
                    flexShrink: "0",
                  })}
                />
              ))
            : Array.from({ length: photoCount }).map((_, index) => (
                <div
                  key={index}
                  className={css({
                    w: "[72px]",
                    aspectRatio: "image.square",
                    borderRadius: "media",
                    bg: "primary.100",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: "0",
                    color: "text.brandOnSoft",
                  })}
                >
                  <Icon name="image" size="md" />
                </div>
              ))}
        </div>
      ) : null}
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "2.5",
          mt: "2.5",
        })}
      >
        <div className={css({ w: "full" })}>
          {actions ?? (
            <PostActions
              id={reviewId}
              target="review"
              currentPath={resolvedPath}
              helpfulCount={helpfulCount}
              voted={helpfulVoted}
              saved={false}
              viewCount={viewCount}
              own={canManage}
            />
          )}
        </div>
        {canManage && reviewId !== undefined && materialId !== undefined ? (
          <ReviewOwnerActions reviewId={reviewId} materialId={materialId} />
        ) : interactive && reviewId !== undefined ? (
          <ReportDialog
            action={createReportAction.bind(null, "review", reviewId, resolvedPath)}
            reasonOptions={REPORT_REASON_OPTIONS}
            title="この感想口コミを通報する"
          />
        ) : null}
      </div>
    </article>
  );
}
