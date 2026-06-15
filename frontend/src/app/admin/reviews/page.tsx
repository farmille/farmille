import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminReviewListResponse,
  ReviewModerationStatus,
} from "@/types/admin";
import { ReviewModerationAction } from "./_components/review-moderation-action";

export const metadata: Metadata = {
  title: "レビュー承認",
};

// レビュー承認フロー (2026-06-13 / 奥田さん指示 6-15 定例): B2 と同型の承認キュー。
// farmer 投稿レビューは pending で着地 → ここで承認(公開) / 却下(非公開) する。

const PER_PAGE = 50;
const MAX_PAGE = 5000;

const STATUS_OPTIONS: { value: "" | ReviewModerationStatus; label: string }[] = [
  { value: "pending", label: "承認待ち (pending)" },
  { value: "", label: "すべて" },
  { value: "approved", label: "公開済 (approved)" },
  { value: "rejected", label: "却下 (rejected)" },
];

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

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const status = params.status === undefined ? "pending" : params.status;
  const page = parsePage(params.page);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin/reviews");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  qs.set("page", String(page));
  qs.set("per_page", String(PER_PAGE));

  const res = await fetch(`${apiUrl}/v1/admin/reviews?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/reviews: ${res.status}`);
  }
  const { reviews, total, per_page } =
    (await res.json()) as AdminReviewListResponse;

  const totalPages = Math.max(1, Math.ceil(total / per_page));
  const rangeStart = total === 0 ? 0 : (page - 1) * per_page + 1;
  const rangeEnd = Math.min(page * per_page, total);

  function pageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    next.set("page", String(targetPage));
    return `/admin/reviews?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">レビュー承認</h1>
        <p className="text-sm text-muted-foreground">
          生産者が投稿したレビューの承認キュー。承認すると公開ページに表示され、却下すると非公開のままになります。
        </p>
      </header>

      <Form
        action="/admin/reviews"
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
            href="/admin/reviews"
            className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
          >
            クリア
          </Link>
        </div>
      </Form>

      <p className="text-sm text-muted-foreground">
        全 {total} 件中 {rangeStart}–{rangeEnd} を表示 / page {page} / {totalPages}
      </p>

      {reviews.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            {status === "pending"
              ? "承認待ちのレビューはありません"
              : "該当するレビューはありません"}
          </p>
          <p className="text-sm text-muted-foreground">
            {status === "pending"
              ? "新しいレビューが投稿されるとここに表示されます。"
              : "フィルタ条件を変えてお試しください。"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">投稿日時</th>
                <th className="px-3 py-2">資材</th>
                <th className="px-3 py-2">投稿者</th>
                <th className="px-3 py-2">評価</th>
                <th className="px-3 py-2 max-w-[360px]">本文</th>
                <th className="px-3 py-2">status</th>
                <th className="px-3 py-2 w-48">処理</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 align-top hover:bg-muted/20"
                >
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(r.created_at)}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {r.product_name ? (
                      <Link
                        href={`/products/${r.product_id}`}
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        {r.product_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-foreground whitespace-nowrap">
                    {r.user_name ?? (
                      <span className="text-muted-foreground italic">
                        (退会者)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-amber-600">
                    {"★".repeat(r.rating)}
                    <span className="text-muted-foreground">
                      {"☆".repeat(5 - r.rating)}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[360px] text-muted-foreground">
                    <p className="whitespace-pre-wrap break-words line-clamp-6">
                      {r.body}
                    </p>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "pending" ? (
                      <ReviewModerationAction
                        reviewId={r.id}
                        productName={r.product_name}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        <p>処理日時: {formatDateTime(r.approved_at)}</p>
                        {r.rejection_reason ? (
                          <p className="mt-1 italic">「{r.rejection_reason}」</p>
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
              (page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted")
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

function StatusBadge({ status }: { status: ReviewModerationStatus }) {
  const map: Record<ReviewModerationStatus, { label: string; cls: string }> = {
    pending: {
      label: "承認待ち",
      cls: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    },
    approved: {
      label: "公開済",
      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    },
    rejected: {
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
