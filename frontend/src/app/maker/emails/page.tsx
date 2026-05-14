import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { createClient } from "@/lib/supabase/server";

type CampaignStatus = "draft" | "queued" | "sent" | "failed";
type SegmentType =
  | "favorite_followers"
  | "event_past_attendees"
  | "specific_users";

type CampaignListItem = {
  id: string;
  subject: string;
  segment_type: SegmentType;
  status: CampaignStatus;
  recipient_count: number;
  created_at: string;
  queued_at: string | null;
  sent_at: string | null;
};

type ListResponse = { campaigns: CampaignListItem[] };

type PageProps = {
  searchParams?: Promise<{ status?: string }>;
};

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "draft", label: "下書き" },
  { value: "queued", label: "送信予約" },
  { value: "sent", label: "送信済" },
  { value: "failed", label: "失敗" },
];

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
      return "送信予約";
    case "sent":
      return "送信済";
    case "failed":
      return "失敗";
    default:
      return "下書き";
  }
}

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

export default async function MakerEmailsPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/maker/emails");
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
    redirect("/login?next=/maker/emails");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  qs.set("status", statusFilter);
  const res = await fetch(
    `${apiUrl}/v1/maker/emails/campaigns?${qs.toString()}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch maker email campaigns: ${res.status}`);
  }

  const { campaigns } = (await res.json()) as ListResponse;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              一斉メール
            </h1>
            <p className="text-sm text-muted-foreground">
              {campaigns.length} 件 / v1 では送信予約まで（実送信は別フェーズ）
            </p>
          </div>
          <Button asChild>
            <Link href="/maker/emails/new">新規作成</Link>
          </Button>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="状態フィルタ"
        >
          {STATUS_TABS.map((tab) => {
            const selected = statusFilter === tab.value;
            return (
              <Link
                key={tab.value}
                href={`/maker/emails?status=${tab.value}`}
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

        {campaigns.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-10 text-center space-y-4">
            <p className="text-lg font-medium text-foreground">
              該当するキャンペーンはありません
            </p>
            <Button asChild>
              <Link href="/maker/emails/new">最初のキャンペーンを作成する</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${statusBadge(c.status)}`}
                    >
                      {statusLabel(c.status)}
                    </span>
                    <span className="inline-block rounded-sm px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                      {segmentLabel(c.segment_type)}
                    </span>
                    <h3 className="text-base font-semibold text-foreground line-clamp-1">
                      {c.subject}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    作成: {formatDate(c.created_at)}
                    {c.queued_at !== null
                      ? ` / 予約: ${formatDate(c.queued_at)}`
                      : ""}
                    {" / 送信予定: "}
                    {c.recipient_count} 件
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/maker/emails/${c.id}`}>詳細</Link>
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
