import { SiteAppBar } from "@/components/SiteAppBar";
import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonList";

import { MaterialCard } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/server/auth";
import { listHomeMaterials } from "@/server/queries/home-materials";
import { css } from "../../styled-system/css";
import { HomeConcept } from "./_components/HomeConcept";
import { HomeFooter } from "./_components/HomeFooter";
import { HomeHero } from "./_components/HomeHero";
import { HomeHills } from "./_components/HomeHills";
import { HomeLetters } from "./_components/HomeLetters";
import { HomeMaterialMarquee } from "./_components/HomeMaterialMarquee";
import { HomeMission } from "./_components/HomeMission";
import { HomeSearch } from "./_components/HomeSearch";
import { HomeSellerInvitation } from "./_components/HomeSellerInvitation";

const shell = css({
  minH: "dvh",
  bg: "surface.paper",
  color: "text.default",
  fontFamily: "sans",
});

const empty = css({
  mx: "4",
  p: "5",
  borderRadius: "card",
  bg: "surface.card",
  color: "text.subtle",
  textStyle: "body",
  tab: { mx: "5" },
});

/** フッターは丘の稜線から深い緑の帯へつなぐ。 */
const footerBand = css({
  position: "relative",
  bgColor: "surface.forest",
  layerStyle: "wash",
  pt: "10",
  tab: { pt: "12" },
});

const footerHills = css({
  position: "absolute",
  left: "0",
  right: "0",
  bottom: "[calc(100% - 1px)]",
});

const footerInner = css({ maxW: "content.wide", mx: "auto", px: "5", tab: { px: "8" } });

export default async function HomePage() {
  // SiteAppBar と同じリクエスト内のキャッシュを使うので、問い合わせは増えない。
  const session = await getSessionUser();
  return (
    <div className={shell}>
      <SiteAppBar chrome="public" active="home" variant="home" preparationNotice={false} />
      <main>
        <HomeHero />
        <HomeConcept showSignup={session === null} />
        <HomeSearch>
          <Suspense
            fallback={<SkeletonList variant="materialScroll" label="掲載資材を読み込んでいます" />}
          >
            <HomeMaterials />
          </Suspense>
        </HomeSearch>
        <HomeLetters />
        <HomeMission />
        <HomeSellerInvitation />
      </main>
      <div className={footerBand}>
        <HomeHills className={footerHills} into="forest" sprouts />
        <div className={footerInner}>
          <HomeFooter tone="forest" />
        </div>
      </div>
      <BottomNav active="home" />
    </div>
  );
}

async function HomeMaterials() {
  const materialsResult = await listHomeMaterials();
  if (materialsResult.length === 0) {
    return <p className={empty}>表示できる資材がまだありません。</p>;
  }
  return (
    <HomeMaterialMarquee>
      {materialsResult.map((material) => (
        <MaterialCard
          key={material.id}
          variant="scroll"
          name={material.name}
          maker={material.manufacturer_name}
          rating={material.avg_rating ?? 0}
          reviewCount={material.review_count}
          categories={material.categories}
          official={material.manufacturer_verified_at !== null}
          imageSrc={material.imageUrl ?? undefined}
          href={`/materials/${material.id}`}
        />
      ))}
    </HomeMaterialMarquee>
  );
}
