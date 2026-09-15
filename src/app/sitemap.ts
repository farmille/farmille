import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";
import { listSitemapEntries, type SitemapEntry } from "@/server/queries/sitemap";

// sitemap.xml は既定でキャッシュされ、ビルド時に一度だけ静的生成される
// （Next.js のキャッシュ規約）。資材・記事・感想口コミは常時追加されるため、
// ビルド時点の DB スナップショットで固定させず、リクエスト毎に最新化する。
// 副次効果として、ビルド時に Supabase への疎通が不要になる（CI で env 未設定でも失敗しない）。
export const dynamic = "force-dynamic";

function dynamicUrls(
  entries: readonly SitemapEntry[],
  pathFor: (id: string) => string,
): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: absoluteUrl(pathFor(entry.id)),
    lastModified: entry.updatedAt,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await listSitemapEntries();

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const { materials, articles, reports, sellers, users } = result.data;

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/search"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/articles"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/sellers"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...dynamicUrls(materials, (id) => `/materials/${id}`),
    ...dynamicUrls(materials, (id) => `/materials/${id}/reviews`),
    ...dynamicUrls(materials, (id) => `/materials/${id}/articles`),
    ...dynamicUrls(articles, (id) => `/articles/${id}`),
    ...dynamicUrls(reports, (id) => `/reports/${id}`),
    ...dynamicUrls(sellers, (id) => `/sellers/${id}`),
    ...dynamicUrls(users, (id) => `/users/${id}`),
  ];
}
