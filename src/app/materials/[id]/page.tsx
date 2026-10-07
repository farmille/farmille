import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Suspense } from "react";

import { SitePageShell } from "@/app/_site/SitePageShell";
import { FabBar } from "@/components/FabBar";
import { SkeletonList } from "@/components/SkeletonList";
import { RatingSkeleton, SkeletonRegion } from "@/components/Skeleton";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { materialSourceLinks } from "@/lib/material-links";
import { createProductJsonLd, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { getPublishedMaterialPage } from "@/server/material-page-editor";
import { getReviewRatingDistribution } from "@/server/queries/material-content";
import type { MaterialDetail } from "@/server/queries/materials";
import { listReviewsByMaterial } from "@/server/queries/reviews";
import { isMaterialSaved } from "@/server/queries/saved-materials";
import {
  recordViewEvent,
  recordViewEvents,
  viewEventsInsertFor,
} from "@/server/queries/view-events";
import { createServerSupabase } from "@/server/supabase";

import { css } from "../../../../styled-system/css";

import { MaterialDetailTable } from "./_components/DetailTable";
import {
  ArchivedNotice,
  MaterialPageCompliance,
  MaterialSpecDisclaimer,
  PostsCompliance,
} from "./_components/MaterialCompliance";
import { HeroCount, HeroSavedCount } from "./_components/HeroSavedCount";
import { MaterialHero } from "./_components/MaterialHero";
import { MaterialDescriptionBox, MaterialTimingBox } from "./_components/MaterialOverview";
import { MaterialPageSkeleton } from "./_components/MaterialPageSkeleton";
import {
  HeroReportCount,
  MaterialReportsSection,
  ReportsHeading,
} from "./_components/MaterialReportsSection";
import { MaterialReviewsSection, ReviewsHeading } from "./_components/MaterialReviewsSection";
import { MaterialSourceLinks } from "./_components/MaterialSourceLinks";
import { RelatedHeading, RelatedMaterialsSection } from "./_components/RelatedMaterialsSection";
import { RatingSummary } from "./_components/RatingSummary";
import { ReviewAnalytics } from "./_components/ReviewAnalytics";
import { toggleSavedMaterialAction } from "./actions";
import {
  isMaterialId,
  loadMaterialOrNotFound,
  materialDescription,
  materialMetadata,
} from "./material-page-data";
import { unwrapQueryResult } from "./query-result";

const breadcrumbStyle = css({ mb: "2.5", fontSize: "xs", color: "text.subtle" });
const crumbLinkStyle = css({ color: "inherit", textDecoration: "underline" });

type MaterialPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string | string[] }>;
};

export async function generateMetadata({ params }: MaterialPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);

  return materialMetadata(material);
}

async function loadViewer(materialId: string) {
  const sessionUser = await getSessionUser();
  const isGeneralUser = sessionUser !== null && canUseGeneralFeatures(sessionUser.accountType);

  return {
    sessionUser,
    viewerUserId: isGeneralUser ? sessionUser.userId : null,
    savedResult: isGeneralUser ? await isMaterialSaved(materialId, sessionUser.userId) : null,
  };
}

async function MaterialRating({ material }: { material: MaterialDetail }) {
  const distribution = unwrapQueryResult(await getReviewRatingDistribution(material.id));
  return (
    <RatingSummary
      average={material.avg_rating}
      reviewCount={material.review_count}
      distribution={distribution}
    />
  );
}

async function MaterialReviews({
  material,
  viewerUserId,
}: {
  material: MaterialDetail;
  viewerUserId: string | null;
}) {
  const reviews = unwrapQueryResult(
    await listReviewsByMaterial(material.id, { sort: "newest", page: 1, viewerUserId }),
  );
  const displayedReviews = reviews.items.slice(0, 3);
  const insertViewEvents = viewEventsInsertFor(await createServerSupabase());
  after(async () => {
    await recordViewEvents({
      targetType: "review",
      targetIds: displayedReviews.map((review) => review.id),
      viewerUserId,
      insert: insertViewEvents,
    });
  });

  return (
    <MaterialReviewsSection
      materialPath={`/materials/${material.id}`}
      reviews={displayedReviews}
      total={reviews.total}
      viewerUserId={viewerUserId}
      rating={
        <Suspense
          fallback={
            <SkeletonRegion label="評価の分布を読み込んでいます">
              <RatingSkeleton />
            </SkeletonRegion>
          }
        >
          <MaterialRating material={material} />
        </Suspense>
      }
    />
  );
}

