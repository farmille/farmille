import { cva } from "../../styled-system/css";

/**
 * 「参考になった」ピル。押下できる場合（HelpfulButton）と、
 * 自分の投稿・未ログインで件数だけ出す場合の両方で使う。
 */
export const helpfulPillRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    color: "text.muted",
    borderRadius: "pill",
    px: "3",
    py: "1.5",
    fontSize: "sm",
    fontVariantNumeric: "tabular-nums",
  },
  variants: {
    /** card はカード内の横並びに置くため折り返さない。detail は詳細画面の単独配置。 */
    layout: {
      card: {
        whiteSpace: "nowrap",
        flexShrink: "0",
        fontSize: "2xs",
        px: "2",
        py: "1.5",
        gap: "1",
      },
      detail: {},
    },
    interactive: {
      true: { cursor: "pointer" },
      false: { cursor: "default" },
    },
    voted: {
      true: {
        bg: "brand.soft",
        color: "brand.primaryDeep",
        borderColor: "brand.primary",
      },
      false: {},
    },
  },
  defaultVariants: {
    layout: "detail",
    interactive: false,
    voted: false,
  },
});
