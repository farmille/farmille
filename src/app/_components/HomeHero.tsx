import Image from "next/image";

import { Icon } from "@/components/Icon";
import { css } from "../../../styled-system/css";
import heroPhoto from "./home-hero-rice-field.webp";
import { HomeHills } from "./HomeHills";
import { HomeVerticalCopy } from "./HomeVerticalCopy";

/** SP は上下のバーを除いた高さ、tab 以上はヘッダーを除いた高さに収める。 */
const hero = css({
  position: "relative",
  overflow: "hidden",
  isolation: "isolate",
  h: "calc(100svh - token(spacing.32))",
  minH: "32rem",
  bg: "surface.forest",
  tab: { h: "calc(100svh - token(spacing.16))", minH: "36rem", maxH: "60rem" },
});

/** 写真は画面から出ていくあいだ遅れて下がる。下がった分が見えないよう、上へはみ出して描く。 */
const photoDrift = css({
  position: "absolute",
  top: "-16%",
  right: "0",
  bottom: "0",
  left: "0",
  zIndex: "-1",
  _scrollTimeline: {
    _motionSafe: {
      animationName: "hero-drift",
      animationTimingFunction: "linear",
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
  h: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  tab: { px: "8" },
});

/** 縦書きの一文は右上に置く。 */
const tagline = css({
  position: "absolute",
  top: "6",
  right: "5",
  tab: { top: "16", right: "10" },
  pc: { top: "20", right: "16" },
});

const brand = css({
  position: "absolute",
  left: "5",
  bottom: "calc(token(spacing.10) + token(spacing.6))",
  m: "0",
  color: "text.inverse",
  fontSize: "display",
  fontWeight: "bold",
  lineHeight: "none",
  textShadow: "shadow.photoText",
  tab: { left: "8", bottom: "calc(token(spacing.16) + token(spacing.10))" },
  pc: { bottom: "calc(token(spacing.24) + token(spacing.8))" },
});

const brandReading = css({
  display: "block",
  mt: "2",
  textStyle: "eyebrow",
  fontWeight: "bold",
});

/** 検索の節へ降りる丸い案内。外周の文字はゆっくり回り、押すと沈む。 */
const badge = css({
  position: "absolute",
  right: "4",
  bottom: "calc(token(spacing.10) + token(spacing.3))",
  display: "grid",
  placeItems: "center",
  w: "28",
  h: "28",
  borderRadius: "pill",
  bg: "surface.paper",
  color: "text.brand",
  textDecoration: "none",
  boxShadow: "shadow.lift",
  transitionProperty: "transform",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _motionSafe: { animation: "heroBadge", animationDelay: "calc(token(durations.intro) * 3)" },
  _active: { transform: "scale(0.97)" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "text.inverse",
    outlineOffset: "3px",
  },
  "@media (hover: hover) and (pointer: fine)": { _hover: { transform: "scale(1.04)" } },
  tab: { right: "8", bottom: "calc(token(spacing.16) + token(spacing.4))", w: "36", h: "36" },
  pc: { right: "12", bottom: "calc(token(spacing.24) + token(spacing.2))" },
});

const ring = css({
  position: "absolute",
  inset: "1.5",
  w: "calc(100% - token(spacing.3))",
  h: "calc(100% - token(spacing.3))",
  fill: "currentColor",
  fontSize: "2xs",
  fontWeight: "bold",
  _motionSafe: { animation: "ringSpin" },
});

const badgeLabel = css({
  display: "grid",
  justifyItems: "center",
  gap: "0.5",
  fontFamily: "ryoGothic",
  fontSize: "sm",
  fontWeight: "bold",
  lineHeight: "tight",
  textAlign: "center",
  tab: { fontSize: "md" },
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
      {/* 改行入りの表示文字から読み上げ名を作ると語の間に空白が入るので、名前は一続きで渡す */}
      <a aria-label="資材をさがす" className={badge} href="#search">
        <svg aria-hidden className={ring} viewBox="0 0 120 120">
          <defs>
            <path d="M60 60m-50 0a50 50 0 1 1 100 0a50 50 0 1 1-100 0" id="home-hero-ring" />
          </defs>
          <text>
            <textPath href="#home-hero-ring" textLength="312">
              SEARCH ・ BIOSTIMULANTS ・ SEARCH ・ BIOSTIMULANTS ・
            </textPath>
          </text>
        </svg>
        <span className={badgeLabel}>
          資材を
          <br />
          さがす
          <Icon name="arrow_downward" size="sm" />
        </span>
      </a>
      <HomeHills className={hills} into="paper" />
    </section>
  );
}
