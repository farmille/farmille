import { materialSourceLinks } from "@/lib/material-links";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { MaterialLinks } from "@/components/materials/MaterialLinks";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { getPublishedMaterialPage } from "@/server/material-page-editor";
import { Suspense } from "react";
import { SkeletonRegion, RatingSkeleton } from "@/components/Skeleton";
import { SkeletonList } from "@/components/SkeletonList";
import { MaterialPageSkeleton } from "./_components/MaterialPageSkeleton";
import { listMaterials, type MaterialDetail } from "@/server/queries/materials";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";

import { buttonRecipe, EmptyState, MaterialCard, ReportCard, SectionHeading } from "@/components";
import { FabBar } from "@/components/FabBar";
import { createProductJsonLd, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import {
  getReviewRatingDistribution,
  listPublishedArticlesByMaterial,
  listPublishedUsageReportsByMaterial,
} from "@/server/queries/material-content";
import { isMaterialSaved } from "@/server/queries/saved-materials";
import { listReviewsByMaterial } from "@/server/queries/reviews";
import { recordViewEvent } from "@/server/queries/view-events";
import { createServerSupabase } from "@/server/supabase";
import { css, cx } from "../../../../styled-system/css";

import { MaterialDetailTable } from "./_components/DetailTable";
import { MaterialHero } from "./_components/MaterialHero";
import { MaterialPageShell } from "./_components/PageShell";
import { RatingSummary } from "./_components/RatingSummary";
import { ReviewAnalytics } from "./_components/ReviewAnalytics";
import { ReviewList } from "./_components/ReviewList";
import { toggleSavedMaterialAction } from "./actions";
import {
  loadMaterialOrNotFound,
  materialDescription,
  materialMetadata,
} from "./material-page-data";
import { unwrapQueryResult } from "./query-result";

type MaterialPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string | string[] }>;
};

const disclaimer = css({
  m: "0",
  p: "3",
  borderRadius: "button",
  bg: "surface.page",
  color: "text.subtle",
  fontSize: "xs",
  lineHeight: "1.65",
});

const archivedNotice = css({
  m: "0",
  p: "3",
  borderRadius: "button",
  bg: "surface.subtle",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "1.6",
});

export async function generateMetadata({ params }: MaterialPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);

  return materialMetadata(material);
}

