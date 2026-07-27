import type { Metadata } from "next";
import Link from "next/link";

import { buttonRecipe, EmptyState, ReportCard, SectionHeading } from "@/components";
import { FabBar } from "@/components/fab-bar";
import { createProductJsonLd, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import {
  getReviewRatingDistribution,
  listPublishedArticlesByMaterial,
  listPublishedUsageReportsByMaterial,
} from "@/server/queries/material-content";
import { isMaterialSaved } from "@/server/queries/saved-materials";
import { listReviewsByMaterial } from "@/server/queries/reviews";
import { css, cx } from "../../../../styled-system/css";

import { EvidenceList } from "./_components/evidence-list";
import { MaterialDetailTable } from "./_components/detail-table";
import { MaterialHero } from "./_components/material-hero";
import { MaterialPageShell } from "./_components/page-shell";
import { RatingSummary } from "./_components/rating-summary";
import { ReviewList } from "./_components/review-list";
import { toggleSavedMaterialAction } from "./actions";
import {
  loadMaterialOrNotFound,
  materialDescription,
  materialMetadata,
} from "./material-page-data";
import { unwrapQueryResult } from "./query-result";

type MaterialPageProps = {
  params: Promise<{ id: string }>;
};

const externalLinks = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  px: "1",
  mt: "3",
});

const externalLink = css({
  color: "brand.primary",
  fontSize: "sm",
  fontWeight: "700",
  textDecoration: "none",
});

const disclaimer = css({
  mt: "3",
  p: "3",
  borderRadius: "button",
  bg: "surface.page",
  color: "text.subtle",
  fontSize: "xs",
  lineHeight: "1.65",
});

function checkedExternalUrl(value: string, label: string): string {
  const url = new URL(value);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${label}のURL形式が不正です。`);
  }

  return value;
}

export async function generateMetadata({ params }: MaterialPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);

  return materialMetadata(material);
}

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);
  const [reportsResult, articlesResult, reviewsResult, distributionResult, sessionUser] =
    await Promise.all([
      listPublishedUsageReportsByMaterial(id, { limit: 3 }),
      listPublishedArticlesByMaterial(id),
      listReviewsByMaterial(id, { sort: "newest", page: 1 }),
      getReviewRatingDistribution(id),
      getSessionUser(),
    ]);
  const reports = unwrapQueryResult(reportsResult);
  const articles = unwrapQueryResult(articlesResult);
  const reviews = unwrapQueryResult(reviewsResult);
  const distribution = unwrapQueryResult(distributionResult);
  const materialPath = `/materials/${material.id}`;
  const isGeneralUser = sessionUser?.accountType === "general";
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
    <MaterialPageShell title={material.name} backHref="/" hasFab>
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

      {material.official_url || material.catalog_url ? (
        <div className={externalLinks}>
          {material.official_url ? (
            <a
              href={checkedExternalUrl(material.official_url, "製造元公式ページ")}
              target="_blank"
              rel="noreferrer"
              className={externalLink}
            >
              製造元公式ページを見る →
            </a>
          ) : null}
          {material.catalog_url ? (
            <a
              href={checkedExternalUrl(material.catalog_url, "公式カタログ")}
              target="_blank"
              rel="noreferrer"
              className={externalLink}
            >
              公式カタログPDFを見る →
            </a>
          ) : null}
        </div>
      ) : null}

      <p className={disclaimer}>
        掲載情報は、製造元公式サイト等の公開情報をもとに Farmille
        が独自に整理・分類したものです。最新・正式な使用方法は必ず製造元公式情報をご確認ください。
      </p>

      <MaterialDetailTable material={material} />
      <EvidenceList evidences={material.evidences} />

      <section aria-labelledby="usage-reports-heading">
        <SectionHeading
          title={
            <span id="usage-reports-heading">
              使用レポート
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
              display: "flex",
              gap: "2.5",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              pb: "1",
            })}
          >
            {reports.items.map((report) => (
              <ReportCard
                key={report.id}
                title={report.title ?? `${material.name} 使用レポート`}
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
            title="公開中の使用レポートはまだありません"
            description="投稿された使用レポートは、編集部の確認後に公開されます。"
          />
        )}
        {articles.total > 0 ? (
          <Link
            href={`${materialPath}/articles`}
            className={cx(buttonRecipe({ variant: "ghost", size: "md" }), css({ mt: "3" }))}
          >
            その他の記事（メーカー・JA等） {articles.total}件
          </Link>
        ) : null}
      </section>

      <section aria-labelledby="review-summary-heading">
        <SectionHeading title={<span id="review-summary-heading">レビューサマリー</span>} />
        <RatingSummary
          average={material.avg_rating}
          reviewCount={material.review_count}
          controlPlotRatio={material.control_plot_ratio}
          distribution={distribution}
        />
      </section>

      <section aria-labelledby="reviews-heading">
        <SectionHeading
          title={
            <span id="reviews-heading">
              レビュー
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
          linkLabel={`レビューをすべて見る（${reviews.total}件）`}
        />
        <ReviewList reviews={reviews.items.slice(0, 3)} />
      </section>

      <FabBar
        reportHref={`${materialPath}/report/new`}
        reviewHref={`${materialPath}/review/new`}
        placement="viewport"
      />
    </MaterialPageShell>
  );
}
