import { css } from "../../../styled-system/css";
// 写真は Wikimedia Commons に転載された Unsplash の写真（CC0、撮影者 Elaine Casap）
import missionPhoto from "./home-mission-harvest.webp";
import { HomePhoto } from "./HomePhoto";
import { HomeSectionTitle } from "./HomeSectionTitle";
import { HomeVerticalCopy } from "./HomeVerticalCopy";
import { Reveal } from "./Reveal";

const section = css({ pt: "8", pb: "24", tab: { pt: "12", pb: "28" } });

/** SP は見出し・写真・本文の順に積み、pc は写真を左に置いて見出しと本文を右にまとめる。 */
const container = css({
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "10",
  tab: { px: "8", gap: "12" },
  pc: { gridTemplateColumns: "minmax(0, 6fr) minmax(0, 5fr)", columnGap: "16", rowGap: "10" },
});

const heading = css({ pc: { gridColumn: "2", gridRow: "1", alignSelf: "end" } });

const visual = css({ position: "relative", pc: { gridColumn: "1", gridRow: "1 / span 2" } });

/** 写真の右上に、縦書きの一文を重ねる。 */
const quote = css({ position: "absolute", top: "4", right: "4", tab: { top: "6", right: "6" } });

const body = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
  pc: { gridColumn: "2", gridRow: "2", alignSelf: "start" },
});

const essay = css({ m: "0", textStyle: "essay", color: "text.default" });

const signature = css({
  m: "0",
  textStyle: "body",
  fontFamily: "ryoGothic",
  fontWeight: "bold",
  color: "text.brand",
  textAlign: "right",
});

/** 運営する学生チームの想い。写真に縦書きの一文を重ね、本文を添える。 */
export function HomeMission() {
  return (
    <section aria-labelledby="mission-heading" className={section}>
      <div className={container}>
        <div className={heading}>
          <HomeSectionTitle eyebrow="Our hope" id="mission-heading" title="運営の想い" />
        </div>
        <div className={visual}>
          <HomePhoto
            alt="収穫したトマトを手渡す二人の手"
            ratio="portrait"
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={missionPhoto}
          />
          <Reveal className={quote} effect="fade">
            <HomeVerticalCopy
              as="p"
              lines={["「豊かな実りを、", "微力ながら", "支えさせてください。」"]}
              motion="scroll"
            />
          </Reveal>
        </div>
        <div className={body}>
          <Reveal>
            <p className={essay}>
              Farmilleを運営しているのは、「日本の農業に少しでも貢献したい」と願う学生のチームです。学生を中心に、所属も、農業への関わり方も違うメンバーが集まっています。でも、農業という一番大切な産業に貢献したいという想いは一つです。
            </p>
          </Reveal>
          <Reveal>
            <p className={essay}>
              生産者の皆さんと、農業を愛するすべての人たちが、手を取り合ってより良い未来をつくっていく。我々Farmilleは、その営みを、微力ながら精一杯お支えします。
            </p>
          </Reveal>
          <Reveal>
            <p className={signature}>Farmille 運営チーム</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
