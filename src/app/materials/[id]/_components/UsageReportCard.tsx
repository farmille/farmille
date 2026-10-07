import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { css, sva } from "../../../../../styled-system/css";

import { Avatar, Chip } from "./CardParts";

const cardRecipe = sva({
  slots: ["root", "cover", "body", "title"],
  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      bg: "surface.card",
      borderWidth: "1px",
      borderColor: "border.default",
      borderRadius: "card",
      boxShadow: "shadow",
    },
    cover: {
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      aspectRatio: "image.wide",
      bg: "primary.soft",
      color: "inherit",
      textDecoration: "none",
    },
    body: { flex: "1", display: "flex", flexDirection: "column", px: "3.5", py: "3" },
    title: {
      display: "block",
      fontSize: "md",
      fontWeight: "bold",
      lineHeight: "snug",
      color: "inherit",
      textDecoration: "none",
    },
  },
  variants: {
    layout: {
      stack: {},
      scroll: {
        root: { flex: "0 0 74%", scrollSnapAlign: "start", pc: { flex: "none" } },
        cover: { aspectRatio: "image.landscape", pc: { aspectRatio: "image.wide" } },
        body: { px: "3", py: "2.5", pc: { px: "2.5", py: "2" } },
        title: { fontSize: "sm" },
      },
    },
  },
  defaultVariants: { layout: "stack" },
});

const coverImageStyle = css({ display: "block", w: "full", h: "full", objectFit: "cover" });
const bylineStyle = css({
  mt: "auto",
  pt: "2",
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontSize: "sm",
  color: "text.subtle",
});
const authorStyle = css({
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontWeight: "normal",
  color: "text.muted",
});
type UsageReportCardProps = {
  href: string;
  title: string;
  author: string;
  avatarSrc?: string | null;
  coverSrc?: string;
  /** 作物名（本番の ReportCard と同じく投稿者の横に出す）。 */
  crop?: string | null;
  /** 参考になった・保存・閲覧数（PostActionsLoader）。 */
  actions: ReactNode;
  /** scroll は横スクロールの列（PC では4列の格子）に並べるときの小さめの体裁。 */
  layout?: "stack" | "scroll";
};

/**
 * 実証詳細レポートのカード。
 * 一覧で見せるのは表紙・題名・投稿者・作物・反応（参考になった・保存・閲覧数）で、本文の抜粋は出さない（既存の資材ページと同じ範囲）。
 */
export function UsageReportCard({
  href,
  title,
  author,
  avatarSrc,
  coverSrc,
  crop,
  actions,
  layout,
}: UsageReportCardProps) {
  const classes = cardRecipe({ layout });
  return (
    <article className={classes.root}>
      <Link href={href} className={classes.cover} aria-label={title}>
        {coverSrc ? (
          <Image
            alt=""
            src={coverSrc}
            width={640}
            height={480}
            sizes="(min-width: 1024px) 280px, 74vw"
            className={coverImageStyle}
          />
        ) : (
          <Icon name="image" size="lg" />
        )}
      </Link>
      <div className={classes.body}>
        <Link href={href} className={classes.title}>
          {title}
        </Link>
        <div className={bylineStyle}>
          <Avatar name={author} src={avatarSrc} extraSmall />
          <b className={authorStyle}>{author}</b>
          {crop ? <Chip>{crop}</Chip> : null}
        </div>
        {actions}
      </div>
    </article>
  );
}
