import Link from "next/link";

import { formatDateJa } from "@/components/format-date";
import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { SectionHeading } from "@/components/SectionHeading";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { Avatar, Stars } from "@/app/materials/[id]/_components/CardParts";
import type { RecentReviewItem } from "@/server/queries/reviews";
import type { RecentUsageReportItem } from "@/server/queries/usage-reports";
import { css, cva, cx } from "../../../styled-system/css";

export type VoiceMaterial = { id: string; name: string; maker: string; imageUrl: string | null };

const cardFrame = css.raw({
  display: "flex",
  flexDirection: "column",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

const scrollRowStyle = css({
  display: "flex",
  overflowX: "auto",
  scrollbarWidth: "none",
  mx: "-4",
  pt: "0.5",
  px: "4",
  pb: "1.5",
  "&::-webkit-scrollbar": { display: "none" },
  tab: { display: "grid", gap: "3", mx: "0", px: "0", overflow: "visible" },
});

const subheadingStyle = css({
  mt: "5",
  mb: "2.5",
  color: "text.muted",
  fontSize: "sm",
  fontWeight: "extrabold",
  tab: { mt: "6.5", mb: "3", fontSize: "md" },
});

const emptyTextStyle = css({ color: "text.subtle", fontSize: "sm" });

const materialRowRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2.5",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
    color: "inherit",
    textDecoration: "none",
  },
  variants: {
    placement: {
      report: { mt: "2.5", pt: "3", tab: { mt: "auto", pt: "2.5" } },
      review: { mt: "3", pt: "3" },
    },
  },
});

const thumbStyle = css({
  flex: "none",
  display: "grid",
  placeItems: "center",
  w: "8",
  h: "8",
  overflow: "hidden",
  bg: "surface.page",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  color: "text.subtle",
  fontSize: "2xs",
  letterSpacing: "0.05em",
  "& img": {
    w: "full",
    h: "full",
    objectFit: "contain",
    borderRadius: "inherit",
    bg: "surface.card",
  },
});

/** 資材ページの該当欄（実証詳細レポート・感想口コミ）へ移る行。 */
function VoiceMaterialRow({
  material,
  placement,
}: {
  material: VoiceMaterial;
  placement: "report" | "review";
}) {
  const anchor = placement === "report" ? "anchorReports" : "anchorReviews";
  return (
    <Link
      className={cx("group", materialRowRecipe({ placement }))}
      href={`/materials/${material.id}#${anchor}`}
    >
      <span className={thumbStyle} aria-hidden="true">
        {material.imageUrl ? (
          <Image alt="" src={material.imageUrl} width={34} height={34} sizes="34px" />
        ) : (
          "NO IMAGE"
        )}
      </span>
      <div className={css({ minW: "0" })}>
        <div
          className={css({
            fontSize: "sm",
            fontWeight: "bold",
            truncate: true,
            _groupHover: { color: "primary.800" },
          })}
        >
          {material.name}
        </div>
        {material.maker ? (
          <div className={css({ color: "text.subtle", fontSize: "xs", truncate: true })}>
            {material.maker}
          </div>
        ) : null}
      </div>
      <span
        className={css({ ml: "auto", color: "primary.700", fontWeight: "bold" })}
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}

function VoiceReportCard({
  report,
  material,
}: {
  report: RecentUsageReportItem;
  material: VoiceMaterial;
}) {
  const href = `/reports/${report.id}`;
  return (
    <article
      className={css(cardFrame, {
        flex: "0 0 74%",
        overflow: "hidden",
        scrollSnapAlign: "start",
        tab: { flex: "none" },
      })}
    >
      <Link
        href={href}
        className={css({
          display: "grid",
          placeItems: "center",
          aspectRatio: "image.landscape",
          overflow: "hidden",
          bg: "primary.soft",
          color: "inherit",
          "& img": { display: "block", w: "full", h: "full", objectFit: "cover" },
          tab: { aspectRatio: "image.wide" },
        })}
        aria-label={report.title}
      >
        {report.coverUrl ? (
          <Image
            alt=""
            src={report.coverUrl}
            width={640}
            height={480}
            sizes="(min-width: 900px) 360px, 74vw"
          />
        ) : (
          <Icon name="image" size="lg" />
        )}
      </Link>
      <div
        className={css({
          flex: "1",
          display: "flex",
          flexDirection: "column",
          pt: "2.5",
          px: "3",
          pb: "3",
          tab: { pb: "2.5" },
        })}
      >
        <Link
          href={href}
          className={css({
            display: "block",
            color: "inherit",
            textDecoration: "none",
            fontSize: "sm",
            fontWeight: "bold",
            lineHeight: "snug",
            tab: { h: "2lh", lineClamp: "2" },
          })}
        >
          {report.title}｜{report.cropName}
        </Link>
        {report.summary ? (
          <div
            className={css({
              mt: "1.5",
              color: "text.muted",
              fontSize: "xs",
              lineHeight: "relaxed",
              lineClamp: "2",
            })}
          >
            {report.summary}
          </div>
        ) : null}
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            mt: "auto",
            pt: "2",
            color: "text.subtle",
            fontSize: "sm",
          })}
        >
          <Avatar name={report.authorHandle} extraSmall />
          <b
            className={css({
              minW: "0",
              color: "text.muted",
              fontWeight: "normal",
              truncate: true,
            })}
          >
            {report.authorHandle}
          </b>
          <span className={css({ flex: "none", ml: "auto", fontSize: "xs" })}>
            {formatDateJa(report.publishedAt)}
          </span>
        </div>
        <PostActionsLoader
          target="usage_report"
          id={report.id}
          currentPath="/"
          helpfulCount={report.helpfulCount}
        />
        <VoiceMaterialRow material={material} placement="report" />
      </div>
    </article>
  );
}

