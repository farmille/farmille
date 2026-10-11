import Link from "next/link";
import type { ReactNode } from "react";

import { ArticleGrid, FeedCard } from "@/app/articles/_components/FeedCard";
import { NoImage, Stars } from "@/app/materials/[id]/_components/CardParts";
import { Badge } from "@/components/Badge";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { StatCard } from "@/components/StatCard";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import type { PublicSellerPageData } from "@/server/queries/public-sellers";

import { css, cx } from "../../../../../styled-system/css";
import { SellerHeader } from "./SellerHeader";

function sellerMaterialsHref(officialName: string): string {
  return `/search?filters=maker:${encodeURIComponent(officialName)}`;
}

const moreLinkStyle = css({
  fontSize: "sm",
  color: "primary.700",
  textDecoration: "none",
  whiteSpace: "nowrap",
});

function SectionHead({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2.5",
        mt: "6",
        mb: "3",
        pc: { mt: "14", mb: "5" },
      })}
    >
      <h2 id={id} className={css({ textStyle: "title" })}>
        {title}
      </h2>
      {children}
    </div>
  );
}

const productCardStyle = css({
  flex: "0 0 auto",
  w: "card.materialMobile",
  overflow: "hidden",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  color: "inherit",
  textDecoration: "none",
});

export function SellerPageContent({ data }: { data: PublicSellerPageData }) {
  const { seller, materials, articles } = data;
  const materialsHref = sellerMaterialsHref(seller.officialName);
  const showAllMaterials = data.materialCount > 3;

  return (
    <>
      <SellerHeader seller={seller} />

      <div
        className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5", mt: "3.5" })}
      >
        <StatCard value={data.materialCount} label="掲載製品" />
        <StatCard value={data.helpfulCount} label="参考になった" />
      </div>

      {data.materialCount > 0 ? (
        <section aria-labelledby="seller-materials-heading">
          <SectionHead id="seller-materials-heading" title="掲載製品">
            {showAllMaterials ? (
              <Link className={moreLinkStyle} href={materialsHref}>
                すべて見る
              </Link>
            ) : null}
          </SectionHead>
          <div
            className={css({
              position: "relative",
              display: "flex",
              gap: "3",
              overflowX: "auto",
              px: "0.5",
              pt: "0.5",
              pb: "1.5",
              scrollbarWidth: "none",
            })}
          >
            {materials.map((material) => (
              <Link
                className={productCardStyle}
                href={`/materials/${material.id}`}
                key={material.id}
              >
                <div
                  className={css({
                    display: "grid",
                    placeItems: "center",
                    aspectRatio: "image.landscape",
                    bg: "primary.soft",
                    "& img": { w: "full", h: "full", objectFit: "contain", bg: "surface.card" },
                  })}
                >
                  {material.imageUrl ? (
                    <Image alt="" height={225} sizes="150px" src={material.imageUrl} width={300} />
                  ) : (
                    <NoImage />
                  )}
                </div>
                <div className={css({ px: "3", py: "2.5" })}>
                  <div className={css({ textStyle: "body", fontWeight: "bold" })}>
                    {material.name}
                  </div>
                  <div className={css({ mt: "1", fontSize: "xs", color: "accent.star" })}>
                    <Stars value={material.averageRating ?? 0} />
                    <span className={css({ srOnly: true })}>
                      （感想口コミ {material.reviewCount}件）
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {showAllMaterials ? (
            <div className={css({ mt: "2.5" })}>
              <Link className={moreLinkStyle} href={materialsHref}>
                掲載製品 {data.materialCount}件をすべて見る →
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <div
          className={css({
            mt: "3.5",
            bg: "primary.100",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "primary.700/25",
            borderRadius: "media",
            px: "3.5",
            py: "3",
            color: "primary.800",
            fontSize: "sm",
            fontWeight: "semibold",
          })}
        >
          このアカウントは記事で情報発信を行っています
        </div>
      )}

      <section aria-labelledby="seller-articles-heading">
        <SectionHead id="seller-articles-heading" title="投稿記事" />
        {articles.length > 0 ? (
          <ArticleGrid>
            {articles.map((article) => (
              <FeedCard
                coverSrc={article.heroImageUrl}
                href={`/articles/${article.id}`}
                key={article.id}
                title={article.title}
              >
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1.5",
                    mt: "1.5",
                    textStyle: "note",
                    color: "text.muted",
                  })}
                >
                  <span
                    aria-hidden="true"
                    className={css({
                      display: "grid",
                      placeItems: "center",
                      flexShrink: "0",
                      w: "4.5",
                      h: "4.5",
                      borderRadius: "mark",
                      bg: "primary.100",
                      color: "primary.800",
                      fontSize: "2xs",
                      fontWeight: "extrabold",
                    })}
                  >
                    {seller.officialName.charAt(0)}
                  </span>
                  {seller.officialName}
                  <Badge variant="type">メーカー</Badge>
                </div>
              </FeedCard>
            ))}
          </ArticleGrid>
        ) : (
          <div
            className={cx(
              surfaceCardRecipe(),
              css({ textAlign: "center", color: "text.subtle", textStyle: "supporting" }),
            )}
          >
            <b
              className={css({ display: "block", mb: "1", color: "text.muted", textStyle: "body" })}
            >
              公開中の記事はまだありません
            </b>
            記事が公開されると、ここに表示されます。
          </div>
        )}
      </section>
    </>
  );
}
