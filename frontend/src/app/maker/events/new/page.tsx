import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { EventForm, type EventFormInitial } from "../_components/event-form";

function defaultInitial(): EventFormInitial {
  const now = new Date();
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoHoursLater = new Date(oneWeek.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: "",
    body: "",
    venue: null,
    online_url: null,
    starts_at: oneWeek.toISOString(),
    ends_at: twoHoursLater.toISOString(),
    capacity: null,
    status: "draft",
  };
}

export default async function MakerEventNewPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/maker/events/new");
  }
  const role = await getRole(user);
  if (role !== "maker") {
    redirect(landingPathForRole(role));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/maker/events" className="hover:text-primary">
            講演会管理
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">新規作成</span>
        </nav>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            講演会を新規作成
          </h1>
          <p className="text-sm text-muted-foreground">
            下書きで作成 → 内容を確認したら公開状態に変更できます。
          </p>
        </header>

        <EventForm mode="create" initial={defaultInitial()} />
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
