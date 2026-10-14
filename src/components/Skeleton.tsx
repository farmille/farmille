import type { ReactNode } from "react";
import { css, cva } from "../../styled-system/css";

// 読み込み領域を1回だけ通知し、装飾用の矩形は読み上げ対象から外す。
export function SkeletonRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

const skeletonRecipe = cva({
  base: {
    display: "block",
    bg: "border.default",
    borderRadius: "button",
    flexShrink: "0",
    animation: "skeletonPulse",
    _motionReduce: { animation: "none" },
  },
  variants: {
    variant: {
      text: { h: "skeleton.text", w: "100%" },
      short: { h: "skeleton.short", w: "60%" },
      title: { h: "skeleton.title", w: "85%" },
      avatar: { w: "skeleton.avatar", h: "skeleton.avatar", borderRadius: "pill" },
      thumbnail: { w: "skeleton.thumbnail", h: "skeleton.thumbnail" },
      hero: { w: "100%", aspectRatio: "image.wide" },
      product: { w: "100%", aspectRatio: "image.landscape" },
      materialHero: { w: "skeleton.materialHero", aspectRatio: "image.square" },
      reference: { w: "skeleton.control", aspectRatio: "image.square" },
      control: { w: "100%", h: "skeleton.control" },
    },
  },
  defaultVariants: { variant: "text" },
});

export function Skeleton({
  variant = "text",
}: {
  variant?:
    | "text"
    | "short"
    | "title"
    | "avatar"
    | "thumbnail"
    | "hero"
    | "product"
    | "materialHero"
    | "control"
    | "reference";
}) {
  return <span aria-hidden="true" className={skeletonRecipe({ variant })} />;
}

const lines = css({ display: "grid", gap: "2.5", minW: "0", flex: "1" });
const card = css({
  bg: "surface.card",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  overflow: "hidden",
  boxShadow: "shadow",
});

// MaterialCard の scroll variant と同じ、影のない細い縁の面
const scrollCard = css({
  bg: "surface.panel",
  borderWidth: "2px",
  borderColor: "border.subtle",
  borderRadius: "banner",
  p: "0.5",
  overflow: "hidden",
});

export function MaterialCardSkeleton({ variant = "list" }: { variant?: "list" | "scroll" }) {
  return (
    <div className={variant === "scroll" ? scrollCard : card}>
      {variant === "scroll" ? <Skeleton variant="product" /> : null}
      <div className={css({ display: "flex", gap: "3", p: "3", alignItems: "start" })}>
        {variant === "list" ? <Skeleton variant="thumbnail" /> : null}
        <div className={lines}>
          <Skeleton />
          <Skeleton variant="short" />
          <Skeleton variant="short" />
          {variant === "list" ? (
            <>
              <Skeleton />
              <Skeleton variant="short" />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ArticleCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" | "scroll" }) {
  return (
    <div className={card}>
      <Skeleton variant={layout === "scroll" ? "product" : "hero"} />
      <div className={css({ p: "3", display: "grid", gap: "2.5" })}>
        <Skeleton />
        <Skeleton />
        <Skeleton variant="short" />
        <Skeleton variant="short" />
        {layout === "list" ? (
          <>
            <Skeleton />
            <Skeleton variant="short" />
            <Skeleton variant="control" />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className={card}>
      <div className={css({ p: "3.5", display: "grid", gap: "3" })}>
        <div className={css({ display: "flex", gap: "2", alignItems: "center" })}>
          <Skeleton variant="avatar" />
          <div className={lines}>
            <Skeleton variant="short" />
            <Skeleton variant="short" />
          </div>
        </div>
        <Skeleton variant="short" />
        <Skeleton />
        <Skeleton />
        <Skeleton variant="short" />
      </div>
    </div>
  );
}

export function MaterialHeroSkeleton() {
  return (
    <div className={card}>
      <div className={css({ p: "3.5", display: "grid", gap: "4" })}>
        <div className={css({ display: "flex", gap: "3.5", alignItems: "start" })}>
          <Skeleton variant="materialHero" />
          <div className={lines}>
            <Skeleton variant="title" />
            <Skeleton variant="short" />
            <Skeleton />
            <Skeleton variant="short" />
          </div>
        </div>
        <Skeleton variant="control" />
      </div>
    </div>
  );
}

export function RatingSkeleton() {
  return (
    <div className={css({ display: "flex", gap: "4", p: "4" })}>
      <Skeleton variant="thumbnail" />
      <div className={lines}>
        <Skeleton />
        <Skeleton />
        <Skeleton variant="short" />
        <Skeleton variant="short" />
        <Skeleton variant="short" />
      </div>
    </div>
  );
}

export function ReadingSkeleton({ variant = "article" }: { variant?: "article" | "report" }) {
  return (
    <SkeletonRegion label="本文を読み込んでいます">
      <div className={css({ display: "grid", gap: "4" })}>
        <Skeleton variant="title" />
        <Skeleton variant="title" />
        <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
          <Skeleton variant="avatar" />
          <Skeleton variant="short" />
        </div>
        {variant === "report" ? (
          <div className={card}>
            <div className={css({ display: "flex", alignItems: "start", gap: "2.5", p: "3" })}>
              <Skeleton variant="reference" />
              <div className={lines}>
                <Skeleton variant="short" />
                <Skeleton />
                <Skeleton variant="short" />
              </div>
            </div>
          </div>
        ) : null}
        <Skeleton variant="hero" />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton variant="short" />
        <Skeleton variant="title" />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </SkeletonRegion>
  );
}

// 資材詳細の定義リストと同じ2列比率・行間を予約する。
export function MaterialDetailsSkeleton() {
  return (
    <div className={card}>
      {Array.from({ length: 12 }, (_, row) => (
        <div
          key={row}
          className={css({
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
            gap: "3",
            px: "3.5",
            py: "3",
            borderTopWidth: "1px",
            borderColor: "border.default",
            _first: { borderTopWidth: "0" },
          })}
        >
          <Skeleton variant="short" />
          <Skeleton />
        </div>
      ))}
    </div>
  );
}
