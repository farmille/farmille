import type { Metadata } from "next";
import { HeroSection } from "@/app/_components/hero-section";
import { HomeContent } from "@/app/_components/home-content";
import { fetchHomeContent } from "@/app/_components/fetch-home";

// Phase 18: 未ログイン向け `/`。
// spec docs/specs/home.md §2 / §6.1 / ADR-0008
//
// hero（HeroSection、未ログイン専用）+ コンテンツ部分（HomeContent、`/home` と共有）
// で構成。ヘッダーはログイン CTA を出す。
// 認証ガードはここでは行わない（公開ページ）。`/home` 側で role を判定する。
//
// `force-dynamic`: BFF (`/v1/home`) を毎リクエスト叩くため static prerender 不可。
// `cache: "no-store"` の fetch だけでは Next.js が build 時に prerender を試みて
// `API_URL` 未設定で失敗する。明示的に動的レンダリングを宣言する。
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Farmille — 農家が選ぶ BS 資材レビュー",
  },
  description:
    "農家・JA 普及員・研究者が BS 資材(生物・微生物農業資材)のリアルな使用感を共有するプラットフォーム。作目・効果タグ・認証で資材を比較できます。",
  openGraph: {
    title: "Farmille — 農家が選ぶ BS 資材レビュー",
    description:
      "農家・JA 普及員・研究者が BS 資材(生物・微生物農業資材)のリアルな使用感を共有するプラットフォーム。",
    url: "/",
  },
};

export default async function LandingPage() {
  const data = await fetchHomeContent();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <HeroSection />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        <HomeContent {...data} />
      </main>
    </div>
  );
}
