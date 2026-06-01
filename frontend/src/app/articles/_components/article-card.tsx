import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";

export type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  category: ArticleCategory;
  hero_image_url: string | null;
  published_at: string;
  excerpt: string;
};

export type ArticleCategory =
  | "monthly_report"
  | "weekly_report"
  | "featured"
  | "column";

const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  monthly_report: "月次レポート",
  weekly_report: "週次レポート",
  featured: "特集",
  column: "コラム",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

// design-tokens v2 + AgList-inspired article card. Matches ProductCard /
// ManufacturerCard structure: green-subtle image bg, pill category, primary
// arrow CTA at the bottom.
export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-border bg-card"
      style={{
        borderRadius: "var(--radius-lg)",
        transition: "var(--transition-fast)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="relative aspect-[16/9] bg-[var(--green-subtle)] overflow-hidden">
        {article.hero_image_url ? (
          <Image
            src={article.hero_image_url}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="inline-flex items-center justify-center h-12 w-12"
              style={{
                backgroundColor: "var(--overlay-on-light-soft)",
                borderRadius: "var(--radius-full)",
              }}
            >
              <BookOpen
                className="h-5 w-5 text-[var(--green-primary)]"
                aria-hidden="true"
              />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "var(--green-subtle)",
              color: "var(--green-dark)",
              borderRadius: "var(--radius-full)",
            }}
          >
            {CATEGORY_LABEL[article.category]}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(article.published_at)}
          </span>
        </div>

        <h3
          className="text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[var(--green-primary)]"
          style={{ transition: "var(--transition-fast)" }}
        >
          {article.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {article.excerpt}
        </p>

        <div className="mt-auto pt-2">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--green-primary)] group-hover:text-[var(--green-dark)]"
            style={{ transition: "var(--transition-fast)" }}
          >
            読む
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

export const ARTICLE_CATEGORY_LABEL = CATEGORY_LABEL;
