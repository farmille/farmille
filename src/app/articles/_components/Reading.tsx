import type { ReactNode } from "react";

import { css, cva } from "../../../../styled-system/css";

export const readingArticle = css({ maxW: "content.reading", mx: "auto" });

export const articleTitle = css({ fontSize: "2xl", lineHeight: "snug" });

export const byline = {
  row: css({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "2",
    mt: "3",
    fontSize: "md",
    color: "text.muted",
  }),
  link: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    color: "[inherit]",
    textDecoration: "none",
  }),
  name: css({ fontWeight: "bold", color: "text.default" }),
  sub: css({ fontSize: "sm", color: "text.subtle" }),
};

export const readingFoot = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "2.5",
  mt: "4",
});

export const figureFrameRecipe = cva({
  base: {
    w: "full",
    maxH: "80",
    borderRadius: "media",
    bg: "primary.soft",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    "& :is(img, video)": { w: "full", h: "full", objectFit: "cover", display: "block" },
  },
  variants: {
    ratio: {
      wide: { aspectRatio: "image.wide" },
      landscape: { aspectRatio: "image.landscape" },
      portrait: { aspectRatio: "image.portrait" },
    },
  },
});

const headingStyle = css({
  textStyle: "title",
  fontWeight: "extrabold",
  mt: "6",
  mb: "2",
  pl: "2.5",
  borderLeftWidth: "3px",
  borderLeftStyle: "solid",
  borderLeftColor: "primary.700",
});

export function ReadingHeading({
  as: Tag = "h2",
  id,
  children,
}: {
  as?: "h2" | "div";
  id?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className={headingStyle}>
      {children}
    </Tag>
  );
}

const proseText = { textStyle: "prose", color: "text.muted" } as const;

export function ReadingProse({ text }: { text: string }) {
  return <p className={css(proseText, { whiteSpace: "pre-wrap" })}>{text}</p>;
}

const markdownStyle = css({
  mt: "4",
  "& p": { ...proseText, mt: "2" },
  "& :is(ul, ol)": { ...proseText, mt: "2", pl: "5" },
  "& > :first-child": { mt: "0" },
  "& :is(h2, h3)": { textStyle: "title", mt: "5.5", mb: "2" },
  "& img": { maxW: "full", borderRadius: "media" },
  "& a": { color: "text.brand" },
});

export function ReadingMarkdown({ html }: { html: string }) {
  return <div className={markdownStyle} dangerouslySetInnerHTML={{ __html: html }} />;
}
