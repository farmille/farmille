// Phase 18: `/v1/home` 集約 endpoint からの fetch ヘルパ。
// `/` と `/home` の両 Server Component から呼ばれる。
// spec docs/specs/home.md §5.1
//
// 失敗時は throw（既存 products / articles ページと同パターン）し、
// Next.js の error boundary に委ねる。empty (空配列) は valid な 200 レスポンス
// として扱い、UI 側で 0 件 fallback する（spec §9.1）。

import type { Banner } from "./banner-card";
import type { FeaturedProduct } from "./featured-products-section";
import type { HomeArticle } from "./latest-articles-section";

export type HomeData = {
  banners: Banner[];
  featured: FeaturedProduct[];
  articles: HomeArticle[];
};

type HomeApiResponse = {
  featured_products: FeaturedProduct[];
  latest_articles: HomeArticle[];
  banners: Banner[];
};

export async function fetchHomeContent(): Promise<HomeData> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(`${apiUrl}/v1/home`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch home data: ${res.status}`);
  }
  const json = (await res.json()) as HomeApiResponse;
  return {
    banners: json.banners ?? [],
    featured: json.featured_products ?? [],
    articles: json.latest_articles ?? [],
  };
}
