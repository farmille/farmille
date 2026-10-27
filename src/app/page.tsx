import { SiteAppBar } from "@/components/SiteAppBar";
import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonList";

import { MaterialCard } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/server/auth";
import { listHomeMaterials } from "@/server/queries/home-materials";
import { css } from "../../styled-system/css";
import { HomeConcept } from "./_components/HomeConcept";
import { HomeHero } from "./_components/HomeHero";
// 応援メッセージ（便箋）の文面は仮のもので、寄稿を本人に確認できるまで公開しない。戻すときはこの import と、main の中の <HomeLetters /> のコメントを外す
// import { HomeLetters } from "./_components/HomeLetters";
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

export default async function HomePage() {
  // SiteAppBar と同じリクエスト内のキャッシュを使うので、問い合わせは増えない。
  const session = await getSessionUser();
  return (
    <div className={shell} data-ui="home">
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
        {/* 応援メッセージ（便箋）は公開まで出さない。理由は import の注記を参照 */}
        {/* <HomeLetters /> */}
        <HomeMission />
        <HomeSellerInvitation />
      </main>
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
          rating={material.avg_rating}
          reviewCount={material.review_count}
          categories={material.categories}
          imageSrc={material.imageUrl ?? undefined}
          href={`/materials/${material.id}`}
        />
      ))}
    </HomeMaterialMarquee>
  );
}
