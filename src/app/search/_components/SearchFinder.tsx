import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import heroPhoto from "@/app/_components/home-hero-rice-field.webp";
import { buttonRecipe } from "@/components/Button";
import {
  buildSearchHref,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";

import { css, cx } from "../../../../styled-system/css";

import apple from "./photos/apple.webp";
import cabbage from "./photos/cabbage.webp";
import cucumber from "./photos/cucumber.webp";
import eggplant from "./photos/eggplant.webp";
import grape from "./photos/grape.webp";
import greenPepper from "./photos/green-pepper.webp";
import lettuce from "./photos/lettuce.webp";
import onion from "./photos/onion.webp";
import potato from "./photos/potato.webp";
import rice from "./photos/rice.webp";
import soybean from "./photos/soybean.webp";
import spinach from "./photos/spinach.webp";
import strawberry from "./photos/strawberry.webp";
import tea from "./photos/tea.webp";
import tomato from "./photos/tomato.webp";
import welshOnion from "./photos/welsh-onion.webp";
import { filterChipRecipe, focusRing } from "./search-chips";
import {
  finderCrops,
  finderEffects,
  type FinderChoice,
  type FinderCrop,
  type FinderScope,
} from "./search-finder";

/**
 * 作物名（または別名）で引く写真。並べる作物はデータで決まり、写真の有無では選ばない。
 * 写真は Unsplash の写真（Unsplash ライセンス）を幅 1200px 以下の WebP にしたもの。
 */
const CROP_PHOTOS = new Map<string, StaticImageData>([
  ["トマト", tomato],
  ["稲", rice],
  ["いちご", strawberry],
  ["きゅうり", cucumber],
  ["なす", eggplant],
  ["たまねぎ", onion],
  ["ほうれんそう", spinach],
  ["ねぎ", welshOnion],
  ["だいず", soybean],
  ["キャベツ", cabbage],
  ["ばれいしょ", potato],
  ["ピーマン", greenPepper],
  ["ぶどう", grape],
  ["レタス", lettuce],
  ["りんご", apple],
  ["茶", tea],
]);

const CROP_LIMIT = 12;
const EFFECT_LIMIT = 8;

function photoOf(crop: FinderCrop) {
  return (
    CROP_PHOTOS.get(crop.name) ??
    crop.aliases.map((alias) => CROP_PHOTOS.get(alias)).find((photo) => photo !== undefined)
  );
}

const root = css({
  mt: "3",
  overflow: "hidden",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
});

const band = css({
  position: "relative",
  h: "28",
  display: "flex",
  alignItems: "flex-end",
  bg: "primary.800",
  tab: { h: "40" },
});

const bandPhoto = css({ objectFit: "cover" });

/** 白文字の下地。写真の下半分だけを暗くする。 */
const bandScrim = css({
  position: "absolute",
  inset: "0",
  bgGradient: "to-t",
  gradientFrom: "scrim/60",
  gradientVia: "scrim/20",
  gradientTo: "transparent",
});

const bandText = css({
  position: "relative",
  px: "4",
  pb: "3",
  color: "text.inverse",
  tab: { px: "5", pb: "4" },
});

const kicker = css({ m: "0", textStyle: "note", color: "text.inverse/90" });
const bandTitle = css({ m: "0", mt: "0.5", textStyle: "title" });

const body = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
  px: "4",
  pt: "4",
  pb: "4",
  tab: { px: "5" },
});

const step = css({
  m: "0",
  display: "flex",
  alignItems: "center",
  gap: "2",
  textStyle: "supporting",
  fontWeight: "bold",
  color: "text.muted",
});

const stepNumber = css({
  w: "5",
  h: "5",
  display: "grid",
  placeItems: "center",
  borderRadius: "pill",
  bg: "primary.soft",
  color: "text.brandOnSoft",
  textStyle: "note",
  fontWeight: "bold",
});

/** SP とタブレットは横に流し、PC は6つずつ2行に並べる。 */
const cropList = css({
  display: "flex",
  gap: "2",
  m: "0",
  mx: "-4",
  px: "4",
  pt: "1",
  pb: "1.5",
  listStyle: "none",
  overflowX: "auto",
  scrollSnapType: "x proximity",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  tab: { mx: "-5", px: "5" },
  pc: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    rowGap: "3",
    mx: "0",
    px: "0",
    overflowX: "visible",
  },
});

const cropLink = css(focusRing, {
  w: "16",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1",
  borderRadius: "button",
  color: "text.default",
  textDecoration: "none",
  scrollSnapAlign: "start",
  pc: { w: "auto" },
});

const cropPhotoFrame = css({
  position: "relative",
  w: "14",
  h: "14",
  overflow: "hidden",
  borderRadius: "pill",
  bg: "surface.panel",
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "transparent",
  outlineOffset: "2px",
  "[aria-current=true] > &": { outlineColor: "primary.600" },
  pc: { w: "20", h: "20" },
});

