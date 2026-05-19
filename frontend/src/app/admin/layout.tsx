import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

// spec §6.1 / §6.5 / §7.1: admin layout は Server Component で role + AAL2 guard。
// 未ログイン / 非 admin → /login?next=/admin
// AAL1 admin → factor の有無で /mfa/setup or /mfa/challenge に分岐 (ADR-0012 §2.3)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  const role = await getRole(user);
  if (role !== "admin") {
    redirect("/login?next=/admin");
  }

  const supabase = await createClient();
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedTotp = factors?.totp.find((f) => f.status === "verified");
    const target = verifiedTotp
      ? `/mfa/challenge?next=${encodeURIComponent("/admin")}`
      : `/mfa/setup?next=${encodeURIComponent("/admin")}`;
    redirect(target);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        <aside className="md:sticky md:top-8 md:self-start space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 pb-2">
            Farmille Admin
          </p>
          <AdminNavLink href="/admin" label="ダッシュボード" />
          <AdminNavLink href="/admin/makers" label="メーカー承認" />
          <AdminNavLink href="/admin/users" label="ユーザー管理" />
          <AdminNavLink href="/admin/reports" label="通報管理" />
          <AdminNavLink href="/admin/articles" label="記事管理" />
          <AdminNavLink
            href="/admin/featured-products"
            label="注目の資材"
          />
          <AdminNavLink href="/admin/banners" label="バナー" />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille Admin</p>
        </div>
      </footer>
    </div>
  );
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded text-sm text-foreground hover:bg-muted"
    >
      {label}
    </Link>
  );
}
