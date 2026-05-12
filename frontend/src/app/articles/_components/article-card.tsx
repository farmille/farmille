import Link from "next/link";
import Image from "next/image";

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

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block rounded-md border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
    >
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {article.hero_image_url ? (
          <Image
            src={article.hero_image_url}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-block rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {CATEGORY_LABEL[article.category]}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(article.published_at)}
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}

export const ARTICLE_CATEGORY_LABEL = CATEGORY_LABEL;
