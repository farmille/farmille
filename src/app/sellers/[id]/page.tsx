import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { createPageMetadata } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";
import { getPublicSellerPage, type PublicSellerPageData } from "@/server/queries/public-sellers";
import type { Result } from "@/server/result";

import { SellerPageContent } from "./_components/SellerPageContent";

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

/** 企業会員のメーカーページ。公開されるのは企業会員として確認済みのメーカーだけ。 */
export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  const data = await loadSellerOrNotFound(id);

  return (
    <MockPageShell title={data.seller.officialName} backHref="/" active="search">
      <SellerPageContent data={data} />
    </MockPageShell>
  );
}
