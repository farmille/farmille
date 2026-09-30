"use client";
import { publicProfileLabel } from "@/lib/public-profile-label";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import * as v from "valibot";
import { ReviewCard } from "@/components/ReviewCard";
import { Icon } from "@/components/Icon";
import type { RecentReviewItem } from "@/server/queries/reviews";
import type { HomeFeedSort } from "@/server/queries/home-order";
import { css } from "../../../styled-system/css";
import { HomeFeedOrder } from "./HomeFeedOrder";

export function HomeReviewFeed({
  reviews,
  actions,
  orders,
  viewerUserId,
  reportSort,
  reviewSort,
}: {
  reviews: RecentReviewItem[];
  actions?: { id: string; node: React.ReactNode }[];
  orders: { newest: string[]; helpful: string[] };
  viewerUserId: string | null;
  reportSort: HomeFeedSort;
  reviewSort: HomeFeedSort;
}) {
  const carousel = useRef<HTMLDivElement>(null);
  const params = useSearchParams();
  const currentReviewSort = v.parse(
    v.picklist(["newest", "helpful"]),
    params.get("reviews") ?? reviewSort,
  );
  const currentReportSort = v.parse(
    v.picklist(["newest", "helpful"]),
    params.get("reports") ?? reportSort,
  );
  // 並び順を変えたら先頭へ戻す。カードの状態とページの縦位置は保持する。
  useLayoutEffect(() => {
    if (carousel.current) carousel.current.scrollLeft = 0;
  }, [currentReviewSort]);
  const ids = orders[currentReviewSort];
  const currentPath = `/?reports=${currentReportSort}&reviews=${currentReviewSort}#home-reviews`;

  return (
    <>
      <HomeFeedOrder
        target="reviews"
        reportSort={currentReportSort}
        reviewSort={currentReviewSort}
        local
      />
      <div
        ref={carousel}
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
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
          pc: { gridTemplateColumns: "repeat(4, minmax(0, 1fr))" },
        })}
      >
        {/* 同じ投稿は1つのカードとして保持し、非表示を経ても投票状態を失わない。 */}
        {reviews
          .toSorted((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
          .map((review) => (
            <div key={review.id} hidden={!ids.includes(review.id)} data-review-id={review.id}>
              <div
                className={css({
                  bg: "surface.card",
                  borderWidth: "1px",
                  borderColor: "border.default",
                  borderRadius: "card",
                  boxShadow: "shadow",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  h: "100%",
                })}
              >
                <ReviewCard
                  actions={actions?.find((entry) => entry.id === review.id)?.node}
                  className={css({ borderWidth: "0", boxShadow: "none", flex: "1" })}
                  handle={review.author?.handle ?? "匿名"}
                  authorDetails={publicProfileLabel(review.author)}
                  crop={review.crops.map((crop) => crop.name).join("・")}
                  rating={review.rating}
                  helpfulCount={review.helpfulCount}
                  reviewId={review.id}
                  canManage={viewerUserId === review.author_user_id}
                  materialId={review.material_id}
                  helpfulVoted={review.helpfulVotedByViewer}
                  currentPath={currentPath}
                  body={review.body}
                />
                <Link
                  href={`/materials/${review.material_id}/reviews`}
                  className={css({
                    display: "block",
                    p: "3",
                    fontSize: "sm",
                    color: "primary.700",
                    textDecoration: "none",
                  })}
                >
                  {review.materialName} <Icon name="arrow_forward" size="sm" />
                </Link>
              </div>
            </div>
          ))}
      </div>
      {!reviews.some((review) => ids.includes(review.id)) ? (
        <p
          className={css({
            p: "5",
            borderWidth: "1px",
            borderColor: "border.default",
            borderRadius: "card",
            bg: "surface.card",
            color: "text.subtle",
            fontSize: "md",
          })}
        >
          まだ公開中の感想口コミはありません。資材を使った感想を共有してください。
        </p>
      ) : null}
    </>
  );
}
