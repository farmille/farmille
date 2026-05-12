import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
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
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/articles" className="hover:text-primary">
            記事一覧
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground line-clamp-1">{article.title}</span>
        </nav>

        <article className="space-y-6">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-block rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {ARTICLE_CATEGORY_LABEL[article.category]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(article.published_at)}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {article.title}
            </h1>
            {article.author && (
              <p className="text-sm text-muted-foreground">
                著者: {article.author.name}
              </p>
            )}
            {article.hero_image_url && (
              <div className="relative aspect-[16/9] rounded-md border border-border bg-muted overflow-hidden">
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
          </header>

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
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              関連製品
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {article.related_products.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hover:text-primary">
              ログイン
            </Link>
            <Link href="/signup" className="hover:text-primary">
              新規登録
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
