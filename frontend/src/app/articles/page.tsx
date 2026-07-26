import type { Metadata } from "next";

import {
  AppBar,
  ArticleCard,
  ArticlesToolbar,
  BottomNav,
  EmptyState,
  Pagination,
  ReportCard,
} from "@/components";
import { sellerTypeLabel } from "@/components/seller-type-label";
import { createPageMetadata } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";
import { listContentFeed, type ContentFeedFilter } from "@/server/queries/content-feed";
import { css } from "../../../styled-system/css";

// NEXT_PUBLIC_SITE_URL の評価をモジュール読み込み時ではなく使用時に遅延させる（layout.tsx と同じ理由）。
export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "記事を読む",
    description: "農家の使用レポートとメーカー・JA・専門家の記事を探せます。",
    path: "/articles",
  });
}

type ArticlesPageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const main = css({
  flex: "1",
  px: "3.5",
  py: "4",
});

const cardGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  mt: "3",
});

function parseFilter(value: string | undefined): ContentFeedFilter {
  if (value === "report" || value === "article" || value === "all") {
    return value;
  }
  return "all";
}

function parsePage(value: string | undefined): number {
  if (value === undefined || value.length === 0) return 1;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

function hrefForPage(page: number, filter: ContentFeedFilter, q: string): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("type", filter);
  if (q.trim().length > 0) params.set("q", q.trim());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query.length > 0 ? `/articles?${query}` : "/articles";
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.type);
  const q = params.q ?? "";
  const page = parsePage(params.page);

  const result = await listContentFeed({ filter, q, page });

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const feed = result.data;

  return (
    <div className={shell}>
      <AppBar title="記事を読む" backHref="/" />
      <main className={main}>
        <ArticlesToolbar filter={filter} q={q} />

        {feed.items.length === 0 ? (
          <EmptyState
            title="該当する記事・使用レポートがありません"
            description="検索条件やフィルタを変えて、もう一度探してみてください。"
          />
        ) : (
          <>
            <div className={cardGrid}>
              {feed.items.map((item) =>
                item.kind === "report" ? (
                  <ReportCard
                    key={`report-${item.id}`}
                    title={item.title}
                    author={item.authorHandle}
                    crop={item.cropName}
                    helpfulCount={item.helpfulCount}
                    viewCount={item.viewCount}
                    href={`/reports/${item.id}`}
                    coverSrc={item.coverUrl ?? undefined}
                    layout="grid"
                  />
                ) : (
                  <ArticleCard
                    key={`article-${item.id}`}
                    title={item.title}
                    organization={item.organization}
                    typeLabel={sellerTypeLabel(item.sellerType)}
                    helpfulCount={item.helpfulCount}
                    viewCount={item.viewCount}
                    href={`/articles/${item.id}`}
                    coverSrc={item.coverUrl ?? undefined}
                  />
                ),
              )}
            </div>
            <Pagination
              page={feed.page}
              totalPages={feed.totalPages}
              hrefForPage={(nextPage) => hrefForPage(nextPage, filter, q)}
            />
          </>
        )}
      </main>
      <BottomNav active="articles" />
    </div>
  );
}
