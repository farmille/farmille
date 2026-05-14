import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";
import {
  EventForm,
  type EventFormInitial,
} from "../../_components/event-form";

type EventStatus = "draft" | "published" | "cancelled";

type MakerEventDetail = {
  id: string;
  title: string;
  body: string;
  host_user_id: string;
  host_type: "maker" | "admin";
  venue: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  status: EventStatus;
  active_registration_count: number;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MakerEventEditPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) {
    const { id } = await params;
    redirect(`/login?next=/maker/events/${id}/edit`);
  }
  const role = await getRole(user);
  if (role !== "maker") {
    redirect(landingPathForRole(role));
  }

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect(`/login?next=/maker/events/${id}/edit`);
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(`${apiUrl}/v1/maker/events/${id}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 403) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch maker event: ${res.status}`);
  }

  const event = (await res.json()) as MakerEventDetail;

  const initial: EventFormInitial = {
    id: event.id,
    title: event.title,
    body: event.body,
    venue: event.venue,
    online_url: event.online_url,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    capacity: event.capacity,
    status: event.status,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/maker/events" className="hover:text-primary">
            講演会管理
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground line-clamp-1">{event.title}</span>
        </nav>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            講演会を編集
          </h1>
          <p className="text-sm text-muted-foreground">
            申込: {event.active_registration_count} 名
            {event.capacity !== null
              ? ` / 定員 ${event.capacity} 名`
              : ""}
          </p>
        </header>

        <EventForm mode="edit" initial={initial} />
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
