import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";
import {
  CampaignForm,
  type CampaignFormInitial,
  type MakerEventOption,
} from "../_components/campaign-form";

type MakerEventListItem = {
  id: string;
  title: string;
  starts_at: string;
  status: "draft" | "published" | "cancelled";
};

type MakerEventsResponse = { events: MakerEventListItem[] };

function defaultInitial(): CampaignFormInitial {
  return {
    subject: "",
    body: "",
    segment_type: "favorite_followers",
    segment_filter: { segment_type: "favorite_followers" },
  };
}

export default async function MakerEmailNewPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/maker/emails/new");
  }
  const role = await getRole(user);
  if (role !== "maker") {
    redirect(landingPathForRole(role));
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/maker/emails/new");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  // 自社 events を全 status で取得（event_past_attendees segment 選択肢用）
  const eventsRes = await fetch(`${apiUrl}/v1/maker/events?status=all`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  let events: MakerEventOption[] = [];
  if (eventsRes.ok) {
    const data = (await eventsRes.json()) as MakerEventsResponse;
    events = data.events.map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
    }));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/maker/emails" className="hover:text-primary">
            一斉メール
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">新規作成</span>
        </nav>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            一斉メールを新規作成
          </h1>
          <p className="text-sm text-muted-foreground">
            下書きで作成 → 内容を確認したら送信予約できます。
            v1 では送信予約までで、実送信は別フェーズで対応します。
          </p>
        </header>

        <CampaignForm
          mode="create"
          initial={defaultInitial()}
          events={events}
        />
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
