import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminArticleDetail } from "@/types/admin";
import { ArticleForm } from "../_components/article-form";

export const metadata: Metadata = {
  title: "記事を編集",
  description: "記事の編集",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

// Admin Articles CMS (ADR-0014): 編集画面。
// SSR で /v1/admin/articles/{id} を取得し Client Island (ArticleForm) に渡す。
// PATCH 提出は /api/admin/articles/{id} 経由 (BFF 直叩き禁止)。

export default async function AdminArticleEditPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect(`/login?next=/admin/articles/${encodeURIComponent(id)}`);
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(
    `${apiUrl}/v1/admin/articles/${encodeURIComponent(id)}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/admin/articles/${id}: ${res.status}`);
  }

  const article = (await res.json()) as AdminArticleDetail;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/articles" className="hover:underline">
            記事管理
          </Link>
          <span>/</span>
          <span>編集</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {article.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          id: <span className="font-mono">{article.id}</span>
        </p>
      </header>

      <ArticleForm mode="edit" article={article} />
    </div>
  );
}
