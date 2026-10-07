import { css, cva } from "../../../../styled-system/css";

export const guidePageStyle = css({ "& [id]": { scrollMarginTop: "32" } });

export const guideNarrowPageStyle = css({
  maxW: "content.reading",
  mx: "auto",
  "& [id]": { scrollMarginTop: "32" },
});

export const guideTitleStyle = css({ fontSize: "2xl", lineHeight: "snug" });

const guideHeading = { fontSize: "xl", pc: { fontSize: "3xl" } } as const;

export const guideHeadingStyle = css(guideHeading, { mt: "8", pc: { mt: "11" } });

export const guideEyebrowHeadingStyle = css(guideHeading, { mt: "1.5" });

const guideSub = { fontSize: "sm", lineHeight: "prose", color: "text.muted" } as const;

export const guideSubStyle = css(guideSub, { mt: "1.5" });

export const guideLeadStyle = css(guideSub, { mt: "2" });

const guideCard = {
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "media",
} as const;

export const guideCardStyle = css(guideCard);

export const guideBoxStyle = css(guideCard, { mt: "3", py: "4", px: "4.5" });

export const guideLinkStyle = css({
  color: "primary.800",
  fontWeight: "bold",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  cursor: "pointer",
});

export const stepCardRecipe = cva({
  base: {
    mt: "3",
    py: "4",
    px: "4.5",
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "media",
  },
  variants: {
    actor: {
      maker: {},
      farmille: { borderStyle: "dashed", borderColor: "primary.800", bg: "surface.page" },
    },
  },
  defaultVariants: { actor: "maker" },
});

export const stepLabelRecipe = cva({
  base: {
    display: "inline-block",
    py: "1",
    px: "2",
    borderRadius: "mark",
    fontSize: "xs",
    fontWeight: "extrabold",
    letterSpacing: "0.06em",
  },
  variants: {
    actor: {
      maker: { bg: "accent.manufacturer", color: "text.inverse" },
      farmille: {
        bg: "surface.card",
        color: "text.muted",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.strong",
      },
    },
  },
  defaultVariants: { actor: "maker" },
});

export const stepBodyRecipe = cva({
  base: { mt: "1.5", fontSize: "sm", lineHeight: "prose" },
  variants: {
    actor: { maker: { color: "text.muted" }, farmille: { color: "text.subtle" } },
  },
  defaultVariants: { actor: "maker" },
});

export const stepLinkStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  mt: "2.5",
  mr: "3",
  fontSize: "md",
  fontWeight: "bold",
  color: "primary.800",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
});

export const questionStyle = css({
  display: "flex",
  gap: "2.5",
  fontSize: "md",
  fontWeight: "extrabold",
  lineHeight: "normal",
  _before: { content: '"Q"', color: "primary.700", flexShrink: "0" },
});
