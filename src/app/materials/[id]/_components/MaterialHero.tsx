import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import Link from "next/link";
import type { ReactNode } from "react";

import type { MaterialDetail } from "@/server/queries/materials";

import { css } from "../../../../../styled-system/css";

import type { SaveControlState } from "../actions";
import { HeroCount } from "./HeroSavedCount";
import { MaterialGenres } from "@/components/MaterialGenres";
import { NoImage, Stars } from "./CardParts";
import { SaveControl } from "./SaveControl";

const heroStyle = css(surfaceCardRecipe.raw({ padding: "flush" }), {
  display: "flex",
  gap: "3.5",
  p: "3.5",
  pc: { p: "5.5", gap: "5.5" },
});
const mediaColumnStyle = css({ flex: "none" });
const imageFrameStyle = css({
  w: "skeleton.materialHero",
  h: "skeleton.materialHero",
  p: "2",
  display: "grid",
  placeItems: "center",
  bg: "surface.card",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "media",
  "& > *": { gridArea: "1 / 1" },
  pc: { w: "44", h: "44" },
});
const photoStyle = css({ objectFit: "contain", bg: "surface.card" });
const infoStyle = css({ flex: "1", minW: "0" });
const nameStyle = css({ textStyle: "title" });
const ratingStyle = css({
  mt: "1",
  color: "accent.warn",
  fontWeight: "extrabold",
  fontSize: "md",
  fontVariantNumeric: "tabular-nums",
});
const makerBase = {
  mt: "1",
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  fontSize: "sm",
} as const;
const makerLinkStyle = css(makerBase, {
  color: "text.brand",
  textDecoration: "underline",
  textDecorationColor: "text.brand/40",
});
const makerTextStyle = css(makerBase, { color: "text.muted" });
const unverifiedStyle = css({
  mt: "0.5",
  fontSize: "xs",
  lineHeight: "relaxed",
  color: "text.subtle",
});
const applyLinkStyle = css({
  color: "text.brand",
  fontWeight: "semibold",
  textDecoration: "none",
});
const genresStyle = css({ mb: "1" });
const countsStyle = css({ mt: "1.5", textStyle: "note", color: "text.subtle" });
const countLinkStyle = css({ whiteSpace: "nowrap", color: "[inherit]" });
const countMinorStyle = css({ textStyle: "note", whiteSpace: "nowrap", color: "[inherit]" });
const savedMarkStyle = css({ color: "text.brand" });

type MaterialHeroProps = {
  material: MaterialDetail;
  saved: boolean | null;
  toggleAction?: (previous: SaveControlState, formData: FormData) => Promise<SaveControlState>;
  saveUnavailable?: boolean;
  reportCount?: ReactNode;
  savedCount?: ReactNode;
};

export function MaterialHero({
  material,
  saved,
  toggleAction,
  saveUnavailable,
  reportCount = <HeroCount>−件</HeroCount>,
  savedCount = <HeroCount>−</HeroCount>,
}: MaterialHeroProps) {
  const hasReviews = material.review_count > 0 && material.avg_rating !== null;

  return (
    <section className={heroStyle} aria-labelledby="material-name">
      <div className={mediaColumnStyle}>
        <div className={imageFrameStyle} data-ui="material-hero-image">
          <NoImage />
          {material.imageUrl ? (
            <Image
              alt={`${material.name}の容器イメージ`}
              className={photoStyle}
              height={170}
              preload
              sizes="(min-width: 1024px) 176px, 118px"
              src={material.imageUrl}
              width={170}
            />
          ) : null}
        </div>
        <p className={css({ fontSize: "2xs", color: "text.subtle", mt: "1" })}>容器のイメージ</p>
      </div>
      <div className={infoStyle}>
        <MaterialGenres
          names={[...new Set(material.ingredientCategories.map(({ name }) => name))]}
          className={genresStyle}
        />
        <h1 id="material-name" className={nameStyle}>
          {material.name}
        </h1>
        {hasReviews ? (
          <div className={ratingStyle}>
            <Stars value={material.avg_rating ?? 0} /> {material.avg_rating?.toFixed(1)}
          </div>
        ) : null}
        {material.representativeSeller ? (
          <Link href={`/sellers/${material.representativeSeller.id}`} className={makerLinkStyle}>
            {material.representativeSeller.official_name}
          </Link>
        ) : (
          <div className={makerTextStyle}>{material.manufacturer_name}</div>
        )}
        {material.manufacturer_verified_at === null ? (
          <div className={unverifiedStyle}>
            公開情報をもとにFarmilleが調査し、当該資材の国内の主な販売元を掲載しています。相違がある場合は、
            <a href="mailto:contact@farmille.com" className={applyLinkStyle}>
              contact@farmille.com
            </a>
            までご連絡ください。
          </div>
        ) : null}
        <div className={countsStyle}>
          <a href="#anchorReports" className={countLinkStyle}>
            実証詳細レポート {reportCount}
          </a>{" "}
          <a href="#anchorReviews" className={countMinorStyle}>
            ・ 感想口コミ <HeroCount>{material.review_count}件</HeroCount>
          </a>{" "}
          <span className={countMinorStyle}>
            ・ <Icon name="star_filled" size="xs" className={savedMarkStyle} /> お気に入り{" "}
            {savedCount}
          </span>
        </div>
        <SaveControl
          materialId={material.id}
          materialPath={`/materials/${material.id}`}
          saved={saved}
          toggleAction={toggleAction}
          unavailable={saveUnavailable}
        />
      </div>
    </section>
  );
}
