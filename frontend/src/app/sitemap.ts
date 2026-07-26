import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";
import { listSitemapEntries, type SitemapEntry } from "@/server/queries/sitemap";

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
    ...dynamicUrls(materials, (id) => `/materials/${id}`),
    ...dynamicUrls(materials, (id) => `/materials/${id}/reviews`),
    ...dynamicUrls(materials, (id) => `/materials/${id}/articles`),
    ...dynamicUrls(articles, (id) => `/articles/${id}`),
    ...dynamicUrls(reports, (id) => `/reports/${id}`),
    ...dynamicUrls(sellers, (id) => `/sellers/${id}`),
    ...dynamicUrls(users, (id) => `/users/${id}`),
  ];
}
