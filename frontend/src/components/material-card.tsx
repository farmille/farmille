import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { ChevronIcon, ImagePlaceholderIcon, OfficialCheckIcon } from "./icons";
import { StarRating } from "./star-rating";

const scrollCard = cva({
  base: {
    flex: "0 0 150px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    overflow: "hidden",
    bg: "surface.card",
    boxShadow: "shadow",
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
});

const listCard = cva({
  base: {
    display: "flex",
    gap: "3",
    p: "3",
    alignItems: "center",
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    boxShadow: "shadow",
    textDecoration: "none",
    color: "inherit",
  },
});

const imgBox = css({
  aspectRatio: "4/3",
  bg: "green.soft2",
  display: "grid",
  placeItems: "center",
  color: "brand.primary",
});

const listImg = css({
  w: "62px",
  h: "62px",
  borderRadius: "button",
  bg: "green.soft2",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  overflow: "hidden",
  color: "brand.primary",
});

export type MaterialCardProps = {
  name: string;
  maker: string;
  rating: number;
  reviewCount: number;
  articleCount?: number;
  description?: string;
  official?: boolean;
  href?: string;
  imageSrc?: string;
  imageAlt?: string;
  /** 横スクロール用（prod-card）／一覧用（mat-card） */
  variant?: "scroll" | "list";
  className?: string;
};

function MaterialImage({ src, alt, className }: { src?: string; alt: string; className: string }) {
  if (src) {
    return (
      <img src={src} alt={alt} className={css({ w: "100%", h: "100%", objectFit: "contain" })} />
    );
  }
  return (
    <div className={className}>
      <ImagePlaceholderIcon />
    </div>
  );
}

/** 資材カード。横スクロール用と一覧用。 */
export function MaterialCard({
  name,
  maker,
  rating,
  reviewCount,
  articleCount,
  description,
  official = false,
  href = "#",
  imageSrc,
  imageAlt,
  variant = "list",
  className,
}: MaterialCardProps) {
  const alt = imageAlt ?? name;

  if (variant === "scroll") {
    return (
      <Link href={href} className={cx(scrollCard(), className)}>
        <div className={css({ bg: "surface.card", p: "2" })}>
          <MaterialImage src={imageSrc} alt={alt} className={imgBox} />
        </div>
        <div className={css({ px: "2.5", py: "2.5" })}>
          <div className={css({ fontSize: "sm", fontWeight: "700" })}>{name}</div>
          <div
            className={css({
              fontSize: "2xs",
              color: "text.muted",
              mt: "0.5",
              display: "flex",
              alignItems: "center",
              gap: "1",
            })}
          >
            {maker}
            {official ? (
              <OfficialCheckIcon size={12} className={css({ color: "accent.official" })} />
            ) : null}
          </div>
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "1",
              mt: "1",
              fontSize: "2xs",
            })}
          >
            <StarRating value={rating} />
            <span className={css({ color: "text.subtle", fontVariantNumeric: "tabular-nums" })}>
              {reviewCount}件
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className={cx(listCard(), className)}>
      <div className={listImg}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={alt}
            className={css({ w: "100%", h: "100%", objectFit: "contain" })}
          />
        ) : (
          <ImagePlaceholderIcon />
        )}
      </div>
      <div className={css({ flex: "1", minW: "0" })}>
        <div className={css({ fontSize: "md", fontWeight: "700" })}>{name}</div>
        <div
          className={css({
            fontSize: "xs",
            color: "text.muted",
            display: "inline-flex",
            alignItems: "center",
            gap: "1",
            mt: "0.5",
          })}
        >
          {maker}
          {official ? (
            <OfficialCheckIcon size={14} className={css({ color: "accent.official" })} />
          ) : null}
        </div>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1.5",
            fontSize: "xs",
            color: "text.muted",
            mt: "1",
            flexWrap: "wrap",
          })}
        >
          <StarRating value={rating} />
          <span
            className={css({
              fontWeight: "800",
              color: "text.default",
              fontVariantNumeric: "tabular-nums",
            })}
          >
            {rating.toFixed(1)}
          </span>
          <span className={css({ color: "text.subtle" })}>
            レビュー {reviewCount}件{articleCount !== undefined ? ` ・ 記事 ${articleCount}件` : ""}
          </span>
        </div>
        {description ? (
          <p
            className={css({
              fontSize: "sm",
              color: "text.muted",
              mt: "1",
              overflow: "hidden",
              maxH: "2.6em",
              lineHeight: "1.3",
            })}
          >
            {description}
          </p>
        ) : null}
      </div>
      <ChevronIcon className={css({ color: "text.subtle", flexShrink: "0" })} />
    </Link>
  );
}
