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
  it("作物名として記載のある作物だけを並べ、件数には分類への記載も含める", () => {
    const crops = finderCrops(scope([]), 12);
    expect(crops.map((crop) => [crop.name, crop.count])).toEqual([
      ["たまねぎ", 2],
      ["トマト", 2],
    ]);
  });

  it("並びは作物名としての記載数で決め、分類への記載だけの作物は出さない", () => {
    const tomato = storyCatalog.crops.find((crop) => crop.id === storyIds.tomato);
    if (tomato === undefined) throw new Error("見本のトマトがありません。");
    const catalog = {
      ...storyCatalog,
      materials: [
        ...storyCatalog.materials,
        { ...storyCatalog.materials[1], id: "tomato-2", material_crops: [{ crop_id: tomato.id }] },
      ],
      crops: [
        ...storyCatalog.crops,
        { ...tomato, id: "pepper", name: "ピーマン", aliases: [], sort_order: 3 },
      ],
    };
    const crops = finderCrops({ ...scope([]), catalog }, 12);
    expect(crops.map((crop) => crop.name)).toEqual(["トマト", "たまねぎ"]);
  });

  it("上限を超えても選択中の作物は残し、件数は作物の条件を外して数える", () => {
    const crops = finderCrops(scope([{ category: "crop", id: storyIds.tomato }]), 1);
    expect(crops.map((crop) => [crop.name, crop.count, crop.active])).toEqual([
      ["たまねぎ", 2, false],
      ["トマト", 2, true],
    ]);
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
