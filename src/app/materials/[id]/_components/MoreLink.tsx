import Link from "next/link";
import type { ReactNode } from "react";

import { css } from "../../../../../styled-system/css";

const moreLinkStyle = css({
  fontSize: "sm",
  color: "primary.700",
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
