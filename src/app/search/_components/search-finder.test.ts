import { describe, expect, it } from "vitest";

import { cropEvidence, filterCatalog } from "@/lib/catalog-search";

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
  it("作物の件数は、その作物を選んだ結果のうち作物名として記載のある資材の数と一致する", () => {
    const crops = finderCrops(scope([]));
    expect(crops.map((crop) => [crop.name, crop.count])).toEqual([
      ["たまねぎ", 1],
      ["トマト", 1],
    ]);
    for (const crop of crops) {
      const filters = [{ category: "crop" as const, id: crop.id }];
      const named = filterCatalog(storyCatalog, filters, [], []).filter(
        (material) => cropEvidence(material, filters, storyCatalog).direct.length > 0,
      );
      expect(crop.count).toBe(named.length);
    }
  });

  const tomato = storyCatalog.crops.find((crop) => crop.id === storyIds.tomato);
  if (tomato === undefined) throw new Error("見本のトマトがありません。");
  const withPepper = {
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

  it("記載の多い順に並べ、分類への記載しかない作物は出さない", () => {
    const crops = finderCrops({ ...scope([]), catalog: withPepper });
    expect(crops.map((crop) => crop.name)).toEqual(["トマト", "たまねぎ"]);
  });

  it("記載のない作物でも、選択中なら件数0で残す", () => {
    const crops = finderCrops({
      ...scope([{ category: "crop", id: "pepper" }]),
      catalog: withPepper,
    });
    expect(crops.map((crop) => [crop.name, crop.count, crop.active])).toEqual([
      ["トマト", 2, false],
      ["たまねぎ", 1, false],
      ["ピーマン", 0, true],
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
