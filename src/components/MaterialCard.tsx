import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { surfaceCardRecipe } from "./SurfaceCard";
import { Icon } from "@/components/Icon";
import { Chip } from "./Chip";
import { StarRating } from "./StarRating";

const scrollCard = cva({
  base: {
    scrollSnapAlign: "start",
    overflow: "hidden",
    textDecoration: "none",
    color: "text.default",
    display: "block",
    flexShrink: "0",
    w: "card.materialMobile",
    tab: { w: "card.material" },
    // 影は持たず、淡い灰色の細い縁で囲んだ面に画像をはめ込む
    bg: "surface.panel",
    borderWidth: "2px",
    borderColor: "border.subtle",
    p: "0.5",
    // 画像枠（media 12px）と同心円にする。16px - (縁 2px + 余白 2px) = 12px
    borderRadius: "banner",
  },
});

const rowCard = css({
  display: "flex",
  gap: "3",
  // 本文が複数行でもサムネをカード上端に置く
  alignItems: "start",
  textDecoration: "none",
  color: "text.default",
});

const imageBoxRecipe = cva({
  base: {
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    bg: "surface.card",
    borderRadius: "media",
    color: "text.brand",
  },
  variants: {
    variant: {
      scroll: { aspectRatio: "image.landscape" },
      list: {
        w: "[62px]",
        aspectRatio: "image.square",
        flexShrink: "0",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
      },
      rich: {
        w: "20",
        tab: { w: "28" },
        aspectRatio: "image.square",
        flexShrink: "0",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
      },
    },
  },
});

const IMAGE_SIZES = {
  scroll: { width: 600, height: 450, sizes: "(max-width: 767px) 150px, 240px" },
  list: { width: 62, height: 62, sizes: "62px" },
  rich: { width: 112, height: 112, sizes: "(max-width: 767px) 80px, 112px" },
} as const;

/** 通常画像と読み込み失敗時のプレースホルダーを同じグリッドセルに重ねる。 */
const imageLayer = css({ gridArea: "1 / 1" });

const reportCountRecipe = cva({
  base: { fontWeight: "extrabold", fontVariantNumeric: "tabular-nums" },
  variants: {
    emphasized: {
      true: { color: "accent.warn", fontSize: "md" },
      false: { color: "text.default" },
    },
  },
});

const countStyle = css({
  fontWeight: "extrabold",
  color: "text.default",
  fontVariantNumeric: "tabular-nums",
});

const noWrapStyle = css({ whiteSpace: "nowrap" });

const tagRowStyle = css({ display: "flex", flexWrap: "wrap", gap: "1.5", mt: "1.5" });

const RICH_CATEGORY_LIMIT = 3;

type MaterialCardBase = {
  href: string;
  name: string;
  maker: string;
  /** 感想口コミの平均評価。感想口コミが無ければ null */
  rating: number | null;
  imageSrc?: string;
  preload?: boolean;
  className?: string;
};

export type MaterialCardProps = MaterialCardBase &
  (
    | {
        /** 横スクロール用 */
        variant: "scroll";
        reviewCount: number;
        categories?: readonly string[];
      }
    | {
        /** 一覧・参照用。資材名・メーカー・評価だけを出す */
        variant: "list";
        reviewCount?: number;
        description?: string;
      }
    | {
        /** 検索結果用。件数・資材ジャンル・作物の記載まで出す */
        variant: "rich";
        reviewCount: number;
        reportCount: number;
        savedCount: number;
        description?: string;
        categories: readonly string[];
        /** direct は作物そのものの記載、groups は作物群としての記載 */
        evidence: { direct: readonly string[]; groups: readonly string[] };
      }
  );

type MaterialCardVariant = MaterialCardProps["variant"];

function MaterialImage({
  src,
  alt,
  variant,
  preload,
}: {
  src?: string;
  alt: string;
  variant: MaterialCardVariant;
  preload: boolean;
}) {
  const size = IMAGE_SIZES[variant];
  return (
    <div className={imageBoxRecipe({ variant })} data-ui="material-card-image">
      <Icon name="image" size="lg" className={imageLayer} />
      {src ? (
        <Image
          alt={alt}
          className={cx(
            imageLayer,
            css({
              display: "block",
              w: "full",
              h: "full",
              objectFit: "contain",
            }),
          )}
          height={size.height}
          preload={preload}
          sizes={size.sizes}
          src={src}
          width={size.width}
        />
      ) : null}
    </div>
  );
}

