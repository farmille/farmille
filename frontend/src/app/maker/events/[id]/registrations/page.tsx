import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";

type Registration = {
  id: string;
  user_id: string;
  display_name: string | null;
  role: string;
  registered_at: string;
  cancelled_at: string | null;
};

type RegistrationsResponse = {
  registrations: Registration[];
  active_count: number;
  cancelled_count: number;
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ include_cancelled?: string }>;
};

function roleLabel(role: string): string {
  switch (role) {
    case "farmer":
      return "農家";
    case "ja_staff":
      return "JA普及員";
    case "researcher":
      return "研究者";
    case "maker":
      return "メーカー";
    case "admin":
      return "運営";
    default:
      return role;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default async function MakerEventRegistrationsPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getUser();
  if (!user) {
    const { id } = await params;
    redirect(`/login?next=/maker/events/${id}/registrations`);
  }
  const role = await getRole(user);
  if (role !== "maker") {
    redirect(landingPathForRole(role));
  }

  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const includeCancelled = sp.include_cancelled === "true";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect(`/login?next=/maker/events/${id}/registrations`);
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  if (includeCancelled) qs.set("include_cancelled", "true");
  const res = await fetch(
    `${apiUrl}/v1/maker/events/${id}/registrations?${qs.toString()}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  if (res.status === 404 || res.status === 403) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch registrations: ${res.status}`);
  }

  const { registrations, active_count, cancelled_count } =
    (await res.json()) as RegistrationsResponse;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/maker/events" className="hover:text-primary">
            講演会管理
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">申込者一覧</span>
        </nav>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">申込者一覧</h1>
          <p className="text-sm text-muted-foreground">
            申込 {active_count} 名 / キャンセル {cancelled_count} 名
          </p>
        </header>

        <div className="flex gap-2" role="group" aria-label="表示切替">
          <Link
            href={`/maker/events/${id}/registrations`}
            className={
              !includeCancelled
                ? "rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            }
          >
            申込中のみ
          </Link>
          <Link
            href={`/maker/events/${id}/registrations?include_cancelled=true`}
            className={
              includeCancelled
                ? "rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            }
          >
            キャンセル済も含む
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              申込者はまだいません。
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    氏名
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    ロール
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    申込日時
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    取消日時
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-foreground">
                      {r.display_name ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {roleLabel(r.role)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatDate(r.registered_at)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatDate(r.cancelled_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
