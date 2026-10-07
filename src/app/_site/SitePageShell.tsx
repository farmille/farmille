import type { ReactNode } from "react";

import { PreparationNotice } from "@/components/PreparationNotice";
import { css, cva } from "../../../styled-system/css";

import { SiteBackBar } from "./SiteBackBar";
import { SiteFooter } from "./SiteFooter";
import { type SiteNavActive, SiteHeader } from "./SiteHeader";

type SitePageShellBaseProps = {
  active?: SiteNavActive;
  searchQuery?: string;
  /** ヘッダーの検索バー。ヒーローに検索欄があるホームだけ出さない。 */
  showHeaderSearch?: boolean;
  /** 画面下の投稿ボタン（FabBar look="site"）がある画面。本文の下に隠れない余白をとる。 */
  hasFab?: boolean;
  /** 本文末尾のフッター。記事フィード以外の画面で出す。 */
  footer?: boolean;
  children: ReactNode;
};

/** 戻るバー。渡さない画面（ホーム）は戻るバーを出さない。 */
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

/**
 * 画面の外枠。上から、ヘッダー＋戻るバー（上に固定）、準備中のお知らせ、
 * 本文とフッター。見本にない画面（運営・パスワード再設定など）は使わず、
 * 既定の AppBar / FormPageShell のままにする。
 */
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
