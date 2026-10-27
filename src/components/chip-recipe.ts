import { css, sva } from "../../styled-system/css";

export const chipRecipe = sva({
  slots: ["root", "category", "label", "remove"],
  base: {
    root: {
      display: "inline-flex",
      alignItems: "center",
      gap: "1.5",
      minW: "0",
      maxW: "full",
      py: "1",
      pl: "3",
      pr: "3",
      borderWidth: "1px",
      borderStyle: "solid",
      borderRadius: "pill",
      fontWeight: "semibold",
      lineHeight: "normal",
      outline: "none",
      // Combobox の中では矢印キーでチップへフォーカスが移る
      _focusVisible: {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "primary.700",
        outlineOffset: "[1px]",
      },
    },
    category: { flexShrink: "0", fontSize: "2xs", fontWeight: "bold", opacity: "label" },
    label: {
      minW: "0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    remove: {
      position: "relative",
      display: "grid",
      placeItems: "center",
      flexShrink: "0",
      p: "0",
      borderWidth: "0",
      borderRadius: "pill",
      bg: "primary.700/18",
      color: "text.brandOnSoft",
      cursor: "pointer",
      _focusVisible: {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "primary.700",
        outlineOffset: "[1px]",
      },
      _after: { content: '""', position: "absolute", inset: "-1" },
    },
  },
  variants: {
    tone: {
      brand: {
        root: { bg: "primary.100", color: "text.brandOnSoft", borderColor: "primary.700/30" },
      },
      neutral: { root: { bg: "surface.page", color: "text.muted", borderColor: "border.default" } },
    },
    size: {
      md: { root: { fontSize: "md" }, remove: { w: "4.5", h: "4.5" } },
      sm: { root: { fontSize: "sm" }, remove: { w: "4", h: "4" } },
      xs: {
        root: { gap: "1", pl: "2", pr: "2", py: "0.5", fontSize: "xs" },
        remove: { w: "3.5", h: "3.5" },
      },
    },
    removable: {
      true: { root: { pr: "1.5" } },
      false: {},
    },
  },
  defaultVariants: { tone: "brand", size: "sm", removable: false },
});

export const chipTooltipStyle = css({
  maxW: "[min(20rem, calc(100vw - 2rem))]",
  px: "2.5",
  py: "1.5",
  bg: "surface.card",
  color: "text.default",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  boxShadow: "overlay",
  textStyle: "note",
});
