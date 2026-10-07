import type { ReactNode } from "react";

import { PreparationNotice } from "@/components/PreparationNotice";
import { css, cva } from "../../../styled-system/css";

import { SiteBackBar } from "./SiteBackBar";
import { SiteFooter } from "./SiteFooter";
import { type SiteNavActive, SiteHeader } from "./SiteHeader";

type SitePageShellBaseProps = {
  active?: SiteNavActive;
  searchQuery?: string;
  showHeaderSearch?: boolean;
  hasFab?: boolean;
  footer?: boolean;
  children: ReactNode;
};

type SitePageShellProps = SitePageShellBaseProps &
  (
    | { title: string; backHref: string; shareHref?: string }
    | { title?: undefined; backHref?: undefined; shareHref?: undefined }
  );

const page = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.panel",
  overflowX: "clip",
});

const chrome = css({ position: "sticky", top: "0", zIndex: "30" });

const body = cva({
  base: {
    flex: "1",
    w: "100%",
    px: "4",
    pt: "4",
    pb: "10",
    tab: { maxW: "content.wide", mx: "auto", px: "8", pt: "6.5", pb: "0" },
  },
  variants: {
    hasFab: { true: { pb: "24", tab: { pb: "24" } }, false: {} },
  },
});

export function SitePageShell(props: SitePageShellProps) {
  const { active, searchQuery, showHeaderSearch = true, hasFab = false, footer = true } = props;

  return (
    <div className={page}>
      <div className={chrome}>
        <SiteHeader active={active} searchQuery={searchQuery} showSearch={showHeaderSearch} />
        {props.title === undefined ? null : (
          <SiteBackBar title={props.title} backHref={props.backHref} shareHref={props.shareHref} />
        )}
      </div>
      <PreparationNotice look="site" />
      <main className={body({ hasFab })}>
        {props.children}
        {footer ? <SiteFooter /> : null}
      </main>
    </div>
  );
}
