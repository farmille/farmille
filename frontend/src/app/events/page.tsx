import type { Metadata } from "next";
import Link from "next/link";

type EventHost = {
  user_id: string;
  display_name: string;
  host_type: "maker" | "admin";
  prefecture: string | null;
  city: string | null;
};

type EventListItem = {
  id: string;
  title: string;
  host: EventHost;
  starts_at: string;
  ends_at: string;
  venue: string | null;
  online_url: string | null;
  capacity: number | null;
  status: "draft" | "published" | "cancelled";
  active_registration_count: number;
};

type EventListResponse = { events: EventListItem[] };

type PageProps = {
  searchParams?: Promise<{ upcoming_only?: string }>;
};

export const metadata: Metadata = {
  title: "講演会・イベント",
  description:
    "BS資材メーカーが主催する講演会・勉強会の一覧。農家・JA普及員・研究者の申込を受け付けています。",
  openGraph: {
    title: "講演会・イベント | Farmille",
    description:
      "BS資材メーカーが主催する講演会・勉強会の一覧。",
    url: "/events",
  },
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

function venueLabel(event: EventListItem): string {
  if (event.online_url) return "オンライン開催";
  if (event.venue) return event.venue;
  return "会場未定";
}

function remainingSeatsLabel(event: EventListItem): string {
  if (event.capacity === null) return "定員なし";
  const remaining = event.capacity - event.active_registration_count;
  if (remaining <= 0) return "満席";
  return `残り ${remaining} 名 / 定員 ${event.capacity} 名`;
}

export default async function EventsListPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const upcomingOnly = params.upcoming_only !== "false";

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  qs.set("upcoming_only", upcomingOnly ? "true" : "false");
  const res = await fetch(`${apiUrl}/v1/events?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status}`);
  }
  const { events } = (await res.json()) as EventListResponse;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            講演会・イベント
          </h1>
          <p className="text-base text-muted-foreground">
            BS資材メーカーが主催する講演会・勉強会の一覧。
          </p>
        </div>

        <div
          className="flex gap-2"
          role="group"
          aria-label="開催時期フィルタ"
        >
          <Link
            href="/events?upcoming_only=true"
            className={
              upcomingOnly
                ? "rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            }
          >
            これから開催
          </Link>
          <Link
            href="/events?upcoming_only=false"
            className={
              !upcomingOnly
                ? "rounded-sm border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            }
          >
            すべて
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
            <p className="text-lg font-medium text-foreground">
              公開予定の講演会はありません
            </p>
            <p className="text-sm text-muted-foreground">
              新しい講演会が公開されるとここに表示されます。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group block rounded-md border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow p-4 space-y-2"
              >
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary line-clamp-2">
                  {e.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  主催: {e.host.display_name}
                </p>
                <p className="text-sm text-foreground">
                  {formatRange(e.starts_at, e.ends_at)}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {venueLabel(e)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {remainingSeatsLabel(e)}
                </p>
              </Link>
            ))}
          </div>
        )}
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
