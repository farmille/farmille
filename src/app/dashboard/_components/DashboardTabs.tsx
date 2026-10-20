import Link from "next/link";

import { css, cva } from "../../../../styled-system/css";

const TABS = [
  { id: "dash", label: "ダッシュボード", href: "/dashboard" },
  { id: "profile", label: "メーカープロフィール", href: "/dashboard/profile" },
  { id: "product", label: "製品情報", href: "/dashboard/materials" },
] as const;

export type DashboardTab = (typeof TABS)[number]["id"];

const list = css({
  display: "flex",
  gap: "1.5",
  flexWrap: "wrap",
  mb: "4",
  listStyle: "none",
  p: "0",
});

const tabRecipe = cva({
  base: {
    display: "inline-block",
    fontSize: "sm",
    py: "1.5",
    px: "3",
    borderRadius: "pill",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    bg: "surface.card",
    color: "text.muted",
    textDecoration: "none",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "0.5",
    },
  },
  variants: {
    active: {
      true: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "semibold",
      },
      false: {},
    },
  },
});

export function DashboardTabs({ active }: { active: DashboardTab }) {
  return (
    <nav aria-label="企業会員メニュー">
      <ul className={list}>
        {TABS.map((tab) => (
          <li key={tab.id}>
            <Link
              className={tabRecipe({ active: tab.id === active })}
              href={tab.href}
              aria-current={tab.id === active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
