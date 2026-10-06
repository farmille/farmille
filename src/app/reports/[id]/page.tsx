import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込む。
import "@/app/_mock/reports-articles.css";

import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { cache } from "react";

import { FabBar } from "@/components/FabBar";
import { HelpfulButton } from "@/components/HelpfulButton";
import { helpfulPillRecipe } from "@/components/helpful-pill";
import { Icon } from "@/components/Icon";
import { formatDateJa } from "@/components/format-date";
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

import { MockAvatar, MockCheckIcon } from "../../materials/[id]/_components/MockParts";
import { LegacyReportSections } from "./LegacyReportSections";
import { ReportFigure } from "./ReportFigures";
import { ReportGate } from "./ReportGate";
import { StructuredReportArticle } from "./StructuredReportArticle";

type ReportDetailPageProps = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    <MockPageShell title="" backHref={materialPath} shareHref={`/reports/${report.id}`} hasFab>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(reportJsonLd) }}
      />
      <article className="pub-body">
        <h1 className="art-title">{report.title}</h1>
        <div className="byline">
          <Link href={`/users/${report.author.userId}`} className="by-link">
            <MockAvatar name={report.author.handle} src={report.author.avatarUrl} size={32} />
            <span className="by-name">{report.author.handle}</span>
          </Link>
          <time className="by-sub" dateTime={report.publishedAt}>
            {formatDateJa(report.publishedAt)}
          </time>
          {standpointLabel ? <span className="by-sub">{standpointLabel}</span> : null}
        </div>
        <div className="rp-tags">
          <span className="chip-sel">
            <span className="cat-mini">作物</span>
            {cropLabel}
          </span>
          {report.purposeTags.map((tag) => (
            <span key={tag} className="chip-sel">
              <span className="cat-mini">効果</span>
              {tag}
            </span>
          ))}
        </div>
        <Link href={materialPath} className="ref">
          <div>
            <div className="muted" style={{ fontSize: 10.5 }}>
              対象資材
            </div>
            <div className="t-name">{report.material.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {report.material.manufacturerName}
            </div>
          </div>
        </Link>

        {report.structured === null ? (
          <>
            <h2 className="a-h3">結果・感想</h2>
            <div className="a-body">
              <p>{report.observedChange}</p>
            </div>
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
            <div className="compliance">
              <span className="ck">
                <MockCheckIcon />
              </span>
              <span>
                この実証詳細レポートには、病害虫の防除、殺菌・殺虫、農薬の代替など、農薬としての効果を断定する表現を含めていません。
              </span>
            </div>
          </>
        )}

        <div className="rc-foot">
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
            className="muted tnum rp-views"
            style={{ fontSize: 12 }}
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
        look="mock"
      />
    </MockPageShell>
  );
}
