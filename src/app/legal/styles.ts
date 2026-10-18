import { css, cva } from "../../../styled-system/css";

export const legalHeading = cva({
  base: {
    color: "text.default",
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
        borderColor: "primary.600",
      },
      h2: {
        fontSize: "xl",
        pl: "3",
        mb: "4",
        borderLeftWidth: "4px",
        borderColor: "primary.600",
      },
    },
  },
});

export const legalLink = css({
  textStyle: "body",
  color: "text.brand",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
  _hover: { color: "text.default" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "2px",
  },
});

export const legalProse = css({
  textStyle: "prose",
  overflowWrap: "anywhere",
  "& p": { my: "4" },
  "& h3": { textStyle: "title", fontWeight: "bold", mt: "6", mb: "3" },
  "& ul": { listStyleType: "disc", pl: "6", my: "4" },
  "& ol": { listStyleType: "decimal", pl: "6", my: "4" },
  "& li": { mb: "3" },
  "& a": { color: "text.brand", textDecoration: "underline", overflowWrap: "anywhere" },
});
