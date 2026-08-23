import Link from "next/link";

import {
  AppBar,
  MaterialCard,
  MaterialCardRail,
  ReportCard,
  ReviewCard,
  SectionHeading,
} from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { HomeSearchEntry } from "@/components/search/HomeSearchEntry";
import { getSessionUser } from "@/server/auth";
import { listMaterials } from "@/server/queries/materials";
import { listRecentReviews } from "@/server/queries/reviews";
import { listRecentUsageReports } from "@/server/queries/usage-reports";
import { css } from "../../styled-system/css";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const main = css({
  flex: "1",
  pb: "4",
});

const hero = css({
  w: "100%",
  maxW: "content.reading",
  mx: "auto",
  px: "4",
  pt: "5.5",
  pb: "1",
  textAlign: "center",
});

const body = css({
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  pt: "3",
  md: { px: "5" },
});

const reportRail = css({
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "54%",
  gap: "2.5",
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  pb: "1.5",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  lg: {
    gridAutoFlow: "row",
    gridAutoColumns: "auto",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    overflowX: "visible",
    scrollSnapType: "none",
    pb: "0",
  },
});

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  lg: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    alignItems: "start",
  },
});

const cta = css({
  bg: "brand.primary",
  borderRadius: "card",
  px: "4",
  py: "5",
  textAlign: "center",
  color: "surface.card",
  mt: "6",
});

const ctaButton = css({
  display: "inline-flex",
  mt: "3",
  bg: "surface.card",
  color: "brand.primaryDeep",
  borderRadius: "button",
  px: "4",
  py: "3",
  fontWeight: "700",
  fontSize: "md",
  textDecoration: "none",
  justifyContent: "center",
  w: "100%",
  lg: { w: "auto", px: "6" },
});

const reviewLink = css({
  textDecoration: "none",
  color: "inherit",
  display: "block",
});

export default async function HomePage() {
  const [session, featuredResult, reportsResult, reviewsResult] = await Promise.all([
    getSessionUser(),
    listMaterials({ page: 1, sort: "reviews" }),
    listRecentUsageReports({ limit: 4 }),
    listRecentReviews({ limit: 2 }),
  ]);

  if (!featuredResult.ok) {
    throw new Error(`注目資材の取得に失敗しました: ${featuredResult.error}`);
  }
  if (!reportsResult.ok) {
    throw new Error(`新着使用レポートの取得に失敗しました: ${reportsResult.error}`);
  }
  if (!reviewsResult.ok) {
    throw new Error(`新着レビューの取得に失敗しました: ${reviewsResult.error}`);
  }
  const featured = featuredResult.data.items.slice(0, 3);
  const reports = reportsResult.data;
  const reviews = reviewsResult.data;
  const showSignupCta = session === null;

  return (
    <div className={shell}>
      <AppBar chrome="public" active="home" variant="home" />
      <main className={main}>
        <div className={hero}>
          <h1
            className={css({ fontSize: "3xl", fontWeight: "700", letterSpacing: "0.01em", m: 0 })}
          >
            農業の未来を、みんなの知恵で。
          </h1>
          <p
            className={css({
              fontSize: "sm",
              color: "text.muted",
              mt: "2",
              mb: "0",
              lineHeight: "1.6",
            })}
          >
            BS資材の、農家によるレビュー・データベース。
          </p>
        </div>

        <div className={body}>
          <HomeSearchEntry />

          <SectionHeading title="注目のBS資材" href="/search" linkLabel="探す →" />
          {featured.length > 0 ? (
            <MaterialCardRail>
              {featured.map((material, index) => (
                <MaterialCard
                  key={material.id}
                  variant="scroll"
                  name={material.name}
                  maker={material.manufacturer_name}
                  rating={material.avg_rating ?? 0}
                  reviewCount={material.review_count}
                  official={material.seller_id !== null}
                  imageSrc={material.primaryImage?.url}
                  href={`/materials/${material.id}`}
                  preload={index === 0}
                />
              ))}
            </MaterialCardRail>
          ) : (
            <p className={css({ fontSize: "sm", color: "text.subtle" })}>
              表示できる資材がまだありません。
            </p>
          )}

          {reports.length > 0 ? (
            <>
              <SectionHeading
                title="新着の使用レポート"
                href="/articles"
                linkLabel="記事を読む →"
              />
              <div className={reportRail}>
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    layout="scroll"
                    title={report.title}
                    author={report.authorHandle}
                    crop={report.cropName}
                    helpfulCount={report.helpfulCount}
                    coverSrc={report.coverUrl ?? undefined}
                    href={`/reports/${report.id}`}
                  />
                ))}
              </div>
            </>
          ) : null}

          <SectionHeading title="新着レビュー" href="/search" linkLabel="レビューを読む →" />
          {reviews.length > 0 ? (
            <div className={stack}>
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/materials/${review.material_id}#sec-reviews`}
                  className={reviewLink}
                >
                  <ReviewCard
                    handle={review.author?.handle ?? "匿名"}
                    crop={review.crops.map(({ name }) => name).join("・")}
                    rating={review.rating}
                    helpfulCount={review.helpfulCount}
                    body={review.body}
                    materialName={review.materialName}
                    photoCount={review.photos.length}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className={css({ fontSize: "sm", color: "text.subtle", my: "2" })}>
              まだ公開中のレビューはありません。
            </p>
          )}

          {showSignupCta ? (
            <div className={cta}>
              <h3 className={css({ fontSize: "md", fontWeight: "700", m: 0 })}>
                あなたの一言が、次の農家の判断材料になる。
              </h3>
              <p
                className={css({
                  fontSize: "xs",
                  opacity: "0.9",
                  mt: "1.5",
                  mb: "0",
                  lineHeight: "1.5",
                })}
              >
                匿名で参加OK。実名・所属の公開は不要です。
              </p>
              <Link href="/signup" className={ctaButton}>
                無料で登録する
              </Link>
            </div>
          ) : null}
        </div>
      </main>
      <BottomNav active="home" />
    </div>
  );
}
