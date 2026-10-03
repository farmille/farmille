import type { CatalogSearch } from "@/server/queries/catalog-search";
import type { SearchFilterRef, matchSearchCatalog } from "@/lib/material-search";

type Material = CatalogSearch["materials"][number];

/** 分類への直接記載と個別作目への記載は、検索時も別々に扱う。 */
export function cropAncestors(groupId: string, groups: CatalogSearch["groups"]): string[] {
  const ancestors: string[] = [];
  let current: string | null = groupId;
  while (current !== null) {
    if (ancestors.includes(current)) throw new Error("作物分類の親子関係が循環しています。");
    ancestors.push(current);
    current = groups.find((group) => group.id === current)?.parent_id ?? null;
  }
  return ancestors;
}

export function cropEvidence(
  material: Material,
  filters: SearchFilterRef[],
  catalog: CatalogSearch,
) {
  const crops = filters
    .filter((filter) => filter.category === "crop")
    .flatMap((filter) => catalog.crops.filter((crop) => crop.id === filter.id));
  const direct = crops.filter((crop) =>
    material.material_crops.some((row) => row.crop_id === crop.id),
  );
  const ancestorIds = new Set(crops.flatMap((crop) => cropAncestors(crop.groupId, catalog.groups)));
  const groups = catalog.groups.filter(
    (group) =>
      ancestorIds.has(group.id) &&
      material.material_crop_groups.some((row) => row.crop_group_id === group.id),
  );
  return { direct: direct.map((crop) => crop.name), groups: groups.map((group) => group.name) };
}

export function matchesCatalogFilter(
  material: Material,
  filter: SearchFilterRef,
  catalog: CatalogSearch,
): boolean {
  switch (filter.category) {
    case "crop": {
      const evidence = cropEvidence(material, [filter], catalog);
      return evidence.direct.length > 0 || evidence.groups.length > 0;
    }
    case "crop_group": {
      const descendants = catalog.groups
        .filter((group) => cropAncestors(group.id, catalog.groups).includes(filter.id))
        .map((group) => group.id);
      const crops = new Set(
        catalog.crops.filter((crop) => descendants.includes(crop.groupId)).map((crop) => crop.id),
      );
      return (
        material.material_crop_groups.some((row) => descendants.includes(row.crop_group_id)) ||
        material.material_crops.some((row) => crops.has(row.crop_id))
      );
    }
    case "effect":
      return material.material_effects.some((row) => row.effect_id === filter.id);
    case "genre":
      return material.material_ingredient_categories.some(
        (row) => row.ingredient_category_id === filter.id,
      );
    case "method":
      return material.material_application_methods.some((row) => row.method === filter.id);
    case "concern":
    case "condition":
      return material.material_search_tags.some((row) => row.search_tag_id === filter.id);
  }
}

export function filterCatalog(
  catalog: CatalogSearch,
  filters: SearchFilterRef[],
  makerNames: string[],
  materialNames: string[],
  keyword?: ReturnType<typeof matchSearchCatalog>,
) {
  const dimensions = new Map<string, SearchFilterRef[]>();
  for (const filter of filters) {
    const dimension = filter.category === "crop_group" ? "crop" : filter.category;
    dimensions.set(dimension, [...(dimensions.get(dimension) ?? []), filter]);
  }
  return catalog.materials.filter((material) => {
    if (makerNames.length && !makerNames.includes(material.manufacturer_name)) return false;
    if (materialNames.length && !materialNames.includes(material.name)) return false;
    if (
      ![...dimensions.values()].every((choices) =>
        choices.some((filter) => matchesCatalogFilter(material, filter, catalog)),
      )
    )
      return false;
    return (
      keyword === undefined ||
      keyword.makerNames.includes(material.manufacturer_name) ||
      keyword.materialNames.includes(material.name) ||
      keyword.filters.some((filter) => matchesCatalogFilter(material, filter, catalog))
    );
  });
}
