import { HeroSlider, type HeroSliderImage } from "./hero-slider";
import type { HomeArticle } from "./latest-articles-section";

// Phase 18 / 2026-05-27 demo polish:
// 未ログイン向け hero（`/` のみで使用）
// spec docs/specs/home.md §6.1 / §6.3
//
// 投資家デモ向け改修（2026-05-27 再改修）:
//   - 旧 hero（記事カード横並びカルーセル）→ 画像オンリーのフルブリードスライダーに
//     再構成。articles の hero_image_url を背景として使い、文字は overlay で固定。
//   - CTA は「資材を見る」/「記事を見る」の 2 つ。/signup 行きは撤去。
//   - 既存 LP の 3 カラム価値提案セクションはそのまま下に温存。
//
// このファイルは Server Component のままで、状態を持つ slider 本体は
// HeroSlider（"use client"）に閉じる。

export function HeroSection({ articles }: { articles: HomeArticle[] }) {
  // hero 背景に使う画像は最新記事の hero_image_url のうち存在するものだけ。
  // 5 枚を上限にする（auto-advance × 5s = 25s で一周。それ以上は冗長）。
  const heroImages: HeroSliderImage[] = articles
    .filter((a): a is HomeArticle & { hero_image_url: string } =>
      Boolean(a.hero_image_url),
    )
    .slice(0, 5)
    .map((a) => ({ url: a.hero_image_url, alt: a.title }));

  return (
    <>
      <HeroSlider
        images={heroImages}
        title="Farmille へようこそ"
        subtitle="農家が選ぶ BS 資材のレビュープラットフォーム"
      />

      {/* 3 カラム価値提案（既存をそのまま温存） */}
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
              製造元申告の推奨効果と、農家が実感した効果を並べて比較。資材選びの判断材料に。
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
    </>
  );
}
