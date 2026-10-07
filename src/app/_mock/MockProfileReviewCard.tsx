import Link from "next/link";
import type { ReactNode } from "react";

import { badgeRecipe } from "@/components/Badge";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { ReportDialog } from "@/components/ReportDialog";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";

import { css } from "../../../styled-system/css";

import { MockAvatar, MockChip, MockStars } from "@/app/materials/[id]/_components/MockParts";

const card = css(surfaceCardRecipe.raw({ padding: "cozy" }));

const materialLine = css({ mb: "1", color: "text.subtle", fontSize: "xs" });

const headRow = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  columnGap: "2",
  rowGap: "1",
});

const authorLink = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  color: "inherit",
  textDecoration: "none",
});

const authorName = css({ fontSize: "md", fontWeight: "bold", overflowWrap: "anywhere" });

const authorLabel = css(badgeRecipe.raw({ variant: "type" }), {
  maxW: "100%",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
});

const rating = css({ display: "flex", alignItems: "center", gap: "2", mt: "2" });

const score = css({
  color: "accent.warn",
  fontSize: "md",
  fontWeight: "extrabold",
  fontVariantNumeric: "tabular-nums",
});

const crops = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1.5",
  mt: "1",
  mb: "1.5",
});

const text = css({
  color: "text.muted",
  fontSize: "md",
  lineHeight: "relaxed",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

const photos = css({
  display: "flex",
  gap: "2",
  mt: "2.5",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

const photo = css({
  flex: "0 0 auto",
  w: "16",
  h: "16",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  borderRadius: "media",
  bg: "primary.soft",
  "& img": { display: "block", w: "100%", h: "100%", objectFit: "cover" },
});

const foot = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "2.5",
  mt: "3",
});

type MockProfileReviewCardProps = {
  review: {
    id: string;
    materialId: string;
    materialName: string;
    cropName: string;
    rating: number;
    body: string;
    photos?: ReadonlyArray<{ id: string; url: string; alt: string }>;
  };
  author: { handle: string; avatarUrl?: string | null; href?: string; label?: string };
  /** 参考になった・保存・閲覧数（PostActionsLoader）。 */
  actions: ReactNode;
  /** 通報の戻り先。渡さないときは通報ボタンを出さない（本人が自分の公開プロフィールを見ているとき）。 */
  reportReturnPath?: string;
};

/**
 * 資材名つきの感想口コミカード（上に「〇〇 の感想口コミ」）。
 * マイページ・公開プロフィールの投稿一覧で使う。
 */
export function MockProfileReviewCard({
  review,
  author,
  actions,
  reportReturnPath,
}: MockProfileReviewCardProps) {
  const head = (
    <>
      <MockAvatar name={author.handle} src={author.avatarUrl} size={30} />
      <span className={authorName}>{author.handle}</span>
    </>
  );
  return (
    <article className={card}>
      <div className={materialLine}>
        <Link href={`/materials/${review.materialId}#review-${review.id}`}>
          {review.materialName} の感想口コミ
        </Link>
      </div>
      <div className={headRow}>
        {author.href ? (
          <Link href={author.href} className={authorLink}>
            {head}
          </Link>
        ) : (
          head
        )}
        {author.label ? <span className={authorLabel}>{author.label}</span> : null}
      </div>
      <div className={rating}>
        <MockStars value={review.rating} />
        <span className={score}>{review.rating.toFixed(1)}</span>
      </div>
      {review.cropName ? (
        <div className={crops}>
          <MockChip>{review.cropName}</MockChip>
        </div>
      ) : null}
      {review.body ? <div className={text}>{review.body}</div> : null}
      {review.photos && review.photos.length > 0 ? (
        <div className={photos}>
          {review.photos.map((item) => (
            <div key={item.id} className={photo}>
              <Image src={item.url} alt={item.alt} width={140} height={140} unoptimized />
            </div>
          ))}
        </div>
      ) : null}
      <div className={foot}>
        <div className={css({ flex: "1", minW: "0" })}>{actions}</div>
        {reportReturnPath === undefined ? null : (
          <ReportDialog
            action={createReportAction.bind(null, "review", review.id, reportReturnPath)}
            reasonOptions={REPORT_REASON_OPTIONS}
            title="この感想口コミを通報する"
          />
        )}
      </div>
    </article>
  );
}
