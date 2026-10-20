import "@fontsource/klee-one/400.css";

import { css, cva } from "../../../styled-system/css";
import { HomeHills } from "./HomeHills";
import { HomeSectionTitle } from "./HomeSectionTitle";
import { Reveal } from "./Reveal";

/** 応援メッセージ1通。差出人は名前を出さず、肩書きだけを添える。 */
export type SupportLetter = {
  role: string;
  paragraphs: readonly string[];
};

// shortcut: 文面と肩書きは仮のもの。寄稿が届いたら、本人に確認した文面へ差し替える
export const supportLetters: readonly SupportLetter[] = [
  {
    role: "農林水産省 大臣官房環境バイオマス課長",
    paragraphs: [
      "気候の変化が年々大きくなるなか、生産の現場では新しい技術を試す工夫が続いています。",
      "バイオスティミュラント資材は、その選択肢のひとつとして期待が高まる一方、効き方が畑ごとに違い、判断の難しい資材でもあります。全国の生産者の経験が集まり、互いに確かめ合える場が育っていくことを、心から応援しています。",
    ],
  },
  {
    role: "大学教授（土壌微生物学）",
    paragraphs: [
      "土の中で起きていることは、まだ分からないことばかりです。",
      "だからこそ、現場で積み重ねられた一つひとつの記録が、研究にとっても大きな手がかりになります。生産者と研究者が同じ記録を見ながら話せる場所ができることを、楽しみにしています。",
    ],
  },
];

/** 机に置いた便箋のように、1通ずつ傾きと現れる順を変える。 */
const placements = [
  { tilt: "left", delay: "0" },
  { tilt: "right", delay: "1" },
] as const;

/** 前の節の下端に丘を重ね、紙の地へ戻す。 */
const section = css({
  position: "relative",
  pt: "16",
  pb: "24",
  tab: { pt: "20", pb: "28" },
});

const hills = css({ position: "absolute", left: "0", right: "0", bottom: "calc(100% - 1px)" });

const container = css({
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  display: "flex",
  flexDirection: "column",
  gap: "12",
  tab: { px: "8", gap: "16" },
});

/** 便箋は横長に使う。tab では1通ずつ幅いっぱいに積み、pc で2通を並べる。 */
const list = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "10",
  m: "0",
  p: "0",
  listStyle: "none",
  tab: { gap: "12" },
  pc: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12", alignItems: "start" },
});

/** 横に並べたときだけ2通目を少し下げ、便箋の頭をそろえない。 */
const item = css({ pc: { _even: { mt: "12" } } });

const sheet = cva({
  base: {
    position: "relative",
    m: "0",
    px: "6",
    pt: "10",
    pb: "8",
    bg: "surface.card",
    borderRadius: "mark",
    boxShadow: "shadow",
    tab: { px: "10", pt: "12", pb: "10" },
  },
  variants: {
    tilt: {
      left: { transform: "rotate(-1.2deg)" },
      right: { transform: "rotate(0.9deg)" },
    },
  },
});

/** 便箋の上辺に貼ったマスキングテープ。 */
const tape = css({
  position: "absolute",
  top: "-3",
  left: "50%",
  w: "24",
  h: "6",
  bgColor: "primary.300/55",
  layerStyle: "wash",
  transform: "translateX(-50%) rotate(-3deg)",
});

/** 本文の行送りと同じ間隔で罫線を引く。段落は字下げで区切り、行と罫線をずらさない。 */
const ruled = css({
  m: "0",
  textStyle: "letter",
  color: "text.default",
  bgImage:
    "repeating-linear-gradient(to bottom, transparent 0, transparent calc(1lh - 1px), {colors.border.default} calc(1lh - 1px), {colors.border.default} 1lh)",
});

const quote = css({ m: "0" });

const paragraph = css({ m: "0", textIndent: "1em" });

/** 肩書きは語の区切り（空白）でだけ折り返し、入りきらないときに限って語中で折る。 */
const signature = css({
  display: "block",
  textAlign: "right",
  color: "text.muted",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
  _before: { content: '"― "' },
});

export function HomeLetters() {
  return (
    <section aria-labelledby="letters-heading" className={section}>
      <HomeHills className={hills} into="paper" sprouts />
      <div className={container}>
        <HomeSectionTitle
          align="center"
          eyebrow="Messages"
          id="letters-heading"
          title="応援メッセージ"
        />
        <ul className={list}>
          {supportLetters.map((letter, index) => {
            const placement = placements[index % placements.length];
            return (
              <li className={item} key={letter.role}>
                <Reveal delay={placement.delay} effect="settle">
                  <figure className={sheet({ tilt: placement.tilt })}>
                    <span aria-hidden className={tape} />
                    <div className={ruled}>
                      <blockquote className={quote}>
                        {letter.paragraphs.map((text) => (
                          <p className={paragraph} key={text}>
                            {text}
                          </p>
                        ))}
                      </blockquote>
                      <figcaption className={signature}>{letter.role}</figcaption>
                    </div>
                  </figure>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
