import type { ReactNode } from "react";

import { cva, css, cx } from "../../styled-system/css";
import { AppBar } from "./app-bar";

const materialShellRecipe = cva({
  base: {
    position: "relative",
  },
  variants: {
    hasFab: {
      true: { pb: "24" },
      false: { pb: "6" },
    },
  },
  defaultVariants: {
    hasFab: false,
  },
});

type FormPageShellProps = {
  title: string;
  backHref: string;
  children: ReactNode;
  hasFixedFooter?: boolean;
  variant?: "form" | "material";
  hasFab?: boolean;
};

/** 投稿系画面の共通シェル。固定フッターが本文を隠さない余白もここで管理する。 */
export function FormPageShell({
  title,
  backHref,
  children,
  hasFixedFooter = false,
  variant = "form",
  hasFab = false,
}: FormPageShellProps) {
  const isMaterial = variant === "material";

  return (
    <div
      className={cx(
        css({
          minH: "100dvh",
          maxW: "md",
          mx: "auto",
          bg: "surface.panel",
          color: "text.default",
          fontFamily: "sans",
        }),
        isMaterial && materialShellRecipe({ hasFab }),
      )}
    >
      <AppBar title={title} backHref={backHref} />
      <main
        className={
          isMaterial
            ? css({ px: "3.5", py: "4" })
            : css({ px: "4", pt: "4", pb: hasFixedFooter ? "40" : "8" })
        }
      >
        {children}
      </main>
    </div>
  );
}
