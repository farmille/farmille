import type { Metadata } from "next";
import { OptimizedImage as Image } from "@/components/optimized-image";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";

import { AppBar, MaterialRefCard, MetricBars } from "@/components";
import { FabBar } from "@/components/fab-bar";
import { HelpfulButton } from "@/components/helpful-button";
import { helpfulPillRecipe } from "@/components/helpful-pill";
import { CheckIcon, ImagePlaceholderIcon, PersonIcon, ThumbIcon } from "@/components/icons";
import { formatDateJa } from "@/components/format-date";
import { ReportDialog } from "@/components/report-dialog";
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
import { css } from "../../../../styled-system/css";

import { prefectureName } from "./prefecture-name";

type ReportDetailPageProps = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const shell = css({
  minH: "100dvh",
  maxW: "md",
  mx: "auto",
  bg: "surface.panel",
  position: "relative",
  pb: "24",
});

const main = css({
  px: "3.5",
  py: "4",
});

const sectionTitle = css({
  m: "0",
  mt: "6",
  mb: "2.5",
  fontSize: "md",
  fontWeight: "700",
});

const bodyText = css({
  m: "0",
  fontSize: "md",
  color: "text.muted",
  lineHeight: "1.75",
  whiteSpace: "pre-wrap",
});

async function loadReport(id: string) {
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const result = await getPublishedUsageReport(id);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  if (result.data === null) {
    notFound();
  }

  return result.data;
}

