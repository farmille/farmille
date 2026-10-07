import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import Link from "next/link";
import type { ReactNode } from "react";

import type { MaterialDetail } from "@/server/queries/materials";

import { css } from "../../../../../styled-system/css";

import type { SaveControlState } from "../actions";
import { HeroCount } from "./HeroSavedCount";
import { MockChip, MockNoImage, MockStars } from "./MockParts";
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
const thumbGridStyle = css({
  display: "grid",
  gridTemplateColumns: "repeat(3, token(sizes.9))",
  gap: "1",
  mt: "1.5",
});
const thumbStyle = css({
  w: "9",
  h: "9",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  bg: "surface.page",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "mark",
});
const thumbImageStyle = css({ w: "full", h: "full", objectFit: "contain" });
const infoStyle = css({ flex: "1", minW: "0" });
const nameStyle = css({ fontSize: "lg" });
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
  color: "primary.700",
  textDecoration: "underline",
  textDecorationColor: "primary.700/40",
});
const makerTextStyle = css(makerBase, { color: "text.muted" });
const unverifiedStyle = css({
  mt: "0.5",
  fontSize: "xs",
  lineHeight: "relaxed",
  color: "text.subtle",
});
const applyLinkStyle = css({
  color: "primary.800",
  fontWeight: "semibold",
  textDecoration: "none",
});
const chipsStyle = css({ mt: "2", display: "flex", flexWrap: "wrap", gap: "1" });
const countsStyle = css({ mt: "1.5", fontSize: "xs", color: "text.subtle" });
const countLinkStyle = css({ whiteSpace: "nowrap", color: "inherit" });
const countMinorStyle = css({ fontSize: "2xs", whiteSpace: "nowrap", color: "inherit" });
const savedMarkStyle = css({ color: "primary.800" });

type MaterialHeroProps = {
  material: MaterialDetail;
  saved: boolean | null;
  toggleAction?: (previous: SaveControlState, formData: FormData) => Promise<SaveControlState>;
  saveUnavailable?: boolean;
  /** 実証詳細レポートの件数（読み込み中は Suspense の代替表示が入る）。 */
  reportCount?: ReactNode;
  /** お気に入り数（読み込み中は Suspense の代替表示が入る）。 */
  savedCount?: ReactNode;
};

/** 資材ページ先頭の資材カード（画像・名前・評価・メーカー・お気に入り）。追加画像はすべて出し、3枚ごとに折り返す。 */
export function MaterialHero({
  material,
  saved,
  toggleAction,
  saveUnavailable,
  reportCount = <HeroCount>−件</HeroCount>,
  savedCount = <HeroCount>−</HeroCount>,
}: MaterialHeroProps) {
  const primaryImage = material.images[0];
  const extraImages = material.images.slice(1);
  const hasReviews = material.review_count > 0 && material.avg_rating !== null;

  return (
    <section className={heroStyle} aria-labelledby="material-name">
      <div className={mediaColumnStyle}>
        <div className={imageFrameStyle} data-ui="material-hero-image">
          <MockNoImage />
          {primaryImage ? (
            <Image
              alt={material.name}
              className={photoStyle}
              height={170}
              preload
              sizes="(min-width: 1024px) 176px, 118px"
              src={primaryImage.url}
              width={170}
            />
          ) : null}
        </div>
        {extraImages.length > 0 ? (
          <div role="group" aria-label="追加の製品画像" className={thumbGridStyle}>
            {extraImages.map((image, index) => (
              <div key={image.id} className={thumbStyle}>
                <Image
                  src={image.url}
                  alt={`${material.name}の製品画像${index + 2}`}
                  width={72}
                  height={72}
                  sizes="36px"
                  className={thumbImageStyle}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className={infoStyle}>
        <h1 id="material-name" className={nameStyle}>
          {material.name}
        </h1>
        {hasReviews ? (
          <div className={ratingStyle}>
            <MockStars value={material.avg_rating ?? 0} /> {material.avg_rating?.toFixed(1)}
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
            国内での販売を代表する立場にあるとFarmille運営が調査・認識した企業を表示しています。相違がある場合は、
            <Link href="/sellers/apply" className={applyLinkStyle}>
              企業会員登録
            </Link>
            からご連絡ください。
          </div>
        ) : null}
        {material.ingredientCategories.length > 0 ? (
          <div className={chipsStyle}>
            {[...new Set(material.ingredientCategories.map(({ name }) => name))].map((name) => (
              <MockChip key={name} wrap>
                {name}
              </MockChip>
            ))}
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
            ・ <span className={savedMarkStyle}>★</span> お気に入り {savedCount}
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