/** 資材カード。横スクロール用（scroll）、一覧・参照用（list）、検索結果用（rich）。 */
export function MaterialCard(props: MaterialCardProps) {
  const { href, name, maker, rating, imageSrc, preload = false, className, variant } = props;

  if (props.variant === "scroll") {
    return (
      <Link
        href={href}
        className={cx(scrollCard(), className)}
        data-ui="material-card"
        data-variant="scroll"
      >
        <MaterialImage src={imageSrc} alt={name} variant="scroll" preload={preload} />
        <div className={css({ px: "2", py: "2.5" })}>
          <div
            className={css({
              textStyle: "body",
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
              textStyle: "note",
              color: "text.muted",
              mt: "0.5",
              display: "flex",
              alignItems: "center",
              gap: "1",
            })}
          >
            {maker}
          </div>
          {rating !== null ? (
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "1",
                mt: "1",
                textStyle: "note",
              })}
            >
              <StarRating value={rating} />
              <span className={css({ color: "text.subtle", fontVariantNumeric: "tabular-nums" })}>
                {props.reviewCount}件
              </span>
            </div>
          ) : null}
          {props.categories ? (
            <div className={css({ display: "flex", flexWrap: "wrap", gap: "1", mt: "2" })}>
              {props.categories.map((category) => (
                <Chip key={category} size="xs">
                  {category}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cx(surfaceCardRecipe({ padding: "compact" }), rowCard, className)}
      data-ui="material-card"
      data-variant={variant}
    >
      <MaterialImage src={imageSrc} alt={name} variant={variant} preload={preload} />
      <div className={css({ flex: "1", minW: "0" })}>
        <div className={css({ textStyle: "body", fontWeight: "bold" })}>{name}</div>
        <div className={css({ textStyle: "note", color: "text.muted", mt: "0.5" })}>{maker}</div>
        {rating !== null || props.reviewCount !== undefined ? (
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "1.5",
              textStyle: "note",
              color: "text.subtle",
              mt: "1",
              flexWrap: "wrap",
            })}
          >
            {rating !== null ? (
              <>
                <StarRating value={rating} />
                <span className={countStyle}>{rating.toFixed(1)}</span>
              </>
            ) : null}
            {props.reviewCount !== undefined ? (
              <span>
                感想口コミ <b className={countStyle}>{props.reviewCount}</b>件
              </span>
            ) : null}
          </div>
        ) : null}
        {props.variant === "rich" ? (
          <div className={css({ textStyle: "note", color: "text.subtle", mt: "1" })}>
            <span className={noWrapStyle}>
              実証詳細レポート{" "}
              <b className={reportCountRecipe({ emphasized: props.reportCount > 0 })}>
                {props.reportCount}
              </b>
              件
            </span>
            {" ・ "}
            <span className={noWrapStyle}>
              お気に入り <b className={countStyle}>{props.savedCount}</b>件
            </span>
          </div>
        ) : null}
        {props.description ? (
          <p
            className={css({
              textStyle: "supporting",
              color: "text.muted",
              mt: "1",
              lineClamp: "1",
            })}
          >
            {props.description}
          </p>
        ) : null}
        {props.variant === "rich" ? (
          <RichTags categories={props.categories} evidence={props.evidence} />
        ) : null}
      </div>
      <Icon
        name="chevron_right"
        size="sm"
        className={css({ color: "text.subtle", flexShrink: "0", alignSelf: "center" })}
      />
    </Link>
  );
}

function RichTags({
  categories,
  evidence,
}: Pick<Extract<MaterialCardProps, { variant: "rich" }>, "categories" | "evidence">) {
  const shownCategories = categories.slice(0, RICH_CATEGORY_LIMIT);
  return (
    <>
      {shownCategories.length > 0 ? (
        <div className={tagRowStyle}>
          {shownCategories.map((category) => (
            <Chip key={category} size="xs" tone="neutral">
              {category}
            </Chip>
          ))}
        </div>
      ) : null}
      {/* 作物そのものの記載があれば、作物群としての記載は出さない */}
      {evidence.direct.length > 0 ? (
        <div className={tagRowStyle}>
          {evidence.direct.map((crop) => (
            <Chip key={crop} size="xs">
              <Icon name="check" size="xs" /> {crop}の記載あり
            </Chip>
          ))}
        </div>
      ) : evidence.groups.length > 0 ? (
        <div className={tagRowStyle}>
          {evidence.groups.map((group) => (
            <Chip key={group} size="xs" tone="neutral">
              {group}として記載
            </Chip>
          ))}
        </div>
      ) : null}
    </>
  );
}
