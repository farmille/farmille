import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser, getRole } from "@/lib/auth/server";
import { RegisterButton } from "./_components/register-button";

type EventHost = {
  user_id: string;
  display_name: string;
  host_type: "maker" | "admin";
  prefecture: string | null;
  city: string | null;
};

type EventDetail = {
  id: string;
  title: string;
  body: string;
  host: EventHost;
  venue: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  status: "draft" | "published" | "cancelled";
  active_registration_count: number;
  is_full: boolean;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  const startStr = `${s.getFullYear()}/${(s.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${s.getDate().toString().padStart(2, "0")} ${s
    .getHours()
    .toString()
    .padStart(2, "0")}:${s.getMinutes().toString().padStart(2, "0")}`;
  if (sameDay) {
    const endStr = `${e.getHours().toString().padStart(2, "0")}:${e
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return `${startStr} - ${endStr}`;
  }
  const endStr = `${e.getFullYear()}/${(e.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${e.getDate().toString().padStart(2, "0")} ${e
    .getHours()
    .toString()
    .padStart(2, "0")}:${e.getMinutes().toString().padStart(2, "0")}`;
  return `${startStr} - ${endStr}`;
}

async function fetchEvent(id: string): Promise<EventDetail | null> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }
  const res = await fetch(`${apiUrl}/v1/events/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch event: ${res.status}`);
  }
  return (await res.json()) as EventDetail;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);
  if (!event) return {};
  const description = event.body.replace(/\s+/g, " ").trim().slice(0, 120);
  return {
    title: event.title,
    description,
    openGraph: {
      title: `${event.title} | Farmille`,
      description,
      url: `/events/${event.id}`,
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const event = await fetchEvent(id);
  if (!event) {
    notFound();
  }

  const user = await getUser();
  const role = await getRole(user);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/events" className="hover:text-primary">
            講演会・イベント
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground line-clamp-1">{event.title}</span>
        </nav>

        <article className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="text-base text-foreground">
              {formatRange(event.starts_at, event.ends_at)}
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>主催: {event.host.display_name}</p>
              {event.host.prefecture && (
                <p>
                  所在地: {event.host.prefecture}
                  {event.host.city ? ` ${event.host.city}` : ""}
                </p>
              )}
              {event.venue && <p>会場: {event.venue}</p>}
              {event.online_url && (
                <p>
                  オンライン:{" "}
                  <a
                    href={event.online_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {event.online_url}
                  </a>
                </p>
              )}
              <p>
                {event.capacity === null
                  ? "定員なし"
                  : `定員 ${event.capacity} 名 / 現在 ${event.active_registration_count} 名申込`}
              </p>
            </div>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              内容
            </h2>
            <pre className="whitespace-pre-wrap font-sans text-base text-foreground">
              {event.body}
            </pre>
          </section>

          <section className="rounded-md border border-border bg-card p-6 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              申込
            </h2>
            <RegisterButton
              eventId={event.id}
              role={role}
              isAuthenticated={user !== null}
              isFull={event.is_full}
            />
          </section>
        </article>
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hover:text-primary">
              ログイン
            </Link>
            <Link href="/signup" className="hover:text-primary">
              新規登録
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
