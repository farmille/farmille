import Link from "next/link";
import Image from "next/image";

// Phase 18: 最新の記事セクション
// spec docs/specs/home.md §6.1 / §6.3
//
// Phase 15 の <ArticleCard> を再利用したいが、Phase 18 worktree では Phase 15 の
// frontend コードもまだ in していない（chore/v2-prep ベース）。Phase 15 と
// 視覚的に揃った最小カードを本ファイルに閉じる。Phase 15 が main に入った後の
// PR で <ArticleCard> 共通化は別途検討する。

export type HomeArticle = {
  id: string;
  slug: string;
  title: string;
  category: "monthly_report" | "weekly_report" | "featured" | "column";
  hero_image_url: string | null;
  published_at: string; // ISO 8601
  excerpt: string;
};

const CATEGORY_LABELS: Record<HomeArticle["category"], string> = {
  monthly_report: "月次レポート",
  weekly_report: "週次レポート",
  featured: "特集",
  column: "コラム",
};

function formatDate(iso: string): string {
  // タイムゾーン依存を避けるため YYYY/MM/DD で素朴に整形（locale 依存しない）
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function HomeArticleCard({ article }: { article: HomeArticle }) {
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
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-block rounded-sm bg-muted px-2 py-0.5">
            {CATEGORY_LABELS[article.category]}
          </span>
          <time dateTime={article.published_at}>
            {formatDate(article.published_at)}
          </time>
        </div>
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function LatestArticlesSection({
  items,
}: {
  items: HomeArticle[];
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="latest-articles-heading" className="space-y-4">
      <div className="flex items-end justify-between">
        <h2
          id="latest-articles-heading"
          className="text-2xl font-semibold text-foreground"
        >
          最新の記事
        </h2>
        <Link
          href="/articles"
          className="text-sm text-primary hover:underline"
        >
          すべて見る
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((article) => (
          <HomeArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
