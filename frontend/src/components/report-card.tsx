import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { ImagePlaceholderIcon, PersonIcon, ThumbIcon } from "./icons";

const cardRecipe = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    overflow: "hidden",
    bg: "surface.card",
    boxShadow: "shadow",
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
  variants: {
    layout: {
      /** ホーム横スクロール */
      scroll: {
        flex: "0 0 54%",
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
    bg: "green.soft2",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    color: "brand.primary",
  },
  variants: {
    layout: {
      scroll: { aspectRatio: "4/3" },
      grid: { aspectRatio: "4/3" },
      list: { aspectRatio: "16/9" },
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

const titleRecipe = cva({
  base: {
    fontWeight: "700",
    lineHeight: "1.4",
  },
  variants: {
    layout: {
      scroll: { fontSize: "sm", lineHeight: "1.35" },
      grid: { fontSize: "sm", lineHeight: "1.35" },
      list: { fontSize: "md" },
    },
  },
  defaultVariants: {
    layout: "list",
  },
});

const helpfulBtn = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    color: "text.muted",
    borderRadius: "pill",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
    flexShrink: "0",
  },
  variants: {
    layout: {
      scroll: { px: "2", py: "1", fontSize: "2xs", gap: "1" },
      grid: { px: "2", py: "1", fontSize: "2xs", gap: "1" },
      list: { px: "3", py: "1.5", fontSize: "sm", gap: "1.5" },
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
  href?: string;
  coverSrc?: string;
  layout?: "scroll" | "grid" | "list";
  className?: string;
};

/** 使用レポートのカード（横スクロール・グリッド・一覧）。 */
export function ReportCard({
  title,
  author,
  authorHref,
  avatarSrc,
  crop,
  helpfulCount,
  viewCount,
  href = "#",
  coverSrc,
  layout = "list",
  className,
}: ReportCardProps) {
  const compact = layout === "scroll" || layout === "grid";
  const authorContent = (
    <>
      <span
        className={css({
          w: compact ? "18px" : "26px",
          h: compact ? "18px" : "26px",
          borderRadius: "pill",
          bg: "brand.soft",
          display: "grid",
          placeItems: "center",
          color: "brand.primary",
          flexShrink: "0",
          overflow: "hidden",
        })}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className={css({ w: "100%", h: "100%", objectFit: "cover" })}
          />
        ) : (
          <PersonIcon size={compact ? 10 : 14} />
        )}
      </span>
      <span>{author}</span>
    </>
  );

  return (
    <article className={cx(cardRecipe({ layout }), className)}>
      <Link
        href={href}
        aria-label={title}
        className={css({ display: "block", color: "inherit", textDecoration: "none" })}
      >
        <div className={coverRecipe({ layout })}>
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              className={css({ w: "100%", h: "100%", objectFit: "cover" })}
            />
          ) : (
            <ImagePlaceholderIcon />
          )}
        </div>
      </Link>
      <div className={bodyRecipe({ layout })}>
        <Link
          href={href}
          className={cx(
            titleRecipe({ layout }),
            css({ display: "block", color: "inherit", textDecoration: "none" }),
          )}
        >
          {title}
        </Link>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: compact ? "1" : "1.5",
            fontSize: compact ? "2xs" : "xs",
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
                color: "inherit",
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
          {!compact ? (
            <span
              className={css({
                fontSize: "2xs",
                px: "2.5",
                py: "0.5",
                borderRadius: "pill",
                bg: "brand.soft",
                color: "brand.primaryDeep",
                fontWeight: "600",
              })}
            >
              {crop}
            </span>
          ) : null}
        </div>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: compact ? "2xs" : "xs",
            color: "text.subtle",
            mt: compact ? "1.5" : "2",
          })}
        >
          <span className={helpfulBtn({ layout })}>
            <ThumbIcon size={compact ? 11 : 14} />
            {!compact ? <span>参考になった</span> : null}
            {helpfulCount}
          </span>
          {viewCount !== undefined ? (
            <span className={css({ fontVariantNumeric: "tabular-nums" })}>{viewCount} 回閲覧</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
