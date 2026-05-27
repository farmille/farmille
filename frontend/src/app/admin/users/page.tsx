import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminUserListResponse,
  UserAccountStatus,
  UserRole,
} from "@/types/admin";
import { RoleChangeAction } from "./_components/role-change-action";

export const metadata: Metadata = {
  title: "ユーザー管理",
  description: "Farmille ユーザー一覧 + ロール変更",
};

// B6 MVP (spec maker-approval-admin §5.5、ADR-0009)。
// - SSR で /v1/admin/users を取得 (admin BFF + AAL2 必須、layout.tsx 側 guard 通過済)
// - role 変更は Client Island RoleChangeAction を行ごとに配置
//   (backend は ASSIGNABLE_ROLES = admin / ja_staff / researcher のみ)
// - status 変更 (frozen toggle) は v1.5+ に push (今日は閲覧 + role 変更のみ)
// - Next.js 16 <Form scroll={false}> で URL クエリ反映時のスクロール位置保持

const PER_PAGE = 50;
const MAX_PAGE = 5000;

const ROLE_FILTER_OPTIONS: { value: ""; label: string }[] | { value: UserRole; label: string }[] = [
  { value: "" as never, label: "すべて" },
  { value: "admin", label: "admin" },
  { value: "farmer", label: "farmer" },
  { value: "maker", label: "maker" },
  { value: "ja_staff", label: "ja_staff" },
  { value: "researcher", label: "researcher" },
  { value: "unassigned", label: "unassigned" },
];

const STATUS_FILTER_OPTIONS: {
  value: "" | UserAccountStatus;
  label: string;
}[] = [
  { value: "", label: "すべて" },
  { value: "active", label: "active" },
  { value: "pending_review", label: "pending_review" },
  { value: "rejected", label: "rejected" },
  { value: "frozen", label: "frozen" },
];

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const roleFilter = params.role?.trim() ?? "";
  const statusFilter = params.status?.trim() ?? "";
  const page = parsePage(params.page);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin/users");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (roleFilter) qs.set("role", roleFilter);
  if (statusFilter) qs.set("status", statusFilter);
  qs.set("page", String(page));
  qs.set("per_page", String(PER_PAGE));

  const res = await fetch(`${apiUrl}/v1/admin/users?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/users: ${res.status}`);
  }
  const { users, total, per_page } =
    (await res.json()) as AdminUserListResponse;

  const totalPages = Math.max(1, Math.ceil(total / per_page));
  const rangeStart = total === 0 ? 0 : (page - 1) * per_page + 1;
  const rangeEnd = Math.min(page * per_page, total);

  function pageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (roleFilter) next.set("role", roleFilter);
    if (statusFilter) next.set("status", statusFilter);
    next.set("page", String(targetPage));
    return `/admin/users?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">ユーザー管理</h1>
        <p className="text-sm text-muted-foreground">
          Farmille ユーザーの一覧と role 変更。凍結 / 削除は v1.5+ で UI 化予定 (現状 SQL 直)。
        </p>
      </header>

      <Form
        action="/admin/users"
        scroll={false}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-md border border-border bg-card p-4"
      >
        <label className="md:col-span-2 space-y-1">
          <span className="text-xs text-muted-foreground">
            キーワード (name 部分一致)
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="例: 田中"
            maxLength={100}
            className="w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">role</span>
          <select
            name="role"
            defaultValue={roleFilter}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">status</span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
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
            href="/admin/users"
            className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
          >
            クリア
          </Link>
        </div>
      </Form>

      <p className="text-sm text-muted-foreground">
        全 {total} 件中 {rangeStart}–{rangeEnd} を表示 / page {page} / {totalPages}
      </p>

      {users.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            該当するユーザーが見つかりません
          </p>
          <p className="text-sm text-muted-foreground">
            フィルタを緩めるかキーワードを変更してください。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">名前</th>
                <th className="px-3 py-2">email</th>
                <th className="px-3 py-2">role</th>
                <th className="px-3 py-2">status</th>
                <th className="px-3 py-2">登録日</th>
                <th className="px-3 py-2 w-72">操作 (role 変更)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {u.name || "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[260px] truncate">
                    {u.email ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    <RoleChangeAction
                      userId={u.user_id}
                      displayName={u.name || u.email || u.user_id}
                      currentRole={u.role}
                    />
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

function RoleBadge({ role }: { role: UserRole }) {
  const cls =
    role === "admin"
      ? "bg-rose-500/15 text-rose-700 border-rose-500/30"
      : role === "ja_staff" || role === "researcher"
        ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
        : role === "maker"
          ? "bg-sky-500/15 text-sky-700 border-sky-500/30"
          : role === "farmer"
            ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
            : "bg-slate-500/15 text-slate-700 border-slate-500/30";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${cls}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: UserAccountStatus }) {
  const labelMap: Record<UserAccountStatus, { label: string; cls: string }> = {
    active: {
      label: "active",
      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    },
    pending_review: {
      label: "pending",
      cls: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    },
    rejected: {
      label: "rejected",
      cls: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    },
    frozen: {
      label: "frozen",
      cls: "bg-slate-500/15 text-slate-700 border-slate-500/30",
    },
  };
  const entry = labelMap[status];
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}
