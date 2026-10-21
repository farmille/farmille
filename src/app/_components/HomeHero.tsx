import Image from "next/image";

import { css } from "../../../styled-system/css";
import heroPhoto from "./home-hero-rice-field.webp";
import { HomeHills } from "./HomeHills";
import { HomeVerticalCopy } from "./HomeVerticalCopy";

/**
 * SP は上下のバーを除いた高さ、tab 以上はヘッダーを除いた高さに収める。
 * はみ出しは clip で切る。hidden はスクロールコンテナになり、写真と丘の view() がヒーローを基準にして動かなくなる。
 */
const hero = css({
  position: "relative",
  overflow: "clip",
  isolation: "isolate",
  h: "[calc(100svh - {spacing.32})]",
  minH: "[32rem]",
  bg: "surface.forest",
  containerType: "size",
  tab: { h: "[calc(100svh - {spacing.16})]", minH: "[36rem]", maxH: "[60rem]" },
});

/** 写真は画面から出ていくあいだ遅れて下がる。下がった分が見えないよう、上へはみ出して描く。 */
const photoDrift = css({
  position: "absolute",
  top: "[-16%]",
  right: "0",
  bottom: "0",
  left: "0",
  zIndex: "[-1]",
  _scrollTimeline: {
    _motionSafe: {
      animationName: "hero-drift",
      animationTimingFunction: "[linear]",
      animationFillMode: "both",
      animationTimeline: "view()",
      animationRange: "exit 0% exit 100%",
    },
  },
});

const photo = css({
  objectFit: "cover",
  objectPosition: "46% 62%",
  _motionSafe: { animation: "heroZoom" },
});

const inner = css({
  position: "relative",
  h: "full",
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  tab: { px: "8" },
});

/**
 * 縦書きの一文は右上に置く。画面の低い PC でも最も長い2本目の帯（14字、字送りを含め約16字ぶん）が
 * 丘にかからないよう、文字はヒーローの高さに合わせて詰める。引く値は上の余白・帯の段差・帯の余白・丘の高さと
 * すき間の合計で、大きさの上限は hero の役割のまま。
 */
const tagline = css({
  position: "absolute",
  top: "6",
  right: "5",
  tab: {
    top: "16",
    right: "10",
    "& > span": { fontSize: "[min({fontSizes.hero.md}, calc((100cqh - 14.5rem) / 16))]" },
  },
  pc: {
    top: "20",
    right: "16",
    "& > span": { fontSize: "[min({fontSizes.hero.lg}, calc((100cqh - 16.25rem) / 16))]" },
  },
});

const brand = css({
  position: "absolute",
  left: "5",
  bottom: "[calc({spacing.10} + {spacing.6})]",
  m: "0",
  color: "text.inverse",
  fontSize: "display",
  fontWeight: "bold",
  lineHeight: "none",
  textShadow: "shadow.photoText",
  tab: { left: "8", bottom: "[calc({spacing.16} + {spacing.10})]" },
  pc: { bottom: "[calc({spacing.24} + {spacing.8})]" },
});

const brandReading = css({
  display: "block",
  mt: "2",
  textStyle: "eyebrow",
  fontWeight: "bold",
});

const hills = css({ position: "absolute", left: "0", right: "0", bottom: "0" });

export function HomeHero() {
  return (
    <section className={hero} aria-labelledby="home-heading">
      <div className={photoDrift}>
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
      <div className={inner}>
        <HomeVerticalCopy
          as="h1"
          className={tagline}
          id="home-heading"
          lines={["日本で唯一の", "バイオスティミュラント資材の", "検索・口コミサイト"]}
          motion="load"
        />
        <p className={brand}>
          Farmille
          <span className={brandReading}>ファーミル</span>
        </p>
      </div>
      <HomeHills className={hills} into="paper" />
    </section>
  );
}
