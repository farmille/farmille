import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { surfaceCardRecipe } from "./SurfaceCard";
import { Icon } from "@/components/Icon";
import { StarRating } from "./StarRating";

const scrollCard = cva({
  base: {
    scrollSnapAlign: "start",
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    display: "block",
    flexShrink: "0",
    w: "card.materialMobile",
    tab: { w: "card.material" },
  },
});

const listCard = cva({
  base: {
    display: "flex",
    gap: "3",
    // 本文が複数行でもサムネをカード上端に置く
    alignItems: "start",
    textDecoration: "none",
    color: "inherit",
  },
});

const imgBox = css({
  aspectRatio: "image.landscape",
  bg: "surface.card",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  color: "primary.700",
});

const listImg = css({
  w: "62px",
  aspectRatio: "image.square",
  borderRadius: "media",
  bg: "surface.card",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  overflow: "hidden",
  color: "primary.700",
});

/** 通常画像と読み込み失敗時のプレースホルダーを同じグリッドセルに重ねる。 */
const imageLayer = css({ gridArea: "1 / 1" });

export type MaterialCardProps = {
  name: string;
  maker: string;
  rating: number;
  reviewCount: number;
  articleCount?: number;
  savedCount?: number;
  categories?: string[];
  evidenceBadges?: string[];
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
      <Icon name="image" size="lg" className={imageLayer} />
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
          sizes="(max-width: 767px) 150px, 240px"
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
  savedCount,
  categories,
  evidenceBadges,
  description,
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
        className={cx(surfaceCardRecipe({ padding: "flush" }), scrollCard(), className)}
        data-ui="material-card"
        data-variant="scroll"
      >
        <MaterialImage src={imageSrc} alt={alt} className={imgBox} preload={preload} />
        <div className={css({ px: "2.5", py: "2.5" })}>
          <div
            className={css({
              fontSize: "sm",
              fontWeight: "bold",
              minW: "0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {name}
          </div>
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
          </div>
          {reviewCount > 0 ? (
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
          ) : null}
          {categories ? (
            <div className={css({ display: "flex", flexWrap: "wrap", gap: "1", mt: "2" })}>
              {categories.map((name) => (
                <span
                  key={name}
                  className={css({
                    fontSize: "2xs",
                    px: "2",
                    py: "1",
                    bg: "primary.soft",
                    color: "primary.700",
                    borderRadius: "pill",
                  })}
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    );
  }

  const countParts = [
    ...(reviewCount > 0 ? [`感想口コミ ${reviewCount}件`] : []),
    ...(articleCount !== undefined ? [`実証詳細レポート ${articleCount}件`] : []),
    ...(savedCount !== undefined ? [`お気に入り ${savedCount}件`] : []),
  ];

  return (
    <Link
      href={href}
      className={cx(surfaceCardRecipe({ padding: "compact" }), listCard(), className)}
      data-ui="material-card"
      data-variant="list"
    >
      <div className={listImg} data-ui="material-card-image">
        <Icon name="image" size="lg" className={imageLayer} />
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
        <div className={css({ fontSize: "md", fontWeight: "bold" })}>{name}</div>
        <div
          className={css({
            textStyle: "note",
            color: "text.muted",
            display: "inline-flex",
            alignItems: "center",
            gap: "1",
            mt: "0.5",
          })}
        >
          {maker}
        </div>
        {reviewCount > 0 || countParts.length > 0 ? (
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "1.5",
              textStyle: "note",
              color: "text.muted",
              mt: "1",
              flexWrap: "wrap",
            })}
          >
            {reviewCount > 0 ? (
              <>
                <StarRating value={rating} />
                <span
                  className={css({
                    fontWeight: "extrabold",
                    color: "text.default",
                    fontVariantNumeric: "tabular-nums",
                  })}
                >
                  {rating.toFixed(1)}
                </span>
              </>
            ) : null}
            {countParts.length > 0 ? (
              <span className={css({ color: "text.subtle" })}>{countParts.join(" ・ ")}</span>
            ) : null}
          </div>
        ) : null}
        {description ? (
          <p
            className={css({
              fontSize: "sm",
              color: "text.muted",
              mt: "1",
              lineHeight: "tight",
              lineClamp: 1,
            })}
          >
            {description}
          </p>
        ) : null}
        {categories && (
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "1", mt: "2" })}>
            {categories.map((name) => (
              <span
                key={name}
                className={css({
                  fontSize: "2xs",
                  px: "2",
                  py: "1",
                  bg: "primary.soft",
                  color: "primary.700",
                  borderRadius: "pill",
                })}
              >
                {name}
              </span>
            ))}
          </div>
        )}
        {evidenceBadges && (
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "1", mt: "2" })}>
            {evidenceBadges.map((label) => (
              <span
                key={label}
                className={css({ fontSize: "xs", fontWeight: "bold", color: "primary.700" })}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <Icon
        name="chevron_right"
        size="sm"
        className={css({ color: "text.subtle", flexShrink: "0", alignSelf: "center" })}
      />
    </Link>
  );
}
