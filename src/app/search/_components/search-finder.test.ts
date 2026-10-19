import { describe, expect, it } from "vitest";

import { finderCrops, finderEffects, type FinderScope } from "./search-finder";
import { storyCatalog, storyIds } from "./story-fixtures";

const scope = (filters: FinderScope["filters"]): FinderScope => ({
  catalog: storyCatalog,
  filters,
  makerNames: [],
  materialNames: [],
  keyword: undefined,
});

describe("検索の2段階の絞り込み", () => {
  it("作物の件数は分類としての記載も数え、マスタにない作物は出さない", () => {
    const crops = finderCrops(scope([]), ["トマト", "ぶどう", "たまねぎ"]);
    expect(crops.map((crop) => [crop.name, crop.count])).toEqual([
      ["トマト", 2],
      ["たまねぎ", 2],
    ]);
  });

  it("作物を選んでいても、作物の件数は作物の条件を外して数える", () => {
    const crops = finderCrops(scope([{ category: "crop", id: storyIds.tomato }]), ["トマト"]);
    expect(crops).toEqual([expect.objectContaining({ name: "トマト", count: 2, active: true })]);
  });

  it("効果の件数は選んだ作物の中で数え、該当しない効果は出さない", () => {
    const effects = finderEffects(scope([{ category: "crop", id: storyIds.onion }]), 8);
    expect(effects.map((effect) => [effect.name, effect.count])).toEqual([["養分吸収の改善", 1]]);
  });

  it("上限を超えても選択中の効果は残す", () => {
    const effects = finderEffects(scope([{ category: "effect", id: storyIds.nutrient }]), 0);
    expect(effects).toEqual([
      expect.objectContaining({ name: "養分吸収の改善", count: 2, active: true }),
    ]);
  });
});
