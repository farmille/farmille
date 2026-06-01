import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sprout } from "lucide-react";
import type { Banner } from "./banner-card";
import {
  FeaturedProductsSection,
  type FeaturedProduct,
} from "./featured-products-section";
import {
  LatestArticlesSection,
  type HomeArticle,
} from "./latest-articles-section";

// Phase 18 / 2026-05-27 demo polish:
// `/` と `/home` で共有する home コンテンツ Server Component。
// spec docs/specs/home.md §6.3 / ADR-0008
//
// 投資家デモ向け改修:
//   - お知らせバナー (BannersSection) は撤去。`banners` prop は型として残し、
//     /v1/home の banners も fetch し続けるが描画はしない（breaking change 回避）。
//   - 旧 SearchBar（入力風 pill）は CTA ボタン「資材一覧を見る」に変更
//     （検索ボックスと誤認される、という user フィードバック）。
//
// 0 件時の UI 崩れ防止は spec §1.1 / §9.2:
//   - featured 0 件 → セクション非表示
//   - articles 0 件 → セクション非表示
// 全部 0 でも CTA + フォールバック文言で空ページ回避。

export type HomeContentProps = {
  banners: Banner[];
  featured: FeaturedProduct[];
  articles: HomeArticle[];
};

function ProductsCta() {
  // 旧「資材を検索」pill → 「資材一覧を見る」CTA ボタンに変更。
  // 検索ボックス誤認問題（user feedback）の解消。`Button asChild` + `<Link>` 既存パターン。
  return (
    <div className="flex justify-center sm:justify-start">
      <Button asChild size="lg">
        <Link href="/products" aria-label="資材一覧を見る">
          <Sprout className="h-5 w-5" aria-hidden="true" />
          資材一覧を見る
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
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
  banners: _banners,
  featured,
  articles,
}: HomeContentProps) {
  const allEmpty = featured.length === 0 && articles.length === 0;

  return (
    <div className="space-y-10">
      <ProductsCta />
      <FeaturedProductsSection items={featured} />
      <LatestArticlesSection items={articles} />
      {allEmpty ? <EmptyHomeFallback /> : null}
    </div>
  );
}