function reportDescription(authorHandle: string, materialName: string): string {
  return `${authorHandle}さんの${materialName}に関する使用レポート`;
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

function MediaFigure({
  url,
  caption,
  mediaType,
  wide = false,
}: {
  url: string;
  caption: string | null;
  mediaType: "photo" | "video";
  wide?: boolean;
}) {
  return (
    <figure className={css({ m: "0", mt: "3" })}>
      <div
        className={css({
          position: "relative",
          borderRadius: "card",
          overflow: "hidden",
          bg: "green.soft2",
          aspectRatio: wide ? "16/9" : "4/3",
          display: "grid",
          placeItems: "center",
          color: "brand.primary",
        })}
      >
        {mediaType === "photo" ? (
          <Image
            alt={caption ?? ""}
            className={css({ w: "100%", h: "100%", objectFit: "cover" })}
            fill
            sizes={wide ? "(max-width: 768px) 100vw, 768px" : "(max-width: 768px) 100vw, 640px"}
            src={url}
          />
        ) : (
          <>
            <video
              src={url}
              controls
              className={css({ w: "100%", h: "100%", objectFit: "cover" })}
            />
          </>
        )}
      </div>
      {caption ? (
        <figcaption
          className={css({
            mt: "1.5",
            fontSize: "xs",
            color: "text.subtle",
            lineHeight: "1.5",
          })}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  const report = await loadReport(id);
  const session = await getSessionUser();
  const viewerUserId = session?.accountType === "general" ? session.userId : null;
  const isOwnPost = viewerUserId !== null && viewerUserId === report.author.userId;
  const helpfulVotedResult = await isHelpfulVotedByViewer(viewerUserId, "usage_report", report.id);

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
  const methodMedia = report.media.filter(
    (m) => m.placement === "method" || (m.mediaType === "video" && m.id !== cover?.id),
  );
  const observationPhotos = report.media.filter(
    (m) =>
      m.mediaType === "photo" &&
      m.id !== cover?.id &&
      (m.placement === "observation" || m.placement === "treated" || m.placement === "untreated"),
  );
  const summaryMedia = report.media.filter((m) => m.placement === "summary");

  const envLines = [
    report.prefectureCode !== null ? `地域：${prefectureName(report.prefectureCode)}` : null,
    report.fieldName !== null && report.fieldName.length > 0 ? `圃場名：${report.fieldName}` : null,
    `使用作物：${report.crop.name}${report.variety ? `（品種：${report.variety}）` : ""}`,
    report.plantingDate !== null ? `定植時期：${formatDateJa(report.plantingDate)}ごろ` : null,
    [
      report.cultivationType,
      report.cultivationTags.length > 0 ? report.cultivationTags.join("・") : null,
    ]
      .filter((part): part is string => part !== null && part.length > 0)
      .join("｜") || null,
    report.growthStage !== null && report.growthStage.length > 0
      ? `生育ステージ：${report.growthStage}`
      : null,
  ].filter((line): line is string => line !== null);

  const applicationLines = report.applications.flatMap((app) => {
    const lines: string[] = [];
    if (app.method !== null && app.method.length > 0) {
      lines.push(`使用方法：${app.method}`);
    }
    if (app.detail !== null && app.detail.length > 0) {
      lines.push(app.detail);
    }
    if (app.appliedOn !== null) {
      lines.push(`処理日：${formatDateJa(app.appliedOn)}`);
    }
    return lines;
  });

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
    articleSection: "使用レポート",
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
      <AppBar title="" backHref="/articles" shareHref={`/reports/${report.id}`} />
      <main className={main}>
        <h1
          className={css({
            m: "0",
            fontSize: "xl",
            fontWeight: "700",
            lineHeight: "1.4",
          })}
        >
          {report.title}
        </h1>

        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            mt: "3",
            fontSize: "sm",
            color: "text.muted",
            flexWrap: "wrap",
          })}
        >
          <Link
            href={`/users/${report.author.userId}`}
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "2",
              textDecoration: "none",
              color: "inherit",
            })}
          >
            <span
              className={css({
                w: "32px",
                h: "32px",
                borderRadius: "pill",
                bg: "brand.soft",
                display: "grid",
                placeItems: "center",
                color: "brand.primary",
                overflow: "hidden",
              })}
            >
              {report.author.avatarUrl ? (
                <Image
                  alt=""
                  className={css({ w: "100%", h: "100%", objectFit: "cover" })}
                  height={32}
                  sizes="32px"
                  src={report.author.avatarUrl}
                  width={32}
                />
              ) : (
                <PersonIcon size={16} />
              )}
            </span>
            <span className={css({ fontWeight: "700", color: "text.default" })}>
              {report.author.handle}
            </span>
          </Link>
          <span className={css({ fontSize: "xs" })}>{formatDateJa(report.publishedAt)}</span>
        </div>

        <MaterialRefCard
          className={css({ mt: "3.5" })}
          href={materialPath}
          name={report.material.name}
          manufacturerName={report.material.manufacturerName}
          isOfficial={report.material.isOfficial}
          showTargetLabel
        />

        {cover ? (
          <MediaFigure
            url={cover.url}
            caption={cover.caption}
            mediaType={cover.mediaType}
            wide={cover.mediaType === "photo"}
          />
        ) : (
          <div
            className={css({
              mt: "3",
              aspectRatio: "16/9",
              borderRadius: "card",
              bg: "green.soft2",
              display: "grid",
              placeItems: "center",
              color: "brand.primary",
            })}
          >
            <ImagePlaceholderIcon />
          </div>
        )}

        <h2 className={sectionTitle}>使用目的</h2>
        {report.purposeTags.length > 0 ? (
          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5",
              mb: "2",
            })}
          >
            {report.purposeTags.map((tag) => (
              <span
                key={tag}
                className={css({
                  fontSize: "xs",
                  px: "2.5",
                  py: "1",
                  borderRadius: "pill",
                  bg: "brand.soft",
                  color: "brand.primaryDeep",
                  fontWeight: "600",
                })}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {report.purposeNote ? <p className={bodyText}>{report.purposeNote}</p> : null}

        <h2 className={sectionTitle}>環境</h2>
        <p className={bodyText}>{envLines.join("\n")}</p>

        <h2 className={sectionTitle}>使用方法・頻度</h2>
        {applicationLines.length > 0 ? (
          <p className={bodyText}>{applicationLines.join("\n")}</p>
        ) : (
          <p className={bodyText}>使用方法の詳細は記録されていません。</p>
        )}
        {methodMedia.map((media) => (
          <MediaFigure
            key={media.id}
            url={media.url}
            caption={media.caption}
            mediaType={media.mediaType}
            wide
          />
        ))}

        {report.climateNote ? (
          <>
            <h2 className={sectionTitle}>当時の気候・圃場の状況</h2>
            <p className={bodyText}>{report.climateNote}</p>
          </>
        ) : null}

        <h2 className={sectionTitle}>使用後に観察した変化</h2>
        <p className={bodyText}>{report.observedChange}</p>
        {observationPhotos.length > 0 ? (
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "2",
              mt: "3",
            })}
          >
            {observationPhotos.map((photo) => (
              <figure key={photo.id} className={css({ m: "0" })}>
                <div
                  className={css({
                    position: "relative",
                    aspectRatio: "3/4",
                    borderRadius: "button",
                    overflow: "hidden",
                    bg: "green.soft2",
                  })}
                >
                  <Image
                    alt={photo.caption ?? ""}
                    className={css({ w: "100%", h: "100%", objectFit: "cover" })}
                    fill
                    sizes="(max-width: 768px) 50vw, 320px"
                    src={photo.url}
                  />
                </div>
                {photo.caption ? (
                  <figcaption
                    className={css({
                      mt: "1",
                      fontSize: "2xs",
                      color: "text.subtle",
                    })}
                  >
                    {photo.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : null}

        <h2 className={sectionTitle}>マイナス・良くなかった点（薬害など）</h2>
        <p className={bodyText}>
          {report.negativeNote !== null && report.negativeNote.length > 0
            ? report.negativeNote
            : "特に記載はありません。"}
        </p>

        {report.metrics.length > 0 ? (
          <>
            <h2 className={sectionTitle}>収穫調査</h2>
            <MetricBars metrics={report.metrics} />
          </>
        ) : null}

        <h2 className={sectionTitle}>まとめ・感想</h2>
        <p className={bodyText}>{report.summary}</p>
        {summaryMedia.map((media) => (
          <MediaFigure
            key={media.id}
            url={media.url}
            caption={media.caption}
            mediaType={media.mediaType}
            wide
          />
        ))}

        <div
          className={css({
            display: "flex",
            gap: "2",
            alignItems: "flex-start",
            mt: "5.5",
            p: "3",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: "button",
            bg: "surface.page",
            fontSize: "xs",
            color: "text.muted",
            lineHeight: "1.55",
          })}
        >
          <CheckIcon className={css({ color: "brand.primary", flexShrink: "0", mt: "0.5" })} />
          <span>
            この使用レポートには、病害虫の防除、殺菌・殺虫、農薬の代替など、農薬としての効果を断定する表現を含めていません。
          </span>
        </div>

        <div
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: "4",
            fontSize: "xs",
            color: "text.subtle",
          })}
        >
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
              <ThumbIcon />
              <span>参考になった</span>
              {report.helpfulCount}
            </span>
          )}
          <span className={css({ fontVariantNumeric: "tabular-nums" })}>
            {report.viewCount} 回閲覧
          </span>
        </div>

        {!isOwnPost ? (
          <div className={css({ display: "flex", justifyContent: "flex-end", mt: "2" })}>
            <ReportDialog
              action={createReportAction.bind(
                null,
                "usage_report",
                report.id,
                `/reports/${report.id}`,
              )}
              reasonOptions={REPORT_REASON_OPTIONS}
              title="この使用レポートを通報する"
            />
          </div>
        ) : null}
      </main>

      <FabBar
        reportHref={`${materialPath}/report/new`}
        reviewHref={`${materialPath}/review/new`}
        placement="viewport"
      />
    </div>
  );
}
