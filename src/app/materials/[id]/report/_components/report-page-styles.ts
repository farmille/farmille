import { css, cva } from "../../../../../../styled-system/css";

/** ページ版の文書の見出し（結果・感想など）。未記入のまま投稿しようとしたら赤くする。 */
export const docHeadingRecipe = cva({
  base: { m: "0", mt: "8", fontSize: "2xl", lineHeight: "snug" },
  variants: {
    level: { 2: {}, 3: { mt: "5", fontSize: "xl" } },
    missing: { true: { color: "accent.danger" }, false: {} },
  },
  defaultVariants: { level: 2, missing: false },
});

export const requirementMark = css({
  ml: "2",
  fontSize: "sm",
  fontWeight: "normal",
  color: "accent.danger",
});

/** 見出しの下の案内。薄字にしない。 */
export const docLead = css({
  m: "0",
  mt: "1",
  textStyle: "body",
  lineHeight: "relaxed",
  color: "text.default",
});

/** 案内の中の大事な一文。 */
export const docLeadMark = css({
  display: "inline-block",
  mt: "1",
  px: "2",
  py: "0.5",
  borderRadius: "input",
  bg: "primary.soft",
  color: "text.brandOnSoft",
  fontWeight: "bold",
});

/** 区・調査項目の中の項目名は太字。 */
export const labelStyle = css({ fontWeight: "bold", color: "text.default" });

/** 「＋ 区を追加」など、追加の操作。薄字にせず緑の太字。 */
export const addButton = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  mt: "3",
  border: "none",
  bg: "transparent",
  p: "0",
  fontSize: "md",
  fontWeight: "bold",
  color: "text.brand",
  cursor: "pointer",
  _touch: { fontSize: "lg" },
});

/** 右端の丸い ×。 */
export const removeButton = css({
  display: "grid",
  placeItems: "center",
  ml: "auto",
  w: "8",
  h: "8",
  border: "none",
  borderRadius: "pill",
  bg: "transparent",
  color: "text.muted",
  cursor: "pointer",
  _hover: { bg: "surface.panel", color: "text.default" },
});
