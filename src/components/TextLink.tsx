import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const textLinkRecipe = cva({
  variants: {
    variant: {
      inline: {
        color: "text.brand",
        fontWeight: "bold",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
      },
      /** primary.soft の面に置く本文リンク。 */
      inlineOnSoft: {
        color: "text.brandOnSoft",
        fontWeight: "bold",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
      },
      plain: {
        display: "inline-block",
        color: "text.brand",
        fontSize: "sm",
        textDecoration: "none",
        _hover: { textDecoration: "underline" },
      },
      /**
       * メニューやフッターに並べる文字だけのリンク。色と大きさは置き場所から受け継ぐ。
       * ホバーと現在地（aria-current）では、左端から下線を伸ばす。
       */
      nav: {
        position: "relative",
        display: "inline-block",
        color: "[inherit]",
        textDecoration: "none",
        _after: {
          content: '""',
          position: "absolute",
          left: "0",
          right: "0",
          bottom: "-0.5",
          h: "[1px]",
          bg: "currentColor",
          transform: "scaleX(0)",
          transformOrigin: "left center",
          transitionProperty: "[transform]",
          transitionDuration: "dialog",
          transitionTimingFunction: "out",
          // 視覚効果を減らす設定では伸ばさず、線を薄く現すだけにする
          _motionReduce: { transform: "scaleX(1)", opacity: "0", transitionProperty: "[opacity]" },
        },
        "@media (hover: hover) and (pointer: fine)": {
          _hover: { _after: { transform: "scaleX(1)", opacity: "1" } },
        },
        _focusVisible: { _after: { transform: "scaleX(1)", opacity: "1" } },
        "&[aria-current=page]": { _after: { transform: "scaleX(1)", opacity: "1" } },
      },
      /** 送信ボタンの下に置く「キャンセル」など。指で押せるよう、押せる高さを 44px 取る。 */
      subtle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minH: "11",
        color: "text.subtle",
        fontSize: "md",
        textAlign: "center",
        textDecoration: "none",
        _focusVisible: {
          outlineWidth: "2px",
          outlineStyle: "solid",
          outlineColor: "primary.700",
          outlineOffset: "0.5",
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
