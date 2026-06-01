import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminReportListResponse,
  ReportReason,
  ReportStatus,
} from "@/types/admin";
import { ResolveAction } from "./_components/resolve-action";

export const metadata: Metadata = {
  title: "通報管理",
};

// 2026-05-27: B2 本実装。SQL 直 → admin UI へ昇格。
// admin AAL2 通過後、/v1/admin/reports からキューを取得し処理アクションを並べる。

const PER_PAGE = 50;
const MAX_PAGE = 5000;

const STATUS_OPTIONS: { value: "" | ReportStatus; label: string }[] = [
  { value: "pending", label: "未処理 (pending)" },
  { value: "", label: "すべて" },
  { value: "resolved", label: "解決済" },
  { value: "spam", label: "spam" },
  { value: "dismissed", label: "却下" },
];

const REASON_LABEL: Record<ReportReason, string> = {
  spam: "スパム",
  abuse: "嫌がらせ",
  impersonation: "なりすまし",
  inappropriate: "不適切な内容",
  other: "その他",
};

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    page?: string;
  }>;
};

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 1;
  const i = Math.floor(n);
  if (i < 1) return 1;
  if (i > MAX_PAGE) return MAX_PAGE;
  return i;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const status = params.status === undefined ? "pending" : params.status;
  const page = parsePage(params.page);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin/reports");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  qs.set("page", String(page));
  qs.set("per_page", String(PER_PAGE));

  const res = await fetch(`${apiUrl}/v1/admin/reports?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/reports: ${res.status}`);
  }
  const { reports, total, per_page } =
    (await res.json()) as AdminReportListResponse;

  const totalPages = Math.max(1, Math.ceil(total / per_page));
  const rangeStart = total === 0 ? 0 : (page - 1) * per_page + 1;
  const rangeEnd = Math.min(page * per_page, total);

  function pageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    next.set("page", String(targetPage));
    return `/admin/reports?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">通報管理</h1>
        <p className="text-sm text-muted-foreground">
          ユーザー対ユーザーの通報キュー。pending を解決 / spam / 却下のいずれかに進めます。
        </p>
      </header>

      <Form
        action="/admin/reports"
        scroll={false}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-md border border-border bg-card p-4"
      >
        <label className="md:col-span-2 space-y-1">
          <span className="text-xs text-muted-foreground">status</span>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
          >
            絞り込む
          </button>
          <Link
            href="/admin/reports"
            className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
          >
            クリア
          </Link>
        </div>
      </Form>

      <p className="text-sm text-muted-foreground">
        全 {total} 件中 {rangeStart}–{rangeEnd} を表示 / page {page} / {totalPages}
      </p>

      {reports.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-medium text-foreground">通報はありません</p>
          <p className="text-sm text-muted-foreground">
            未処理通報が来るとここに表示されます。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">受付日時</th>
                <th className="px-3 py-2">通報者</th>
                <th className="px-3 py-2">対象</th>
                <th className="px-3 py-2">理由</th>
                <th className="px-3 py-2 max-w-[320px]">内容</th>
                <th className="px-3 py-2">status</th>
                <th className="px-3 py-2 w-72">処理</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 align-top hover:bg-muted/20"
                >
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(r.created_at)}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {r.reporter_name ?? <span className="text-muted-foreground italic">(退会者)</span>}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {r.target_name ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <ReasonBadge reason={r.reason} />
                  </td>
                  <td className="px-3 py-2 max-w-[320px] text-muted-foreground">
                    {r.body ? (
                      <p className="whitespace-pre-wrap break-words">
                        {r.body}
                      </p>
                    ) : (
                      <span className="italic">(コメントなし)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "pending" ? (
                      <ResolveAction
                        reportId={r.id}
                        targetName={r.target_name}
                        reason={REASON_LABEL[r.reason]}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        <p>処理日時: {formatDateTime(r.resolved_at)}</p>
                        {r.resolution_note ? (
                          <p className="mt-1 italic">「{r.resolution_note}」</p>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="pagination"
          className="flex items-center justify-between"
        >
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={
              "rounded border border-border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2 " +
              (page <= 1
                ? "pointer-events-none opacity-50"
                : "hover:bg-muted")
            }
          >
            前へ
          </Link>
          <span className="text-xs text-muted-foreground">
            page {page} / {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={
              "rounded border border-border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2 " +
              (page >= totalPages
                ? "pointer-events-none opacity-50"
                : "hover:bg-muted")
            }
          >
            次へ
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

function ReasonBadge({ reason }: { reason: ReportReason }) {
  const cls =
    reason === "spam"
      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
      : reason === "abuse"
        ? "bg-rose-500/15 text-rose-700 border-rose-500/30"
        : reason === "impersonation"
          ? "bg-purple-500/15 text-purple-700 border-purple-500/30"
          : reason === "inappropriate"
            ? "bg-rose-500/15 text-rose-700 border-rose-500/30"
            : "bg-slate-500/15 text-slate-700 border-slate-500/30";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${cls}`}>
      {REASON_LABEL[reason]}
    </span>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, { label: string; cls: string }> = {
    pending: {
      label: "未処理",
      cls: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    },
    resolved: {
      label: "解決済",
      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    },
    spam: {
      label: "spam",
      cls: "bg-slate-500/15 text-slate-700 border-slate-500/30",
    },
    dismissed: {
      label: "却下",
      cls: "bg-slate-500/15 text-slate-700 border-slate-500/30",
    },
  };
  const entry = map[status];
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}
