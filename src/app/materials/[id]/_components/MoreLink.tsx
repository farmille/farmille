import Link from "next/link";
import type { ReactNode } from "react";

import { css } from "../../../../../styled-system/css";

const moreLinkStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  // 指で押せるよう、押せる高さを 44px 取る
  minH: "11",
  fontSize: "sm",
  color: "text.brand",
  textDecoration: "none",
  whiteSpace: "nowrap",
});

export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className={moreLinkStyle} href={href}>
      {children}
    </Link>
  );
}
