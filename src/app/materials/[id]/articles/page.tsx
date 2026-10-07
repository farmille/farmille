import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込む。
import "@/app/_mock/reports-articles.css";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  listPublishedArticlesByMaterial,
  listPublishedUsageReportsByMaterial,
} from "@/server/queries/material-content";

import { FeedReportCard } from "../../../articles/_components/FeedReportCard";
import { OrgArticleCard } from "../../../articles/_components/OrgArticleCard";
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

/** 見本の `.sec-h`（件数つきの見出し）。 */
function SectionHeading({ id, title, count }: { id: string; title: string; count: number }) {
  return (
    <div className="sec-h" style={{ marginTop: 18 }}>
      <h2 id={id}>
        {title}{" "}
        <span className="muted tnum" style={{ fontSize: 12 }}>
          {count}件
        </span>
      </h2>
    </div>
  );
}

// 見本 S.materialArticles の `.body`。本番は実証詳細レポートも同じ画面に並べる（資材ページの「すべて見る」の行き先）。
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
    <MockPageShell title={`${material.name} の記事`} backHref={materialPath}>
      <h1 className="sr-only">{material.name} の記事・実証詳細レポート</h1>
      <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        この資材に紐づく、生産者の実証詳細レポートとメーカーによる記事です。
      </p>

      {isEmpty ? (
        <div className="card pad" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>記事・実証詳細レポートはまだありません</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            この資材に紐づく公開コンテンツは、まだ登録されていません。
          </p>
        </div>
      ) : null}

      {reports.items.length > 0 ? (
        <section aria-labelledby="material-reports-heading">
          <SectionHeading
            id="material-reports-heading"
            title="実証詳細レポート"
            count={reports.total}
          />
          <div className="report-grid">
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
          </div>
        </section>
      ) : null}

      {articles.items.length > 0 ? (
        <section aria-labelledby="material-articles-heading">
          <SectionHeading
            id="material-articles-heading"
            title="メーカーの記事"
            count={articles.total}
          />
          <div className="report-grid">
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
          </div>
        </section>
      ) : null}
    </MockPageShell>
  );
}
