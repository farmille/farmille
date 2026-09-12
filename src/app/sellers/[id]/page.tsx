import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  AppBar,
  ArtMini,
  EmptyState,
  MaterialCard,
  MaterialCardRail,
  SectionHeading,
  StatCard,
} from "@/components";
import { Icon } from "@/components/Icon";
import { createPageMetadata } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";
import { getPublicSellerPage, type PublicSellerPageData } from "@/server/queries/public-sellers";
import type { Result } from "@/server/result";
import { css } from "../../../../styled-system/css";

import { SellerHeader } from "./_components/SellerHeader";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const shell = css({
  minH: "100dvh",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  py: "4",
  pb: "10",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

const statRow = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  mt: "3.5",
});

const broadcastBand = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  mt: "3.5",
  px: "3.5",
  py: "3",
  bg: "brand.soft",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "green/25",
  borderRadius: "button",
  color: "brand.primaryDeep",
  fontSize: "sm",
  fontWeight: "600",
  lineHeight: "1.55",
});

const articleStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  tab: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
});

const getCachedSellerPage = cache(async (id: string): Promise<Result<PublicSellerPageData>> => {
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, error: "not_found" };
  }

  return getPublicSellerPage(id);
});

async function loadSellerOrNotFound(id: string): Promise<PublicSellerPageData> {
  const result = await getCachedSellerPage(id);

  if (!result.ok) {
    if (result.error === "not_found") {
      notFound();
    }

    throw new Error(errorMessageJa[result.error]);
  }

  return result.data;
}

function sellerMaterialsHref(officialName: string): string {
  return `/search?filters=maker:${encodeURIComponent(officialName)}`;
}

type SellerPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  const { seller } = await loadSellerOrNotFound(id);
  const description =
    seller.profileText ?? `${seller.officialName}の掲載資材と投稿記事を確認できます。`;

  return createPageMetadata({
    title: seller.officialName,
    description,
    path: `/sellers/${seller.id}`,
    imageUrls: seller.logoUrl === null ? undefined : [seller.logoUrl],
  });
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  const data = await loadSellerOrNotFound(id);
  const { seller, materials, articles } = data;
  const materialsHref = sellerMaterialsHref(seller.officialName);
  const showAllMaterials = data.materialCount > 3;

  return (
    <div className={shell}>
      <AppBar chrome="public" active="search" title={seller.officialName} backHref="/" />
      <main className={body}>
        <SellerHeader seller={seller} />

        <div className={statRow}>
          <StatCard value={`${data.materialCount}件`} label="掲載資材" />
          <StatCard value={data.helpfulCount} label="参考になった" />
        </div>

        {data.materialCount > 0 ? (
          <section aria-labelledby="seller-materials-heading">
            <SectionHeading
              title={<span id="seller-materials-heading">掲載資材</span>}
              href={showAllMaterials ? materialsHref : undefined}
              linkLabel="すべて見る →"
            />
            <MaterialCardRail>
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  variant="scroll"
                  name={material.name}
                  maker={material.manufacturerName}
                  rating={material.averageRating ?? 0}
                  reviewCount={material.reviewCount}
                  official={material.manufacturerVerified}
                  imageSrc={material.imageUrl ?? undefined}
                  href={`/materials/${material.id}`}
                />
              ))}
            </MaterialCardRail>
            {showAllMaterials ? (
              <Link
                href={materialsHref}
                className={css({
                  display: "inline-flex",
                  mt: "2.5",
                  color: "brand.primary",
                  fontSize: "sm",
                  fontWeight: "700",
                  textDecoration: "none",
                })}
              >
                掲載資材 {data.materialCount}件をすべて見る <Icon name="arrow_forward" size="sm" />
              </Link>
            ) : null}
          </section>
        ) : (
          <div className={broadcastBand}>
            <Icon name="article" size="md" />
            <span>このアカウントは記事で情報発信を行っています</span>
          </div>
        )}

        <section aria-labelledby="seller-articles-heading">
          <SectionHeading title={<span id="seller-articles-heading">投稿記事</span>} />
          {articles.length > 0 ? (
            <div className={articleStack}>
              {articles.map((article) => (
                <ArtMini
                  key={article.id}
                  title={article.title}
                  organization={seller.officialName}
                  typeLabel="メーカー"
                  thumbSrc={article.heroImageUrl ?? undefined}
                  href={`/articles/${article.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="公開中の記事はまだありません"
              description="記事が公開されると、ここに表示されます。"
            />
          )}
        </section>
      </main>
    </div>
  );
}
