import type { ReactNode } from "react";

import { css, cva, cx } from "../../../styled-system/css";

const noticeRecipe = cva({
  base: {
    px: "3",
    borderWidth: "1px",
    borderStyle: "solid",
    textStyle: "supporting",
  },
  variants: {
    tone: {
      error: {
        py: "3",
        borderRadius: "input",
        bg: "accent.dangerSoft",
        color: "accent.danger",
        borderColor: "accent.danger/25",
        fontWeight: "bold",
      },
      success: {
        py: "2.5",
        borderRadius: "input",
        bg: "primary.soft",
        color: "primary.700",
        borderColor: "primary.600/30",
        fontWeight: "bold",
        lineHeight: "normal",
      },
      info: {
        py: "3",
        borderRadius: "input",
        bg: "primary.soft",
        color: "primary.800",
        borderColor: "primary.700/22",
      },
      warn: {
        py: "2.5",
        borderRadius: "card",
        bg: "accent.warnSoft",
        color: "accent.warn",
        borderColor: "border.default",
        textStyle: "note",
      },
      neutral: {
        py: "2.5",
        borderRadius: "card",
        bg: "surface.page",
        color: "text.muted",
        borderColor: "border.default",
        textStyle: "note",
      },
    },
  },
});

const titleStyle = css({ display: "block", fontWeight: "bold" });

type NoticeProps = {
  tone: "error" | "success" | "info" | "warn" | "neutral";
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** フォームの結果や注意書きを囲む箱。エラーは alert、完了は status として読み上げる。 */
export function Notice({ tone, title, children, className }: NoticeProps) {
  return (
    <div
      className={cx(noticeRecipe({ tone }), className)}
      role={tone === "error" ? "alert" : tone === "success" ? "status" : undefined}
    >
      {title === undefined ? null : <strong className={titleStyle}>{title}</strong>}
      {children}
    </div>
  );
}
