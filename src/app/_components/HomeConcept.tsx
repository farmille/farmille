import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { css, cva } from "../../../styled-system/css";
import soilPhoto from "./home-concept-soil.webp";
import sproutPhoto from "./home-concept-sprout.webp";
import tomatoPhoto from "./home-concept-tomato-sunset.webp";
import { HomePhoto } from "./HomePhoto";
import { HomeSectionTitle } from "./HomeSectionTitle";
import { Reveal } from "./Reveal";

// 写真は Wikimedia Commons に転載された Unsplash の写真（CC0）。撮影者は Gabriel Jimenez、Chad Stembridge、Austin D
const conceptPhotos = {
  main: { src: soilPhoto, alt: "土を両手にすくう手元" },
  sub: { src: tomatoPhoto, alt: "夕日を受けて実るトマト" },
  accent: { src: sproutPhoto, alt: "芽吹いたばかりの若葉" },
};

const section = css({
  position: "relative",
  pt: "16",
  pb: "24",
  tab: { pt: "24", pb: "32" },
});

const container = css({
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  display: "flex",
  flexDirection: "column",
  gap: "12",
  tab: { px: "8", gap: "16" },
});

/** pc は問いかけと本文を左、写真を右に置く。 */
const intro = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "12",
  pc: {
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    columnGap: "16",
    alignItems: "center",
  },
});

const introText = css({ display: "flex", flexDirection: "column", gap: "8" });

/** 写真3枚を大小と上下にずらして重ねる。枠の縦横比で全体の高さを決める。 */
const collage = css({ position: "relative", aspectRatio: "image.portrait" });

const collageMain = css({ position: "absolute", top: "0", right: "0", w: "[64%]" });

const collageSub = css({
  position: "absolute",
  top: "[46%]",
  left: "0",
  zIndex: "local.1",
  w: "[56%]",
});

const collageAccent = css({ position: "absolute", right: "[4%]", bottom: "0", w: "[34%]" });

const essay = css({ m: "0", textStyle: "essay", color: "text.default" });

const prose = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
  maxW: "content.reading",
});

const closing = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8",
  textAlign: "center",
});

const closingText = css({
  m: "0",
  textStyle: "statement",
  color: "text.default",
  textWrap: "balance",
});

/** 文節の途中で折り返さないよう、まとまりごとに区切る。 */
const phrase = css({ display: "inline-block" });

/**
 * 問いかけは、見出しが現れたあと1行ずつ左から書いていくように見せる。
 * 行に地の色の幕を重ねておき、幕だけを右へ送り出す。
 */
const writtenLine = cva({
  base: {
    position: "relative",
    display: "inline-block",
    overflow: "hidden",
    _after: {
      content: '""',
      position: "absolute",
      inset: "0",
      bg: "surface.paper",
      transform: "translateX(101%)",
      transitionProperty: "[transform]",
      transitionDuration: "write",
      transitionTimingFunction: "out",
    },
    _scripted: { _motionSafe: { _after: { transform: "translateX(0)" } } },
    _revealedWithin: { _after: { transform: "translateX(101%)" } },
  },
  variants: {
    order: {
      first: { _after: { transitionDelay: "revealStep" } },
      second: {
        _after: {
          transitionDelay: "[calc({durations.revealStep} + {durations.reveal})]",
        },
      },
    },
  },
});

const signup = css({ display: "flex", flexDirection: "column", alignItems: "center", gap: "3" });

const signupButton = css(buttonRecipe.raw({ size: "md" }), {
  gap: "3",
  minH: "14",
  px: "10",
  borderRadius: "pill",
  fontSize: "lg",
  boxShadow: "shadow.lift",
  transitionProperty: "[transform]",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _active: { transform: "scale(0.97)" },
  "@media (hover: hover) and (pointer: fine)": { _hover: { bg: "primary.800" } },
  tab: { w: "auto" },
});

const signupNote = css({
  m: "0",
  maxW: "content.form",
  textStyle: "supporting",
  color: "text.muted",
});

/** ホームのコンセプト。生産者の問いかけから始め、Farmille の答えと会員登録の誘いで締める。 */
export function HomeConcept({ showSignup }: { showSignup: boolean }) {
  return (
    <section aria-labelledby="concept-heading" className={section}>
      <div className={container}>
        <div className={intro}>
          <div className={introText}>
            <HomeSectionTitle
              eyebrow="Concept"
              id="concept-heading"
              kind="voice"
              title={
                <>
                  <span className={writtenLine({ order: "first" })}>「本当にうちの畑で</span>
                  <span className={writtenLine({ order: "second" })}>効くのだろうか？」</span>
                </>
              }
            />
            <Reveal>
              <p className={essay}>
                気候変動の影響がすさまじい昨今、「バイオスティミュラント（BS）資材」への期待が高まっています。しかし、いざ使おうと思っても、どの資材が自分の悩みに合うのか分からない。大切な作物に使うからこそ、新しい挑戦には迷いがつきものです。
              </p>
            </Reveal>
          </div>
          <div className={collage}>
            <HomePhoto
              alt={conceptPhotos.main.alt}
              className={collageMain}
              ratio="portrait"
              sizes="(min-width: 1024px) 30vw, 64vw"
              src={conceptPhotos.main.src}
            />
            <div className={collageSub}>
              <HomePhoto
                alt={conceptPhotos.sub.alt}
                delay="1"
                ratio="landscape"
                sizes="(min-width: 1024px) 26vw, 56vw"
                src={conceptPhotos.sub.src}
              />
            </div>
            <HomePhoto
              alt={conceptPhotos.accent.alt}
              className={collageAccent}
              delay="2"
              ratio="square"
              sizes="(min-width: 1024px) 16vw, 34vw"
              src={conceptPhotos.accent.src}
            />
          </div>
        </div>

        <Reveal className={prose}>
          <p className={essay}>
            「Farmille（ファーミル）」は、そんなバイオスティミュラント（BS）資材について、全国の生産者や技術者が現場の知恵を持ち寄る場所。
          </p>
          <p className={essay}>
            これまでなら、自分の畑だけで何年もかけて答えを探すしかなかったところを、全国の仲間と経験を持ち寄り、1年で確かめ合う。
          </p>
        </Reveal>

        <div className={closing}>
          <Reveal>
            <p className={closingText}>
              <span className={phrase}>気候変動から、</span>
              <span className={phrase}>自分の畑を、</span>
              <span className={phrase}>そして日本の農業を守り抜くために。</span>
              <br />
              <span className={phrase}>知恵と想いで支え合う新しい農業を、</span>
              <span className={phrase}>ここから一緒に始めませんか。</span>
            </p>
          </Reveal>
          {showSignup ? (
            <Reveal className={signup} delay="1">
              <Link className={signupButton} href="/signup/general">
                無料で会員登録
                <Icon name="arrow_forward" size="md" />
              </Link>
              <p className={signupNote}>
                検索と感想口コミの閲覧は、登録なしで利用できます。会員登録すると、実証詳細レポートの閲覧・投稿、感想口コミの投稿、お気に入りの保存ができます。
              </p>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
