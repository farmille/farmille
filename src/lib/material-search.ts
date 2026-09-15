export const SEARCH_FILTER_CATEGORIES = [
  "crop",
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

export function isSearchFilterCategory(value: string): value is SearchFilterCategory {
  return SEARCH_FILTER_CATEGORIES.some((category) => category === value);
}
