export const SEARCH_FILTER_CATEGORIES = [
  "crop",
  "crop_group",
  "method",
  "concern",
  "effect",
  "condition",
  "genre",
] as const;

export type SearchFilterCategory = (typeof SEARCH_FILTER_CATEGORIES)[number];

export type SearchFilterRef = {
  category: SearchFilterCategory;
  id: string;
};

export type SearchFilterItem = SearchFilterRef & {
  aliases: string[];
  name: string;
  sort_order: number;
};

export type SearchCatalog = {
  filters: SearchFilterItem[];
  makers: string[];
  materialNames: string[];
};

/** キーワードに合う候補を全件返す。一覧の絞り込みには候補表示の件数上限を適用しない。 */
export function matchSearchCatalog(catalog: SearchCatalog, query: string) {
  const keyword = query.trim().normalize("NFKC").toLowerCase();
  return {
    filters: catalog.filters.filter((filter) =>
      [filter.name, ...filter.aliases].some((name) =>
        name.normalize("NFKC").toLowerCase().includes(keyword),
      ),
    ),
    makerNames: catalog.makers.filter((name) =>
      name.normalize("NFKC").toLowerCase().includes(keyword),
    ),
    materialNames: catalog.materialNames.filter((name) =>
      name.normalize("NFKC").toLowerCase().includes(keyword),
    ),
  };
}

export function isSearchFilterCategory(value: string): value is SearchFilterCategory {
  return SEARCH_FILTER_CATEGORIES.some((category) => category === value);
}
