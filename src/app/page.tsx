import { after } from "next/server";
import { Suspense } from "react";

import { SitePageShell } from "@/app/_site/SitePageShell";
import { SkeletonList } from "@/components/SkeletonList";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { getSessionUser } from "@/server/auth";
import {
  getCatalogSearch,
  listSearchSuggestions,
  type CatalogSearch,
} from "@/server/queries/catalog-search";
import { listHomeMaterials } from "@/server/queries/home-materials";
import { listRecentReviews } from "@/server/queries/reviews";
import { listRecentUsageReports } from "@/server/queries/usage-reports";
import { recordViewEvents, viewEventsInsertFor } from "@/server/queries/view-events";
import { createServerSupabase } from "@/server/supabase";
import { css } from "../../styled-system/css";
import { HomeHero } from "./_components/HomeHero";
import { buildHeroSearchOptions } from "./_components/home-hero-options";
import { HomeInvitations } from "./_components/HomeInvitations";
import { HomeMaterialsSection } from "./_components/HomeMaterialsSection";
import { HomeVoices, type VoiceMaterial } from "./_components/HomeVoices";

// 本文の余白を打ち消して写真を画面幅いっぱいに敷く。
const heroBleedStyle = css({ mt: "-4", mx: "calc(50% - 50vw)", tab: { mt: "-6.5" } });

/** 生産者の声は実証詳細レポート3件・感想口コミ4件。 */
const REPORT_LIMIT = 3;
const REVIEW_LIMIT = 4;

export default function HomePage() {
  return (
    <SitePageShell showHeaderSearch={false}>
      <div className={heroBleedStyle}>
        <Suspense fallback={<HomeHero />}>
          <HomeHeroWithOptions />
        </Suspense>
      </div>
      <Suspense fallback={<HomeMaterialsSection materials={null} />}>
        <HomeMaterials />
      </Suspense>
      <Suspense
        fallback={<SkeletonList variant="materialReports" label="生産者の声を読み込んでいます" />}
      >
        <HomeRecentVoices />
      </Suspense>
      <Suspense fallback={null}>
        <HomeAccountInvitations />
      </Suspense>
    </SitePageShell>
  );
}

async function HomeHeroWithOptions() {
  const [catalog, search] = await Promise.all([getCatalogSearch(), listSearchSuggestions()]);
  if (!search.ok) throw new Error("検索候補を取得できませんでした。");
  return <HomeHero searchOptions={buildHeroSearchOptions(catalog, search.data)} />;
}

async function HomeMaterials() {
  const [materials, catalog] = await Promise.all([listHomeMaterials(), getCatalogSearch()]);
  return (
    <HomeMaterialsSection
      materials={materials.map((material) => {
        const counts = catalog.counts.find((row) => row.material_id === material.id);
        return {
          href: `/materials/${material.id}`,
          name: material.name,
          maker: material.manufacturer_name,
          rating: material.review_count > 0 ? material.avg_rating : null,
          reviewCount: material.review_count,
          reportCount: counts?.report_count ?? null,
          savedCount: counts?.saved_count ?? null,
          categories: material.categories,
          imageSrc: material.primaryImage?.url,
        };
      })}
    />
  );
}

function voiceMaterial(catalog: CatalogSearch, id: string, fallbackName: string): VoiceMaterial {
  const material = catalog.materials.find((row) => row.id === id);
  return {
    id,
    name: material?.name ?? fallbackName,
    maker: material?.manufacturer_name ?? "",
    imageUrl:
      material?.material_images
        .filter((image) => image.is_current)
        .toSorted((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  };
}

/** 新着の実証詳細レポートと感想口コミ（公開中のみ）。 */
async function HomeRecentVoices() {
  const [reportsResult, reviewsResult, catalog, session, viewEventSupabase] = await Promise.all([
    listRecentUsageReports({ limit: REPORT_LIMIT }),
    listRecentReviews({ limit: REVIEW_LIMIT }),
    getCatalogSearch(),
    getSessionUser(),
    // after() の中では cookies() が使えないため、閲覧記録用のクライアントは先に作る。
    createServerSupabase(),
  ]);
  if (!reportsResult.ok) throw new Error("新着の実証詳細レポートを取得できませんでした。");
  if (!reviewsResult.ok) throw new Error("新着の感想口コミを取得できませんでした。");
  const reports = reportsResult.data;
  const reviews = reviewsResult.data;
  const viewerUserId =
    session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null;
  const insertViewEvents = viewEventsInsertFor(viewEventSupabase);
  // 表示した感想口コミごとに閲覧を1回記録する。
  after(async () => {
    await recordViewEvents({
      targetType: "review",
      targetIds: reviews.map((review) => review.id),
      viewerUserId,
      insert: insertViewEvents,
    });
  });

  return (
    <HomeVoices
      reports={reports.map((report) => ({
        report,
        material: voiceMaterial(catalog, report.materialId, report.materialName),
      }))}
      reviews={reviews.map((review) => ({
        review,
        material: voiceMaterial(catalog, review.material_id, review.materialName),
      }))}
    />
  );
}

async function HomeAccountInvitations() {
  const session = await getSessionUser();
  return <HomeInvitations showSignup={session === null} />;
}