async function MaterialContent({ params, searchParams }: MaterialPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!isMaterialId(id)) {
    notFound();
  }

  const [material, { sessionUser, viewerUserId, savedResult }, publishedPage] = await Promise.all([
    loadMaterialOrNotFound(id),
    loadViewer(id),
    getPublishedMaterialPage(id),
  ]);
  const isGeneralUser = viewerUserId !== null;
  // after() の中では cookies() が使えないため、Supabase クライアントは先に作る。
  const viewEventSupabase = await createServerSupabase();

  after(async () => {
    await recordViewEvent({
      targetType: "material",
      targetId: material.id,
      viewerUserId,
      supabase: viewEventSupabase,
    });
  });

  const materialPath = `/materials/${material.id}`;
  const saved = savedResult === null ? null : unwrapQueryResult(savedResult);
  const toggleAction = isGeneralUser
    ? toggleSavedMaterialAction.bind(null, material.id)
    : undefined;
  const productJsonLd = createProductJsonLd({
    id: material.id,
    name: material.name,
    manufacturerName: material.manufacturer_name,
    description: materialDescription(material),
    imageUrls: material.images.map((image) => image.url),
    averageRating: material.avg_rating,
    reviewCount: material.review_count,
  });

  return (
    <SitePageShell
      title={material.name}
      backHref="/"
      hasFab={material.publication_status === "published"}
    >
      <ReviewAnalytics materialId={material.id} submitted={query.review === "posted"} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <nav aria-label="パンくずリスト" className={breadcrumbStyle}>
        <Link className={crumbLinkStyle} href="/search">
          資材をさがす
        </Link>{" "}
        › {material.name}
      </nav>
      <MaterialHero
        material={material}
        saved={saved}
        toggleAction={toggleAction}
        saveUnavailable={sessionUser !== null && !isGeneralUser}
        reportCount={
          <Suspense fallback={<HeroCount>−件</HeroCount>}>
            <HeroReportCount materialId={material.id} />
          </Suspense>
        }
        savedCount={
          <Suspense fallback={<HeroCount>−</HeroCount>}>
            <HeroSavedCount materialId={material.id} />
          </Suspense>
        }
      />
      {material.publication_status === "archived" ? <ArchivedNotice /> : null}
      <MaterialPageCompliance makerVerified={material.manufacturer_verified_at !== null} />

      <MaterialDescriptionBox description={publishedPage?.content.description} />
      <MaterialTimingBox timings={publishedPage?.content.timings ?? []} />
      <MaterialSourceLinks
        links={publishedPage ? publishedPage.content.links : materialSourceLinks(material)}
      />
      <MaterialDetailTable material={material} content={publishedPage?.content} />
      <MaterialSpecDisclaimer />

      <PostsCompliance />
      <Suspense
        fallback={
          <>
            <ReportsHeading />
            <SkeletonList variant="materialReports" label="実証詳細レポートを読み込んでいます" />
          </>
        }
      >
        <MaterialReportsSection material={material} signedIn={sessionUser !== null} />
      </Suspense>
      <Suspense
        fallback={
          <>
            <ReviewsHeading />
            <SkeletonRegion label="評価の分布を読み込んでいます">
              <RatingSkeleton />
            </SkeletonRegion>
            <SkeletonList variant="reviews" label="感想口コミを読み込んでいます" />
          </>
        }
      >
        <MaterialReviews material={material} viewerUserId={viewerUserId} />
      </Suspense>
      <Suspense
        fallback={
          <>
            <RelatedHeading />
            <SkeletonList variant="materials" label="関連資材を読み込んでいます" />
          </>
        }
      >
        <RelatedMaterialsSection material={material} />
      </Suspense>

      {material.publication_status === "published" ? (
        <FabBar
          reportHref={`${materialPath}/report/new`}
          reviewHref={`${materialPath}/review/new`}
          placement="viewport"
          look="site"
        />
      ) : null}
    </SitePageShell>
  );
}

// この詳細画面だけの初期表示。投稿フォームや感想口コミ一覧には継承しない。
export default function MaterialPage(props: MaterialPageProps) {
  return (
    <Suspense fallback={<MaterialPageSkeleton />}>
      <MaterialContent {...props} />
    </Suspense>
  );
}