function VoiceReviewCard({
  review,
  material,
}: {
  review: RecentReviewItem;
  material: VoiceMaterial;
}) {
  const handle = review.author?.handle ?? "退会したユーザー";
  const role = publicProfileLabel(review.author);
  const crops = review.crops.map((crop) => crop.name).join("・");
  return (
    <article
      className={css(cardFrame, {
        flex: "0 0 82%",
        p: "3.5",
        scrollSnapAlign: "start",
        tab: { flex: "none" },
      })}
    >
      <div className={css({ display: "flex", alignItems: "flex-start", gap: "2", fontSize: "sm" })}>
        <Avatar name={handle} src={review.author?.avatar_url} extraSmall />
        <div>
          <b className={css({ fontWeight: "bold" })}>{handle}</b>{" "}
          {role ? (
            <span
              className={css({
                py: "0.5",
                px: "2",
                bg: "primary.100",
                color: "primary.800",
                borderRadius: "pill",
                fontSize: "xs",
                fontWeight: "semibold",
                whiteSpace: "nowrap",
              })}
            >
              {role}
            </span>
          ) : null}
          <div className={css({ mt: "0.5", color: "text.subtle", fontSize: "xs" })}>
            {crops ? `${crops}で使用 ・ ` : ""}
            {formatDateJa(review.created_at)}
          </div>
        </div>
      </div>
      <div className={css({ mt: "2" })}>
        <Stars value={review.rating} />
      </div>
      <div
        className={css({
          flex: "1",
          mt: "2",
          color: "text.muted",
          fontSize: "sm",
          lineHeight: "prose",
          lineClamp: "4",
        })}
      >
        {review.body}
      </div>
      <PostActionsLoader
        target="review"
        id={review.id}
        currentPath="/"
        helpfulCount={review.helpfulCount}
      />
      <VoiceMaterialRow material={material} placement="review" />
    </article>
  );
}

/** ホームの「生産者の声」。新着の実証詳細レポートと感想口コミ（公開中のみ）。 */
export function HomeVoices({
  reports,
  reviews,
}: {
  reports: { report: RecentUsageReportItem; material: VoiceMaterial }[];
  reviews: { review: RecentReviewItem; material: VoiceMaterial }[];
}) {
  return (
    <section aria-labelledby="home-voices-heading" className={css({ mt: "8" })}>
      <SectionHeading
        className={css({ tab: { mb: "5", "& h2": { fontSize: "3xl" } } })}
        title={<span id="home-voices-heading">生産者の声</span>}
      />
      <h3 className={subheadingStyle}>実証詳細レポート</h3>
      {reports.length > 0 ? (
        <div
          className={cx(
            scrollRowStyle,
            css({
              gap: "2.5",
              scrollSnapType: "x mandatory",
              tab: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
            }),
          )}
        >
          {reports.map(({ report, material }) => (
            <VoiceReportCard key={report.id} report={report} material={material} />
          ))}
        </div>
      ) : (
        <div className={surfaceCardRecipe()}>
          <p className={emptyTextStyle}>公開中の実証詳細レポートはまだありません。</p>
        </div>
      )}
      <h3 className={subheadingStyle}>感想口コミ</h3>
      {reviews.length > 0 ? (
        <div
          className={cx(
            scrollRowStyle,
            css({
              gap: "3",
              scrollSnapType: "x proximity",
              tab: { gridTemplateColumns: "repeat(4, minmax(0, 1fr))" },
            }),
          )}
        >
          {reviews.map(({ review, material }) => (
            <VoiceReviewCard key={review.id} review={review} material={material} />
          ))}
        </div>
      ) : (
        <div className={surfaceCardRecipe()}>
          <p className={emptyTextStyle}>公開中の感想口コミはまだありません。</p>
        </div>
      )}
    </section>
  );
}
