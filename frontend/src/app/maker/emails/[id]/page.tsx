import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";
import {
  CampaignForm,
  type CampaignFormInitial,
  type MakerEventOption,
} from "../_components/campaign-form";
import { DeleteSection } from "../_components/delete-section";
import { SendButton } from "../_components/send-button";

type CampaignStatus = "draft" | "queued" | "sent" | "failed";
type SegmentType =
  | "favorite_followers"
  | "event_past_attendees"
  | "specific_users";

type CampaignDetail = {
  id: string;
  maker_user_id: string;
  subject: string;
  body: string;
  segment_type: SegmentType;
  segment_filter: Record<string, unknown>;
  status: CampaignStatus;
  recipient_count: number;
  queued_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type MakerEventListItem = {
  id: string;
  title: string;
  starts_at: string;
};

type MakerEventsResponse = { events: MakerEventListItem[] };

type PageProps = {
  params: Promise<{ id: string }>;
};

function segmentLabel(t: SegmentType): string {
  switch (t) {
    case "favorite_followers":
      return "暗黙フォロワー";
    case "event_past_attendees":
      return "過去申込者";
    default:
      return "個別指定";
  }
}

function statusBadge(status: CampaignStatus): string {
  switch (status) {
    case "queued":
      return "bg-primary/10 text-primary";
    case "sent":
      return "bg-emerald-500/10 text-emerald-700";
    case "failed":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusLabel(status: CampaignStatus): string {
  switch (status) {
    case "queued":
      return "送信予約済";
    case "sent":
      return "送信済";
    case "failed":
      return "失敗";
    default:
      return "下書き";
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

export default async function MakerEmailDetailPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) {
    const { id } = await params;
    redirect(`/login?next=/maker/emails/${id}`);
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
    redirect(`/login?next=/maker/emails/${id}`);
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(
    `${apiUrl}/v1/maker/emails/campaigns/${encodeURIComponent(id)}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  if (res.status === 404 || res.status === 403) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch campaign: ${res.status}`);
  }

  const campaign = (await res.json()) as CampaignDetail;
  const isDraft = campaign.status === "draft";

  // 編集モード用に自社 events を取得（segment 変更で event_past_attendees を選ぶ可能性）
  let events: MakerEventOption[] = [];
  if (isDraft) {
    const eventsRes = await fetch(`${apiUrl}/v1/maker/events?status=all`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
    if (eventsRes.ok) {
      const data = (await eventsRes.json()) as MakerEventsResponse;
      events = data.events.map((e) => ({
        id: e.id,
        title: e.title,
        starts_at: e.starts_at,
      }));
    }
  }

  const initial: CampaignFormInitial = {
    id: campaign.id,
    subject: campaign.subject,
    body: campaign.body,
    segment_type: campaign.segment_type,
    segment_filter: campaign.segment_filter,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/maker/emails" className="hover:text-primary">
            一斉メール
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">{campaign.subject}</span>
        </nav>

        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${statusBadge(campaign.status)}`}
            >
              {statusLabel(campaign.status)}
            </span>
            <span className="inline-block rounded-sm px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {segmentLabel(campaign.segment_type)}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {campaign.subject}
          </h1>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <dt>作成日時</dt>
            <dd>{formatDate(campaign.created_at)}</dd>
            <dt>送信予約日時</dt>
            <dd>{formatDate(campaign.queued_at)}</dd>
            <dt>送信日時</dt>
            <dd>{formatDate(campaign.sent_at)}</dd>
            <dt>送信予定件数</dt>
            <dd>{campaign.recipient_count} 件</dd>
          </dl>
        </header>

        {isDraft ? (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">編集</h2>
            <CampaignForm mode="edit" initial={initial} events={events} />

            <hr className="border-border" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                送信予約
              </h2>
              <p className="text-sm text-muted-foreground">
                送信予約すると下書き状態を抜け、編集できなくなります。
              </p>
              <SendButton campaignId={campaign.id} />
            </section>

            <hr className="border-border" />

            <DeleteSection campaignId={campaign.id} />
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">内容</h2>
            <article className="rounded-md border border-border bg-card p-6 space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                {campaign.subject}
              </h3>
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                {campaign.body}
              </pre>
            </article>
            <p className="text-xs text-muted-foreground">
              送信予約済のキャンペーンは編集・削除できません。
            </p>
            <Button asChild variant="outline">
              <Link href="/maker/emails">一覧に戻る</Link>
            </Button>
          </section>
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
