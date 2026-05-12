import type { Metadata } from "next";
import Link from "next/link";
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
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            記事一覧
          </h1>
          <p className="text-base text-muted-foreground">
            Farmille 編集部による週次〜月次レポート・特集・コラム。
          </p>
        </div>

        <CategoryTabs selectedCategory={category} />

        {articles.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
            <p className="text-lg font-medium text-foreground">
              まだ記事がありません
            </p>
            <p className="text-sm text-muted-foreground">
              {category
                ? "このカテゴリの記事はまだ投稿されていません。別のカテゴリをお試しください。"
                : "Farmille 編集部による記事の公開をお待ちください。"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
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
