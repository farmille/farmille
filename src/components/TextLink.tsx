import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { css, cx } from "../../styled-system/css";

const textLinkStyle = css({
  color: "primary.700",
  fontWeight: "700",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
});

type TextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
};

/** 本文中の内部リンクと外部リンクを同じ視覚言語で表示する。 */
export function TextLink({ href, external = false, children, className, ...rest }: TextLinkProps) {
  const linkClass = cx(textLinkStyle, className);

  if (external) {
    return (
      <a className={linkClass} href={href} rel="noreferrer" target="_blank" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link className={linkClass} href={href} {...rest}>
      {children}
    </Link>
  );
}
