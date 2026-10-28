import type { ReactNode } from "react";

import { AppBar } from "@/components/AppBar";
import { SiteAppBar } from "@/components/SiteAppBar";
import { css } from "../../../styled-system/css";

/** 共通ヘッダーと本文で画面の高さを埋め、本文の中でフォームを中央に置けるようにする。 */
const pageStyle = css({
  minH: "dvh",
  display: "flex",
  flexDirection: "column",
});

// モック（reference/mockup-sp-19screens.html）の .appbar / .body 相当。
// sp は上詰め、tab 以上はタイトルとフォームを共通ヘッダーの下の中央に置く。
const screenStyle = css({
  flex: "1",
  w: "full",
  bg: "surface.panel",
  color: "text.default",
  mx: "auto",
  maxW: "auth",
  tab: {
    maxW: "none",
    display: "flex",
    flexDirection: "column",
    px: "5",
  },
});

const frameStyle = css({
  tab: {
    w: "full",
    maxW: "content.form",
    my: "auto",
    mx: "auto",
    py: "10",
  },
});

/** 上に固定するのは共通ヘッダーだけにし、画面名の行は本文と一緒に流す。 */
const appBarStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "3.5",
  pt: "4",
  pb: "[calc(var(--spacing-2\\.5) + var(--spacing-0\\.5) / 2)]",
  bg: "surface.panel",
  tab: {
    px: "4",
  },
});

const titleStyle = css({
  flex: "1",
  minW: "0",
  textStyle: "title",
});

const bodyStyle = css({
  px: "4",
  pt: "4",
  pb: "10",
  tab: {
    pb: "4",
  },
});

const leadStyle = css({
  textStyle: "supporting",
  color: "text.subtle",
  mb: "4.5",
});

export function AuthScreen({
  title,
  lead,
  loading = false,
  children,
}: {
  title: string;
  lead?: string;
  /** 読み込み中の画面。閲覧者を確かめず、開いた時点で項目を切り替えるメニューの共通ヘッダーを出す。 */
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={pageStyle}>
      {loading ? (
        <AppBar chrome="public" variant="home" />
      ) : (
        <SiteAppBar chrome="public" variant="home" />
      )}
      <main className={screenStyle} data-ui="auth-screen">
        <div className={frameStyle}>
          <header className={appBarStyle}>
            <h1 className={titleStyle}>{title}</h1>
          </header>
          <div className={bodyStyle}>
            {lead === undefined ? null : <p className={leadStyle}>{lead}</p>}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
