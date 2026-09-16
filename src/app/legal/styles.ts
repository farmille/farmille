import { css, cva } from "../../../styled-system/css";

export const legalHeading = cva({
  base: {
    color: "text.default",
    fontWeight: "700",
    lineHeight: "relaxed",
    overflowWrap: "anywhere",
  },
  variants: {
    level: {
      h1: {
        fontSize: "3xl",
        pb: "5",
        mb: "6",
        borderBottomWidth: "2px",
        borderColor: "brand.primary",
      },
      h2: {
        fontSize: "xl",
        pl: "3",
        mb: "4",
        borderLeftWidth: "4px",
        borderColor: "brand.primary",
      },
    },
  },
});

export const legalLink = css({
  color: "brand.primaryDeep",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
  _hover: { color: "text.default" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    outlineOffset: "2px",
  },
});

export const legalProse = css({
  fontSize: "lg",
  lineHeight: "loose",
  overflowWrap: "anywhere",
  "& p": { my: "4" },
  "& h3": { fontSize: "lg", fontWeight: "700", mt: "6", mb: "3" },
  "& ul": { listStyleType: "disc", pl: "6", my: "4" },
  "& ol": { listStyleType: "decimal", pl: "6", my: "4" },
  "& li": { mb: "3" },
  "& a": { color: "brand.primaryDeep", textDecoration: "underline", overflowWrap: "anywhere" },
});
