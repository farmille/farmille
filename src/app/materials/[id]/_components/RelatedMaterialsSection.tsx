import Link from "next/link";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import {
  listRelatedMaterials,
  type MaterialDetail,
  type MaterialListItem,
} from "@/server/queries/materials";

import { css } from "../../../../../styled-system/css";

import { unwrapQueryResult } from "../query-result";
import { MaterialSectionHeading } from "./MaterialSectionHeading";
import { NoImage } from "./CardParts";

const captionStyle = css({ mb: "1.5", fontSize: "xs", color: "text.subtle" });
const scrollStyle = css({
  display: "flex",
  gap: "2.5",
  pt: "0.5",
  px: "0.5",
  pb: "1.5",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  pc: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "3.5",
    overflowX: "visible",
  },
});
const cardStyle = css({
  display: "block",
  flex: "0 0 token(sizes.card.materialMobile)",
  overflow: "hidden",
  color: "inherit",
  textDecoration: "none",
  bg: "surface.card",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  pc: { flex: "none" },
});
const imageBoxStyle = css({
  display: "grid",
  placeItems: "center",
  aspectRatio: "image.landscape",
  bg: "primary.soft",
});
const imageStyle = css({
  display: "block",
  w: "full",
  h: "full",
  objectFit: "contain",
  bg: "surface.card",
});
const infoStyle = css({ p: "2.5" });
const nameStyle = css({ fontSize: "md", fontWeight: "bold" });
const makerStyle = css({
  mt: "0.5",
  fontSize: "xs",
  color: "text.subtle",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
const ratingStyle = css({ mt: "0.5", fontSize: "xs", color: "accent.star" });
const reviewCountStyle = css({ color: "text.subtle", fontVariantNumeric: "tabular-nums" });
const emptyStyle = css({ fontSize: "sm", color: "text.subtle" });

function StarText({ value }: { value: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span role="img" aria-label={`5段階中${filled}`}>
      {"★".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </span>
  );
}

export function RelatedHeading() {
  return (
    <MaterialSectionHeading
      headingId="related-materials-heading"
      title="関連する資材"
      spacing="section"
    />
  );
}

export function RelatedMaterialsView({ related }: { related: MaterialListItem[] }) {
  return (
    <section aria-labelledby="related-materials-heading">
      <RelatedHeading />
      {related.length > 0 ? (
        <>
          <div className={captionStyle}>同じ資材ジャンルの資材</div>
          <div className={scrollStyle}>
            {related.map((item) => (
              <Link key={item.id} href={`/materials/${item.id}`} className={cardStyle}>
                <div className={imageBoxStyle}>
                  {item.imageUrl ? (
                    <Image
                      alt=""
                      src={item.imageUrl}
                      width={300}
                      height={225}
                      sizes="150px"
                      className={imageStyle}
                    />
                  ) : (
                    <NoImage />
                  )}
                </div>
                <div className={infoStyle}>
                  <div className={nameStyle}>{item.name}</div>
                  <div className={makerStyle}>{item.manufacturer_name}</div>
                  {item.review_count > 0 ? (
                    <div className={ratingStyle}>
                      <StarText value={item.avg_rating ?? 0} />{" "}
                      <span className={reviewCountStyle}>{item.review_count}件</span>
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className={emptyStyle}>同じ資材ジャンルの関連資材はありません。</p>
      )}
    </section>
  );
}

export async function RelatedMaterialsSection({ material }: { material: MaterialDetail }) {
  const related = unwrapQueryResult(
    await listRelatedMaterials(
      material.id,
      material.ingredientCategories.map(({ id }) => id),
    ),
  );
  return <RelatedMaterialsView related={related} />;
}
