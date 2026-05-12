import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { isAssignedRole } from "@/lib/auth/roles";
import { HomeContent } from "@/app/_components/home-content";
import { fetchHomeContent } from "@/app/_components/fetch-home";

// Phase 18: `/home` をログイン済ユーザのコンテンツ閲覧入口として実装。
// ADR-0008 で再定義（Phase 11b で残置されていた redirect 薄ラッパは本実装で置換）。
//
// アクセス制御（spec §6.2）:
//   - 未ログイン → `/`（誘導）
//   - unassigned → `/onboarding`
//   - reviewer / maker → 通常表示
//
// `/` と同じ <HomeContent> を共有。出し分けはヘッダーのみ。
// ロール別 dashboard 機能は持たない（ADR-0008 §2-2、SKILL §1.4）。

export const metadata: Metadata = {
  title: "ホーム",
  description:
    "Farmille のホーム。注目の資材・最新の記事・お知らせをまとめて確認できます。",
  openGraph: {
    title: "ホーム | Farmille",
    description:
      "注目の資材と最新の記事をまとめて閲覧。ログイン中ユーザ向けのコンテンツ入口。",
    url: "/home",
  },
};

// auth ガード + BFF fetch を行うため static prerender 不可。`/` と同じ理由で
// 明示的に動的レンダリング。
export const dynamic = "force-dynamic";

export default async function LoggedInHomePage() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }
  const role = await getRole(user);
  if (!isAssignedRole(role)) {
    redirect("/onboarding");
  }

  const data = await fetchHomeContent();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Farmille
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/products" className="text-foreground hover:text-primary">
              資材一覧
            </Link>
            <Link href="/articles" className="text-foreground hover:text-primary">
              記事
            </Link>
            <span
              className="hidden sm:inline-flex items-center gap-2 rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground"
              aria-label={`ログイン中のロール: ${role}`}
            >
              {role}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/me/profile">マイページ</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        <HomeContent {...data} />
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
          <nav className="flex items-center gap-4">
            <Link href="/products" className="hover:text-primary">
              資材一覧
            </Link>
            <Link href="/articles" className="hover:text-primary">
              記事
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
