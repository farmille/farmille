import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PendingMakersResponse } from "@/types/admin";
import { MakerActionButtons } from "./_components/maker-action-buttons";

export const metadata: Metadata = {
  title: "メーカー承認",
  description: "承認待ちメーカー一覧",
};

type PageProps = {
  searchParams?: Promise<{ limit?: string; offset?: string }>;
};

const DEFAULT_LIMIT = 50;

function parseIntInRange(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

// spec §6.3: B1 メーカー承認 (必達)。Server Component で pending 一覧を SSR、
// 承認・却下は行ごとの Client Island (_components/maker-action-buttons.tsx) で
// /api/admin/makers/[id]/{approve,reject} を叩く (BFF 直叩き禁止、spec §3.2)。
// 並び順は backend で created_at ASC (spec §5.2)。
export default async function AdminMakersPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const limit = parseIntInRange(params.limit, DEFAULT_LIMIT, 1, 100);
  const offset = parseIntInRange(params.offset, 0, 0, 100000);

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

  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(
    `${apiUrl}/v1/admin/makers/pending?${qs.toString()}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/makers/pending: ${res.status}`);
  }
  const { makers, total } = (await res.json()) as PendingMakersResponse;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          メーカー承認
        </h1>
        <p className="text-sm text-muted-foreground">
          承認待ちのメーカー {total} 件 (古い順)
        </p>
      </header>

      {makers.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            承認待ちのメーカーはいません
          </p>
          <p className="text-sm text-muted-foreground">
            新規メーカー登録が来ると、ここに表示されます。
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
                  <p className="text-lg font-medium text-foreground">
                    {m.company_name ?? m.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    担当者: {m.name} / {m.email || "メール未取得"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  申請日: {formatDate(m.created_at)}
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
              />
            </li>
          ))}
        </ul>
      )}
    </div>
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
