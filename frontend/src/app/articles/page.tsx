import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import {
  ArticleCard,
  type ArticleCategory,
  type ArticleListItem,
} from "./_components/article-card";
import { CategoryTabs } from "./_components/category-tabs";

const VALID_CATEGORIES: ReadonlySet<ArticleCategory> = new Set([
  "monthly_report",
  "weekly_report",
  "featured",
  "column",
]);

export const metadata: Metadata = {
  title: "記事一覧",
  description:
    "Farmille 編集部による週次〜月次レポート・特集・コラムの一覧。BS資材の最新動向と農家の声をまとめてお届けします。",
  openGraph: {
    title: "記事一覧 | Farmille",
    description:
      "Farmille 編集部による週次〜月次レポート・特集・コラムの一覧。",
    url: "/articles",
  },
};

type ArticleListResponse = { articles: ArticleListItem[] };

type PageProps = {
  searchParams?: Promise<{ category?: string }>;
};

function parseCategory(raw: string | undefined): ArticleCategory | null {
  if (!raw) return null;
  return VALID_CATEGORIES.has(raw as ArticleCategory)
    ? (raw as ArticleCategory)
    : null;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const category = parseCategory(params.category);

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const query = new URLSearchParams();
  if (category) query.set("category", category);
  const qs = query.toString();
  const articlesUrl = qs
    ? `${apiUrl}/v1/articles?${qs}`
    : `${apiUrl}/v1/articles`;

  const articlesRes = await fetch(articlesUrl, { cache: "no-store" });
  if (!articlesRes.ok) {
    throw new Error(`Failed to fetch articles: ${articlesRes.status}`);
  }

  const { articles } = (await articlesRes.json()) as ArticleListResponse;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* AgList-inspired hero — soft green band matching /products + /manufacturers. */}
      <section
        aria-label="ページヘッダー"
        className="border-b border-border"
        style={{ backgroundColor: "var(--green-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 space-y-5">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "var(--overlay-on-light-soft)",
              color: "var(--green-dark)",
              borderRadius: "var(--radius-full)",
            }}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            編集部レポート
          </div>
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            記事一覧
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            Farmille 編集部による週次〜月次レポート・特集・コラム。
            BS 資材の最新動向と農家の声をまとめてお届けします。
          </p>
          <div className="flex items-center gap-3 pt-2">
            <span
              className="inline-flex items-center px-4 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "var(--green-primary)",
                color: "var(--text-on-green)",
                borderRadius: "var(--radius-full)",
              }}
            >
              {articles.length} 件
            </span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-6">
        <CategoryTabs selectedCategory={category} />

        {articles.length === 0 ? (
          <div
            className="border border-border bg-card p-12 text-center space-y-3"
            style={{
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex justify-center">
              <span
                className="inline-flex items-center justify-center h-14 w-14"
                style={{
                  backgroundColor: "var(--green-subtle)",
                  borderRadius: "var(--radius-full)",
                }}
              >
                <BookOpen
                  className="h-7 w-7 text-[var(--green-primary)]"
                  aria-hidden="true"
                />
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              まだ記事がありません
            </p>
            <p className="text-sm text-muted-foreground">
              {category
                ? "このカテゴリの記事はまだ投稿されていません。別のカテゴリをお試しください。"
                : "Farmille 編集部による記事の公開をお待ちください。"}
            </p>
          </div>
        ) : (
          <section aria-label="記事一覧">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
