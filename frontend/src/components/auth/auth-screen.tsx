import type { ReactNode } from "react";

import { css } from "../../../styled-system/css";

// モック（reference/mockup-sp-19screens.html）の .appbar / .body 相当。
// 共通 AppBar は T-21 で作るため、ここでは認証画面用の最小の枠だけを持つ。
const screenStyle = css({
  minH: "100dvh",
  bg: "surface.panel",
  color: "text.default",
  mx: "auto",
  maxW: "430px",
});

const appBarStyle = css({
  position: "sticky",
  top: "0",
  zIndex: "10",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  px: "14px",
  pt: "16px",
  pb: "11px",
  bg: "surface.panel",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const titleStyle = css({
  flex: "1",
  minW: "0",
  fontSize: "lg",
  fontWeight: "700",
  lineHeight: "1.35",
});

const bodyStyle = css({
  px: "16px",
  pt: "16px",
  pb: "40px",
});

const leadStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  lineHeight: "1.6",
  mb: "18px",
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
      <header className={appBarStyle}>
        <h1 className={titleStyle}>{title}</h1>
      </header>
      <div className={bodyStyle}>
        {lead === undefined ? null : <p className={leadStyle}>{lead}</p>}
        {children}
      </div>
    </main>
  );
}
