import type { ReactNode } from "react";
import { AppBar } from "@/components";
import { HomeFooter } from "@/app/_components/HomeFooter";
import { css } from "../../../styled-system/css";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        minH: "100dvh",
        bg: "surface.page",
        color: "text.default",
        fontFamily: "sans",
      })}
    >
      <AppBar chrome="public" variant="home" active="home" />
      <div className={css({ maxW: "content.wide", mx: "auto", px: "4", tab: { px: "6" } })}>
        <main className={css({ maxW: "content.reading", mx: "auto", py: "8", tab: { py: "12" } })}>
          {children}
        </main>
        <HomeFooter />
      </div>
    </div>
  );
}
