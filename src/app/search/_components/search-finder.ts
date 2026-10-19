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
  /** 呼び出し側が渡した名前。写真との対応に使う。 */
  key: string;
};

/**
 * 写真を用意した作物を、マスタにあるものだけ渡した順に返す。
 * 環境によって「稲」が作物名にも「水稲」の別名にもなるので、名前で見つからなければ別名で引く。
 */
export function finderCrops(scope: FinderScope, names: readonly string[]): FinderCrop[] {
  const base = materialsWithout(scope, isCropDimension);
  return names.flatMap((key) => {
    const crop =
      scope.catalog.crops.find((item) => item.name === key) ??
      scope.catalog.crops.find((item) => item.aliases.includes(key));
    if (crop === undefined) return [];
    const ref: SearchFilterRef = { category: "crop", id: crop.id };
    return [
      {
        key,
        category: "crop",
        id: crop.id,
        name: crop.name,
        count: base.filter((material) => matchesCatalogFilter(material, ref, scope.catalog)).length,
        active: scope.filters.some((filter) => filter.category === "crop" && filter.id === crop.id),
      },
    ];
  });
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
