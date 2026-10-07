import { SitePageShell } from "@/app/_site/SitePageShell";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  listPublishedArticlesByMaterial,
  listPublishedUsageReportsByMaterial,
} from "@/server/queries/material-content";

import { css } from "../../../../../styled-system/css";

import { ArticleGrid } from "../../../articles/_components/FeedCard";
import { FeedReportCard } from "../../../articles/_components/FeedReportCard";
import { OrgArticleCard } from "../../../articles/_components/OrgArticleCard";
import { EmptyCard } from "../_components/EmptyCard";
import { MaterialSectionHeading } from "../_components/MaterialSectionHeading";
import { isMaterialId, loadMaterialOrNotFound, materialMetadata } from "../material-page-data";
import { unwrapQueryResult } from "../query-result";

type MaterialArticlesPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: MaterialArticlesPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);

  return materialMetadata(material, {
    titleSuffix: "の記事・実証詳細レポート",
    description: `${material.name}に紐づく記事と実証詳細レポートを一覧で確認できます。`,
    pathSuffix: "/articles",
  });
}

const visuallyHiddenStyle = css({ srOnly: true });
const leadStyle = css({ mb: "3", fontSize: "sm", color: "text.subtle" });

export default async function MaterialArticlesPage({ params }: MaterialArticlesPageProps) {
  const { id } = await params;

  if (!isMaterialId(id)) {
    notFound();
  }

  const [material, reportsResult, articlesResult] = await Promise.all([
    loadMaterialOrNotFound(id),
    listPublishedUsageReportsByMaterial(id),
    listPublishedArticlesByMaterial(id),
  ]);
  const reports = unwrapQueryResult(reportsResult);
  const articles = unwrapQueryResult(articlesResult);
  const materialPath = `/materials/${material.id}`;
  const isEmpty = reports.items.length === 0 && articles.items.length === 0;

  return (
    <SitePageShell title={`${material.name} の記事`} backHref={materialPath}>
      <h1 className={visuallyHiddenStyle}>{material.name} の記事・実証詳細レポート</h1>
      <div className={leadStyle}>
        この資材に紐づく、生産者の実証詳細レポートとメーカーによる記事です。
      </div>

      {isEmpty ? (
        <EmptyCard
          align="center"
          title="記事・実証詳細レポートはまだありません"
          description="この資材に紐づく公開コンテンツは、まだ登録されていません。"
        />
      ) : null}

      {reports.items.length > 0 ? (
        <section aria-labelledby="material-reports-heading">
          <MaterialSectionHeading
            headingId="material-reports-heading"
            title="実証詳細レポート"
            count={reports.total}
            spacing="list"
          />
          <ArticleGrid>
            {reports.items.map((report) => (
              <FeedReportCard
                key={report.id}
                href={`/reports/${report.id}`}
                title={report.title ?? `${material.name} 実証詳細レポート`}
                author={report.author?.handle ?? "退会したユーザー"}
                avatarSrc={report.author?.avatar_url}
                coverSrc={report.coverImage?.url}
                publishedAt={report.published_at ?? undefined}
                crop={report.crop?.name}
                actions={
                  <PostActionsLoader
                    target="usage_report"
                    id={report.id}
                    currentPath={`/reports/${report.id}`}
                    helpfulCount={report.helpfulCount}
                  />
                }
              />
            ))}
          </ArticleGrid>
        </section>
      ) : null}

      {articles.items.length > 0 ? (
        <section aria-labelledby="material-articles-heading">
          <MaterialSectionHeading
            headingId="material-articles-heading"
            title="メーカーの記事"
            count={articles.total}
            spacing="list"
          />
          <ArticleGrid>
            {articles.items.map((article) => (
              <OrgArticleCard
                key={article.id}
                href={`/articles/${article.id}`}
                title={article.title}
                organization={article.seller?.official_name ?? "メーカー情報なし"}
                typeLabel="メーカー"
                coverSrc={article.hero_image_url}
                helpfulCount={article.helpfulCount}
                viewCount={article.viewCount}
              />
            ))}
          </ArticleGrid>
        </section>
      ) : null}
    </SitePageShell>
  );
}
