import Link from "next/link";
import type { ReactNode } from "react";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { ReportDialog } from "@/components/ReportDialog";
import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";

import { MockAvatar, MockChip, MockStars } from "@/app/materials/[id]/_components/MockParts";

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
 * 見本の reviewCard(…, product)（`.card.rc` の上に「〇〇 の感想口コミ」）。
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
      <span className="rc-name">{author.handle}</span>
    </>
  );
  return (
    <article className="card rc">
      <div className="rc-prod">
        <Link href={`/materials/${review.materialId}#review-${review.id}`}>
          {review.materialName} の感想口コミ
        </Link>
      </div>
      <div className="rc-head">
        {author.href ? (
          <Link
            href={author.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {head}
          </Link>
        ) : (
          head
        )}
        {author.label ? (
          <span className="type-label" style={{ fontSize: 9.5 }}>
            {author.label}
          </span>
        ) : null}
      </div>
      <div className="rc-stars">
        <MockStars value={review.rating} />
        <span className="score-num">{review.rating.toFixed(1)}</span>
      </div>
      {review.cropName ? (
        <div className="rc-crops">
          <MockChip>{review.cropName}</MockChip>
        </div>
      ) : null}
      {review.body ? (
        <div className="rc-text" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {review.body}
        </div>
      ) : null}
      {review.photos && review.photos.length > 0 ? (
        <div className="review-photos">
          {review.photos.map((photo) => (
            <div key={photo.id} className="rphoto">
              <Image src={photo.url} alt={photo.alt} width={140} height={140} unoptimized />
            </div>
          ))}
        </div>
      ) : null}
      <div className="rc-foot" style={{ flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>{actions}</div>
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
