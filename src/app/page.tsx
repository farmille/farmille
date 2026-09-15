import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { Suspense } from "react";
import { SkeletonList } from "@/components/SkeletonList";
import { notFound } from "next/navigation";
import * as v from "valibot";

import { AppBar, MaterialCard, ReportCard, SectionHeading } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/server/auth";
import { listHomeMaterials } from "@/server/queries/home-materials";
import { listRecentReviews } from "@/server/queries/reviews";
import { listRecentUsageReports } from "@/server/queries/usage-reports";
import { css } from "../../styled-system/css";
import { HomeHero } from "./_components/HomeHero";
import { HomeInvitations } from "./_components/HomeInvitations";
import { HomeMaterialMarquee } from "./_components/HomeMaterialMarquee";
import { HomeFooter } from "./_components/HomeFooter";
import { HomeReviewFeed } from "./_components/HomeReviewFeed";
import { HomeFeedOrder } from "./_components/HomeFeedOrder";
import { homeFeedIds } from "@/server/queries/home-order";
import { getViewerHelpfulVotes } from "@/server/queries/helpful";

const empty = css({
  p: "5",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  color: "text.subtle",
  fontSize: "md",
});
const section = css({ display: "flex", flexDirection: "column", gap: "4" });
const feedTitle = css({ m: "0", fontSize: "lg", fontWeight: "700", scrollMarginTop: "20" });

const homeParams = v.object({
  reports: v.optional(v.picklist(["newest", "helpful"]), "newest"),
  reviews: v.optional(v.picklist(["newest", "helpful"]), "helpful"),
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ reports?: string | string[]; reviews?: string | string[] }>;
}) {
  const parsed = v.safeParse(homeParams, await searchParams);
  if (!parsed.success) notFound();
  const reportSort = parsed.output.reports;
  const reviewSort = parsed.output.reviews;

  return (
    <div
      className={css({
        minH: "100dvh",
        bg: "surface.page",
        color: "text.default",
        fontFamily: "sans",
      })}
    >
      <AppBar chrome="public" active="home" variant="home" />
      <main>
        <HomeHero />
        <div
          className={css({
            maxW: "content.wide",
            mx: "auto",
            px: "4",
            pt: "8",
            tab: { px: "5", pt: "10" },
          })}
        >
          <div className={css({ display: "flex", flexDirection: "column", gap: "12" })}>
            <section aria-label="掲載資材一覧">
              <SectionHeading as="h1" title="掲載資材一覧" href="/search" linkLabel="すべて見る" />
              <Suspense
                fallback={
                  <SkeletonList variant="materialScroll" label="掲載資材を読み込んでいます" />
                }
              >
                <HomeMaterials />
              </Suspense>
            </section>
            <section className={section} aria-labelledby="producer-voices">
              <h1
                id="producer-voices"
                className={css({ m: "0", fontSize: "2xl", fontWeight: "700" })}
              >
                生産者の声
              </h1>
              <section className={section} aria-labelledby="home-reports">
                <h2 id="home-reports" className={feedTitle}>
                  実証詳細レポート
                </h2>
                <HomeFeedOrder target="reports" reportSort={reportSort} reviewSort={reviewSort} />
                <Suspense
                  key={reportSort}
                  fallback={
                    <SkeletonList
                      variant="reportScroll"
                      label="実証詳細レポートを読み込んでいます"
                    />
                  }
                >
                  <HomeReports reportSort={reportSort} reviewSort={reviewSort} />
                </Suspense>
              </section>
              <section className={section} aria-labelledby="home-reviews">
                <h2 id="home-reviews" className={feedTitle}>
                  感想口コミ
                </h2>
                <Suspense
                  fallback={
                    <SkeletonList variant="reviewScroll" label="感想口コミを読み込んでいます" />
                  }
                >
                  <HomeReviews reportSort={reportSort} reviewSort={reviewSort} />
                </Suspense>
              </section>
            </section>
            <Suspense fallback={null}>
              <HomeAccountInvitations />
            </Suspense>
          </div>
          <HomeFooter />
        </div>
      </main>
      <BottomNav active="home" />
    </div>
  );
}

