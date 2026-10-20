import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import {
  listPublishedArticlesByMaterial,
  type MaterialContentList,
  type PublishedUsageReport,
} from "@/server/queries/material-content";
import type { MaterialDetail } from "@/server/queries/materials";

import { css, cx } from "../../../../../styled-system/css";

import { loadMaterialReports } from "../material-reports";
import { unwrapQueryResult } from "../query-result";
import { EmptyCard } from "./EmptyCard";
import { HeroCount } from "./HeroSavedCount";
import { MaterialSectionHeading } from "./MaterialSectionHeading";
import { UsageReportCard } from "./UsageReportCard";
import { MoreLink } from "./MoreLink";

const scrollStyle = css({
  display: "flex",
  gap: "2.5",
  mx: "-3.5",
  px: "3.5",
  pt: "0.5",
  pb: "1.5",
  overflowX: "auto",
  scrollSnapType: "[x mandatory]",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  pc: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "3",
    mx: "0",
    px: "0",
    overflowX: "visible",
  },
});
const signupStyle = css({ mt: "2.5", textAlign: "center" });
const signupTitleStyle = css({ textStyle: "body", fontWeight: "bold" });
const signupActionsStyle = css({
  mt: "2",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "2.5",
});
const articlesLinkStyle = css({ mt: "3" });

export function ReportsHeading({ count, moreHref }: { count?: number; moreHref?: string }) {
  return (
    <MaterialSectionHeading
      id="anchorReports"
      headingId="usage-reports-heading"
      title="実証詳細レポート"
      count={count}
      more={moreHref === undefined ? undefined : { href: moreHref, label: "すべて見る →" }}
      spacing="section"
    />
  );
}

export async function HeroReportCount({ materialId }: { materialId: string }) {
  const reports = unwrapQueryResult(await loadMaterialReports(materialId));
  return <HeroCount tone={reports.total > 0 ? "highlight" : "zero"}>{reports.total}件</HeroCount>;
}

type MaterialReportsViewProps = {
  material: Pick<MaterialDetail, "id" | "name">;
  reports: MaterialContentList<PublishedUsageReport>;
  articleTotal: number;
  signedIn: boolean;
};

export function MaterialReportsView({
  material,
  reports,
  articleTotal,
  signedIn,
}: MaterialReportsViewProps) {
  const materialPath = `/materials/${material.id}`;
  const next = encodeURIComponent(materialPath);

  return (
    <section aria-labelledby="usage-reports-heading" data-tour="material-reports">
      <ReportsHeading count={reports.total} moreHref={`${materialPath}/articles`} />
      {reports.items.length > 0 ? (
        <div className={scrollStyle}>
          {reports.items.map((report) => (
            <UsageReportCard
              key={report.id}
              href={`/reports/${report.id}`}
              title={report.title ?? `${material.name} 実証詳細レポート`}
              author={report.author?.handle ?? "退会したユーザー"}
              avatarSrc={report.author?.avatar_url}
              coverSrc={report.coverImage?.url}
              crop={report.crop?.name}
              layout="scroll"
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
      ) : (
        <EmptyCard
          title="公開中の実証詳細レポートはまだありません"
          description="投稿された実証詳細レポートは、編集部の確認後に公開されます。"
        />
      )}
      {!signedIn && reports.items.length > 0 ? (
        <div className={cx(surfaceCardRecipe(), signupStyle)}>
          <div className={signupTitleStyle}>
            実証詳細レポートの続きを読むには、会員登録が必要です
          </div>
          <div className={signupActionsStyle}>
            <Link
              className={buttonRecipe({ variant: "primary", size: "sm" })}
              href={`/signup/general?next=${next}`}
            >
              無料会員登録して読む（1分）
            </Link>
            <MoreLink href={`/login?next=${next}`}>ログインはこちら →</MoreLink>
          </div>
        </div>
      ) : null}
      {articleTotal > 0 ? (
        <div className={articlesLinkStyle}>
          <MoreLink href={`${materialPath}/articles`}>メーカーの記事 {articleTotal}件 →</MoreLink>
        </div>
      ) : null}
    </section>
  );
}

export async function MaterialReportsSection({
  material,
  signedIn,
}: {
  material: MaterialDetail;
  signedIn: boolean;
}) {
  const [reportsResult, articlesResult] = await Promise.all([
    loadMaterialReports(material.id),
    listPublishedArticlesByMaterial(material.id),
  ]);
  return (
    <MaterialReportsView
      material={material}
      reports={unwrapQueryResult(reportsResult)}
      articleTotal={unwrapQueryResult(articlesResult).total}
      signedIn={signedIn}
    />
  );
}
