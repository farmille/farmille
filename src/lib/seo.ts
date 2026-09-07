import type { Metadata } from "next";

import { clientEnv } from "@/env";

export const SITE_NAME = "Farmille";
export const DEFAULT_DESCRIPTION =
  "農業資材の製品情報、農家のレビュー、使用レポートを共有するプラットフォームです。";

const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  imageUrls?: readonly string[];
  publishedTime?: string;
};

type ProductJsonLdInput = {
  id: string;
  name: string;
  manufacturerName: string;
  description: string;
  imageUrls: readonly string[];
  averageRating: number | null;
  reviewCount: number;
};

type ReviewJsonLdInput = {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  authorName: string;
};

type ReviewListJsonLdInput = {
  materialId: string;
  materialName: string;
  reviews: readonly ReviewJsonLdInput[];
};

type ArticleJsonLdInput = {
  id: string;
  route: "articles" | "reports";
  headline: string;
  description: string;
  datePublished: string;
  author: {
    type: "Organization" | "Person";
    name: string;
    path: string;
  };
  imageUrls: readonly string[];
  articleSection: string;
  about?: {
    id: string;
    name: string;
  };
};

type AggregateRatingJsonLd = {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  bestRating: 5;
  worstRating: 1;
};

export type ProductJsonLd = {
  "@context": "https://schema.org";
  "@type": "Product";
  "@id": string;
  url: string;
  name: string;
  description: string;
  brand: { "@type": "Organization"; name: string };
  image?: string[];
  aggregateRating?: AggregateRatingJsonLd;
};

export type ReviewListJsonLd = {
  "@context": "https://schema.org";
  "@type": "ItemList";
  numberOfItems: number;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    item: {
      "@type": "Review";
      "@id": string;
      name: string;
      reviewBody: string;
      datePublished: string;
      author: { "@type": "Person"; name: string };
      itemReviewed: { "@type": "Product"; "@id": string; name: string };
      reviewRating: {
        "@type": "Rating";
        ratingValue: number;
        bestRating: 5;
        worstRating: 1;
      };
    };
  }>;
};

export type ArticleJsonLd = {
  "@context": "https://schema.org";
  "@type": "Article";
  "@id": string;
  mainEntityOfPage: string;
  headline: string;
  description: string;
  datePublished: string;
  articleSection: string;
  author: { "@type": "Organization" | "Person"; name: string; url: string };
  publisher: { "@type": "Organization"; name: string; url: string };
  image?: string[];
  about?: { "@type": "Product"; "@id": string; name: string };
};

export type JsonLdDocument = ProductJsonLd | ReviewListJsonLd | ArticleJsonLd;

export const NO_INDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export function siteUrl(): URL {
  return new URL(clientEnv.siteUrl);
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

function titleWithSiteName(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

function metadataImages(imageUrls: readonly string[] | undefined) {
  const urls =
    imageUrls === undefined || imageUrls.length === 0 ? [DEFAULT_OG_IMAGE_PATH] : imageUrls;
  return urls.map((url) => ({ url: absoluteUrl(url) }));
}

export function createRootMetadata(): Metadata {
  const imageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  return {
    metadataBase: siteUrl(),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: {
      canonical: absoluteUrl("/"),
    },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: absoluteUrl("/"),
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [{ url: imageUrl, alt: SITE_NAME }],
    },
  };
}

export function createPageMetadata({
  title,
  description,
  path,
  type = "website",
  imageUrls,
  publishedTime,
}: PageMetadataOptions): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const fullTitle = titleWithSiteName(title);
  const images = metadataImages(imageUrls);
  const commonOpenGraph = {
    locale: "ja_JP",
    url: canonicalUrl,
    siteName: SITE_NAME,
    title: fullTitle,
    description,
    images,
  };
  const openGraph =
    type === "article"
      ? {
          ...commonOpenGraph,
          type,
          publishedTime,
        }
      : {
          ...commonOpenGraph,
          type,
        };

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images,
    },
  };
}

export function createProductJsonLd({
  id,
  name,
  manufacturerName,
  description,
  imageUrls,
  averageRating,
  reviewCount,
}: ProductJsonLdInput): ProductJsonLd {
  const productUrl = absoluteUrl(`/materials/${id}`);
  const aggregateRating: AggregateRatingJsonLd | undefined =
    reviewCount > 0 && averageRating !== null
      ? {
          "@type": "AggregateRating",
          ratingValue: averageRating,
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  const document: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    url: productUrl,
    name,
    description,
    brand: {
      "@type": "Organization",
      name: manufacturerName,
    },
  };
  if (imageUrls.length > 0) {
    document.image = imageUrls.map((url) => absoluteUrl(url));
  }
  if (aggregateRating !== undefined) {
    document.aggregateRating = aggregateRating;
  }
  return document;
}

export function createReviewListJsonLd({
  materialId,
  materialName,
  reviews,
}: ReviewListJsonLdInput): ReviewListJsonLd {
  const productUrl = absoluteUrl(`/materials/${materialId}`);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: reviews.length,
    itemListElement: reviews.map((review, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Review",
        "@id": `${absoluteUrl(`/materials/${materialId}/reviews`)}#review-${review.id}`,
        name: `${materialName}のレビュー`,
        reviewBody: review.body,
        datePublished: review.createdAt,
        author: {
          "@type": "Person",
          name: review.authorName,
        },
        itemReviewed: {
          "@type": "Product",
          "@id": `${productUrl}#product`,
          name: materialName,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
      },
    })),
  };
}

export function createArticleJsonLd({
  id,
  route,
  headline,
  description,
  datePublished,
  author,
  imageUrls,
  articleSection,
  about,
}: ArticleJsonLdInput): ArticleJsonLd {
  const articleUrl = absoluteUrl(`/${route}/${id}`);

  const document: ArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${articleUrl}#article`,
    mainEntityOfPage: articleUrl,
    headline,
    description,
    datePublished,
    articleSection,
    author: {
      "@type": author.type,
      name: author.name,
      url: absoluteUrl(author.path),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
  };
  if (imageUrls.length > 0) {
    document.image = imageUrls.map((url) => absoluteUrl(url));
  }
  if (about !== undefined) {
    document.about = {
      "@type": "Product",
      "@id": `${absoluteUrl(`/materials/${about.id}`)}#product`,
      name: about.name,
    };
  }
  return document;
}

// JSON-LD 内の文字列が script 要素を閉じないよう、HTML が解釈する文字を Unicode 化する。
export function serializeJsonLd(value: JsonLdDocument): string {
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
