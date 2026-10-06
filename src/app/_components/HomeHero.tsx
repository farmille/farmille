import Image from "next/image";

import { HomeHeroSearch } from "./HomeHeroSearch";
import type { HeroSearchOptions } from "./home-hero-options";
import heroPhoto from "./home-hero-rice-field.webp";

/**
 * 見本 S.home の写真ヒーロー（`.hero-m.hero-photo`）。クラス名と入れ子は見本のまま。
 * 見本は背景を data URI の CSS 変数で敷くが、アプリは next/image（LCP・blur）で `.hero-bg` に敷く。
 * `searchOptions` が null の間（候補の読み込み中）は検索窓だけが使え、ピルは押せない。
 */
export function HomeHero({ searchOptions = null }: { searchOptions?: HeroSearchOptions | null }) {
  return (
    <section className="hero-m hero-photo" aria-labelledby="home-heading">
      <div className="hero-bg">
        <Image alt="" fill placeholder="blur" priority sizes="100vw" src={heroPhoto} />
      </div>
      <div className="hero-inner">
        <div className="hero-left">
          <p className="hero-eyebrow">FARMILLE ／ 生産者のためのBS資材データベース</p>
          <h1 id="home-heading">
            <span className="h1-main">
              日本で<span className="hl">唯一</span>の<br className="lb-sp" />
              <span className="hl">バイオスティミュラント</span>の<br className="lb-sp" />
              <span className="hl">検索・口コミ</span>サイト
            </span>
          </h1>
          <p className="lead">
            <span className="lead-strong">
              作物や効果・資材名から<span className="hl2">検索</span>。<br className="lb-sp" />
              実際に使った<span className="hl2">体験</span>を、
              <br className="lb-sp" />
              <span className="hl2">生産者</span>どうしで<span className="hl2">共有</span>
              しましょう。
            </span>
          </p>
        </div>
        <div className="hero-right">
          <HomeHeroSearch options={searchOptions} />
        </div>
      </div>
    </section>
  );
}
