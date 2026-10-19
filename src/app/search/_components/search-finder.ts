import { filterCatalog, matchesCatalogFilter } from "@/lib/catalog-search";
import type { SearchFilterRef, matchSearchCatalog } from "@/lib/material-search";
import type { CatalogSearch } from "@/server/queries/catalog-search";

export type FinderScope = {
  catalog: CatalogSearch;
  filters: SearchFilterRef[];
  makerNames: string[];
  materialNames: string[];
  keyword: ReturnType<typeof matchSearchCatalog> | undefined;
};

export type FinderChoice = {
  category: "crop" | "effect";
  id: string;
  name: string;
  /** 自分と同じ軸の条件を外し、ほかの条件は保ったときの該当件数。 */
  count: number;
  active: boolean;
};

const isCropDimension = (filter: SearchFilterRef) =>
  filter.category === "crop" || filter.category === "crop_group";

function materialsWithout(scope: FinderScope, drop: (filter: SearchFilterRef) => boolean) {
  return filterCatalog(
    scope.catalog,
    scope.filters.filter((filter) => !drop(filter)),
    scope.makerNames,
    scope.materialNames,
    scope.keyword,
  );
}

export type FinderCrop = FinderChoice & {
  /** 写真を名前でも別名でも引けるように持つ（環境によって「稲」が名前にも「水稲」の別名にもなる）。 */
  aliases: string[];
};

/**
 * 今の条件で、資材に作物名として記載のある数が多い作物から limit 件を選ぶ。選択中の作物は件数によらず残す。
 * 選ぶときは個別の記載だけを数える。分類（野菜類など）への記載まで数えると、
 * その分類の作物がすべて同じだけ上がり、記載の少ない作物が上位に混ざるため。
 * 表示する件数は押した先の結果と揃えて分類への記載も含め、並びはその件数の多い順にする。
 */
export function finderCrops(scope: FinderScope, limit: number): FinderCrop[] {
  const base = materialsWithout(scope, isCropDimension);
  const direct = new Map<string, number>();
  for (const material of base)
    for (const row of material.material_crops)
      direct.set(row.crop_id, (direct.get(row.crop_id) ?? 0) + 1);
  const active = new Set(
    scope.filters.filter((filter) => filter.category === "crop").map((filter) => filter.id),
  );
  return scope.catalog.crops
    .filter((crop) => direct.has(crop.id) || active.has(crop.id))
    .toSorted((a, b) => (direct.get(b.id) ?? 0) - (direct.get(a.id) ?? 0))
    .filter((crop, index) => index < limit || active.has(crop.id))
    .map((crop): FinderCrop => {
      const ref: SearchFilterRef = { category: "crop", id: crop.id };
      return {
        category: "crop",
        id: crop.id,
        name: crop.name,
        aliases: crop.aliases,
        count: base.filter((material) => matchesCatalogFilter(material, ref, scope.catalog)).length,
        active: active.has(crop.id),
      };
    })
    .toSorted((a, b) => b.count - a.count);
}

/** 該当する資材が多い効果から limit 件。選択中の効果は件数によらず残す。 */
export function finderEffects(scope: FinderScope, limit: number): FinderChoice[] {
  const base = materialsWithout(scope, (filter) => filter.category === "effect");
  const counts = new Map<string, number>();
  for (const material of base)
    for (const row of material.material_effects)
      counts.set(row.effect_id, (counts.get(row.effect_id) ?? 0) + 1);
  const active = new Set(
    scope.filters.filter((filter) => filter.category === "effect").map((filter) => filter.id),
  );
  return scope.catalog.effects
    .filter((effect) => (counts.get(effect.id) ?? 0) > 0 || active.has(effect.id))
    .toSorted((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
    .filter((effect, index) => index < limit || active.has(effect.id))
    .map((effect) => ({
      category: "effect",
      id: effect.id,
      name: effect.name,
      count: counts.get(effect.id) ?? 0,
      active: active.has(effect.id),
    }));
}
