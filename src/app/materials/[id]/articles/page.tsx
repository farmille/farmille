import { PostActionsLoader } from "@/components/PostActionsLoader";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleCard, EmptyState, ReportCard, SectionHeading } from "@/components";
import {
  listPublishedArticlesByMaterial,
  listPublishedUsageReportsByMaterial,
} from "@/server/queries/material-content";
import { css } from "../../../../../styled-system/css";

import { MaterialPageShell } from "../_components/PageShell";
import { isMaterialId, loadMaterialOrNotFound, materialMetadata } from "../material-page-data";
import { unwrapQueryResult } from "../query-result";

type MaterialArticlesPageProps = {
  params: Promise<{ id: string }>;
};

const cardGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  tab: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
});

export async function generateMetadata({ params }: MaterialArticlesPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);

  return materialMetadata(material, {
    titleSuffix: "の記事・実証詳細レポート",
    description: `${material.name}に紐づく記事と実証詳細レポートを一覧で確認できます。`,
    pathSuffix: "/articles",
  });
}

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
    <MaterialPageShell title={`${material.name}の記事`} backHref={materialPath}>
      <header>
        <h1 className={css({ m: "0", fontSize: "xl", fontWeight: "700" })}>
          {material.name} の記事・実証詳細レポート
        </h1>
        <p
          className={css({
            m: "0",
            mt: "2",
            color: "text.muted",
            fontSize: "sm",
            lineHeight: "1.65",
          })}
        >
          この資材に紐づく、農家の実証詳細レポートとメーカーによる記事です。
        </p>
      </header>

      {isEmpty ? (
        <EmptyState
          title="記事・実証詳細レポートはまだありません"
          description="この資材に紐づく公開コンテンツは、まだ登録されていません。"
        />
      ) : (
        <>
          {reports.items.length > 0 ? (
            <section aria-labelledby="material-reports-heading">
              <SectionHeading
                title={
                  <span id="material-reports-heading">
                    実証詳細レポート
                    <span
                      className={css({
                        ml: "2",
                        fontSize: "sm",
                        color: "text.subtle",
                        fontVariantNumeric: "tabular-nums",
                      })}
                    >
                      {reports.total}件
                    </span>
                  </span>
                }
              />
              <div className={cardGrid}>
                {reports.items.map((report) => (
                  <ReportCard
                    actions={
                      <PostActionsLoader
                        target="usage_report"
                        id={report.id}
                        currentPath={`/reports/${report.id}`}
                        helpfulCount={report.helpfulCount}
                      />
                    }
                    reportId={report.id}
                    key={report.id}
                    title={report.title ?? `${material.name} 実証詳細レポート`}
                    author={report.author?.handle ?? "退会したユーザー"}
                    crop={report.crop?.name ?? "作目情報なし"}
                    helpfulCount={report.helpfulCount}
                    viewCount={report.viewCount}
                    href={`/reports/${report.id}`}
                    coverSrc={report.coverImage?.url}
                    layout="grid"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {articles.items.length > 0 ? (
            <section aria-labelledby="material-articles-heading">
              <SectionHeading
                title={
                  <span id="material-articles-heading">
                    メーカーの記事
                    <span
                      className={css({
                        ml: "2",
                        fontSize: "sm",
                        color: "text.subtle",
                        fontVariantNumeric: "tabular-nums",
                      })}
                    >
                      {articles.total}件
                    </span>
                  </span>
                }
              />
              <div className={cardGrid}>
                {articles.items.map((article) => (
                  <ArticleCard
                    key={article.id}
                    title={article.title}
                    organization={article.seller?.official_name ?? "メーカー情報なし"}
                    typeLabel="メーカー"
                    helpfulCount={article.helpfulCount}
                    viewCount={article.viewCount}
                    href={`/articles/${article.id}`}
                    coverSrc={article.hero_image_url ?? undefined}
                    official={article.seller !== null}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </MaterialPageShell>
  );
}
