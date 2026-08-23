import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { ChevronIcon, ImagePlaceholderIcon, OfficialCheckIcon } from "./Icons";
import { StarRating } from "./StarRating";

const scrollCard = cva({
  base: {
    scrollSnapAlign: "start",
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
    flexShrink: "0",
    w: "card.materialMobile",
    lg: { w: "card.material" },
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
  aspectRatio: "image.landscape",
  bg: "green.soft2",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  color: "brand.primary",
});

const listImg = css({
  w: "62px",
  aspectRatio: "image.square",
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

/** 通常画像と読み込み失敗時のプレースホルダーを同じグリッドセルに重ねる。 */
const imageLayer = css({ gridArea: "1 / 1" });

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
  preload?: boolean;
  className?: string;
};

function MaterialImage({
  src,
  alt,
  className,
  preload,
}: {
  src?: string;
  alt: string;
  className: string;
  preload: boolean;
}) {
  return (
    <div className={className} data-ui="material-card-image">
      <ImagePlaceholderIcon className={imageLayer} />
      {src ? (
        <Image
          alt={alt}
          className={cx(
            imageLayer,
            css({
              display: "block",
              w: "100%",
              h: "100%",
              objectFit: "contain",
            }),
          )}
          height={450}
          preload={preload}
          sizes="(max-width: 1023px) 150px, 240px"
          src={src}
          width={600}
        />
      ) : null}
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
  preload = false,
  className,
}: MaterialCardProps) {
  const alt = imageAlt ?? name;

  if (variant === "scroll") {
    return (
      <Link
        href={href}
        className={cx(scrollCard(), className)}
        data-ui="material-card"
        data-variant="scroll"
      >
        <div className={css({ bg: "surface.card", p: "2" })}>
          <MaterialImage src={imageSrc} alt={alt} className={imgBox} preload={preload} />
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
    <Link
      href={href}
      className={cx(listCard(), className)}
      data-ui="material-card"
      data-variant="list"
    >
      <div className={listImg} data-ui="material-card-image">
        <ImagePlaceholderIcon className={imageLayer} />
        {imageSrc ? (
          <Image
            alt={alt}
            className={cx(
              imageLayer,
              css({
                display: "block",
                w: "100%",
                h: "100%",
                objectFit: "contain",
              }),
            )}
            height={62}
            preload={preload}
            sizes="62px"
            src={imageSrc}
            width={62}
          />
        ) : null}
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
              lineHeight: "1.3",
              lineClamp: 2,
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
