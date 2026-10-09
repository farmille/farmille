import { css, cva } from "../../../../styled-system/css";

export const selectedChipRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    bg: "primary.100",
    color: "primary.800",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "primary.700/30",
    borderRadius: "pill",
    fontWeight: "semibold",
  },
  variants: {
    size: {
      md: { py: "1", pr: "1.5", pl: "3", fontSize: "md" },
      sm: { py: "1", pr: "1", pl: "2.5", fontSize: "sm" },
    },
  },
});

export const chipCategoryStyle = css({ fontSize: "2xs", fontWeight: "bold", opacity: "0.65" });

export const chipRemoveRecipe = cva({
  base: {
    display: "grid",
    placeItems: "center",
    p: "0",
    borderWidth: "0",
    borderRadius: "pill",
    bg: "primary.700/18",
    color: "primary.800",
    fontSize: "sm",
    lineHeight: "none",
    textDecoration: "none",
    cursor: "pointer",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "1px",
    },
  },
  variants: { size: { md: { w: "4", h: "4" }, sm: { w: "5", h: "5" } } },
});

export const chipList = css.raw({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  pt: "0.5",
  pb: "1.5",
});

export const chipListStyle = css(chipList);

export const focusRing = css.raw({
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
});
