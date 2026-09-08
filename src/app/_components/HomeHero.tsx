import Image from "next/image";

import { HomeSearchEntry } from "@/components/search/HomeSearchEntry";
import { css } from "../../../styled-system/css";
import heroPhoto from "./home-hero-rice-field.webp";

/** ヒーローだけ本文書体からゴシックMB101 L（weight 300）へ切り替える。 */
const hero = css({
  position: "relative",
  overflow: "hidden",
  bg: "surface.page",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  fontFamily: "gothicMb101",
  fontWeight: "light",
  pt: "12",
  pb: "12",
  md: {
    pt: "16",
    pb: "16",
  },
  lg: {
    display: "flex",
    alignItems: "center",
    minH: "700px",
    pt: "0",
    pb: "0",
  },
});

const inner = css({
  position: "relative",
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  lg: {
    // 写真の基準を section にしてビューポート右端まで伸ばす
    position: "static",
    px: "8",
    py: "24",
  },
});

const intro = css({
  position: "relative",
  zIndex: "1",
  mb: "-12",
  lg: { mb: "0" },
});

const label = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  m: "0",
  color: "text.subtle",
  fontSize: "2xs",
  letterSpacing: "0.24em",
  md: { fontSize: "xs" },
  _before: {
    content: '""',
    display: "block",
    w: "32px",
    h: "1px",
    bg: "brand.primary",
    flexShrink: "0",
  },
});

const title = css({
  m: "0",
  mt: "6",
  fontSize: "hero",
  fontWeight: "light",
  lineHeight: "relaxed",
  letterSpacing: "0.08em",
  lg: {
    mt: "8",
    fontSize: "hero.lg",
  },
});

/** SP は全幅で下に敷き、PC は右側に大きく置く。角丸は付けず、文字と重なる側を背景色へ溶かす。 */
const figure = css({
  position: "relative",
  mx: "-5",
  aspectRatio: "image.square",
  bg: "surface.panel",
  md: { aspectRatio: "image.landscape" },
  lg: {
    position: "absolute",
    top: "0",
    right: "0",
    bottom: "0",
    left: "auto",
    w: "64%",
    h: "auto",
    m: "0",
    aspectRatio: "auto",
  },
});

const photo = css({
  objectFit: "cover",
  objectPosition: "center 58%",
});

const fade = css({
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  h: "24%",
  pointerEvents: "none",
  bgGradient: "to-b",
  gradientFrom: "surface.page",
  gradientTo: "surface.page/0",
  lg: {
    bottom: "0",
    right: "auto",
    w: "32%",
    h: "auto",
    bgGradient: "to-r",
  },
});

const lead = css({
  position: "relative",
  zIndex: "1",
  mt: "8",
  mb: "0",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "loose",
  letterSpacing: "0.06em",
  md: { fontSize: "md" },
  lg: { maxW: "480px" },
});

/** 日本語が語中で折り返さないよう、文節ごとに inline-block で区切る。 */
const phrase = css({
  display: "inline-block",
});

const search = css({
  position: "relative",
  zIndex: "1",
  mt: "8",
  lg: {
    mt: "12",
    maxW: "content.form",
  },
});

export function HomeHero() {
  return (
    <section className={hero} aria-labelledby="home-heading">
      <div className={inner}>
        <div className={intro}>
          <p className={label}>FARMILLE / 農家のためのBS資材データベース</p>
          <h1 className={title} id="home-heading">
            BS資材を、
            <br />
            作物と悩みから
            <br />
            見つける。
          </h1>
        </div>

        <div className={figure}>
          <Image
            alt=""
            className={photo}
            fill
            placeholder="blur"
            priority
            sizes="(min-width: 1024px) 64vw, 100vw"
            src={heroPhoto}
          />
          <div aria-hidden className={fade} />
        </div>

        <p className={lead}>
          <span className={phrase}>資材情報と、</span>
          <span className={phrase}>実際に使った人のレビュー・使用レポートを、</span>
          <span className={phrase}>ひとつの場所で比べられます。</span>
        </p>

        <div className={search}>
          <HomeSearchEntry />
        </div>
      </div>
    </section>
  );
}
