import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Sprout } from "lucide-react";
import { BannerCard, type Banner } from "./banner-card";
import {
  FeaturedProductsSection,
  type FeaturedProduct,
} from "./featured-products-section";
import {
  LatestArticlesSection,
  type HomeArticle,
} from "./latest-articles-section";

// Phase 18: `/` と `/home` で共有する home コンテンツ Server Component。
// spec docs/specs/home.md §6.3 / ADR-0008
//
// 検索バーは v1 では `/products` への単純リンク。クエリ転送（?q=...）は v1.5+
// （spec §11.2 worker 判断可、§13 アイハーブ風レイアウト最終形は §5.2.14 待ち）。
//
// 0 件時の UI 崩れ防止は spec §1.1 / §9.2:
//   - banners 0 件 → セクション非表示
//   - featured 0 件 → セクション非表示
//   - articles 0 件 → セクション非表示
// 全部 0 でも検索バー + フォールバック文言で空ページ回避。

export type HomeContentProps = {
  banners: Banner[];
  featured: FeaturedProduct[];
  articles: HomeArticle[];
};

function SearchBar() {
  // AgList 風 pill 検索バー。実検索は v1.5+、現状は /products へのリンクのみ。
  return (
    <Link
      href="/products"
      aria-label="資材を検索"
      className="group flex items-center gap-3 border border-border bg-card px-5 py-4 text-sm transition-colors hover:border-[var(--green-primary)]"
      style={{
        borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center"
        style={{
          backgroundColor: "var(--green-subtle)",
          borderRadius: "var(--radius-full)",
        }}
        aria-hidden
      >
        <Search className="h-4 w-4 text-[var(--green-primary)]" />
      </span>
      <span className="flex-1 text-muted-foreground">
        資材を検索 (作目 / タイプ / 効果から探す)
      </span>
      <span
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--green-primary)] group-hover:text-[var(--green-dark)]"
        style={{ transition: "var(--transition-fast)" }}
      >
        探す
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function BannersSection({ banners }: { banners: Banner[] }) {
  // 縮退ライン（spec §1.2）: 0 件時は表示せず、UI 崩れない
  if (banners.length === 0) return null;
  return (
    <section aria-label="お知らせ" className="space-y-4">
      <div className="overflow-x-auto snap-x snap-mandatory -mx-6 px-6">
        <div className="flex gap-4 pb-2">
          {banners.map((b) => (
            <BannerCard key={b.id} banner={b} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyHomeFallback() {
  return (
    <div
      className="border border-border bg-card p-12 text-center space-y-4"
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
          <Sprout
            className="h-7 w-7 text-[var(--green-primary)]"
            aria-hidden="true"
          />
        </span>
      </div>
      <p className="text-lg font-semibold text-foreground">
        まだ表示できるコンテンツがありません
      </p>
      <p className="text-sm text-muted-foreground">
        資材一覧から探してみてください。
      </p>
      <Button asChild className="mt-2">
        <Link href="/products">資材一覧へ</Link>
      </Button>
    </div>
  );
}

export function HomeContent({
  banners,
  featured,
  articles,
}: HomeContentProps) {
  const allEmpty =
    banners.length === 0 && featured.length === 0 && articles.length === 0;

  return (
    <div className="space-y-10">
      <SearchBar />
      <BannersSection banners={banners} />
      <FeaturedProductsSection items={featured} />
      <LatestArticlesSection items={articles} />
      {allEmpty ? <EmptyHomeFallback /> : null}
    </div>
  );
}
