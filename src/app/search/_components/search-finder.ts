import { filterCatalog } from "@/lib/catalog-search";
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
  /** 自分と同じ軸の条件を外し、ほかの条件は保ったときの件数。作物は作物名としての記載数（finderCrops）。 */
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
 * 今の条件で、資材に作物名として記載のある作物を、その数が多い順にすべて返す。選択中の作物は記載がなくても残す。
 * 件数は作物名としての記載だけを数え、検索結果の「〇〇の記載がある資材」と揃える。
 * 分類（野菜類など）への記載まで数えると、その分類の作物がすべて同じだけ上がり、記載の少ない作物が先頭に混ざるため。
 */
export function finderCrops(scope: FinderScope): FinderCrop[] {
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
    .map(
      (crop): FinderCrop => ({
        category: "crop",
        id: crop.id,
        name: crop.name,
        aliases: crop.aliases,
        count: direct.get(crop.id) ?? 0,
        active: active.has(crop.id),
      }),
    )
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

/** サイドバーからは作物を複数選べる（どれかに当てはまる資材を出す）ので、見出しにも全部が分かるように出す。 */
export function finderHeading(cropNames: string[]): string {
  const [first, second, ...rest] = cropNames;
  if (first === undefined) return "育てている作物を選んでください";
  if (second === undefined) return `${first}に使える資材`;
  if (rest.length === 0) return `${first}・${second}に使える資材`;
  return `${first}ほか${rest.length + 1}品目に使える資材`;
}
