import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 絞り込み条件の組み合わせごとに URL が増えるため、条件付きの検索結果は巡回させない。
      disallow: ["/admin", "/dashboard", "/me", "/api", "/search?"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
