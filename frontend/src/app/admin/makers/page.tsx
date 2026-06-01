import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MakerActionButtons } from "./_components/maker-action-buttons";

export const metadata: Metadata = {
  title: "メーカー承認",
  description: "メーカー一覧 + 公開/非公開トグル",
};

// 2026-05-27 改修: 「承認待ちキュー」から「全 maker 一覧 + 公開/非公開トグル」へ。
// signup 時 status='pending_review' で着地、admin が公開ボタンで active 化する運用。

type MakerStatus = "active" | "pending_review" | "rejected" | "frozen";

type MakerRow = {
  user_id: string;
  name: string;
  email: string | null;
  status: MakerStatus;
  created_at: string;
  company_name: string | null;
  prefecture: string | null;
  city: string | null;
  note: string | null;
};

type ListResponse = { makers: MakerRow[]; total: number };

const STATUS_LABEL: Record<MakerStatus, string> = {
  active: "公開中",
  pending_review: "非公開",
  rejected: "取り下げ",
  frozen: "凍結中",
};

const STATUS_BADGE_CLASS: Record<MakerStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pending_review: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  rejected: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  frozen: "bg-slate-500/15 text-slate-700 border-slate-500/30",
};

const STATUS_FILTER_OPTIONS: { value: "" | MakerStatus; label: string }[] = [
  { value: "", label: "すべて" },
  { value: "pending_review", label: "非公開" },
  { value: "active", label: "公開中" },
  { value: "rejected", label: "取り下げ" },
  { value: "frozen", label: "凍結中" },
];

type PageProps = {
  searchParams?: Promise<{ status?: string }>;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminMakersPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const status = params.status?.trim() ?? "";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin/makers");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);

  const res = await fetch(
    `${apiUrl}/v1/admin/makers/list${qs.toString() ? `?${qs.toString()}` : ""}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/makers/list: ${res.status}`);
  }
  const { makers, total } = (await res.json()) as ListResponse;

  // status 別の件数 (簡易、サブクエリ無しで全件から count)
  const counts = makers.reduce<Record<MakerStatus, number>>(
    (acc, m) => {
      acc[m.status] = (acc[m.status] ?? 0) + 1;
      return acc;
    },
    {
      active: 0,
      pending_review: 0,
      rejected: 0,
      frozen: 0,
    },
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">メーカー承認</h1>
        <p className="text-sm text-muted-foreground">
          全 {total} 件 — 公開中 {counts.active} / 非公開 {counts.pending_review} / 取り下げ {counts.rejected}
          {counts.frozen > 0 ? ` / 凍結中 ${counts.frozen}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          新規 signup の maker は <b>非公開 (pending_review)</b> で着地。「公開」を押すと /manufacturers に表示され、出品が解禁されます。
        </p>
      </header>

      <Form
        action="/admin/makers"
        scroll={false}
        className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4"
      >
        <label className="space-y-1 flex-1 min-w-[200px]">
          <span className="text-xs text-muted-foreground">status フィルタ</span>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
        >
          絞り込む
        </button>
        <Link
          href="/admin/makers"
          className="rounded border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          クリア
        </Link>
      </Form>

      {makers.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            該当するメーカーがいません
          </p>
          <p className="text-sm text-muted-foreground">
            新規メーカーが signup するとここに「非公開」状態で表示されます。
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {makers.map((m) => (
            <li
              key={m.user_id}
              className="rounded-md border border-border bg-card p-5 space-y-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-medium text-foreground">
                      {m.company_name ?? m.name}
                    </p>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    担当者: {m.name} / {m.email || "メール未取得"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  登録日: {formatDate(m.created_at)}
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <Field
                  label="所在地"
                  value={
                    [m.prefecture, m.city].filter(Boolean).join(" ") || "未設定"
                  }
                />
                <Field label="user_id" value={m.user_id} mono />
              </dl>

              {m.note ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">自己紹介</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {m.note}
                  </p>
                </div>
              ) : null}

              <MakerActionButtons
                userId={m.user_id}
                companyName={m.company_name ?? m.name}
                currentStatus={m.status}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: MakerStatus }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "text-xs font-mono text-foreground break-all"
            : "text-sm text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
