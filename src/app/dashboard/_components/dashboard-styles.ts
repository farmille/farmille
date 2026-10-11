import { css, cva } from "../../../../styled-system/css";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

export const readingColumn = css({ maxW: "content.reading", mx: "auto" });

export const workspaceColumn = css({ maxW: "content.workspace", mx: "auto" });

export const sectionHeading = css({
  textStyle: "title",
  fontWeight: "extrabold",
  mt: "4.5",
  mb: "2",
  mx: "0.5",
});

export const sectionNote = css({
  textStyle: "supporting",
  color: "text.subtle",
  px: "0.5",
  pb: "2",
});

export const cardList = css(surfaceCardRecipe.raw({ padding: "flush" }), {
  listStyle: "none",
  m: "0",
});

export const logRow = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  py: "3",
  px: "4",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  fontSize: "sm",
  _last: { borderBottomWidth: "0" },
});

export const logDate = css({
  flex: "none",
  color: "text.subtle",
  textStyle: "note",
  fontVariantNumeric: "tabular-nums",
});

export const logText = css({
  flex: "1",
  minW: "0",
  color: "text.muted",
  "& a": { color: "primary.800", textDecoration: "underline" },
});

export const visuallyHidden = css({ srOnly: true });

export const pillButtonRecipe = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    borderRadius: "button",
    py: "1",
    px: "3",
    fontSize: "sm",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
    _hover: { borderColor: "primary.700" },
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    tone: {
      primary: { color: "primary.800" },
      ghost: { color: "text.muted" },
    },
  },
  defaultVariants: { tone: "primary" },
});
