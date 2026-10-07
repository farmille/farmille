import { css, cva } from "../../../../styled-system/css";

export const formalPageRecipe = cva({
  base: { mx: "auto", pt: "6.5" },
  variants: {
    width: {
      standard: { maxW: "content.medium" },
      narrow: { maxW: "content.reading" },
    },
  },
  defaultVariants: { width: "standard" },
});

export const formalTitleStyle = css({ fontSize: "3xl", fontWeight: "extrabold" });

const formalProse = {
  color: "formal.ink",
  fontSize: "md",
  lineHeight: "loose",
} as const;

export const introStyle = css({
  mt: "3",
  "& p": formalProse,
  "& ul": { ...formalProse, mt: "2.5", pl: "4.5" },
});

export const formNoteStyle = css({
  mt: "3",
  fontSize: "sm",
  lineHeight: "prose",
  color: "formal.ink",
  "& a": { color: "primary.700", textDecoration: "underline" },
});

export const formalGuideRecipe = cva({
  base: { fontSize: "sm", lineHeight: "prose" },
  variants: {
    tone: {
      notice: { color: "accent.danger" },
      hint: { color: "formal.muted" },
    },
    placement: {
      lead: { mb: "2", _first: { mt: "2" } },
      trailing: { mt: "1.5" },
    },
  },
  defaultVariants: { tone: "notice", placement: "lead" },
});

export const fieldStyle = css({ mt: "5.5" });

const fieldsetReset = { borderWidth: "0", p: "0", m: "0", minW: "0" } as const;

export const formBlockStyle = css(fieldsetReset);

export const fieldsetStyle = css(fieldsetReset, { mt: "5.5" });

const labelRow = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  w: "full",
  p: "0",
  fontSize: "md",
} as const;

export const fieldLabelStyle = css(labelRow, {
  gap: "1",
  mb: "2",
  fontWeight: "medium",
  color: "formal.ink",
});

export const fieldHeadingStyle = css(labelRow, { gap: "2", mb: "1.5", fontWeight: "bold" });

export const formalControlRecipe = cva({
  base: {
    display: "block",
    w: "full",
    bg: "formal.surface",
    color: "text.default",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "formal.line",
    borderRadius: "mark",
    p: "3.5",
    fontSize: "lg",
    _placeholder: { color: "formal.subtle" },
    _focus: {
      bg: "surface.card",
      borderColor: "accent.manufacturer",
      outlineWidth: "3px",
      outlineStyle: "solid",
      outlineColor: "accent.manufacturer/30",
      outlineOffset: "0",
    },
    _readOnly: { bg: "formal.line/50", color: "text.muted" },
    "&[aria-invalid=true]": { borderColor: "accent.danger" },
  },
  variants: {
    multiline: {
      true: { minH: "20", resize: "vertical", lineHeight: "relaxed" },
      false: {},
    },
  },
  defaultVariants: { multiline: false },
});

export const choiceListStyle = css({ display: "flex", flexDirection: "column" });

export const choiceStyle = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2",
  py: "1.5",
  fontSize: "md",
  color: "text.default",
  cursor: "pointer",
});

export const choiceInputStyle = css({
  flexShrink: "0",
  w: "3.5",
  h: "3.5",
  m: "0",
  mt: "1",
  accentColor: "accent.manufacturer",
  cursor: "pointer",
});

export const formalMessageRecipe = cva({
  base: {
    mt: "4",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "mark",
    px: "3",
    py: "3",
    fontSize: "sm",
    lineHeight: "prose",
    whiteSpace: "pre-wrap",
  },
  variants: {
    tone: {
      error: { bg: "accent.dangerSoft", color: "accent.danger", borderColor: "accent.danger/25" },
      info: { bg: "primary.soft", color: "primary.800", borderColor: "primary.700/20" },
    },
  },
});

export const formalActionsStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "8",
  textAlign: "center",
});

export const formalSubmitStyle = css({
  w: "full",
  py: "3.5",
  px: "10",
  borderWidth: "0",
  borderRadius: "mark",
  bg: "accent.manufacturer",
  color: "text.inverse",
  fontSize: "lg",
  fontWeight: "bold",
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
});

export const formalDraftStyle = css({ color: "formal.subtle", fontSize: "sm", p: "1" });
