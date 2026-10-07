import Link from "next/link";

import { Chip, NoImage } from "@/app/materials/[id]/_components/CardParts";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { css, cva, cx } from "../../../../styled-system/css";

type SearchResultCardProps = {
  href: string;
  name: string;
  maker: string;
  /** 感想口コミが無い資材は null（★を出さない）。 */
  rating: number | null;
  reviewCount: number;
  reportCount: number;
  savedCount: number;
  description?: string | null;
  categories: string[];
  /** 作物で絞り込んだときの根拠（作目への直接記載）。 */
  directEvidence: string[];
  /** 作物分類としての記載（直接記載が無いときだけ）。 */
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
  color: "inherit",
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
      direct: { bg: "primary.100", color: "primary.800", borderColor: "primary.700/30" },
      group: { bg: "surface.page", color: "text.muted", borderColor: "border.default" },
    },
  },
});

function ChevronIcon() {
  return (
    <svg
      className={css({ flex: "none", color: "text.subtle" })}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * 検索結果の資材カード。
 * 作物で絞り込んだときは根拠のバッジ（✓ 直接記載＝緑、分類として記載＝灰）を出す。
 */
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
        <div className={css({ color: "text.muted", fontSize: "xs" })}>{maker}</div>
        <div className={css({ fontSize: "md", fontWeight: "bold" })}>{name}</div>
        <div className={css({ mt: "1", fontSize: "xs" })}>
          {rating === null ? null : (
            <>
              <span className={css({ color: "accent.warn", fontWeight: "extrabold" })}>
                ★ <span className={tabularNums}>{rating.toFixed(1)}</span>
              </span>
              <span className={css({ color: "text.subtle" })}>（{reviewCount}）</span>
            </>
          )}
          <span className={css({ color: "text.subtle" })}>
            {rating === null ? "" : " ・ "}実証詳細レポート{" "}
            <b className={reportCountRecipe({ emphasized: reportCount > 0 })}>{reportCount}</b> 件
            ・ <span className={css({ color: "primary.800" })}>★</span> お気に入り{" "}
            <b className={cx(tabularNums, css({ color: "text.default" }))}>{savedCount}</b>
          </span>
        </div>
        {description ? (
          <div className={css({ mt: "1", color: "text.muted", fontSize: "sm", lineClamp: "1" })}>
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
                ✓ {crop}の記載あり
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
      <ChevronIcon />
    </Link>
  );
}
