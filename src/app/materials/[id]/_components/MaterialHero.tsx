import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";

import { Badge, StarRating } from "@/components";
import { Icon } from "@/components/Icon";
import type { MaterialDetail } from "@/server/queries/materials";
import { css, cx } from "../../../../../styled-system/css";

import type { SaveControlState } from "../actions";
import { SaveControl } from "./SaveControl";

const heroCard = css({
  p: "3.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

const imageBox = css({
  w: "118px",
  aspectRatio: "image.square",
  borderRadius: "button",
  bg: "green.soft2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  overflow: "hidden",
  color: "brand.primary",
});

/** 通常画像と読み込み失敗時のプレースホルダーを同じグリッドセルに重ねる。 */
const imageLayer = css({ gridArea: "1 / 1" });

const manufacturerStyle = css({
  mt: "1",
  display: "inline-flex",
  maxW: "100%",
  alignItems: "center",
  color: "text.muted",
  fontSize: "sm",
  textDecoration: "none",
  "& > span": {
    maxW: "100%",
    alignItems: "flex-start",
    whiteSpace: "normal",
    lineHeight: "1.4",
  },
  "& svg": {
    flexShrink: "0",
    mt: "0.5",
  },
});

type MaterialHeroProps = {
  material: MaterialDetail;
  saved: boolean | null;
  toggleAction?: (previous: SaveControlState, formData: FormData) => Promise<SaveControlState>;
  saveUnavailable?: boolean;
};

export function MaterialHero({
  material,
  saved,
  toggleAction,
  saveUnavailable,
}: MaterialHeroProps) {
  const primaryImage = material.images[0];
  const manufacturer = material.seller_id ? (
    <Link href={`/sellers/${material.seller_id}`} className={manufacturerStyle}>
      {material.manufacturer_verified_at === null ? (
        material.manufacturer_name
      ) : (
        <Badge variant="official">{material.manufacturer_name} メーカー確認済み</Badge>
      )}
    </Link>
  ) : (
    <span className={manufacturerStyle}>{material.manufacturer_name}</span>
  );

  return (
    <section className={heroCard} aria-labelledby="material-name">
      <div className={css({ display: "flex", gap: "3.5", alignItems: "center" })}>
        <div className={imageBox} data-ui="material-hero-image">
          <Icon name="image" className={imageLayer} size="xl" />
          {primaryImage ? (
            <Image
              alt={material.name}
              className={cx(
                imageLayer,
                css({
                  display: "block",
                  w: "100%",
                  h: "100%",
                  objectFit: "contain",
                }),
              )}
              height={118}
              preload
              sizes="118px"
              src={primaryImage.url}
              width={118}
            />
          ) : null}
        </div>
        <div className={css({ flex: "1", minW: "0" })}>
          <h1 id="material-name" className={css({ m: "0", fontSize: "2xl", fontWeight: "700" })}>
            {material.name}
          </h1>
          {manufacturer}
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "2",
              mt: "2.5",
            })}
          >
            <span
              className={css({
                fontSize: "3xl",
                fontWeight: "800",
                fontVariantNumeric: "tabular-nums",
              })}
            >
              {material.avg_rating?.toFixed(1) ?? "—"}
            </span>
            <div>
              <StarRating value={material.avg_rating ?? 0} />
              <p
                className={css({
                  m: "0",
                  mt: "0.5",
                  color: "text.subtle",
                  fontSize: "xs",
                  fontVariantNumeric: "tabular-nums",
                })}
              >
                農家のレビュー {material.review_count}件
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        className={css({
          mt: "3.5",
          pt: "3",
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: "border.default",
        })}
      >
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
