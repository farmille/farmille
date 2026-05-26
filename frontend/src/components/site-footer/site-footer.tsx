import Link from "next/link";
import { Sprout } from "lucide-react";

// 全ページ共通のフッター。design-tokens v2 + AgList-style 2-tier layout。
// 上段: ブランド + リソース / カタログ / アカウント の 3 列
// 下段: © と二次リンク (現状は最小)
//
// Server Component の前提 (lib/auth は使わない、role に依存しない)。
// 認証必須ページ (例: /admin) は固有 footer を持っていれば本コンポーネントを
// 採用しなくてよい。共通 public ページが対象。

type FooterLink = { href: string; label: string };

const RESOURCE_LINKS: FooterLink[] = [
  { href: "/articles", label: "記事" },
  { href: "/manufacturers", label: "メーカー一覧" },
];

const CATALOG_LINKS: FooterLink[] = [
  { href: "/products", label: "資材を探す" },
  { href: "/manufacturers", label: "メーカーを探す" },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { href: "/login", label: "ログイン" },
  { href: "/signup", label: "新規登録" },
];

export function SiteFooter() {
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
            農家・JA・研究者・メーカーをつなぐプラットフォーム。
          </p>
        </div>

        <FooterColumn title="探す" links={CATALOG_LINKS} />
        <FooterColumn title="読む" links={RESOURCE_LINKS} />
        <FooterColumn title="アカウント" links={ACCOUNT_LINKS} />
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 Farmille</p>
          <p className="text-[11px]">
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
