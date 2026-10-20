import { Icon } from "@/components/Icon";
import Link from "next/link";
import type { ReactNode } from "react";

import { css } from "../../../../styled-system/css";

// 運営管理はモック基準外（D4）。PC 想定の素直な1カラムで、キット部品を並べるだけにする。
const shellStyle = css({
  minH: "dvh",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const headerStyle = css({
  bg: "surface.card",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const headerInnerStyle = css({
  maxW: "content.workspace",
  mx: "auto",
  px: "4",
  py: "3",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "3",
});

const brandStyle = css({
  fontSize: "md",
  fontWeight: "extrabold",
  color: "text.brand",
  textDecoration: "none",
});

const navStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "3",
  ml: "auto",
});

const navLinkStyle = css({
  fontSize: "md",
  color: "text.muted",
  textDecoration: "none",
  _hover: { color: "text.brand", textDecoration: "underline" },
});

const mainStyle = css({
  maxW: "content.workspace",
  mx: "auto",
  px: "4",
  py: "5",
});

const backLinkStyle = css({
  display: "inline-block",
  fontSize: "md",
  color: "text.brand",
  textDecoration: "none",
  mb: "2",
  _hover: { textDecoration: "underline" },
});

const titleStyle = css({
  fontSize: "2xl",
  m: "0",
});

const descriptionStyle = css({
  textStyle: "supporting",
  color: "text.muted",
  mt: "1.5",
});

const contentStyle = css({
  mt: "5",
  display: "flex",
  flexDirection: "column",
  gap: "5",
});

const NAV_ITEMS = [
  { href: "/me", label: "個人のマイページ" },
  { href: "/admin", label: "ホーム" },
  { href: "/admin/sellers", label: "メーカー確認" },
  { href: "/admin/materials/expressions", label: "表現確認" },
  { href: "/admin/materials", label: "資材" },
  { href: "/admin/tags", label: "検索タグ・作物" },
] as const;

export function AdminShell({
  title,
  description,
  backHref,
  backLabel = "戻る",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className={shellStyle}>
      <header className={headerStyle}>
        <div className={headerInnerStyle}>
          <Link className={brandStyle} href="/admin">
            Farmille 運営管理
          </Link>
          <nav className={navStyle}>
            {NAV_ITEMS.map((item) => (
              <Link className={navLinkStyle} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={mainStyle}>
        {backHref === undefined ? null : (
          <Link className={backLinkStyle} href={backHref}>
            <Icon name="arrow_back" size="sm" /> {backLabel}
          </Link>
        )}
        <h1 className={titleStyle}>{title}</h1>
        {description === undefined ? null : <p className={descriptionStyle}>{description}</p>}
        <div className={contentStyle}>{children}</div>
      </main>
    </div>
  );
}
