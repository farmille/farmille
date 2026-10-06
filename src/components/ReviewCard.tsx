import type { ReactNode } from "react";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";

import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";
import { cva, css, cx } from "../../styled-system/css";
import { PostActions } from "./PostActions";
import { Icon } from "@/components/Icon";
import { ReportDialog } from "./ReportDialog";
import { ReviewOwnerActions } from "./ReviewOwnerActions";
import { StarRating } from "./StarRating";

const cardRecipe = cva({
  base: {
    p: "3.5",
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    boxShadow: "shadow",
  },
});

const cropChip = css({
  fontSize: "xs",
  px: "2.5",
  py: "0.5",
  borderRadius: "pill",
  bg: "primary.soft",
  color: "primary.700",
  fontWeight: "600",
  whiteSpace: "nowrap",
});

const avatar = css({
  w: "30px",
  aspectRatio: "image.square",
  borderRadius: "pill",
  bg: "primary.soft",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  overflow: "hidden",
  color: "primary.700",
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
      <span className={avatar}>
        {avatarSrc ? (
          <Image
            alt=""
            className={css({
              display: "block",
              w: "100%",
              h: "100%",
              objectFit: "cover",
              borderRadius: "pill",
            })}
            height={30}
            sizes="30px"
            src={avatarSrc}
            width={30}
          />
        ) : (
          <Icon name="person" size="sm" />
        )}
      </span>
      <span className={css({ fontWeight: "700", fontSize: "sm" })}>{handle}</span>
      {authorDetails ? (
        <span className={css({ color: "text.subtle", fontSize: "xs" })}>{authorDetails}</span>
      ) : null}
    </>
  );
  const displayedPhotoCount = photos.length > 0 ? photos.length : photoCount;

  return (
    <article className={cx(cardRecipe(), className)}>
      {materialName ? (
        <div className={css({ fontSize: "xs", color: "text.subtle", mb: "1" })}>
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
              color: "inherit",
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
      <p className={css({ fontSize: "sm", color: "text.muted", lineHeight: "1.65" })}>{body}</p>
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
                    w: "72px",
                    aspectRatio: "image.square",
                    display: "block",
                    borderRadius: "button",
                    objectFit: "cover",
                    flexShrink: "0",
                  })}
                />
              ))
            : Array.from({ length: photoCount }).map((_, index) => (
                <div
                  key={index}
                  className={css({
                    w: "72px",
                    aspectRatio: "image.square",
                    borderRadius: "button",
                    bg: "primary.soft",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: "0",
                    color: "primary.700",
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
        <div className={css({ w: "100%" })}>
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
