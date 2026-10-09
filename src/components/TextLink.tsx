import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const textLinkRecipe = cva({
  variants: {
    variant: {
      inline: {
        color: "primary.700",
        fontWeight: "bold",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
      },
      plain: {
        display: "inline-block",
        color: "primary.700",
        fontSize: "sm",
        textDecoration: "none",
        _hover: { textDecoration: "underline" },
      },
      subtle: {
        display: "block",
        p: "1",
        color: "text.subtle",
        fontSize: "sm",
        textAlign: "center",
        textDecoration: "none",
        _focusVisible: {
          outlineWidth: "2px",
          outlineStyle: "solid",
          outlineColor: "primary.700",
          outlineOffset: "2px",
        },
      },
    },
  },
  defaultVariants: { variant: "inline" },
});

type TextLinkProps = RecipeVariantProps<typeof textLinkRecipe> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
    external?: boolean;
    className?: string;
  };

/** 本文中の内部リンクと外部リンクを同じ視覚言語で表示する。 */
export function TextLink({
  href,
  external = false,
  variant,
  children,
  className,
  ...rest
}: TextLinkProps) {
  const linkClass = cx(textLinkRecipe({ variant }), className);

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
