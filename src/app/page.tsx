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
import { getSessionUser } from "@/server/auth";
import { listMaterials } from "@/server/queries/materials";
import { listRecentReviews } from "@/server/queries/reviews";
import { listRecentUsageReports } from "@/server/queries/usage-reports";
import { css } from "../../styled-system/css";
import { HomeHero } from "./_components/HomeHero";

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
  lg: { pb: "16" },
});

const body = css({
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  pt: "6",
  md: { px: "5" },
  lg: { pt: "10" },
});

/** 各節を同じ間隔で積む。見出しの `_first` が効くよう、節ごとに包む。 */
const sections = css({
  display: "flex",
  flexDirection: "column",
  gap: "8",
  lg: { gap: "12" },
});

const materialGrid = css({
  lg: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "3.5",
  },
});

const materialCard = css({
  lg: { w: "100%" },
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
    gap: "3.5",
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
    gap: "3.5",
    alignItems: "start",
  },
});

const cta = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4",
  bgGradient: "to-br",
  gradientFrom: "brand.primaryDeep",
  gradientTo: "brand.primary",
  borderRadius: "card",
  boxShadow: "shadow.lift",
  px: "5",
  py: "7",
  textAlign: "center",
  color: "surface.card",
  lg: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: "6",
    px: "9",
    py: "8",
    textAlign: "left",
  },
});

const ctaTitle = css({
  m: "0",
  fontSize: "lg",
  fontWeight: "700",
  lineHeight: "relaxed",
  textWrap: "balance",
  lg: { fontSize: "2xl" },
});

/** 日本語が語中で折り返さないよう、文節ごとに inline-block で区切る。 */
const phrase = css({
  display: "inline-block",
});

const ctaLead = css({
  mt: "1.5",
  mb: "0",
  color: "surface.card/88",
  fontSize: "xs",
  lineHeight: "relaxed",
  lg: { fontSize: "md" },
});

const ctaButton = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minH: "48px",
  w: "100%",
  flexShrink: "0",
  bg: "surface.card",
  color: "brand.primaryDeep",
  borderRadius: "button",
  boxShadow: "shadow",
  px: "5",
  fontWeight: "700",
  fontSize: "md",
  textDecoration: "none",
  lg: { w: "auto", px: "7" },
});

const reviewLink = css({
  textDecoration: "none",
  color: "inherit",
  display: "block",
  borderRadius: "card",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    outlineOffset: "2px",
  },
});

const emptyNote = css({
  m: "0",
  fontSize: "sm",
  color: "text.subtle",
});

export default async function HomePage() {
  const [session, featuredResult, reportsResult, reviewsResult] = await Promise.all([
    getSessionUser(),
    listMaterials({ page: 1, sort: "reviews" }),
    listRecentUsageReports({ limit: 4 }),
    listRecentReviews({ limit: 4 }),
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
  const featured = featuredResult.data.items.slice(0, 8);
  const reports = reportsResult.data;
  const reviews = reviewsResult.data;
  const showSignupCta = session === null;

  return (
    <div className={shell}>
      <AppBar chrome="public" active="home" variant="home" />
      <main className={main}>
        <HomeHero />

        <div className={body}>
          <div className={sections}>
            <section>
              <SectionHeading title="注目のBS資材" href="/search" linkLabel="探す →" />
              {featured.length > 0 ? (
                <MaterialCardRail className={materialGrid}>
                  {featured.map((material, index) => (
                    <MaterialCard
                      key={material.id}
                      className={materialCard}
                      variant="scroll"
                      name={material.name}
                      maker={material.manufacturer_name}
                      rating={material.avg_rating ?? 0}
                      reviewCount={material.review_count}
                      official={material.manufacturer_verified_at !== null}
                      imageSrc={material.primaryImage?.url}
                      href={`/materials/${material.id}`}
                      preload={index === 0}
                    />
                  ))}
                </MaterialCardRail>
              ) : (
                <p className={emptyNote}>表示できる資材がまだありません。</p>
              )}
            </section>

            {reports.length > 0 ? (
              <section>
                <SectionHeading
                  title="新着の使用レポート"
                  href="/articles"
                  linkLabel="記事を読む →"
                />
                <div className={reportRail}>
                  {reports.map((report, index) => (
                    <ReportCard
                      key={report.id}
                      layout="scroll"
                      title={report.title}
                      author={report.authorHandle}
                      crop={report.cropName}
                      helpfulCount={report.helpfulCount}
                      coverSrc={report.coverUrl ?? undefined}
                      href={`/reports/${report.id}`}
                      preload={index === 0}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
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
                <p className={emptyNote}>まだ公開中のレビューはありません。</p>
              )}
            </section>

            {showSignupCta ? (
              <div className={cta}>
                <div>
                  <h2 className={ctaTitle}>
                    <span className={phrase}>あなたの一言が、</span>
                    <span className={phrase}>次の農家の判断材料になる。</span>
                  </h2>
                  <p className={ctaLead}>
                    <span className={phrase}>匿名で参加OK。</span>
                    <span className={phrase}>実名・所属の公開は不要です。</span>
                  </p>
                </div>
                <Link href="/signup" className={ctaButton}>
                  無料で登録する
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <BottomNav active="home" />
    </div>
  );
}
