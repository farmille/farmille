import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminSummary } from "@/types/admin";

export const metadata: Metadata = {
  title: "ダッシュボード",
  description: "Farmille 運営ダッシュボード",
};

// spec §6.2: admin ダッシュボード。/v1/admin/summary を SSR で取得して
// 集計を表示し、B1-B7 サブ画面へのカードを並べる。
// role guard は layout.tsx 側で既に通過済 (spec §6.1)。
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(`${apiUrl}/v1/admin/summary`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/summary: ${res.status}`);
  }
  const summary = (await res.json()) as AdminSummary;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          ダッシュボード
        </h1>
        <p className="text-sm text-muted-foreground">
          Farmille 運営者向けの管理画面です。
        </p>
      </header>

      <section
        aria-label="集計"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard label="保留中メーカー" value={summary.pending_makers_count} />
        <StatCard label="承認済メーカー" value={summary.active_makers_count} />
        <StatCard label="却下メーカー" value={summary.rejected_makers_count} />
        <StatCard label="総ユーザー" value={summary.total_users_count} />
        <StatCard
          label="資材マスタ (総数)"
          value={summary.products_total}
        />
        <StatCard
          label="資材マスタ (公開中)"
          value={summary.products_public_total}
        />
        <StatCard
          label="承認待ちレビュー"
          value={summary.pending_reviews_count}
        />
      </section>

      <section aria-label="サブ画面" className="space-y-3">
        <h2 className="text-lg font-medium">運営メニュー</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SubpageCard
            href="/admin/makers"
            title="メーカー承認 (B1)"
            description="新規メーカー登録の承認・却下を行います。"
            ready
          />
          <SubpageCard
            href="/admin/products"
            title="資材マスタ"
            description="BS 資材 (products) の業務管理。検索 / 編集 / 公開フラグ切替。"
            ready
          />
          <SubpageCard
            href="/admin/users"
            title="ユーザー管理 (B6)"
            description="ロール昇格・凍結などのユーザー操作。準備中。"
          />
          <SubpageCard
            href="/admin/reviews"
            title="レビュー承認"
            description="生産者が投稿したレビューの承認・却下キュー。承認で公開、却下で非公開。"
            ready
          />
          <SubpageCard
            href="/admin/reports"
            title="通報管理 (B2)"
            description="ユーザーからの通報キュー。準備中。"
          />
          <SubpageCard
            href="/admin/articles"
            title="記事管理 (B3)"
            description="お知らせ・コラム記事の編集。準備中。"
          />
          <SubpageCard
            href="/admin/featured-products"
            title="注目の資材 (B7)"
            description="トップに表示するキュレーション。準備中。"
          />
          <SubpageCard
            href="/admin/banners"
            title="バナー"
            description="トップバナーの差し替え。準備中。"
          />
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SubpageCard({
  href,
  title,
  description,
  ready = false,
}: {
  href: string;
  title: string;
  description: string;
  ready?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-md border border-border bg-card p-4 hover:bg-muted transition-colors"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-foreground">{title}</span>
          {ready ? (
            <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
              利用可能
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
              準備中
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </Link>
    </li>
  );
}
