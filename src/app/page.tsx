import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import Link from "next/link";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { notFound } from "next/navigation";
import * as v from "valibot";

import { AppBar, MaterialCard, ReportCard, ReviewCard, SectionHeading } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/server/auth";
import { listHomeMaterials } from "@/server/queries/home-materials";
import { listRecentReviews } from "@/server/queries/reviews";
import { listRecentUsageReports } from "@/server/queries/usage-reports";
import { css } from "../../styled-system/css";
import { HomeHero } from "./_components/HomeHero";
import { HomeInvitations } from "./_components/HomeInvitations";
import { HomeFooter } from "./_components/HomeFooter";
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
  const [session, materialsResult, reportIds, reviewIds] = await Promise.all([
    getSessionUser(),
    listHomeMaterials(),
    homeFeedIds("usage_report", reportSort, 3),
    homeFeedIds("review", reviewSort, 4),
  ]);
  const [reportsResult, reviewsResult, reportVotes] = await Promise.all([
    listRecentUsageReports({ limit: 3, ids: reportIds }),
    listRecentReviews({
      limit: 4,
      ids: reviewIds,
      viewerUserId:
        session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null,
    }),
    getViewerHelpfulVotes(
      session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null,
      "usage_report",
      reportIds,
    ),
  ]);
  if (!reportVotes.ok) throw new Error("使用レポートの投票状態を取得できませんでした。");
  if (!reportsResult.ok)
    throw new Error("使用レポートの取得に失敗しました：" + reportsResult.error);
  if (!reviewsResult.ok) throw new Error("レビューの取得に失敗しました：" + reviewsResult.error);

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
            lg: { px: "5", pt: "10" },
          })}
        >
          <div className={css({ display: "flex", flexDirection: "column", gap: "12" })}>
            <section aria-label="掲載資材一覧">
              <SectionHeading title="掲載資材一覧" href="/search" linkLabel="すべて見る →" />
              <div
                className={css({
                  display: "flex",
                  gap: "3",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  pb: "4",
                })}
              >
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
              </div>
              {materialsResult.length === 0 ? (
                <p className={empty}>表示できる資材がまだありません。</p>
              ) : (
                <p className={css({ fontSize: "xs", color: "text.subtle" })}>
                  ※ 表示順はランダムです（広告・優先枠ではありません）。
                </p>
              )}
            </section>
            <section className={section} aria-labelledby="producer-voices">
              <h2
                id="producer-voices"
                className={css({ m: "0", fontSize: "2xl", fontWeight: "700" })}
              >
                生産者の声
              </h2>
              <section className={section} aria-labelledby="home-reports">
                <h3 id="home-reports" className={feedTitle}>
                  使用レポート
                </h3>
                <HomeFeedOrder target="reports" reportSort={reportSort} reviewSort={reviewSort} />
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
                      md: {
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
                    まだ公開中の使用レポートはありません。投稿は運営の確認後に公開されます。
                  </p>
                )}
              </section>
              <section className={section} aria-labelledby="home-reviews">
                <h3 id="home-reviews" className={feedTitle}>
                  レビュー
                </h3>
                <HomeFeedOrder target="reviews" reportSort={reportSort} reviewSort={reviewSort} />
                {reviewsResult.data.length > 0 ? (
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
                      md: {
                        gridAutoFlow: "row",
                        gridAutoColumns: "auto",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      },
                      lg: { gridTemplateColumns: "repeat(4, minmax(0, 1fr))" },
                    })}
                  >
                    {reviewsResult.data.map((review) => (
                      <div
                        key={review.id}
                        className={css({
                          bg: "surface.card",
                          borderWidth: "1px",
                          borderColor: "border.default",
                          borderRadius: "card",
                          boxShadow: "shadow",
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                        })}
                      >
                        <ReviewCard
                          className={css({ borderWidth: "0", boxShadow: "none", flex: "1" })}
                          handle={review.author?.handle ?? "匿名"}
                          authorDetails={publicProfileLabel(review.author)}
                          crop={review.crops.map((crop) => crop.name).join("・")}
                          rating={review.rating}
                          helpfulCount={review.helpfulCount}
                          reviewId={
                            session?.userId === review.author_user_id ? undefined : review.id
                          }
                          materialId={review.material_id}
                          helpfulVoted={review.helpfulVotedByViewer}
                          currentPath={`/?reports=${reportSort}&reviews=${reviewSort}`}
                          body={review.body}
                        />
                        <Link
                          href={`/materials/${review.material_id}/reviews`}
                          className={css({
                            display: "block",
                            p: "3",
                            fontSize: "sm",
                            color: "brand.primaryDeep",
                            textDecoration: "none",
                          })}
                        >
                          {review.materialName} →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={empty}>
                    まだ公開中のレビューはありません。資材を使った感想を共有してください。
                  </p>
                )}
              </section>
            </section>
            <HomeInvitations showSignup={session === null} />
          </div>
          <HomeFooter />
        </div>
      </main>
      <BottomNav active="home" />
    </div>
  );
}
