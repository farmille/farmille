import { MaterialCard } from "@/components/MaterialCard";
import { materialIllustrationUrl } from "@/lib/material-illustration";
import type { PublishedArticleDetail } from "@/server/queries/articles";

import { css } from "../../../../styled-system/css";
import { ReadingHeading } from "./Reading";

export function ArticleMaterialList({
  materials,
}: {
  materials: PublishedArticleDetail["materials"];
}) {
  return (
    <section aria-labelledby="article-materials-heading">
      <ReadingHeading id="article-materials-heading">この記事で紹介した資材</ReadingHeading>
      <div className={css({ display: "flex", flexDirection: "column", gap: "3", my: "4" })}>
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            variant="list"
            href={`/materials/${material.id}`}
            name={material.name}
            maker={material.manufacturer_name}
            rating={material.avg_rating}
            imageSrc={materialIllustrationUrl(material.container_type_id) ?? undefined}
          />
        ))}
      </div>
    </section>
  );
}
