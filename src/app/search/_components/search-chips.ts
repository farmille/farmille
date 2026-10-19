import { css, cva } from "../../../../styled-system/css";

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

/** 押すと条件を足し外しするリンクのチップ。選択中は塗りつぶす。 */
export const filterChipRecipe = cva({
  base: {
    ...focusRing,
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    py: "1",
    px: "3",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "pill",
    fontSize: "sm",
    textDecoration: "none",
  },
  variants: {
    active: {
      true: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "bold",
      },
      false: { bg: "surface.card", borderColor: "border.strong", color: "inherit" },
    },
  },
});
