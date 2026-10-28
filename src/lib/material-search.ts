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
  /** 資材ジャンルの略称。選んだ条件のチップに出す */
  shortName?: string;
  sort_order: number;
};

export type SearchCatalog = {
  filters: SearchFilterItem[];
  makers: string[];
  materials: { name: string; aliases: string[] }[];
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

/** キーワードに合う候補を全件返す。一覧の絞り込みには候補表示の件数上限を適用しない。 */
export function matchSearchCatalog(catalog: SearchCatalog, query: string) {
  const keyword = normalizeSearchText(query.trim());
  return {
    filters: catalog.filters.filter((filter) =>
      [filter.name, ...filter.aliases].some((name) => normalizeSearchText(name).includes(keyword)),
    ),
    makerNames: catalog.makers.filter((name) => normalizeSearchText(name).includes(keyword)),
    materialNames: catalog.materials
      .filter((material) =>
        [material.name, ...material.aliases].some((name) =>
          normalizeSearchText(name).includes(keyword),
        ),
      )
      .map((material) => material.name),
  };
}

export function isSearchFilterCategory(value: string): value is SearchFilterCategory {
  return SEARCH_FILTER_CATEGORIES.some((category) => category === value);
}
