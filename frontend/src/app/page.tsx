import Link from "next/link";

import { AppBar, MaterialCard, ReportCard, ReviewCard, SectionHeading } from "@/components";
import { BottomNav } from "@/components/bottom-nav";
import { TagSearchBox } from "@/components/search/tag-search-box";
import { getSessionUser } from "@/server/auth";
import { listMaterials } from "@/server/queries/materials";
import { listRecentReviews } from "@/server/queries/reviews";
import {
  listSearchSuggestions,
  listTagsByPairs,
  POPULAR_TAG_PAIRS,
  SEASONAL_TAG_PAIRS,
} from "@/server/queries/tags";
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
  px: "4",
  pt: "5.5",
  pb: "1",
  textAlign: "center",
});

const body = css({
  px: "4",
  pt: "3",
});

const scrollRow = css({
  display: "flex",
  gap: "2.5",
  overflowX: "auto",
  pb: "1.5",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
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
});

const reviewLink = css({
  textDecoration: "none",
  color: "inherit",
  display: "block",
});

export default async function HomePage() {
  const [
    session,
    featuredResult,
    reportsResult,
    reviewsResult,
    popularResult,
    seasonalResult,
    catalogResult,
  ] = await Promise.all([
    getSessionUser(),
    listMaterials({ page: 1, sort: "reviews" }),
    listRecentUsageReports({ limit: 4 }),
    listRecentReviews({ limit: 2 }),
    listTagsByPairs(POPULAR_TAG_PAIRS),
    listTagsByPairs(SEASONAL_TAG_PAIRS),
    listSearchSuggestions(),
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
  if (!popularResult.ok || !seasonalResult.ok || !catalogResult.ok) {
    throw new Error("タグ候補の取得に失敗しました。");
  }

  const featured = featuredResult.data.items.slice(0, 3);
  const reports = reportsResult.data;
  const reviews = reviewsResult.data;
  const showSignupCta = session === null;

  return (
    <div className={shell}>
      <AppBar variant="home" />
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
          <TagSearchBox
            variant="home"
            selected={[]}
            sort="reviews"
            popular={popularResult.data}
            seasonal={seasonalResult.data}
            catalog={catalogResult.data}
            placeholder="作物・悩み・資材名を入力"
          />

          <SectionHeading title="注目のBS資材" href="/search" linkLabel="探す →" />
          {featured.length > 0 ? (
            <div className={scrollRow}>
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
            </div>
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
              <div className={scrollRow}>
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
                    crop={review.crop?.name ?? "作物未設定"}
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
