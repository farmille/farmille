import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/Avatar";
import { badgeRecipe } from "@/components/Badge";
import type { PostAuthor } from "@/lib/public-profile-label";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { ReportDialog } from "@/components/ReportDialog";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";

import { css } from "../../styled-system/css";

import { Stars } from "@/app/materials/[id]/_components/CardParts";
import { CropLine } from "@/components/CropLine";

const card = css(surfaceCardRecipe.raw({ padding: "cozy" }));

const materialLine = css({ mb: "1", color: "text.subtle", textStyle: "note" });

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
  color: "[inherit]",
  textDecoration: "none",
});

const authorName = css({ textStyle: "body", fontWeight: "bold", overflowWrap: "anywhere" });

const authorLabel = css(badgeRecipe.raw({ variant: "type" }), {
  maxW: "full",
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

const crops = css({ mt: "1", mb: "1.5", textStyle: "note", color: "text.muted" });

const text = css({
  color: "text.muted",
  textStyle: "body",
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
  flex: "none",
  w: "16",
  h: "16",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  borderRadius: "media",
  bg: "primary.soft",
  "& img": { display: "block", w: "full", h: "full", objectFit: "cover" },
});

// 操作行は縮めずに1行を保ち、入りきらないときは通報を次の行の右端へ回す
const foot = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "2.5",
  mt: "3",
});

type ProfileReviewCardProps = {
  review: {
    id: string;
    materialId: string;
    materialName: string;
    cropName: string;
    rating: number;
    body: string;
    photos?: ReadonlyArray<{ id: string; url: string; alt: string }>;
  };
  author: PostAuthor;
  actions: ReactNode;
  reportReturnPath?: string;
};

export function ProfileReviewCard({
  review,
  author,
  actions,
  reportReturnPath,
}: ProfileReviewCardProps) {
  const head = (
    <>
      <Avatar name={author.name} src={author.avatarUrl} size="sm" />
      <span className={authorName}>{author.name}</span>
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
        {author.href === null ? (
          head
        ) : (
          <Link href={author.href} className={authorLink}>
            {head}
          </Link>
        )}
        {author.label ? <span className={authorLabel}>{author.label}</span> : null}
      </div>
      <div className={rating}>
        <Stars value={review.rating} />
        <span className={score}>{review.rating.toFixed(1)}</span>
      </div>
      {review.cropName ? (
        <div className={crops}>
          <CropLine crops={[review.cropName]} />
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
        <div className={css({ flexGrow: "1", flexShrink: "0" })}>{actions}</div>
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
