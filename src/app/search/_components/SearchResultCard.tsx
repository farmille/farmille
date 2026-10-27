import { Icon } from "@/components/Icon";
import Link from "next/link";

import { Chip, NoImage } from "@/app/materials/[id]/_components/CardParts";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { css, cva, cx } from "../../../../styled-system/css";

type SearchResultCardProps = {
  href: string;
  name: string;
  maker: string;
  rating: number | null;
  reviewCount: number;
  reportCount: number;
  savedCount: number;
  description?: string | null;
  categories: string[];
  directEvidence: string[];
  groupEvidence: string[];
  imageSrc?: string;
  preload?: boolean;
};

const cardStyle = css(surfaceCardRecipe.raw({ padding: "flush" }), {
  display: "flex",
  alignItems: "center",
  gap: "3",
  py: "3",
  px: "3.5",
  color: "[inherit]",
  textDecoration: "none",
});

const imageStyle = css({
  flex: "none",
  display: "grid",
  placeItems: "center",
  w: "28",
  h: "28",
  p: "1.5",
  overflow: "hidden",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  "& img": { display: "block", w: "full", h: "full", objectFit: "contain" },
});

const tabularNums = css({ fontVariantNumeric: "tabular-nums" });

const reportCountRecipe = cva({
  base: { fontVariantNumeric: "tabular-nums" },
  variants: {
    emphasized: {
      true: { color: "accent.warn", fontSize: "md" },
      false: { color: "text.default" },
    },
  },
});

const evidenceRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    py: "0.5",
    px: "2",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "pill",
    fontSize: "xs",
    fontWeight: "bold",
  },
  variants: {
    tone: {
      direct: { bg: "primary.100", color: "text.brandOnSoft", borderColor: "primary.700/30" },
      group: { bg: "surface.page", color: "text.muted", borderColor: "border.default" },
    },
  },
});

export function SearchResultCard({
  href,
  name,
  maker,
  rating,
  reviewCount,
  reportCount,
  savedCount,
  description,
  categories,
  directEvidence,
  groupEvidence,
  imageSrc,
  preload = false,
}: SearchResultCardProps) {
  const genres = categories.slice(0, 3);
  return (
    <Link className={cardStyle} href={href}>
      <div className={imageStyle}>
        {imageSrc ? (
          <Image alt="" src={imageSrc} width={100} height={100} sizes="100px" preload={preload} />
        ) : (
          <NoImage />
        )}
      </div>
      <div className={css({ flex: "1", minW: "0" })}>
        <div className={css({ color: "text.muted", textStyle: "note" })}>{maker}</div>
        <div className={css({ textStyle: "body", fontWeight: "bold" })}>{name}</div>
        <div className={css({ mt: "1", textStyle: "note" })}>
          {rating === null ? null : (
            <>
              <span className={css({ color: "accent.warn", fontWeight: "extrabold" })}>
                <Icon name="star_filled" size="xs" />{" "}
                <span className={tabularNums}>{rating.toFixed(1)}</span>
              </span>
              <span className={css({ color: "text.subtle" })}>（{reviewCount}）</span>
            </>
          )}
          <span className={css({ color: "text.subtle" })}>
            {rating === null ? "" : " ・ "}実証詳細レポート{" "}
            <b className={reportCountRecipe({ emphasized: reportCount > 0 })}>{reportCount}</b> 件
            ・ <Icon name="star_filled" size="xs" className={css({ color: "text.brand" })} />{" "}
            お気に入り{" "}
            <b className={cx(tabularNums, css({ color: "text.default" }))}>{savedCount}</b>
          </span>
        </div>
        {description ? (
          <div
            className={css({
              mt: "1",
              color: "text.muted",
              textStyle: "supporting",
              lineClamp: "1",
            })}
          >
            {description}
          </div>
        ) : null}
        {genres.length > 0 ? (
          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "1.5",
              mt: "1.5",
              "& > *": { minW: "0", maxW: "full", whiteSpace: "normal", overflowWrap: "anywhere" },
            })}
          >
            {genres.map((genre) => (
              <Chip key={genre} tone="grey">
                {genre}
              </Chip>
            ))}
          </div>
        ) : null}
        {directEvidence.length > 0 || groupEvidence.length > 0 ? (
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5", mt: "1.5" })}>
            {directEvidence.map((crop) => (
              <span key={crop} className={evidenceRecipe({ tone: "direct" })}>
                <Icon name="check" size="xs" /> {crop}の記載あり
              </span>
            ))}
            {directEvidence.length === 0
              ? groupEvidence.map((group) => (
                  <span key={group} className={evidenceRecipe({ tone: "group" })}>
                    {group}として記載
                  </span>
                ))
              : null}
          </div>
        ) : null}
      </div>
      <Icon name="chevron_right" size="sm" className={css({ color: "text.subtle" })} />
    </Link>
  );
}