async function HomeMaterials() {
  const materialsResult = await listHomeMaterials();
  return (
    <>
      <HomeMaterialMarquee>
        {materialsResult.map((material) => (
          <MaterialCard
            key={material.id}
            variant="scroll"
            name={material.name}
            maker={material.manufacturer_name}
            rating={material.avg_rating ?? 0}
            reviewCount={material.review_count}
            articleCount={material.reportCount}
            savedCount={material.savedCount}
            categories={material.categories}
            official={material.manufacturer_verified_at !== null}
            imageSrc={material.primaryImage?.url}
            href={`/materials/${material.id}`}
          />
        ))}
      </HomeMaterialMarquee>
      {materialsResult.length === 0 ? (
        <p className={empty}>表示できる資材がまだありません。</p>
      ) : null}
    </>
  );
}

async function HomeReports({
  reportSort,
  reviewSort,
}: {
  reportSort: "newest" | "helpful";
  reviewSort: "newest" | "helpful";
}) {
  const [session, reportIds] = await Promise.all([
    getSessionUser(),
    homeFeedIds("usage_report", reportSort, 3),
  ]);
  const [reportsResult, reportVotes] = await Promise.all([
    listRecentUsageReports({ limit: 3, ids: reportIds }),
    getViewerHelpfulVotes(
      session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null,
      "usage_report",
      reportIds,
    ),
  ]);
  if (!reportVotes.ok) throw new Error("実証詳細レポートの投票状態を取得できませんでした。");
  if (!reportsResult.ok)
    throw new Error("実証詳細レポートの取得に失敗しました：" + reportsResult.error);
  return (
    <>
      {reportsResult.data.length > 0 ? (
        <div
          className={css({
            display: "grid",
            gap: "3",
            gridAutoFlow: "column",
            gridAutoColumns: "85%",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            pb: "4",
            "& > *": { scrollSnapAlign: "start" },
            tab: {
              gridAutoFlow: "row",
              gridAutoColumns: "auto",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            },
          })}
        >
          {reportsResult.data.map((report) => (
            <ReportCard
              key={report.id}
              layout="list"
              title={report.title}
              summary={report.summary}
              reportId={session?.userId === report.authorUserId ? undefined : report.id}
              helpfulVoted={reportVotes.data.has(report.id)}
              currentPath={`/?reports=${reportSort}&reviews=${reviewSort}`}
              materialName={report.materialName}
              materialHref={`/materials/${report.materialId}`}
              author={report.authorHandle}
              crop={report.cropName}
              helpfulCount={report.helpfulCount}
              coverSrc={report.coverUrl ?? undefined}
              href={`/reports/${report.id}`}
            />
          ))}
        </div>
      ) : (
        <p className={empty}>
          まだ公開中の実証詳細レポートはありません。投稿は運営の確認後に公開されます。
        </p>
      )}
    </>
  );
}

async function HomeReviews({
  reportSort,
  reviewSort,
}: {
  reportSort: "newest" | "helpful";
  reviewSort: "newest" | "helpful";
}) {
  const [session, newest, helpful] = await Promise.all([
    getSessionUser(),
    homeFeedIds("review", "newest", 4),
    homeFeedIds("review", "helpful", 4),
  ]);
  // 重複投稿の本文・投票状態は一度だけ取得する。最大8件に限定する。
  const reviewIds = [...new Set([...newest, ...helpful])];
  const viewerUserId =
    session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null;
  const reviewsResult = await listRecentReviews({
    limit: Math.max(1, reviewIds.length),
    ids: reviewIds,
    viewerUserId,
  });
  if (!reviewsResult.ok) throw new Error("レビューの取得に失敗しました：" + reviewsResult.error);
  return (
    <HomeReviewFeed
      reviews={reviewsResult.data}
      orders={{ newest, helpful }}
      viewerUserId={viewerUserId}
      reportSort={reportSort}
      reviewSort={reviewSort}
    />
  );
}

async function HomeAccountInvitations() {
  const session = await getSessionUser();
  return <HomeInvitations showSignup={session === null} />;
}
