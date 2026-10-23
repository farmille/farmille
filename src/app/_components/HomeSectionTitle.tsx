import type { ReactNode } from "react";

import { css, cva } from "../../../styled-system/css";
import { Reveal } from "./Reveal";

export type SectionTone = "ink" | "inverse";

const wrap = cva({
  base: { display: "flex", flexDirection: "column", gap: "3" },
  variants: {
    align: {
      start: { alignItems: "flex-start", textAlign: "left" },
      center: { alignItems: "center", textAlign: "center" },
    },
  },
});

const label = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2.5",
    m: "0",
    textStyle: "eyebrow",
    textTransform: "uppercase",
    _before: { content: '""', w: "6", h: "[1px]", bg: "currentColor" },
  },
  variants: {
    tone: {
      ink: { color: "text.brand" },
      inverse: { color: "text.brandOnForest" },
    },
  },
});

const heading = cva({
  base: { m: "0", textWrap: "balance" },
  variants: {
    tone: {
      ink: { color: "text.default" },
      inverse: { color: "text.inverse" },
    },
  },
});

/** globals.css が h2 に書体と太さを当てるので、役割ごとの書体は内側の span で切り替える。 */
const headingText = cva({
  base: { display: "block" },
  variants: {
    // voice は生産者の問いかけを大きく見せる一文
    kind: {
      headline: { textStyle: "headline" },
      voice: { textStyle: "voice" },
    },
  },
});

/** 見出しの下の手書きの線。見出しが現れたあと、左端から伸ばす。 */
const stroke = cva({
  base: {
    w: "24",
    h: "3",
    fill: "[none]",
    strokeWidth: "[3]",
    strokeLinecap: "round",
    transformOrigin: "left center",
    transitionProperty: "[transform]",
    transitionDuration: "reveal",
    transitionTimingFunction: "out",
    transitionDelay: "[calc({durations.revealStep} * 2)]",
    _scripted: { _motionSafe: { transform: "scaleX(0)" } },
    _revealedWithin: { transform: "scaleX(1)" },
  },
  variants: {
    tone: {
      ink: { stroke: "primary.400" },
      inverse: { stroke: "primary.300" },
    },
  },
});

const strokePath = css({ vectorEffect: "non-scaling-stroke" });

type HomeSectionTitleProps = {
  eyebrow: string;
  title: ReactNode;
  id: string;
  tone?: SectionTone;
  kind?: "headline" | "voice";
  align?: "start" | "center";
};

/** ホームの節の見出し。英字の小見出し、見出し、手書きの線を順に出す。 */
export function HomeSectionTitle({
  eyebrow,
  title,
  id,
  tone = "ink",
  kind = "headline",
  align = "start",
}: HomeSectionTitleProps) {
  return (
    <Reveal className={wrap({ align })}>
      <p className={label({ tone })}>{eyebrow}</p>
      <h2 className={heading({ tone })} id={id}>
        <span className={headingText({ kind })}>{title}</span>
      </h2>
      <svg aria-hidden className={stroke({ tone })} preserveAspectRatio="none" viewBox="0 0 96 12">
        <path className={strokePath} d="M2 8C18 4 34 3 50 6S82 10 94 5" />
      </svg>
    </Reveal>
  );
}
