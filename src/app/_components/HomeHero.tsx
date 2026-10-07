import Image from "next/image";

import { css } from "../../../styled-system/css";
import { HomeHeroSearch } from "./HomeHeroSearch";
import type { HeroSearchOptions } from "./home-hero-options";
import heroPhoto from "./home-hero-rice-field.webp";

const heroStyle = css({
  position: "relative",
  display: "flex",
  minH: "calc(token(sizes.96) + token(sizes.44))",
  color: "text.inverse",
  textAlign: "left",
  tab: { minH: "calc(token(sizes.96) + token(sizes.80))" },
});

const photoStyle = css({
  position: "absolute",
  inset: "0",
  zIndex: "0",
  pointerEvents: "none",
  overflow: "hidden",
  "& > img": { objectFit: "cover", objectPosition: "center 58%" },
  _after: {
    content: '""',
    position: "absolute",
    inset: "0",
    zIndex: "1",
    // 写真の左側だけを暗くし、白い見出しを読めるようにする
    bgImage:
      "linear-gradient(to right, token(colors.scrim/50) 0%, token(colors.scrim/46) 30%, token(colors.scrim/30) 52%, token(colors.scrim/10) 72%, transparent 88%)",
  },
});

const innerStyle = css({
  position: "relative",
  zIndex: "1",
  w: "full",
  maxW: "content.wide",
  mx: "auto",
  pt: "20",
  px: "5",
  pb: "9",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "7",
  alignItems: "end",
  tab: {
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
    gap: "10",
    pt: "36",
    px: "8",
    pb: "14",
  },
});

const eyebrowStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  mb: "5.5",
  fontSize: "xs",
  fontWeight: "light",
  letterSpacing: "0.12em",
  tab: { letterSpacing: "0.22em" },
  _before: {
    content: '""',
    w: "9",
    h: "1px",
    bg: "primary.700",
    flex: "none",
  },
});

const headingStyle = css({
  display: "block",
  m: "0",
  fontSize: "min(token(fontSizes.display), calc((100vw - token(spacing.10)) / 13.2))",
  fontWeight: "light",
  letterSpacing: "0.08em",
  lineHeight: "relaxed",
  tab: { fontSize: "clamp(token(fontSizes.hero), 3.6vw, token(fontSizes.hero.md))" },
});

const keywordStyle = css({ fontWeight: "medium", whiteSpace: "nowrap" });

const leadStyle = css({
  mt: "5.5",
  maxW: "calc(token(sizes.96) + token(sizes.32))",
  fontSize: "md",
  fontWeight: "normal",
  letterSpacing: "0.06em",
  lineHeight: "loose",
  tab: { mt: "7.5" },
});

const spOnlyBreak = css({ tab: { display: "none" } });

const searchColumnStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  w: "full",
  tab: { alignItems: "flex-end" },
});

/**
 * ホームの写真ヒーロー（見出しと検索窓）。背景は next/image（LCP・blur）で敷く。
 * `searchOptions` が null の間（候補の読み込み中）は検索窓だけが使え、ピルは押せない。
 */
export function HomeHero({ searchOptions = null }: { searchOptions?: HeroSearchOptions | null }) {
  return (
    <section className={heroStyle} aria-labelledby="home-heading">
      <div className={photoStyle}>
        <Image alt="" fill placeholder="blur" priority sizes="100vw" src={heroPhoto} />
      </div>
      <div className={innerStyle}>
        <div>
          <p className={eyebrowStyle}>FARMILLE ／ 生産者のためのBS資材データベース</p>
          <h1 id="home-heading" className={headingStyle}>
            日本で<span className={keywordStyle}>唯一</span>の<br />
            <span className={keywordStyle}>バイオスティミュラント</span>の<br />
            <span className={keywordStyle}>検索・口コミ</span>サイト
          </h1>
          <p className={leadStyle}>
            作物や効果・資材名から検索。
            <br className={spOnlyBreak} />
            実際に使った体験を、
            <br className={spOnlyBreak} />
            生産者どうしで共有しましょう。
          </p>
        </div>
        <div className={searchColumnStyle}>
          <HomeHeroSearch options={searchOptions} />
        </div>
      </div>
    </section>
  );
}
