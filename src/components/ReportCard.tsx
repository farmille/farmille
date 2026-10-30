import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { PostActions } from "./PostActions";
import { cva, css, cx } from "../../styled-system/css";
import { Badge } from "./Badge";
import { surfaceCardRecipe } from "./SurfaceCard";
import { Icon } from "@/components/Icon";

const cardRecipe = cva({
  base: {
    overflow: "hidden",
    textDecoration: "none",
    color: "[inherit]",
    display: "block",
  },
  variants: {
    layout: {
      /** ホーム横スクロール */
      scroll: {
        scrollSnapAlign: "start",
      },
      /** 2列グリッド */
      grid: {},
      /** 一覧フル幅 */
      list: {},
    },
  },
  defaultVariants: {
    layout: "list",
  },
});

const coverRecipe = cva({
  base: {
    bg: "primary.100",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    color: "text.brandOnSoft",
  },
  variants: {
    layout: {
      scroll: { aspectRatio: "image.landscape" },
      grid: { aspectRatio: "image.wide" },
      list: { aspectRatio: "image.wide" },
    },
  },
  defaultVariants: {
    layout: "list",
  },
});

const bodyRecipe = cva({
  base: {},
  variants: {
    layout: {
      scroll: { px: "3", pt: "2.5", pb: "2.5" },
      grid: { px: "2.5", pt: "2", pb: "2.5" },
      list: { px: "3.5", py: "3" },
    },
  },
  defaultVariants: {
    layout: "list",
  },
});

export type ReportCardProps = {
  title: string;
  author: string;
  authorHref?: string;
  avatarSrc?: string;
  crop: string;
  helpfulCount: number;
  viewCount?: number;
  summary?: string;
  materialName?: string;
  materialHref?: string;
  reportId?: string;
  helpfulVoted?: boolean;
  currentPath?: string;
  href?: string;
  coverSrc?: string;
  layout?: "scroll" | "grid" | "list";
  preload?: boolean;
  actions?: ReactNode;
  className?: string;
};

/** 実証詳細レポートのカード（横スクロール・グリッド・一覧）。 */
export function ReportCard({
  title,
  author,
  authorHref,
  avatarSrc,
  crop,
  helpfulCount,
  viewCount,
  summary,
  materialName,
  materialHref,
  reportId,
  helpfulVoted = false,
  currentPath,
  href = "#",
  coverSrc,
  layout = "list",
  preload = false,
  actions,
  className,
}: ReportCardProps) {
  const compact = layout === "scroll" || layout === "grid";

  const authorContent = (
    <>
      <Avatar name={author} src={avatarSrc} size={compact ? "2xs" : "xs"} />
      <span>{author}</span>
    </>
  );

  return (
    <article
      className={cx(surfaceCardRecipe({ padding: "flush" }), cardRecipe({ layout }), className)}
    >
      <Link
        href={href}
        aria-label={title}
        className={css({ display: "block", color: "[inherit]", textDecoration: "none" })}
      >
        <div className={coverRecipe({ layout })} data-ui="report-card-image">
          {coverSrc ? (
            <Image
              alt=""
              className={css({
                display: "block",
                w: "full",
                h: "full",
                objectFit: "cover",
              })}
              height={480}
              preload={preload}
              sizes={
                layout === "scroll"
                  ? "(max-width: 767px) 54vw, 280px"
                  : layout === "grid"
                    ? "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
                    : "(max-width: 768px) 100vw, 768px"
              }
              src={coverSrc}
              width={640}
            />
          ) : (
            <Icon name="image" size="lg" />
          )}
        </div>
      </Link>
      <div className={bodyRecipe({ layout })}>
        <Link
          href={href}
          className={css({
            display: "block",
            color: "[inherit]",
            textDecoration: "none",
            textStyle: "body",
            fontWeight: "bold",
          })}
        >
          {title}
        </Link>
        {summary ? (
          <p
            className={css({
              textStyle: "supporting",
              color: "text.muted",
              lineClamp: 3,
            })}
          >
            {summary}
          </p>
        ) : null}
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: compact ? "1" : "1.5",
            textStyle: "note",
            color: "text.muted",
            mt: compact ? "1.5" : "2",
            flexWrap: "wrap",
          })}
        >
          {authorHref ? (
            <Link
              href={authorHref}
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: compact ? "1" : "1.5",
                color: "[inherit]",
                textDecoration: "none",
              })}
            >
              {authorContent}
            </Link>
          ) : (
            <span
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: compact ? "1" : "1.5",
              })}
            >
              {authorContent}
            </span>
          )}
          {!compact ? <Badge variant="type">{crop}</Badge> : null}
        </div>
        {actions ?? (
          <PostActions
            id={reportId}
            target="usage_report"
            currentPath={currentPath ?? href}
            helpfulCount={helpfulCount}
            voted={helpfulVoted}
            saved={false}
            viewCount={viewCount ?? 0}
          />
        )}
      </div>
      {materialName && materialHref ? (
        <Link
          href={materialHref}
          className={css({
            display: "block",
            borderTopWidth: "1px",
            borderColor: "border.default",
            p: "3",
            textStyle: "body",
            fontWeight: "bold",
            color: "text.brand",
            textDecoration: "none",
          })}
        >
          {materialName} <Icon name="arrow_forward" size="sm" />
        </Link>
      ) : null}
    </article>
  );
}
