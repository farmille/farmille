import { buildSearchHref } from "@/components/search/search-selection";
import type { SearchCatalog, SearchFilterCategory } from "@/lib/material-search";
import type { CatalogSearch } from "@/server/queries/catalog-search";

export type HeroPillKind = "crop" | "effect" | "genre" | "maker";

export type HeroPillItem = { label: string; count: number; href: string };

export type HeroMaterialOption = {
  id: string;
  name: string;
  maker: string;
  imageUrl: string | null;
};

export type HeroSearchOptions = {
  materials: HeroMaterialOption[];
  pills: Record<HeroPillKind, HeroPillItem[]>;
};

const PILL_LIMIT = 8;

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function filterPills(
  counts: Map<string, number>,
  search: SearchCatalog,
  category: Extract<SearchFilterCategory, "crop" | "effect" | "genre">,
  limit: number | null,
): HeroPillItem[] {
  const items = search.filters
    .filter((filter) => filter.category === category)
    .map((filter) => ({ filter, count: counts.get(filter.id) ?? 0 }))
    .filter((item) => item.count > 0)
    .toSorted((a, b) => b.count - a.count || a.filter.name.localeCompare(b.filter.name, "ja"))
    .map(({ filter, count }) => ({
      label: filter.name,
      count,
      href: buildSearchHref({
        filters: [{ kind: "filter", category, id: filter.id, name: filter.name }],
        sort: "reviews",
      }),
    }));
  return limit === null ? items : items.slice(0, limit);
}

export function buildHeroSearchOptions(
  catalog: CatalogSearch,
  search: SearchCatalog,
): HeroSearchOptions {
  const { materials } = catalog;
  const makerCounts = countBy(materials.map((material) => material.manufacturer_name));
  return {
    materials: materials.map((material) => ({
      id: material.id,
      name: material.name,
      maker: material.manufacturer_name,
      imageUrl:
        material.material_images
          .filter((image) => image.is_current)
          .toSorted((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
    })),
    pills: {
      crop: filterPills(
        countBy(materials.flatMap((m) => m.material_crops.map((row) => row.crop_id))),
        search,
        "crop",
        PILL_LIMIT,
      ),
      effect: filterPills(
        countBy(materials.flatMap((m) => m.material_effects.map((row) => row.effect_id))),
        search,
        "effect",
        PILL_LIMIT,
      ),
      genre: filterPills(
        countBy(
          materials.flatMap((m) =>
            m.material_ingredient_categories.map((row) => row.ingredient_category_id),
          ),
        ),
        search,
        "genre",
        null,
      ),
      maker: [...makerCounts]
        .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
        .slice(0, PILL_LIMIT)
        .map(([name, count]) => ({
          label: name,
          count,
          href: buildSearchHref({ filters: [{ kind: "maker", name }], sort: "reviews" }),
        })),
    },
  };
}