/** 写真を用意していない作物は、写真と同じ大きさの丸に作物名の頭文字を置く。 */
const cropInitial = css({
  w: "full",
  h: "full",
  display: "grid",
  placeItems: "center",
  bg: "primary.soft",
  color: "text.brandOnSoft",
  textStyle: "title",
  fontWeight: "bold",
});

const cropName = css({
  textStyle: "supporting",
  fontWeight: "bold",
  "[aria-current=true] > &": { color: "text.brand" },
});

const count = css({ textStyle: "note", color: "text.subtle", fontVariantNumeric: "tabular-nums" });
const activeCount = css({ textStyle: "note", fontVariantNumeric: "tabular-nums" });

const effectList = css({ display: "flex", flexWrap: "wrap", gap: "2" });

/** PC は結果が隣に見えるので、結果へ移るボタンは SP とタブレットだけに出す。 */
const resultsLink = css({ pc: { display: "none" } });

type SearchFinderProps = {
  scope: FinderScope;
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  query: string;
  resultCount: number;
};

function CropPhoto({ crop }: { crop: FinderCrop }) {
  const photo = photoOf(crop);
  if (photo === undefined)
    return (
      <span aria-hidden="true" className={cropInitial}>
        {crop.name.slice(0, 1)}
      </span>
    );
  return (
    <Image
      alt=""
      className={bandPhoto}
      fill
      placeholder="blur"
      sizes="(min-width: 1024px) 80px, 56px"
      src={photo}
    />
  );
}

function toSelected(choice: FinderChoice): SelectedSearchFilter {
  return { kind: "filter", category: choice.category, id: choice.id, name: choice.name };
}

const isCropFilter = (filter: SelectedSearchFilter) =>
  filter.kind === "filter" && (filter.category === "crop" || filter.category === "crop_group");

function isSame(filter: SelectedSearchFilter, choice: FinderChoice) {
  return filter.kind === "filter" && filter.category === choice.category && filter.id === choice.id;
}

export function SearchFinder({ scope, selected, sort, query, resultCount }: SearchFinderProps) {
  const crops = finderCrops(scope, CROP_LIMIT);
  const effects = finderEffects(scope, EFFECT_LIMIT);
  // 作物分類だけを選んでいても、見出しはその条件にする。写真がない作物なら帯は既定の写真に戻す。
  const selectedCrop = selected.find(isCropFilter);
  const activeCrop = crops.find((crop) => crop.active);
  const bandSource = (activeCrop && photoOf(activeCrop)) ?? heroPhoto;

  // 作物は1つだけ選ぶ。別の作物を押したら入れ替え、選択中の作物を押したら外す。
  const cropHref = (choice: FinderChoice) => {
    const others = selected.filter((filter) => !isCropFilter(filter));
    return buildSearchHref({
      filters: choice.active ? others : [...others, toSelected(choice)],
      sort,
      query,
    });
  };
  const effectHref = (choice: FinderChoice) =>
    buildSearchHref({
      filters: choice.active
        ? selected.filter((filter) => !isSame(filter, choice))
        : [...selected, toSelected(choice)],
      sort,
      query,
    });

  return (
    <section aria-labelledby="search-finder-title" className={root}>
      <div className={band}>
        <Image
          alt=""
          className={bandPhoto}
          fill
          placeholder="blur"
          priority
          sizes="(min-width: 1200px) 1200px, 100vw"
          src={bandSource}
        />
        <div aria-hidden className={bandScrim} />
        <div className={bandText}>
          <p className={kicker}>作物と悩みから探す</p>
          <h2 className={bandTitle} id="search-finder-title">
            {selectedCrop ? `${selectedCrop.name}に使える資材` : "育てている作物を選んでください"}
          </h2>
        </div>
      </div>
      <div className={body}>
        <p className={step}>
          <span className={stepNumber}>1</span>育てている作物
        </p>
        <ul className={cropList} aria-label="育てている作物">
          {crops.map((crop) => (
            <li key={crop.id}>
              <Link
                aria-current={crop.active ? "true" : undefined}
                className={cropLink}
                href={cropHref(crop)}
                rel="nofollow"
                scroll={false}
              >
                <span className={cropPhotoFrame}>
                  <CropPhoto crop={crop} />
                </span>
                <span className={cropName}>{crop.name}</span>
                <span className={count}>{crop.count}件</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={step}>
          <span className={stepNumber}>2</span>気になること
        </p>
        <div className={effectList}>
          {effects.map((effect) => (
            <Link
              aria-current={effect.active ? "true" : undefined}
              className={filterChipRecipe({ active: effect.active })}
              href={effectHref(effect)}
              key={effect.id}
              rel="nofollow"
              scroll={false}
            >
              {effect.active ? <span aria-hidden="true">✓</span> : null}
              {effect.name}
              <span className={effect.active ? activeCount : count}>{effect.count}件</span>
            </Link>
          ))}
        </div>
        <a
          className={cx(buttonRecipe({ variant: "primary", size: "md" }), resultsLink)}
          href="#search-results"
        >
          該当する資材 {resultCount}件を見る
        </a>
      </div>
    </section>
  );
}
