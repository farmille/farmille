import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";

type EventStatus = "draft" | "published" | "cancelled";

type MakerEventListItem = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue: string | null;
  online_url: string | null;
  capacity: number | null;
  status: EventStatus;
  active_registration_count: number;
  created_at: string;
};

type MakerEventListResponse = { events: MakerEventListItem[] };

type PageProps = {
  searchParams?: Promise<{ status?: string }>;
};

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開" },
  { value: "cancelled", label: "中止" },
];

function statusBadge(status: EventStatus): string {
  switch (status) {
    case "published":
      return "bg-primary/10 text-primary";
    case "cancelled":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusLabel(status: EventStatus): string {
  switch (status) {
    case "published":
      return "公開";
    case "cancelled":
      return "中止";
    default:
      return "下書き";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default async function MakerEventsPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/maker/events");
  }
  const role = await getRole(user);
  if (role !== "maker") {
    redirect(landingPathForRole(role));
  }

  const params = (await searchParams) ?? {};
  const statusFilter = STATUS_TABS.some((t) => t.value === params.status)
    ? (params.status as string)
    : "all";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/maker/events");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  qs.set("status", statusFilter);
  const res = await fetch(`${apiUrl}/v1/maker/events?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch maker events: ${res.status}`);
  }

  const { events } = (await res.json()) as MakerEventListResponse;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              講演会管理
            </h1>
            <p className="text-sm text-muted-foreground">{events.length} 件</p>
          </div>
          <Button asChild>
            <Link href="/maker/events/new">新規作成</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="状態フィルタ">
          {STATUS_TABS.map((tab) => {
            const selected = statusFilter === tab.value;
            return (
              <Link
                key={tab.value}
                href={`/maker/events?status=${tab.value}`}
                className={
                  selected
                    ? "rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    : "rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {events.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-10 text-center space-y-4">
            <p className="text-lg font-medium text-foreground">
              該当する講演会はありません
            </p>
            <Button asChild>
              <Link href="/maker/events/new">最初の講演会を作成する</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${statusBadge(e.status)}`}
                    >
                      {statusLabel(e.status)}
                    </span>
                    <h3 className="text-base font-semibold text-foreground line-clamp-1">
                      {e.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    開催: {formatDate(e.starts_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    申込: {e.active_registration_count} 名
                    {e.capacity !== null ? ` / 定員 ${e.capacity} 名` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/maker/events/${e.id}/edit`}>編集</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/maker/events/${e.id}/registrations`}>
                      申込者
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
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
