import { SectionHeading } from "@/components/SectionHeading";
import { SkeletonList } from "@/components/SkeletonList";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { css } from "../../../styled-system/css";

import { HomeMaterialCard, type HomeMaterialCardProps } from "./HomeMaterialCard";
import { HomeMaterialMarquee } from "./HomeMaterialMarquee";

/** ホームの掲載資材一覧。`materials` が null の間は読み込み中の骨組みを出す。 */
export function HomeMaterialsSection({ materials }: { materials: HomeMaterialCardProps[] | null }) {
  return (
    <section aria-labelledby="home-materials-heading" className={css({ mt: "7" })}>
      <SectionHeading
        className={css({ tab: { mb: "5", "& h2": { fontSize: "3xl" } } })}
        href="/search"
        title={<span id="home-materials-heading">掲載資材一覧</span>}
      />
      {materials === null ? (
        <SkeletonList variant="materialScroll" label="掲載資材を読み込んでいます" />
      ) : materials.length === 0 ? (
        <div className={surfaceCardRecipe()}>
          <p className={css({ color: "text.subtle", fontSize: "sm" })}>
            表示できる資材がまだありません。
          </p>
        </div>
      ) : (
        <>
          <HomeMaterialMarquee>
            {materials.map((material) => (
              <HomeMaterialCard key={material.href} {...material} />
            ))}
          </HomeMaterialMarquee>
          <p className={css({ mt: "0.5", color: "text.subtle", fontSize: "xs" })}>
            ※ 表示順はランダムです（広告・優先枠ではありません）。
          </p>
        </>
      )}
    </section>
  );
}
