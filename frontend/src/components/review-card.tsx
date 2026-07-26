import Link from "next/link";

import { cva, css, cx } from "../../styled-system/css";
import { ImagePlaceholderIcon, PersonIcon, ThumbIcon } from "./icons";
import { StarRating } from "./star-rating";

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
  bg: "brand.soft",
  color: "brand.primaryDeep",
  fontWeight: "600",
  whiteSpace: "nowrap",
});

const helpfulBtn = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  color: "text.muted",
  borderRadius: "pill",
  px: "3",
  py: "1.5",
  fontSize: "sm",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
  flexShrink: "0",
  cursor: "default",
});

const avatar = css({
  w: "30px",
  h: "30px",
  borderRadius: "pill",
  bg: "brand.soft",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  color: "brand.primary",
});

export type ReviewCardProps = {
  handle: string;
  authorHref?: string;
  avatarSrc?: string;
  crop: string;
  rating: number;
  helpfulCount: number;
  body: string;
  /** 資材名を付ける場合（ホームの新着など） */
  materialName?: string;
  photoCount?: number;
  photos?: ReadonlyArray<{
    id: string;
    src: string;
    alt: string;
  }>;
  className?: string;
};

/**
 * レビューカード。
 * 閲覧数は出さない（02 §4-9）。用語は「レビュー」（D8）。
 */
export function ReviewCard({
  handle,
  authorHref,
  avatarSrc,
  crop,
  rating,
  helpfulCount,
  body,
  materialName,
  photoCount = 0,
  photos = [],
  className,
}: ReviewCardProps) {
  const author = (
    <>
      <span className={avatar}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className={css({ w: "100%", h: "100%", objectFit: "cover", borderRadius: "pill" })}
          />
        ) : (
          <PersonIcon size={16} />
        )}
      </span>
      <span className={css({ fontWeight: "700", fontSize: "sm" })}>{handle}</span>
    </>
  );
  const displayedPhotoCount = photos.length > 0 ? photos.length : photoCount;

  return (
    <article className={cx(cardRecipe(), className)}>
      {materialName ? (
        <div className={css({ fontSize: "xs", color: "text.subtle", mb: "1" })}>
          {materialName} のレビュー
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
      <div className={css({ display: "flex", alignItems: "center", gap: "2", mt: "2" })}>
        <StarRating value={rating} />
        <span
          className={css({
            color: "accent.star",
            fontWeight: "800",
            fontSize: "md",
            fontVariantNumeric: "tabular-nums",
          })}
        >
          {Number(rating).toFixed(1)}
        </span>
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
                <img
                  key={photo.id}
                  src={photo.src}
                  alt={photo.alt}
                  className={css({
                    w: "18",
                    h: "18",
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
                    w: "18",
                    h: "18",
                    borderRadius: "button",
                    bg: "green.soft2",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: "0",
                    color: "brand.primary",
                  })}
                >
                  <ImagePlaceholderIcon size={20} />
                </div>
              ))}
        </div>
      ) : null}
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2.5",
          mt: "2.5",
        })}
      >
        <span className={helpfulBtn}>
          <ThumbIcon />
          <span>参考になった</span>
          {helpfulCount}
        </span>
      </div>
    </article>
  );
}
