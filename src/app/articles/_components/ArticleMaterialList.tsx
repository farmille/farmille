import Link from "next/link";

import { surfaceCardRecipe } from "@/components/SurfaceCard";
import type { PublishedArticleDetail } from "@/server/queries/articles";

import { css } from "../../../../styled-system/css";
import { Stars } from "../../materials/[id]/_components/CardParts";
import { ChevronIcon, SeedIcon } from "./ArticleIcons";
import { ReadingHeading } from "./Reading";

const materialLink = css(surfaceCardRecipe.raw({ tone: "soft", padding: "compact" }), {
  display: "flex",
  alignItems: "center",
  gap: "3",
  color: "inherit",
  textDecoration: "none",
});

export function ArticleMaterialList({
  materials,
}: {
  materials: PublishedArticleDetail["materials"];
}) {
  return (
    <section aria-labelledby="article-materials-heading">
      <ReadingHeading id="article-materials-heading">この記事で紹介した資材</ReadingHeading>
      <div className={css({ display: "flex", flexDirection: "column", gap: "2.5" })}>
        {materials.map((material) => (
          <Link key={material.id} href={`/materials/${material.id}`} className={materialLink}>
            <span
              className={css({
                w: "11",
                h: "11",
                borderRadius: "button",
                bg: "primary.soft",
                display: "grid",
                placeItems: "center",
                flexShrink: "0",
              })}
            >
              <SeedIcon />
            </span>
            <span className={css({ minW: "0" })}>
              <span className={css({ display: "block", fontWeight: "bold", fontSize: "md" })}>
                {material.name}
              </span>
              <span
                className={css({
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.5",
                  fontSize: "sm",
                  color: "text.subtle",
                })}
              >
                {material.manufacturer_name}
                {material.avg_rating !== null ? <Stars value={material.avg_rating} /> : null}
              </span>
            </span>
            <span className={css({ display: "flex", ml: "auto" })}>
              <ChevronIcon />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
