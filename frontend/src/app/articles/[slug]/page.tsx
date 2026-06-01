import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import {
  ARTICLE_CATEGORY_LABEL,
  type ArticleCategory,
} from "../_components/article-card";
import {
  RelatedProductCard,
  type RelatedProduct,
} from "../_components/related-product-card";


type ArticleAuthor = { id: string; name: string };

type ArticleDetail = {
  id: string;
  slug: string;
  title: string;
  body_md: string;
  category: ArticleCategory;
  hero_image_url: string | null;
  author: ArticleAuthor | null;
  published_at: string;
  related_products: RelatedProduct[];
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }
  const res = await fetch(`${apiUrl}/v1/articles/${slug}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch article: ${res.status}`);
  }
  return (await res.json()) as ArticleDetail;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return {};
  const description = article.body_md
    .replace(/[#*_`>\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return {
    title: article.title,
    description,
    openGraph: {
      title: `${article.title} | Farmille`,
      description,
      url: `/articles/${article.slug}`,
      ...(article.hero_image_url
        ? { images: [article.hero_image_url] }
        : {}),
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const article = await fetchArticle(slug);
  if (!article) {
    notFound();
  }

  const bodyHtml = await renderMarkdownToHtml(article.body_md);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Breadcrumb bar — AgList-style */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-muted-foreground">
          <nav aria-label="パンくず" className="flex items-center gap-1.5">
            <Link
              href="/articles"
              className="hover:text-[var(--green-primary)]"
            >
              記事一覧
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-foreground line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero band — soft green tint, large title, byline + date */}
      <section
        aria-label="ページヘッダー"
        className="border-b border-border"
        style={{ backgroundColor: "var(--green-subtle)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "var(--overlay-on-light-soft)",
                color: "var(--green-dark)",
                borderRadius: "var(--radius-full)",
              }}
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {ARTICLE_CATEGORY_LABEL[article.category]}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(article.published_at)}
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            {article.title}
          </h1>
          {article.author && (
            <p className="text-sm text-muted-foreground">
              著者: {article.author.name}
            </p>
          )}
        </div>
      </section>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-10">
        <article className="space-y-6">
          {article.hero_image_url && (
            <div
              className="relative aspect-[16/9] border border-border bg-[var(--green-subtle)] overflow-hidden"
              style={{
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Image
                src={article.hero_image_url}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/*
           * 本文は Server Component 内で remark/rehype サニタイズ済 HTML 文字列
           * を生成して挿入する。<script> 等は defaultSchema で除去済。
           */}
          <div
            className="prose-article space-y-4 text-foreground"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </article>

        {article.related_products.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                関連製品
              </h2>
              <span className="text-sm text-muted-foreground">
                {article.related_products.length} 件
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {article.related_products.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
