import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AppBar } from "@/components";
import { FabBar } from "@/components/FabBar";
import { HelpfulButton } from "@/components/HelpfulButton";
import { helpfulPillRecipe } from "@/components/helpful-pill";
import { Icon } from "@/components/Icon";
import { ReportDialog } from "@/components/ReportDialog";
import { STANDPOINTS } from "@/lib/standpoints";
import { createArticleJsonLd, createPageMetadata, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { toggleHelpfulAction } from "@/server/actions/helpful";
import { createReportAction } from "@/server/actions/reports";
import { errorMessageJa } from "@/server/errors";
import { isHelpfulVotedByViewer } from "@/server/queries/helpful";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/reports";
import { getPublishedUsageReport } from "@/server/queries/usage-reports";
import { recordViewEvent } from "@/server/queries/view-events";
import { createServerSupabase } from "@/server/supabase";

import { LegacyReportSections } from "./LegacyReportSections";
import { ReportFigure } from "./ReportFigures";
import { ReportGate } from "./ReportGate";
import { ReportHeader } from "./ReportHeader";
import {
  ReadingHeading,
  ReadingProse,
  readingArticle,
  readingFoot,
} from "../../articles/_components/Reading";
import { css } from "../../../../styled-system/css";
import { StructuredReportArticle } from "./StructuredReportArticle";

type ReportDetailPageProps = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const shell = css({
  minH: "100dvh",
  bg: "surface.page",
  position: "relative",
  pb: "24",
  tab: { pb: "8" },
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

const getCachedReport = cache(getPublishedUsageReport);

async function loadReport(id: string) {
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const result = await getCachedReport(id);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  if (result.data === null) {
    notFound();
  }

  return result.data;
}

async function loadViewer(reportId: string) {
  const session = await getSessionUser();
  const viewerUserId =
    session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null;
  const helpfulVotedResult = await isHelpfulVotedByViewer(viewerUserId, "usage_report", reportId);

  return { session, viewerUserId, helpfulVotedResult };
}

function reportDescription(authorHandle: string, materialName: string): string {
  return `${authorHandle}さんの${materialName}に関する実証詳細レポート`;
}

export async function generateMetadata({ params }: ReportDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await loadReport(id);

  return createPageMetadata({
    title: report.title,
    description: reportDescription(report.author.handle, report.material.name),
    path: `/reports/${report.id}`,
    type: "article",
    publishedTime: report.publishedAt,
    imageUrls: report.media
      .filter((media) => media.mediaType === "photo")
      .map((media) => media.url),
  });
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const [report, { session, viewerUserId, helpfulVotedResult }] = await Promise.all([
    loadReport(id),
    loadViewer(id),
  ]);
  const isOwnPost = viewerUserId !== null && viewerUserId === report.author.userId;

  if (!helpfulVotedResult.ok) {
    throw new Error(errorMessageJa[helpfulVotedResult.error]);
  }

  const helpfulVoted = !isOwnPost && helpfulVotedResult.data;
  // after() の中では cookies() が使えないため、Supabase クライアントは先に作る。
  const viewEventSupabase = await createServerSupabase();

  after(async () => {
    await recordViewEvent({
      targetType: "usage_report",
      targetId: report.id,
      viewerUserId,
      supabase: viewEventSupabase,
    });
  });

  const cover =
    report.media.find((m) => m.placement === "cover") ??
    report.media.find((m) => m.mediaType === "photo") ??
    null;
  const cropLabel = `${report.crop.name}${report.variety ? `（${report.variety}）` : ""}`;
  const standpointLabel = report.author.standpoint
    ? STANDPOINTS.find((item) => item.value === report.author.standpoint)?.label
    : undefined;

  const materialPath = `/materials/${report.material.id}`;
  const reportJsonLd = createArticleJsonLd({
    id: report.id,
    route: "reports",
    headline: report.title,
    description: reportDescription(report.author.handle, report.material.name),
    datePublished: report.publishedAt,
    author: {
      type: "Person",
      name: report.author.handle,
      path: `/users/${report.author.userId}`,
    },
    imageUrls: report.media
      .filter((media) => media.mediaType === "photo")
      .map((media) => media.url),
    articleSection: "実証詳細レポート",
    about: {
      id: report.material.id,
      name: report.material.name,
    },
  });

  return (
    <div className={shell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(reportJsonLd) }}
      />
      <AppBar
        chrome="public"
        active="articles"
        title={report.title}
        backHref="/articles"
        shareHref={`/reports/${report.id}`}
      />
      <main className={main}>
        <article className={readingArticle}>
          <ReportHeader
            report={report}
            cropLabel={cropLabel}
            standpointLabel={standpointLabel}
            materialPath={materialPath}
          />

          {report.structured === null ? (
            <>
              <ReadingHeading>結果・感想</ReadingHeading>
              <ReadingProse text={report.observedChange} />
              {report.formVersion === 1 && cover ? <ReportFigure media={cover} /> : null}
            </>
          ) : null}

          {session === null ? (
            <ReportGate reportPath={`/reports/${report.id}`} />
          ) : (
            <>
              {report.structured !== null ? (
                <StructuredReportArticle
                  input={report.structured}
                  cropLabel={cropLabel}
                  documentUrls={report.documentUrls}
                />
              ) : (
                <LegacyReportSections report={report} coverId={cover?.id ?? null} />
              )}
              <div
                className={css({
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "2",
                  mt: "5.5",
                  px: "3",
                  py: "3",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "border.default",
                  borderRadius: "input",
                  bg: "surface.page",
                  fontSize: "sm",
                  color: "text.muted",
                  lineHeight: "normal",
                })}
              >
                <span
                  className={css({
                    display: "flex",
                    flexShrink: "0",
                    mt: "0.5",
                    color: "primary.700",
                  })}
                >
                  <Icon name="check" size="sm" />
                </span>
                <span>
                  この実証詳細レポートには、病害虫の防除、殺菌・殺虫、農薬の代替など、農薬としての効果を断定する表現を含めていません。
                </span>
              </div>
            </>
          )}

          <div className={readingFoot}>
            {!isOwnPost ? (
              <HelpfulButton
                action={toggleHelpfulAction.bind(
                  null,
                  "usage_report",
                  report.id,
                  `/reports/${report.id}`,
                )}
                count={report.helpfulCount}
                voted={helpfulVoted}
              />
            ) : (
              <span className={helpfulPillRecipe()}>
                <Icon name="thumb_up" size="xs" />
                <span>参考になった</span>
                {report.helpfulCount}
              </span>
            )}
            <span
              className={css({
                fontSize: "sm",
                color: "text.subtle",
                fontVariantNumeric: "tabular-nums",
              })}
              aria-label={`${report.viewCount}回閲覧`}
            >
              閲覧 {report.viewCount}
            </span>
            {!isOwnPost ? (
              <ReportDialog
                action={createReportAction.bind(
                  null,
                  "usage_report",
                  report.id,
                  `/reports/${report.id}`,
                )}
                reasonOptions={REPORT_REASON_OPTIONS}
                title="この実証詳細レポートを通報する"
              />
            ) : null}
          </div>
        </article>

        <FabBar
          reportHref={`${materialPath}/report/new`}
          reviewHref={`${materialPath}/review/new`}
          placement="viewport"
          look="site"
        />
      </main>
    </div>
  );
}
