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
  pt: "0",
  pb: "12",
  tab: {
    display: "flex",
    alignItems: "center",
    minH: "700px",
    pt: "0",
    pb: "0",
  },
});

/** SP は見出しと写真を同じセルに重ねる。PC は通常のブロック配置で、写真は section 基準の全幅。 */
const inner = css({
  position: "relative",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  tab: {
    display: "block",
    position: "static",
    px: "8",
    py: "24",
  },
});

const intro = css({
  position: "relative",
  zIndex: "1",
  gridArea: "1 / 1",
  alignSelf: "start",
  pt: "8",
  tab: { pt: "0" },
});

const label = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  m: "0",
  color: "surface.card/90",
  fontSize: "2xs",
  letterSpacing: "0.24em",
  tab: { fontSize: "xs", color: "surface.card" },
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
  color: "surface.card",
  fontSize: "hero",
  fontWeight: "light",
  lineHeight: "relaxed",
  letterSpacing: "0.08em",
  tab: {
    mt: "8",
    fontSize: "hero.md",
  },
  pc: {
    fontSize: "hero.lg",
  },
});

/** SP は左右いっぱいの正方形で見出しの下地になり、PC は全幅に敷く。角丸は付けない。 */
const figure = css({
  position: "relative",
  gridArea: "1 / 1",
  overflow: "hidden",
  mx: "-5",
  aspectRatio: "image.square",
  bg: "surface.panel",
  tab: {
    position: "absolute",
    inset: "0",
    w: "auto",
    h: "auto",
    m: "0",
    aspectRatio: "auto",
  },
});

/** SP は枠より背を高くして下端に揃え、上端の空（白く飛ぶ部分）を枠外へ出す。PC は枠いっぱい。 */
const photoFrame = css({
  position: "absolute",
  left: "0",
  right: "0",
  bottom: "0",
  h: "140%",
  tab: { top: "0", h: "auto" },
});

const photo = css({
  objectFit: "cover",
  objectPosition: "center 58%",
});

/**
 * 白文字の下地。SP は上端から、PC は左端から見出しの範囲までを一定に暗くし、
 * そこから smoothstep（両端の傾きが 0 の S 字）で抜く。境目が線として見えないよう
 * 直線ではなく 9 段のストップで曲線に近づける。
 */
const scrim = css({
  position: "absolute",
  inset: "0",
  pointerEvents: "none",
  bgImage:
    "linear-gradient(to bottom, color-mix(in srgb, {colors.ink} 50%, transparent) 0%, color-mix(in srgb, {colors.ink} 50%, transparent) 26%, color-mix(in srgb, {colors.ink} 48.3%, transparent) 34%, color-mix(in srgb, {colors.ink} 43.7%, transparent) 41%, color-mix(in srgb, {colors.ink} 37.0%, transparent) 49%, color-mix(in srgb, {colors.ink} 29.1%, transparent) 56%, color-mix(in srgb, {colors.ink} 20.9%, transparent) 64%, color-mix(in srgb, {colors.ink} 13.0%, transparent) 71%, color-mix(in srgb, {colors.ink} 6.3%, transparent) 79%, color-mix(in srgb, {colors.ink} 1.7%, transparent) 86%, color-mix(in srgb, {colors.ink} 0.0%, transparent) 94%)",
  tab: {
    bgImage:
      "linear-gradient(to right, color-mix(in srgb, {colors.ink} 46%, transparent) 0%, color-mix(in srgb, {colors.ink} 46%, transparent) 30%, color-mix(in srgb, {colors.ink} 44.4%, transparent) 36%, color-mix(in srgb, {colors.ink} 40.2%, transparent) 43%, color-mix(in srgb, {colors.ink} 34.1%, transparent) 49%, color-mix(in srgb, {colors.ink} 26.8%, transparent) 56%, color-mix(in srgb, {colors.ink} 19.2%, transparent) 62%, color-mix(in srgb, {colors.ink} 11.9%, transparent) 69%, color-mix(in srgb, {colors.ink} 5.8%, transparent) 75%, color-mix(in srgb, {colors.ink} 1.6%, transparent) 82%, color-mix(in srgb, {colors.ink} 0.0%, transparent) 88%)",
  },
});

const lead = css({
  position: "relative",
  zIndex: "1",
  gridArea: "2 / 1",
  mt: "8",
  mb: "0",
  color: "text.muted",
  fontSize: "sm",
  lineHeight: "loose",
  letterSpacing: "0.06em",
  tab: { fontSize: "md", maxW: "480px", color: "surface.card/90" },
});

/** 日本語が語中で折り返さないよう、文節ごとに inline-block で区切る。 */
const phrase = css({
  display: "inline-block",
});

/** 写真の内側に置く。SP は下辺に寄せて全幅、PC は写真の右下に浮かせる。 */
const search = css({
  position: "absolute",
  left: "5",
  right: "5",
  bottom: "5",
  tab: {
    left: "8",
    right: "8",
    bottom: "8%",
    w: "auto",
  },
  pc: {
    left: "auto",
    right: "8%",
    bottom: "12%",
    w: "min(540px, 58%)",
  },
});

export function HomeHero() {
  return (
    <section className={hero} aria-labelledby="home-heading">
      <div className={inner}>
        <div className={intro}>
          <p className={label}>FARMILLE / 農家のためのBS資材データベース</p>
          <p className={title} id="home-heading">
            BS資材を、
            <br />
            作物と悩みから
            <br />
            見つける。
          </p>
        </div>

        <div className={figure}>
          <div className={photoFrame}>
            <Image
              alt=""
              className={photo}
              fill
              placeholder="blur"
              priority
              sizes="100vw"
              src={heroPhoto}
            />
          </div>
          <div aria-hidden className={scrim} />
          <div className={search}>
            <HomeSearchEntry />
          </div>
        </div>

        <p className={lead}>
          <span className={phrase}>資材情報と、</span>
          <span className={phrase}>実際に使った人のレビュー・使用レポートを、</span>
          <span className={phrase}>ひとつの場所で比べられます。</span>
        </p>
      </div>
    </section>
  );
}
