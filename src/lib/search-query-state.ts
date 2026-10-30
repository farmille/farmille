import { parseAsString, parseAsStringLiteral } from "nuqs/server";

export const MATERIAL_SORT_OPTIONS = [
  { value: "reviews", label: "感想口コミが多い順" },
  { value: "rating", label: "評価が高い順" },
  { value: "newest", label: "新着順" },
] as const;

export const materialSearchParsers = {
  filters: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(MATERIAL_SORT_OPTIONS.map((option) => option.value)).withDefault(
    "reviews",
  ),
  q: parseAsString.withDefault(""),
};
