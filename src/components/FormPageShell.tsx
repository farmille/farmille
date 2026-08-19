import type { ReactNode } from "react";

import { cva, css, cx } from "../../styled-system/css";
import { AppBar, type AppBarActive, type AppChrome } from "./AppBar";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const mainWidthRecipe = cva({
  base: {
    flex: "1",
    w: "100%",
    mx: "auto",
    bg: "surface.panel",
  },
  variants: {
    width: {
      form: { maxW: "content.form" },
      material: { maxW: "content.medium" },
      seller: { maxW: "content.wide" },
    },
  },
});

const materialShellRecipe = cva({
  base: {
    position: "relative",
  },
  variants: {
    hasFab: {
      true: { pb: "24", lg: { pb: "8" } },
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
  chrome: AppChrome;
  active?: AppBarActive;
  hasFixedFooter?: boolean;
  variant?: "form" | "material";
  hasFab?: boolean;
};

/** 投稿系画面の共通シェル。固定フッターが本文を隠さない余白もここで管理する。 */
export function FormPageShell({
  title,
  backHref,
  children,
  chrome,
  active,
  hasFixedFooter = false,
  variant = "form",
  hasFab = false,
}: FormPageShellProps) {
  const isMaterial = variant === "material";

  return (
    <div className={shell}>
      <AppBar chrome={chrome} active={active} title={title} backHref={backHref} />
      <main
        className={cx(
          mainWidthRecipe({ width: chrome === "seller" ? "seller" : variant }),
          isMaterial
            ? css({ px: "3.5", py: "4", md: { px: "5", py: "5" } })
            : css({
                px: "4",
                pt: "4",
                pb: hasFixedFooter ? "40" : "8",
                md: { px: "5" },
                lg: { pb: "8" },
              }),
          isMaterial && materialShellRecipe({ hasFab }),
        )}
      >
        {children}
      </main>
    </div>
  );
}
