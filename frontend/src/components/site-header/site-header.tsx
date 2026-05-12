import { headers } from "next/headers";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { isMakerRole, isReviewerRole } from "@/lib/auth/roles";
import { SiteHeaderUserMenu } from "./user-menu";
import { SiteHeaderMobileNav } from "./mobile-nav";

// 全ページ共通のグローバルヘッダー (Server Component)。
// - role 判定して右側 CTA を出し分け
// - (auth) / onboarding / auth callback では非表示 (それぞれ独自 layout を持つため)
// - mobile (md 未満) ではナビをドロワーに退避
//
// design-tokens v2:
//   - bg-card / border-border / text-foreground
//   - primary CTA は --green-primary
//   - sticky + backdrop-blur で hero などスクロール上にも乗る

const HIDDEN_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/password-reset",
  "/password-update",
  "/auth/", // /auth/callback など
  "/onboarding",
];

const NAV_LINKS = [
  { href: "/products", label: "資材" },
  { href: "/articles", label: "記事" },
  { href: "/manufacturers", label: "メーカー" },
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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
          aria-label="Farmille ホーム"
        >
          <span className="text-xl">🌱</span>
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
              className="text-sm text-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* 検索 (v1 は /products リンクのみ、クエリ転送は v1.5+) */}
          <Link
            href="/products"
            aria-label="資材を検索"
            className="hidden h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary md:flex"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span>検索</span>
          </Link>

          {/* Auth CTAs */}
          {user ? (
            <SiteHeaderUserMenu
              displayName={getDisplayName(user)}
              initial={getInitial(getDisplayName(user))}
              role={role}
              isReviewer={isReviewer}
              isMaker={isMaker}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-foreground transition-colors hover:text-primary sm:inline-flex"
              >
                ログイン
              </Link>
              <Button asChild size="sm">
                <Link href="/signup">新規登録</Link>
              </Button>
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
