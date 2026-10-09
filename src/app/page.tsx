import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonList";

import { AppBar, MaterialCard, SectionHeading } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/server/auth";
import { listHomeMaterials } from "@/server/queries/home-materials";
import { css } from "../../styled-system/css";
import { HomeHero } from "./_components/HomeHero";
import { HomeInvitations } from "./_components/HomeInvitations";
import { HomeMaterialMarquee } from "./_components/HomeMaterialMarquee";
import { HomeFooter } from "./_components/HomeFooter";

const empty = css({
  p: "5",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  color: "text.subtle",
  fontSize: "md",
});

export default function HomePage() {
  return (
    <div
      className={css({
        minH: "100dvh",
        bg: "surface.page",
        color: "text.default",
        fontFamily: "sans",
      })}
    >
      <AppBar chrome="public" active="home" variant="home" overlapNoticeImage />
      <main>
        <HomeHero />
        <div
          className={css({
            maxW: "content.wide",
            mx: "auto",
            px: "4",
            pt: "8",
            tab: { px: "5", pt: "10" },
          })}
        >
          <div className={css({ display: "flex", flexDirection: "column", gap: "12" })}>
            <section aria-label="掲載資材一覧">
              <SectionHeading as="h1" title="掲載資材一覧" href="/search" linkLabel="すべて見る" />
              <Suspense
                fallback={
                  <SkeletonList variant="materialScroll" label="掲載資材を読み込んでいます" />
                }
              >
                <HomeMaterials />
              </Suspense>
            </section>

            <Suspense fallback={null}>
              <HomeAccountInvitations />
            </Suspense>
          </div>
          <HomeFooter />
        </div>
      </main>
      <BottomNav active="home" />
    </div>
  );
}

async function HomeMaterials() {
  const materialsResult = await listHomeMaterials();
  return (
    <>
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
      {materialsResult.length === 0 ? (
        <p className={empty}>表示できる資材がまだありません。</p>
      ) : null}
    </>
  );
}

async function HomeAccountInvitations() {
  const session = await getSessionUser();
  return <HomeInvitations showSignup={session === null} />;
}
