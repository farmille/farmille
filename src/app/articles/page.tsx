import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込む。
import "@/app/_mock/reports-articles.css";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonList";
import type { Metadata } from "next";

import { Pagination } from "@/components";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { createPageMetadata } from "@/lib/seo";
import { errorMessageJa } from "@/server/errors";
import { listContentFeed, type ContentFeedFilter } from "@/server/queries/content-feed";

import { ArticlesSearchBar, articlesHref } from "./_components/ArticlesSearchBar";
import { ArticleGrid } from "./_components/FeedCard";
import { FeedReportCard } from "./_components/FeedReportCard";
import { OrgArticleCard } from "./_components/OrgArticleCard";
import { css } from "../../../styled-system/css";

// NEXT_PUBLIC_SITE_URL の評価をモジュール読み込み時ではなく使用時に遅延させる（layout.tsx と同じ理由）。
export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "記事を読む",
    description: "生産者の実証詳細レポートとメーカーの記事を探せます。",
    path: "/articles",
  });
}

type ArticlesPageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

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

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.type);
  const q = params.q ?? "";
  const page = parsePage(params.page);

  return (
    <MockPageShell>
      <h1 className={css({ srOnly: true })}>記事を読む</h1>
      <ArticlesSearchBar filter={filter} q={q} />

      <Suspense
        key={`${filter}:${q}:${page}`}
        fallback={<SkeletonList variant="articles" label="記事を読み込んでいます" />}
      >
        <ArticleResults filter={filter} q={q} page={page} />
      </Suspense>
    </MockPageShell>
  );
}

// 検索操作を残したまま、記事の取得が終わり次第結果だけを表示する。
async function ArticleResults({
  filter,
  q,
  page,
}: {
  filter: ContentFeedFilter;
  q: string;
  page: number;
}) {
  const result = await listContentFeed({ filter, q, page });

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const feed = result.data;

  if (feed.items.length === 0) {
    return (
      <div
        className={css(surfaceCardRecipe.raw({ padding: "cozy" }), {
          mt: "3",
          textAlign: "center",
        })}
      >
        <p className={css({ fontSize: "md", fontWeight: "bold" })}>
          該当する記事・実証詳細レポートがありません
        </p>
        <p className={css({ mt: "1", fontSize: "sm", color: "text.subtle" })}>
          検索条件やフィルタを変えて、もう一度探してみてください。
        </p>
      </div>
    );
  }

  return (
    <>
      <ArticleGrid className={css({ mt: "3" })}>
        {feed.items.map((item) =>
          item.kind === "report" ? (
            <FeedReportCard
              key={`report-${item.id}`}
              href={`/reports/${item.id}`}
              title={item.title}
              author={item.authorHandle}
              coverSrc={item.coverUrl}
              publishedAt={item.publishedAt}
              crop={item.cropName}
              actions={
                <PostActionsLoader
                  target="usage_report"
                  id={item.id}
                  currentPath={`/reports/${item.id}`}
                  helpfulCount={item.helpfulCount}
                />
              }
            />
          ) : (
            <OrgArticleCard
              key={`article-${item.id}`}
              href={`/articles/${item.id}`}
              title={item.title}
              organization={item.organization}
              typeLabel="メーカー"
              coverSrc={item.coverUrl}
              helpfulCount={item.helpfulCount}
              viewCount={item.viewCount}
            />
          ),
        )}
      </ArticleGrid>
      <Pagination
        page={feed.page}
        totalPages={feed.totalPages}
        hrefForPage={(nextPage) => articlesHref(filter, q, nextPage)}
      />
    </>
  );
}
