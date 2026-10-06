import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込む。
import "@/app/_mock/reports-articles.css";

import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { cache } from "react";

import { HelpfulButton } from "@/components/HelpfulButton";
import { formatDateJa } from "@/components/format-date";
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

import { MockStars } from "../../materials/[id]/_components/MockParts";
import { MockChevronIcon, MockSeedIcon, MockViewCount } from "../_components/MockIcons";

type ArticleDetailPageProps = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

// 見本 S.articleDetail の `.body`。スタイルは src/app/_mock/（.fm 配下に閉じている）。
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
  const sellerInitial = sellerName.charAt(0);
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

  // 記事一覧は置かない（docs/mock-port/decisions.md）。戻る先は紐づく最初の資材、なければホーム。
  const firstMaterial = article.materials[0];
  const backHref = firstMaterial === undefined ? "/" : `/materials/${firstMaterial.id}`;

  return (
    <MockPageShell title="" backHref={backHref} shareHref={`/articles/${article.id}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <article className="rp-body">
        <h1 className="art-title">{article.title}</h1>
        <div className="byline">
          <Link href={sellerPath} className="by-link">
            <span className="org-logo" aria-hidden="true">
              {article.seller.logo_url ? (
                <Image alt="" height={32} sizes="32px" src={article.seller.logo_url} width={32} />
              ) : (
                sellerInitial
              )}
            </span>
            <span className="by-name">{sellerName}</span>
          </Link>
          <span className="type-label">メーカー</span>
          <time className="by-sub" dateTime={article.publishedAt}>
            {formatDateJa(article.publishedAt)}
          </time>
        </div>

        {article.heroImageUrl ? (
          <div className="figure">
            <div className="fimg wide">
              <Image
                alt=""
                height={400}
                preload
                sizes="(max-width: 820px) 100vw, 790px"
                src={article.heroImageUrl}
                width={640}
              />
            </div>
          </div>
        ) : null}

        <div className="a-body md-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

        {article.materials.length > 0 ? (
          <section aria-labelledby="article-materials-heading">
            <h2 id="article-materials-heading" className="a-h3">
              この記事で紹介した資材
            </h2>
            <div className="ref-list">
              {article.materials.map((material) => (
                <Link key={material.id} href={`/materials/${material.id}`} className="card ref">
                  <span className="t-ic">
                    <MockSeedIcon />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="t-name" style={{ display: "block" }}>
                      {material.name}
                    </span>
                    <span className="muted ref-maker">
                      {material.manufacturer_name}
                      {material.avg_rating !== null ? (
                        <MockStars value={material.avg_rating} />
                      ) : null}
                    </span>
                  </span>
                  <span className="cev">
                    <MockChevronIcon />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="rc-foot" style={{ marginTop: 16 }}>
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
          <MockViewCount count={article.viewCount} />
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
    </MockPageShell>
  );
}
