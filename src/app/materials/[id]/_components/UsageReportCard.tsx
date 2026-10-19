import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { css, sva } from "../../../../../styled-system/css";

import { Chip } from "./CardParts";

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
      textStyle: "body",
      fontWeight: "bold",
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
      },
    },
  },
  defaultVariants: { layout: "stack" },
});

const coverImageStyle = css({ display: "block", w: "full", h: "full", objectFit: "cover" });
/** 作物と地域を題名の上に置き、どの畑の記録かを先に伝える。 */
const kickerStyle = css({
  mb: "1.5",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  textStyle: "note",
  color: "text.subtle",
});
const placeStyle = css({ display: "inline-flex", alignItems: "center", gap: "0.5" });
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
  crop?: string | null;
  /** 都道府県。会員にだけ渡す。 */
  place?: string | null;
  /** 題名の下に添える比較のグラフ。 */
  figure?: ReactNode;
  actions: ReactNode;
  layout?: "stack" | "scroll";
};

export function UsageReportCard({
  href,
  title,
  author,
  avatarSrc,
  coverSrc,
  crop,
  place,
  figure,
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
        {crop || place ? (
          <div className={kickerStyle}>
            {crop ? <Chip>{crop}</Chip> : null}
            {place ? (
              <span className={placeStyle}>
                <Icon name="location_on" size="2xs" />
                {place}
              </span>
            ) : null}
          </div>
        ) : null}
        <Link href={href} className={classes.title}>
          {title}
        </Link>
        {figure}
        <div className={bylineStyle}>
          <Avatar name={author} src={avatarSrc} size="xs" />
          <b className={authorStyle}>{author}</b>
        </div>
        {actions}
      </div>
    </article>
  );
}
