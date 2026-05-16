import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";

// spec §6.1 / §7.1: admin layout は Server Component で role guard を行う。
// 未ログイン / 非 admin はすべて /login?next=... へリダイレクト (spec §1.1)。
// 2FA は v1.5+ (spec §10.1)、本 layout には実装上の目印を残さない。

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
