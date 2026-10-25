import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { HomeSearchEntry } from "@/components/search/HomeSearchEntry";
import { TextLink } from "@/components/TextLink";
import { css } from "../../../styled-system/css";
import { HomeHills } from "./HomeHills";
import { HomeSectionTitle } from "./HomeSectionTitle";
import { Reveal } from "./Reveal";

/** 前の節の下端に丘を重ねて深い緑の地へつなぎ、自分の下端でも丘を立てて紙の地へ戻す。 */
const section = css({
  position: "relative",
  bgColor: "surface.forest",
  layerStyle: "wash",
  color: "text.inverse",
  pt: "16",
  pb: "28",
  tab: { pt: "20", pb: "36" },
});

const entryHills = css({
  position: "absolute",
  left: "0",
  right: "0",
  bottom: "[calc(100% - 1px)]",
});

const exitHills = css({ position: "absolute", left: "0", right: "0", bottom: "0" });

const container = css({
  maxW: "content.medium",
  mx: "auto",
  px: "5",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6",
  tab: { px: "8", gap: "8" },
});

const lead = css({
  m: "0",
  textStyle: "essay",
  color: "text.inverse",
  textAlign: "center",
  textWrap: "balance",
});

const phrase = css({ display: "inline-block" });

const searchBox = css({ w: "full", maxW: "content.form" });

const materials = css({
  display: "flex",
  flexDirection: "column",
  gap: "5",
  mt: "16",
  tab: { mt: "20" },
});

const materialsHeader = css({
  w: "full",
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  display: "flex",
  alignItems: "baseline",
  justifyContent: "flex-end",
  gap: "4",
  color: "text.inverse",
  fontSize: "sm",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  tab: { px: "8" },
});

/** 流れる資材カードは、自身の負の余白でこの左右の余白を打ち消して画面端まで届く。 */
const marquee = css({ w: "full", px: "4", tab: { px: "5" } });

/** 検索欄と、流れる掲載資材を置く深い緑の節。資材の一覧は children で受け取る。 */
export function HomeSearch({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="search-heading" className={section} id="search">
      <HomeHills className={entryHills} into="forest" sprouts />
      <div className={container}>
        <HomeSectionTitle
          align="center"
          eyebrow="Search"
          id="search-heading"
          title="資材をさがす"
          tone="inverse"
        />
        <Reveal>
          <p className={lead}>
            <span className={phrase}>作物や悩み、資材名から。</span>
            <span className={phrase}>生産者の感想口コミと</span>
            <span className={phrase}>実証詳細レポートをたどれます。</span>
          </p>
        </Reveal>
        <Reveal className={searchBox} delay="1">
          <HomeSearchEntry />
        </Reveal>
      </div>
      <Reveal className={materials} effect="fade">
        <div className={materialsHeader}>
          <TextLink href="/search" variant="nav">
            すべての資材を見る <Icon name="arrow_forward" size="sm" />
          </TextLink>
        </div>
        <div className={marquee}>{children}</div>
      </Reveal>
      <HomeHills className={exitHills} into="paper" sprouts />
    </section>
  );
}
