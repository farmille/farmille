import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Suspense } from "react";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { FabBar } from "@/components/FabBar";
import { SkeletonList } from "@/components/SkeletonList";
import { RatingSkeleton, SkeletonRegion } from "@/components/Skeleton";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { materialSourceLinks } from "@/lib/material-links";
import { createProductJsonLd, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { getPublishedMaterialPage } from "@/server/material-page-editor";
import { isMaterialSaved } from "@/server/queries/saved-materials";
import { recordViewEvent } from "@/server/queries/view-events";
import { createServerSupabase } from "@/server/supabase";

import { MaterialDetailTable } from "./_components/DetailTable";
import {
  ArchivedNotice,
  MaterialPageCompliance,
  MaterialSpecDisclaimer,
  PostsCompliance,
} from "./_components/MaterialCompliance";
import { HeroSavedCount } from "./_components/HeroSavedCount";
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
import { ReviewAnalytics } from "./_components/ReviewAnalytics";
import { toggleSavedMaterialAction } from "./actions";
import {
  isMaterialId,
  loadMaterialOrNotFound,
  materialDescription,
  materialMetadata,
} from "./material-page-data";
import { unwrapQueryResult } from "./query-result";

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

  // 見本 S.material の `.body` の中身。スタイルは src/app/_mock/mock.css（.fm 配下に閉じている）。
  return (
    <MockPageShell
      title={material.name}
      backHref="/"
      hasFab={material.publication_status === "published"}
    >
      <div className="fm">
        <ReviewAnalytics materialId={material.id} submitted={query.review === "posted"} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
        />
        <nav
          aria-label="パンくずリスト"
          className="muted"
          style={{ fontSize: 11, marginBottom: 10 }}
        >
          <Link className="crumb" href="/search">
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
            <Suspense fallback={<b className="tnum">−件</b>}>
              <HeroReportCount materialId={material.id} />
            </Suspense>
          }
          savedCount={
            <Suspense fallback={<b className="tnum">−</b>}>
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
          <MaterialReviewsSection material={material} viewerUserId={viewerUserId} />
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
            look="mock"
          />
        ) : null}
      </div>
    </MockPageShell>
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
