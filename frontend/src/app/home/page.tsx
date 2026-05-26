import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { isAssignedRole } from "@/lib/auth/roles";
import { HomeContent } from "@/app/_components/home-content";
import { fetchHomeContent } from "@/app/_components/fetch-home";
import { SiteFooter } from "@/components/site-footer/site-footer";

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
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        <HomeContent {...data} />
      </main>

      <SiteFooter />
    </div>
  );
}
