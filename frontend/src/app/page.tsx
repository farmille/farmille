import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Farmille
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/products"
              className="text-foreground hover:text-primary"
            >
              資材一覧
            </Link>
            <Link
              href="/login"
              className="text-foreground hover:text-primary"
            >
              ログイン
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">新規登録</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center bg-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground leading-tight">
            農家が選ぶ、
            <br />
            本当に効く BS 資材を見つけよう
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Farmille は、生物・微生物農業資材(BS資材)の現場レビューが集まるプラットフォームです。
            農家・JA 普及員・研究者の声から、自分の圃場に合った資材を選べます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/products">資材を見る</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">レビューを投稿する</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              現場のリアルな声
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              実際に使った農家の評価とコメントを、作目・地域・施用時期と紐付けて閲覧できます。
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              JBSA 効果タグで比較
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              メーカー申告の推奨効果と、農家が実感した効果を並べて比較。資材選びの判断材料に。
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              専門家もユーザー
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              JA 普及員・研究者も投稿・閲覧する場。プロの視点と現場の視点が交わります。
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hover:text-primary">
              ログイン
            </Link>
            <Link href="/signup" className="hover:text-primary">
              新規登録
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
