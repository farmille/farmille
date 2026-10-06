import "../../_mock/forms.css";
import "../../_mock/reports-articles.css";
import "../../_mock/sellers.css";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { MockImagePlaceholderIcon } from "@/app/articles/_components/MockIcons";
import { MockNoImage, MockStars } from "@/app/materials/[id]/_components/MockParts";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { createPageMetadata } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";
import { getPublicSellerPage, type PublicSellerPageData } from "@/server/queries/public-sellers";
import type { Result } from "@/server/result";

import { SellerHeader } from "./_components/SellerHeader";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

/**
 * 見本 S.seller（企業会員のメーカーページ）。公開されるのは企業会員として確認済みのメーカーだけなので、
 * 見本の「確認済みメーカー」の表示を使う。参考になった数と投稿記事は本番の機能として残す。
 */
export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  const data = await loadSellerOrNotFound(id);
  const { seller, materials, articles } = data;
  const materialsHref = sellerMaterialsHref(seller.officialName);
  const showAllMaterials = data.materialCount > 3;

  return (
    <MockPageShell title={seller.officialName} backHref="/" active="search">
      <SellerHeader seller={seller} />

      <div className="stat-row">
        <div className="stat">
          <div className="num tnum">{data.materialCount}</div>
          <div className="lbl">掲載製品</div>
        </div>
        <div className="stat">
          <div className="num tnum">{data.helpfulCount}</div>
          <div className="lbl">参考になった</div>
        </div>
      </div>

      {data.materialCount > 0 ? (
        <section aria-labelledby="seller-materials-heading">
          <div className="sec-h">
            <h2 id="seller-materials-heading">掲載製品</h2>
            {showAllMaterials ? (
              <Link className="link-more" href={materialsHref}>
                すべて見る
              </Link>
            ) : null}
          </div>
          <div className="prod-scroll">
            {materials.map((material) => (
              <Link className="prod-card" href={`/materials/${material.id}`} key={material.id}>
                <div className="img">
                  {material.imageUrl ? (
                    <Image alt="" height={225} sizes="150px" src={material.imageUrl} width={300} />
                  ) : (
                    <MockNoImage />
                  )}
                </div>
                <div className="info">
                  <div className="nm">{material.name}</div>
                  <div className="rt">
                    <MockStars value={material.averageRating ?? 0} />
                    <span className="sr-only">（感想口コミ {material.reviewCount}件）</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {showAllMaterials ? (
            <div style={{ marginTop: 10 }}>
              <Link className="link-more" href={materialsHref}>
                掲載製品 {data.materialCount}件をすべて見る →
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="broadcast-band" style={{ marginTop: 14 }}>
          このアカウントは記事で情報発信を行っています
        </div>
      )}

      <section aria-labelledby="seller-articles-heading">
        <div className="sec-h">
          <h2 id="seller-articles-heading">投稿記事</h2>
        </div>
        {articles.length > 0 ? (
          <div className="report-grid">
            {articles.map((article) => (
              <article className="alist-card" data-kind="other" key={article.id}>
                <Link aria-label={article.title} className="cover" href={`/articles/${article.id}`}>
                  {article.heroImageUrl ? (
                    <Image
                      alt=""
                      height={480}
                      sizes="(min-width: 900px) 420px, 50vw"
                      src={article.heroImageUrl}
                      width={640}
                    />
                  ) : (
                    <MockImagePlaceholderIcon />
                  )}
                </Link>
                <div className="abody">
                  <Link className="t" href={`/articles/${article.id}`}>
                    {article.title}
                  </Link>
                  <div className="by">
                    <span aria-hidden="true" className="org-mini">
                      {seller.officialName.charAt(0)}
                    </span>
                    {seller.officialName}
                    <span className="type-label" style={{ fontSize: 9.5 }}>
                      メーカー
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card pad empty-note">
            <b>公開中の記事はまだありません</b>
            記事が公開されると、ここに表示されます。
          </div>
        )}
      </section>
    </MockPageShell>
  );
}
