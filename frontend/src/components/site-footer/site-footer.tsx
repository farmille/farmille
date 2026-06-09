import { headers } from "next/headers";
import Link from "next/link";
import { Sprout } from "lucide-react";

// 全ページ共通のフッター。design-tokens v2 + AgList-style 2-tier layout。
// 上段: ブランド + リソース / カタログ / アカウント の 3 列
// 下段: © と二次リンク (現状は最小)
//
// Server Component。app/layout.tsx に 1 箇所マウントし、pathname を見て
// HIDDEN_PATH_PREFIXES に該当するときだけ null を返す (SiteHeader と同じ責務分離)。
// 認証 / オンボーディング系 + /admin (固有 footer を持つ) は非表示。

const HIDDEN_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/password-reset",
  "/password-update",
  "/auth/", // /auth/callback など
  "/onboarding",
  "/admin", // 自前 footer を持つ
];

type FooterLink = { href: string; label: string };

const RESOURCE_LINKS: FooterLink[] = [
  { href: "/articles", label: "記事" },
  { href: "/manufacturers", label: "製造元一覧" },
];

const CATALOG_LINKS: FooterLink[] = [
  { href: "/products", label: "資材を探す" },
  { href: "/manufacturers", label: "製造元を探す" },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { href: "/login", label: "ログイン" },
  { href: "/signup", label: "新規登録" },
];

export async function SiteFooter() {
  const path = (await headers()).get("x-pathname") ?? "/";
  if (HIDDEN_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return null;
  }

  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center"
              style={{
                backgroundColor: "var(--green-subtle)",
                borderRadius: "var(--radius-full)",
              }}
            >
              <Sprout className="h-4 w-4 text-[var(--green-primary)]" />
            </span>
            <span>Farmille</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            BS資材 (生物・微生物農業資材) の農家レビュー・データベース。
            農家・JA・研究者・製造元をつなぐプラットフォーム。
          </p>
        </div>

        <FooterColumn title="探す" links={CATALOG_LINKS} />
        <FooterColumn title="読む" links={RESOURCE_LINKS} />
        <FooterColumn title="アカウント" links={ACCOUNT_LINKS} />
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 Farmille</p>
          <p className="text-xs">
            Made for Japanese ag biologicals community
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-[var(--green-primary)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
