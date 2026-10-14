import { SiteAppBar } from "@/components/SiteAppBar";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { cache } from "react";

import { HelpfulButton } from "@/components/HelpfulButton";
import { ReportDialog } from "@/components/ReportDialog";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { createArticleJsonLd, createPageMetadata, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { toggleHelpfulAction } from "@/server/actions/helpful";
import { createReportAction } from "@/server/actions/reports";
import { errorMessageJa } from "@/server/errors";
import { isHelpfulVotedByViewer } from "@/server/queries/helpful";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/reports";
import { getPublishedArticle } from "@/server/queries/articles";
import { recordViewEvent } from "@/server/queries/view-events";
import { createServerSupabase } from "@/server/supabase";

import { ArticleHeader } from "../_components/ArticleHeader";
import { ArticleMaterialList } from "../_components/ArticleMaterialList";
import { ViewCount } from "../_components/ViewCount";
import { readingArticle, readingFoot, ReadingMarkdown } from "../_components/Reading";
import { css } from "../../../../styled-system/css";

type ArticleDetailPageProps = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const shell = css({
  minH: "100dvh",
  bg: "surface.page",
  pb: "6",
});

const main = css({
  w: "100%",
  maxW: "content.reading",
  mx: "auto",
  px: "3.5",
  py: "4",
  bg: "surface.panel",
  tab: { px: "6", py: "6" },
});

const getCachedArticle = cache(getPublishedArticle);

async function loadArticle(id: string) {
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const result = await getCachedArticle(id);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  if (result.data === null) {
    notFound();
  }

  return result.data;
}

function articleDescription(title: string, sellerName: string): string {
  return `${sellerName}による記事「${title}」`;
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await loadArticle(id);
  const sellerName = article.seller.official_name ?? "メーカー";

  return createPageMetadata({
    title: article.title,
    description: articleDescription(article.title, sellerName),
    path: `/articles/${article.id}`,
    type: "article",
    publishedTime: article.publishedAt,
    imageUrls: article.heroImageUrl === null ? undefined : [article.heroImageUrl],
  });
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params;
  const [article, session] = await Promise.all([loadArticle(id), getSessionUser()]);
  const viewerUserId =
    session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null;
  const [bodyHtml, helpfulVotedResult] = await Promise.all([
    renderMarkdownToHtml(article.body),
    isHelpfulVotedByViewer(viewerUserId, "article", article.id),
  ]);

  if (!helpfulVotedResult.ok) {
    throw new Error(errorMessageJa[helpfulVotedResult.error]);
  }

  const helpfulVoted = helpfulVotedResult.data;
  // after() の中では cookies() が使えないため、Supabase クライアントは先に作る。
  const viewEventSupabase = await createServerSupabase();

  // 閲覧記録は表示をブロックしない（失敗しても画面は出す）。
  after(async () => {
    await recordViewEvent({
      targetType: "article",
      targetId: article.id,
      viewerUserId,
      supabase: viewEventSupabase,
    });
  });

  const sellerName = article.seller.official_name ?? "メーカー";
  const sellerPath = `/sellers/${article.seller.id}`;
  const articleJsonLd = createArticleJsonLd({
    id: article.id,
    route: "articles",
    headline: article.title,
    description: articleDescription(article.title, sellerName),
    datePublished: article.publishedAt,
    author: {
      type: "Organization",
      name: sellerName,
      path: sellerPath,
    },
    imageUrls: article.heroImageUrl === null ? [] : [article.heroImageUrl],
    articleSection: "記事",
  });

  return (
    <div className={shell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <SiteAppBar
        chrome="public"
        active="articles"
        title={article.title}
        backHref="/articles"
        shareHref={`/articles/${article.id}`}
      />
      <main className={main}>
        <article className={readingArticle}>
          <ArticleHeader
            title={article.title}
            sellerName={sellerName}
            sellerPath={sellerPath}
            logoUrl={article.seller.logo_url}
            publishedAt={article.publishedAt}
            heroImageUrl={article.heroImageUrl}
          />

          <ReadingMarkdown html={bodyHtml} />

          {article.materials.length > 0 ? (
            <ArticleMaterialList materials={article.materials} />
          ) : null}

          <div className={readingFoot}>
            <HelpfulButton
              action={toggleHelpfulAction.bind(
                null,
                "article",
                article.id,
                `/articles/${article.id}`,
              )}
              count={article.helpfulCount}
              layout="card"
              voted={helpfulVoted}
            />
            <ViewCount count={article.viewCount} className={css({ ml: "auto" })} />
            <span>
              <ReportDialog
                action={createReportAction.bind(
                  null,
                  "article",
                  article.id,
                  `/articles/${article.id}`,
                )}
                reasonOptions={REPORT_REASON_OPTIONS}
                title="この記事を通報する"
              />
            </span>
          </div>
        </article>
      </main>
    </div>
  );
}
