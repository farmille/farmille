import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArticleForm } from "../_components/article-form";

export const metadata: Metadata = {
  title: "記事を作成",
  description: "新規記事の作成",
};

// Admin Articles CMS (ADR-0014): 新規作成画面。
// session ガードは layout.tsx (role + AAL2) が担うが、SSR fetch を伴わない本画面でも
// 未ログインなら login へ送る (UX、layout 通過済前提だが二重に弾く)。

export default async function AdminArticleNewPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin/articles/new");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/articles" className="hover:underline">
            記事管理
          </Link>
          <span>/</span>
          <span>新規作成</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">記事を作成</h1>
        <p className="text-sm text-muted-foreground">
          作成後、編集画面に移動します。hero 画像は作成後の編集画面で記事 ID
          配下に再アップロードすると整理しやすくなります。
        </p>
      </header>

      <ArticleForm mode="create" />
    </div>
  );
}
