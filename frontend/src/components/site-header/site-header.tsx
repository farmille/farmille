import { headers } from "next/headers";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { getRole, getUser } from "@/lib/auth/server";
import { isMakerRole, isReviewerRole } from "@/lib/auth/roles";
import { SiteHeaderUserMenu } from "./user-menu";
import { SiteHeaderMobileNav } from "./mobile-nav";

// 全ページ共通のグローバルヘッダー (Server Component)。
// - role 判定して右側 CTA を出し分け
// - (auth) / onboarding / auth callback では非表示 (それぞれ独自 layout を持つため)
// - mobile (md 未満) ではナビをドロワーに退避
//
// design-tokens v2 + AgList visual:
//   - 深緑 (--green-dark) 背景 + 白テキストで agtech ディレクトリの空気感
//   - sticky + backdrop-blur で hero などスクロール上にも乗る
//   - ロゴ Sprout icon、Sign Up は white pill で dark 背景に映える

const HIDDEN_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/password-reset",
  "/password-update",
  "/auth/", // /auth/callback など
  // 2026-05-27: /onboarding は除外。signup → 即 /onboarding/{role} 着地に変えた結果、
  // ヘッダー消失で「ログアウトされた?」のような違和感が出てた。ログイン済 user には
  // 通常ヘッダーが見える方が自然。各 page の inline <h1>Farmille</h1> は冗長になるが
  // 害は無いので残置 (後日 cleanup)。
];

const NAV_LINKS = [
  { href: "/products", label: "資材" },
  { href: "/articles", label: "記事" },
  { href: "/manufacturers", label: "製造元" },
];

function getDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const meta = user.user_metadata ?? {};
  const name = typeof meta.name === "string" ? meta.name : null;
  if (name) return name;
  return user.email ?? "ユーザー";
}

function getInitial(name: string): string {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

export async function SiteHeader() {
  const path = (await headers()).get("x-pathname") ?? "/";
  if (HIDDEN_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return null;
  }

  const user = await getUser();
  const role = user ? await getRole(user) : null;

  const isReviewer = isReviewerRole(role);
  const isMaker = isMakerRole(role);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor: "var(--green-dark)",
        borderColor: "var(--overlay-on-dark-soft)",
        color: "var(--text-on-green)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight text-white transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-dark)]"
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center"
            style={{
              backgroundColor: "var(--overlay-on-dark-soft)",
              borderRadius: "var(--radius-full)",
            }}
            aria-hidden
          >
            <Sprout className="h-4 w-4 text-white" />
          </span>
          <span>Farmille</span>
        </Link>

        {/* Desktop primary nav */}
        <nav
          aria-label="主ナビゲーション"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md text-sm font-medium text-white/90 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-dark)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Auth CTAs */}
          {user ? (
            <SiteHeaderUserMenu
              displayName={getDisplayName(user)}
              initial={getInitial(getDisplayName(user))}
              role={role}
              isReviewer={isReviewer}
              isMaker={isMaker}
              onDarkHeader
            />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md text-sm font-medium text-white/90 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-dark)] sm:inline-flex"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center px-4 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-dark)]"
                style={{
                  backgroundColor: "var(--text-on-green)",
                  color: "var(--green-dark)",
                  borderRadius: "var(--radius-full)",
                }}
              >
                新規登録
              </Link>
            </>
          )}

          {/* Mobile hamburger (右端) */}
          <SiteHeaderMobileNav
            isReviewer={isReviewer}
            isMaker={isMaker}
            isLoggedIn={!!user}
          />
        </div>
      </div>
    </header>
  );
}
