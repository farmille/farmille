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
    outlineOffset: "0.5",
  },
});

/** 検索の条件を選ぶチップ。選んである条件は濃い緑の地にする。 */
export const chipRecipe = cva({
  base: {
    ...focusRing,
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "pill",
    textDecoration: "none",
  },
  variants: {
    /** md はスマホの結果画面の上に並べる区分のチップ。押しやすいよう高さだけ増やす。 */
    size: {
      sm: { py: "1", px: "3", fontSize: "sm" },
      md: { py: "1.5", px: "3", fontSize: "sm" },
    },
    active: {
      true: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "bold",
      },
      false: { bg: "surface.card", borderColor: "border.strong", color: "[inherit]" },
    },
  },
  defaultVariants: { size: "sm" },
});
