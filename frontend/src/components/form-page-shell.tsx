import type { ReactNode } from "react";

import { css } from "../../styled-system/css";
import { AppBar } from "./app-bar";

type FormPageShellProps = {
  title: string;
  backHref: string;
  children: ReactNode;
  hasFixedFooter?: boolean;
};

/** 投稿系画面の共通シェル。固定フッターが本文を隠さない余白もここで管理する。 */
export function FormPageShell({
  title,
  backHref,
  children,
  hasFixedFooter = false,
}: FormPageShellProps) {
  return (
    <div
      className={css({
        minH: "100dvh",
        maxW: "md",
        mx: "auto",
        bg: "surface.panel",
        color: "text.default",
        fontFamily: "sans",
      })}
    >
      <AppBar title={title} backHref={backHref} />
      <main className={css({ px: "4", pt: "4", pb: hasFixedFooter ? "40" : "8" })}>{children}</main>
    </div>
  );
}
