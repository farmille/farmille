import type { ReactNode } from "react";
import { PreparationNotice } from "@/components/PreparationNotice";

import { css } from "../../../styled-system/css";

// モック（reference/mockup-sp-19screens.html）の .appbar / .body 相当。
// sp は上詰め、tab 以上はタイトルとフォームを画面中央に置く。
const screenStyle = css({
  minH: "100dvh",
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
    w: "100%",
    maxW: "auth",
    my: "auto",
    mx: "auto",
    py: "10",
  },
});

const appBarStyle = css({
  position: "sticky",
  top: "0",
  zIndex: "10",
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "3.5",
  pt: "4",
  pb: "calc(var(--spacing-2\\.5) + var(--spacing-0\\.5) / 2)",
  bg: "surface.panel",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  tab: {
    position: "static",
    px: "4",
    borderBottomWidth: "0",
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
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <main className={screenStyle}>
      <div className={frameStyle}>
        <header className={appBarStyle}>
          <h1 className={titleStyle}>{title}</h1>
        </header>
        <PreparationNotice roundedTop />
        <div className={bodyStyle}>
          {lead === undefined ? null : <p className={leadStyle}>{lead}</p>}
          {children}
        </div>
      </div>
    </main>
  );
}
