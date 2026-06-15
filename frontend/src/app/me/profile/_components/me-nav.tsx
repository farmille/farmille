"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Phase 19: /me/* 上位ナビゲーション (spec §6.1)。
// /me/profile / /me/reviews / /me/materials の 3 リンクを Tab 風に並べる。
// reviews は Phase 12c, materials は Phase 16 で v1 確定 (本 phase では未着工
// でも遷移先は spec で確定しているため Link として置く)。
export const ME_NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/me/profile", label: "プロフィール" },
  { href: "/me/reviews", label: "レビュー" },
  { href: "/me/materials", label: "マイ資材" },
  // 2026-06-13: 全ロール共通のアカウント設定 (パスワード変更等)。
  { href: "/settings", label: "アカウント設定" },
];

type Props = {
  /** active 判定をテストで上書きするためのフック (テスト時のみ使用)。 */
  pathnameOverride?: string;
};

export function MeNav({ pathnameOverride }: Props) {
  // usePathname() は client only。pathnameOverride を渡されたら一切呼ばない
  // (Server Component から `<MeNav pathnameOverride="/me/profile" />` のように
  // active を直接指示できる、SSR でも無駄な hydration を避ける)。
  const livePathname = usePathname();
  const pathname = pathnameOverride ?? livePathname;
  return (
    <nav
      aria-label="マイページナビゲーション"
      className="border-b border-border"
    >
      <ul className="flex gap-1">
        {ME_NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center px-4 text-sm font-medium",
                  "border-b-2 -mb-px transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