async function MaterialContent({ params, searchParams }: MaterialPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const material = await loadMaterialOrNotFound(id);
  const sessionUser = await getSessionUser();
  const publishedPage = await getPublishedMaterialPage(id);
  const isGeneralUser = sessionUser !== null && canUseGeneralFeatures(sessionUser.accountType);
  const viewerUserId = isGeneralUser ? sessionUser.userId : null;
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
  const saved = isGeneralUser
    ? unwrapQueryResult(await isMaterialSaved(material.id, sessionUser.userId))
    : null;
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
    <MaterialPageShell
      title={material.name}
      backHref="/"
      hasFab={material.publication_status === "published"}
    >
      <ReviewAnalytics materialId={material.id} submitted={query.review === "posted"} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <MaterialHero
        material={material}
        saved={saved}
        toggleAction={toggleAction}
        saveUnavailable={sessionUser !== null && !isGeneralUser}
      />

      {material.publication_status === "archived" ? (
        <p className={archivedNotice}>
          この資材は掲載を終了しています。過去の情報と投稿は参照できますが、新しい感想口コミや実証詳細レポートは投稿できません。
        </p>
      ) : null}

      <section aria-labelledby="material-description-heading">
        <h2
          id="material-description-heading"
          className={css({ fontSize: "lg", fontWeight: "700", mb: "3" })}
        >
          製品説明
        </h2>
        <p className={css({ whiteSpace: "pre-wrap", overflowWrap: "anywhere" })}>
          {publishedPage?.content.description || "−"}
        </p>
      </section>
      <section aria-labelledby="material-timing-heading">
        <h2
          id="material-timing-heading"
          className={css({ fontSize: "lg", fontWeight: "700", mb: "3" })}
        >
          施用タイミング
        </h2>
        <p>
          {publishedPage?.content.timings
            .map((timing) => APPLICATION_TIMINGS[timing])
            .join(" ／ ") || "−"}
        </p>
      </section>
      <MaterialLinks
        links={publishedPage ? publishedPage.content.links : materialSourceLinks(material)}
      />
      <MaterialDetailTable material={material} content={publishedPage?.content} />

      <section aria-label="掲載情報と投稿についての注意事項" className={disclaimer}>
        <p>
          商品の使用にあたっては、当該製品についてメーカー公式サイトなどの公式情報を必ずご確認のうえ、製品の表示や使用条件に従ってご使用ください。
        </p>
        <p className={css({ mt: "3" })}>
          また、農薬、肥料、土壌改良資材等として法令上の登録・届出・表示その他の規制がある資材については、当該法令およびそれに基づく製品表示・使用条件等をご確認のうえ、それらに従ってご使用ください。ご利用の前に
          <Link
            href="/legal"
            className={css({ color: "primary.700", textDecoration: "underline" })}
          >
            規約・ガイドライン
          </Link>
          をご確認ください。
        </p>
      </section>

      <Suspense
        fallback={
          <>
            <SectionHeading title="実証詳細レポート" />
            <SkeletonList variant="materialReports" label="実証詳細レポートを読み込んでいます" />
          </>
        }
      >
        <MaterialReports material={material} />
      </Suspense>
      <Suspense
        fallback={
          <>
            <SectionHeading title="感想口コミ" />
            <SkeletonRegion label="評価の分布を読み込んでいます">
              <RatingSkeleton />
            </SkeletonRegion>
            <SkeletonList variant="reviews" label="感想口コミを読み込んでいます" />
          </>
        }
      >
        <MaterialReviews material={material} viewerUserId={viewerUserId} />
      </Suspense>

      <Suspense fallback={<SkeletonList variant="materials" label="関連資材を読み込んでいます" />}>
        <RelatedMaterials material={material} />
      </Suspense>

      {material.publication_status === "published" ? (
        <FabBar
          reportHref={`${materialPath}/report/new`}
          reviewHref={`${materialPath}/review/new`}
          placement="viewport"
        />
      ) : null}
    </MaterialPageShell>
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

async function MaterialReports({ material }: { material: MaterialDetail }) {
  const [reportsResult, articlesResult] = await Promise.all([
    listPublishedUsageReportsByMaterial(material.id, { limit: 3 }),
    listPublishedArticlesByMaterial(material.id),
  ]);
  const reports = unwrapQueryResult(reportsResult);
  const articles = unwrapQueryResult(articlesResult);
  const materialPath = `/materials/${material.id}`;
  return (
    <section aria-labelledby="usage-reports-heading">
      <SectionHeading
        title={
          <span id="usage-reports-heading">
            実証詳細レポート
            <span
              className={css({
                ml: "2",
                fontSize: "sm",
                color: "text.subtle",
                fontVariantNumeric: "tabular-nums",
              })}
            >
              {reports.total}件
            </span>
          </span>
        }
        href={`${materialPath}/articles`}
      />
      {reports.items.length > 0 ? (
        <div
          className={css({
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "54%",
            gap: "2.5",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            pb: "1",
            tab: {
              gridAutoFlow: "row",
              gridAutoColumns: "auto",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              overflowX: "visible",
              scrollSnapType: "none",
              pb: "0",
            },
          })}
        >
          {reports.items.map((report) => (
            <ReportCard
              actions={
                <PostActionsLoader
                  target="usage_report"
                  id={report.id}
                  currentPath={`/reports/${report.id}`}
                  helpfulCount={report.helpfulCount}
                />
              }
              reportId={report.id}
              key={report.id}
              title={report.title ?? `${material.name} 実証詳細レポート`}
              author={report.author?.handle ?? "退会したユーザー"}
              crop={report.crop?.name ?? "作目情報なし"}
              helpfulCount={report.helpfulCount}
              viewCount={report.viewCount}
              href={`/reports/${report.id}`}
              coverSrc={report.coverImage?.url}
              layout="scroll"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="公開中の実証詳細レポートはまだありません"
          description="投稿された実証詳細レポートは、編集部の確認後に公開されます。"
        />
      )}
      {articles.total > 0 ? (
        <Link
          href={`${materialPath}/articles`}
          className={cx(buttonRecipe({ variant: "ghost", size: "md" }), css({ mt: "3" }))}
        >
          メーカーの記事 {articles.total}件
        </Link>
      ) : null}
    </section>
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
  const materialPath = `/materials/${material.id}`;
  return (
    <section aria-labelledby="reviews-heading">
      <SectionHeading
        title={
          <span id="reviews-heading">
            感想口コミ
            <span
              className={css({
                ml: "2",
                fontSize: "sm",
                color: "text.subtle",
                fontVariantNumeric: "tabular-nums",
              })}
            >
              {reviews.total}件
            </span>
          </span>
        }
        href={`${materialPath}/reviews`}
        linkLabel={`感想口コミをすべて見る（${reviews.total}件）`}
      />
      <Suspense
        fallback={
          <SkeletonRegion label="評価の分布を読み込んでいます">
            <RatingSkeleton />
          </SkeletonRegion>
        }
      >
        <MaterialRating material={material} />
      </Suspense>
      <ReviewList reviews={reviews.items.slice(0, 3)} currentPath={materialPath} />
    </section>
  );
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

// 同じ資材ジャンルに分類された公開資材を紹介する。
async function RelatedMaterials({ material }: { material: MaterialDetail }) {
  const related =
    material.ingredientCategories.length === 0
      ? []
      : unwrapQueryResult(
          await listMaterials({
            page: 1,
            filters: material.ingredientCategories.map(({ id }) => ({ category: "genre", id })),
          }),
        )
          .items.filter(({ id }) => id !== material.id)
          .slice(0, 3);
  return (
    <section aria-label="関連資材">
      <SectionHeading title="関連資材" />
      {related.length ? (
        <div className={css({ display: "grid", gap: "3" })}>
          {related.map((item) => (
            <MaterialCard
              key={item.id}
              variant="list"
              name={item.name}
              maker={item.manufacturer_name}
              rating={item.avg_rating ?? 0}
              reviewCount={item.review_count}
              official={item.manufacturer_verified_at !== null}
              imageSrc={item.primaryImage?.url}
              href={`/materials/${item.id}`}
            />
          ))}
        </div>
      ) : (
        <p>同じ資材ジャンルの関連資材はありません。</p>
      )}
    </section>
  );
}
