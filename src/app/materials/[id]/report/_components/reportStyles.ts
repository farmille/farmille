import { cva } from "../../../../../../styled-system/css";

/** 記事・書き込み枠で使う、枠線つきの小さな丸いボタン */
export const pillButton = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    borderRadius: "pill",
    cursor: "pointer",
    whiteSpace: "nowrap",
    _hover: { borderColor: "primary.700", color: "primary.800" },
  },
  variants: {
    size: {
      md: { py: "1.5", px: "3", fontSize: "sm" },
      xs: { py: "0.5", px: "2.5", fontSize: "sm", fontWeight: "bold", color: "text.muted" },
    },
    tone: {
      plain: {},
      primary: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        _hover: { color: "text.inverse" },
      },
    },
    strong: { true: { fontWeight: "bold" }, false: {} },
  },
  defaultVariants: { size: "md", tone: "plain", strong: false },
});
