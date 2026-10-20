import type { ReactNode } from "react";
import { css, cva } from "../../styled-system/css";
import {
  ArticleCardSkeleton,
  MaterialCardSkeleton,
  ReviewCardSkeleton,
  Skeleton,
  SkeletonRegion,
} from "./Skeleton";

const layout = cva({
  base: { display: "grid", gap: "3" },
  variants: {
    variant: {
      materials: { gap: "2.5", tab: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } },
      articles: {
        gap: "2.5",
        mt: "3",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        tab: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
        pc: { gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "4" },
      },
      materialScroll: {
        gridAutoFlow: "column",
        gridAutoColumns: "[{sizes.card.materialMobile}]",
        overflowX: "auto",
        pb: "4",
        tab: { gridAutoColumns: "[{sizes.card.material}]" },
      },
      reportScroll: {
        gridAutoFlow: "column",
        gridAutoColumns: "[85%]",
        overflowX: "auto",
        pb: "4",
        tab: {
          gridAutoFlow: "row",
          gridAutoColumns: "[auto]",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        },
      },
      reviewScroll: {
        gridAutoFlow: "column",
        gridAutoColumns: "[85%]",
        overflowX: "auto",
        pb: "4",
        tab: {
          gridAutoFlow: "row",
          gridAutoColumns: "[auto]",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        },
        pc: { gridTemplateColumns: "repeat(4, minmax(0, 1fr))" },
      },
      materialReports: {
        gridAutoFlow: "column",
        gridAutoColumns: "[54%]",
        overflowX: "auto",
        gap: "2.5",
        pb: "1",
        tab: {
          gridAutoFlow: "row",
          gridAutoColumns: "[auto]",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        },
      },
      reviews: {},
    },
  },
});

type Variant =
  | "materials"
  | "articles"
  | "materialScroll"
  | "reportScroll"
  | "reviewScroll"
  | "materialReports"
  | "reviews";

// 件数を示す値は取得前に捏造せず、カードの配置だけを予約する。
export function SkeletonList({ variant, label }: { variant: Variant; label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={layout({ variant })}>
        {(variant === "reportScroll" || variant === "materialReports" || variant === "reviews"
          ? ["first", "second", "third"]
          : ["first", "second", "third", "fourth"]
        ).map((key) => (
          <div key={key}>
            {variant === "materials" || variant === "materialScroll" ? (
              <MaterialCardSkeleton variant={variant === "materials" ? "list" : "scroll"} />
            ) : variant === "reviews" || variant === "reviewScroll" ? (
              <ReviewCardSkeleton />
            ) : (
              <ArticleCardSkeleton
                layout={
                  variant === "materialReports"
                    ? "scroll"
                    : variant === "reportScroll"
                      ? "list"
                      : "grid"
                }
              />
            )}
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function SearchResultsSkeleton({ controls }: { controls?: ReactNode }) {
  return (
    <>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2.5",
          mt: "4.5",
          mb: "2.5",
          minH: "skeleton.avatar",
        })}
      >
        <div className={css({ w: "skeleton.count" })}>
          <SkeletonRegion label="検索件数を読み込んでいます">
            <Skeleton variant="short" />
          </SkeletonRegion>
        </div>
        {controls}
      </div>
      <SkeletonList variant="materials" label="資材の検索結果を読み込んでいます" />
    </>
  );
}
