import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { AdminArticleListResponse, ArticleCategory } from "@/types/admin";
import { ArticleDeleteButton } from "./_components/article-delete-button";

export const metadata: Metadata = {
  title: "記事管理",
  description: "記事 (articles) の作成・編集・公開管理",
};

// Admin Articles CMS (ADR-0014 / docs/drafts/admin-articles-cms-spec.md)。
// /v1/admin/articles を SSR 取得し、一覧 + 新規作成 + 行ごと編集 / 削除を提供する。
// 権威ゲートは layout.tsx (role + AAL2) と FastAPI (require_role("admin") + AAL2)。
// layout 通過を理由に backend チェックを緩めない。

const PER_PAGE = 50;
const MAX_PAGE = 5000;

const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  monthly_report: "月次",
  weekly_report: "週次",
  featured: "特集",
  column: "コラム",
};

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
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
    return new Date(iso).toLocaleString("ja-JP", {
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

function publishState(publishedAt: string | null): {
  label: string;
  cls: string;
} {
  if (!publishedAt) {
    return {
      label: "下書き",
      cls: "border border-border text-muted-foreground",
    };
  }
  const isFuture = new Date(publishedAt).getTime() > Date.now();
  if (isFuture) {
    return {
      label: "予約",
      cls: "bg-amber-500/15 text-amber-700 border border-amber-500/30",
    };
  }
  return { label: "公開", cls: "bg-primary text-primary-foreground" };
}

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const page = parsePage(params.page);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin/articles");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("per_page", String(PER_PAGE));

  const res = await fetch(`${apiUrl}/v1/admin/articles?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/articles: ${res.status}`);
  }

  const { articles, total, per_page } =
    (await res.json()) as AdminArticleListResponse;

  const totalPages = Math.max(1, Math.ceil(total / per_page));
  const rangeStart = total === 0 ? 0 : (page - 1) * per_page + 1;
  const rangeEnd = Math.min(page * per_page, total);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">記事管理</h1>
          <p className="text-sm text-muted-foreground">
            記事の作成・編集・公開 / 非公開・削除。公開記事はトップ「最新記事」と
            /articles に表示されます。
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-1 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden /> 新規作成
        </Link>
      </header>

      <p className="text-sm text-muted-foreground">
        全 {total} 件中 {rangeStart}–{rangeEnd} を表示 / page {page} /{" "}
        {totalPages}
      </p>

      {articles.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            記事がまだありません
          </p>
          <p className="text-sm text-muted-foreground">
            「新規作成」から最初の記事を書きましょう。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 w-20">hero</th>
                <th className="px-3 py-2">タイトル / slug</th>
                <th className="px-3 py-2 w-20">カテゴリ</th>
                <th className="px-3 py-2 w-24">状態</th>
                <th className="px-3 py-2 w-40">公開日時</th>
                <th className="px-3 py-2 w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const state = publishState(a.published_at);
                return (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-3 py-2">
                      {a.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.hero_image_url}
                          alt=""
                          className="h-10 w-16 object-cover rounded border border-border"
                        />
                      ) : (
                        <div className="h-10 w-16 rounded border border-dashed border-border bg-muted/30" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/articles/${encodeURIComponent(a.id)}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                        {a.slug}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {CATEGORY_LABEL[a.category]}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs ${state.cls}`}
                      >
                        {state.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateTime(a.published_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/articles/${encodeURIComponent(a.id)}`}
                          className="text-xs text-primary hover:underline"
                        >
                          編集
                        </Link>
                        <ArticleDeleteButton articleId={a.id} title={a.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            href={`/admin/articles?page=${Math.max(1, page - 1)}`}
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
            href={`/admin/articles?page=${Math.min(totalPages, page + 1)}`}
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
