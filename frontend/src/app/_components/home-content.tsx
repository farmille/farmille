import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <Link
        href="/products"
        className="flex items-center gap-3 rounded border border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        aria-label="資材を検索"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
        <span>資材を検索（作目 / タイプ / 効果から探す）</span>
      </Link>
    </div>
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
    <div className="rounded-md border border-border bg-card p-10 text-center space-y-3">
      <p className="text-lg font-medium text-foreground">
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
