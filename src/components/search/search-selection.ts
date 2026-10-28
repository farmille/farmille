import { APPLICATION_METHODS } from "@/lib/material-page-editor";
import * as v from "valibot";

import type { TagCategory } from "@/components/TagChip";
import {
  isSearchFilterCategory,
  type SearchFilterCategory,
  type SearchFilterItem,
  type SearchFilterRef,
} from "@/lib/material-search";

export type SelectedSearchFilter =
  | {
      kind: "filter";
      id: string;
      name: string;
      /** 資材ジャンルの略称 */
      shortName?: string;
      category: SearchFilterCategory;
    }
  | { kind: "maker"; name: string }
  | { kind: "name"; name: string };

export type MaterialSortParam = "reviews" | "rating" | "newest";

export type ParsedSearchQuery = {
  filters: SearchFilterRef[];
  makerNames: string[];
  materialNames: string[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toUiCategory(category: SearchFilterCategory): TagCategory {
  if (category === "crop_group") return "crop";
  return category === "condition" || category === "method" ? "cond" : category;
}

export function selectedFilterKey(filter: SelectedSearchFilter): string {
  if (filter.kind === "filter") return `${filter.category}:${filter.id}`;
  if (filter.kind === "maker") return `maker:${filter.name}`;
  return `name:${filter.name}`;
}

export function encodeFiltersQuery(filters: SelectedSearchFilter[]): string {
  return filters
    .map((filter) => {
      if (filter.kind === "filter") return `${filter.category}:${filter.id}`;
      if (filter.kind === "maker") return `maker:${encodeURIComponent(filter.name)}`;
      return `name:${encodeURIComponent(filter.name)}`;
    })
    .join(",");
}

export function parseFiltersQuery(raw: string | undefined): ParsedSearchQuery {
  if (raw === undefined || raw.trim().length === 0) {
    return { filters: [], makerNames: [], materialNames: [] };
  }

  const filters: SearchFilterRef[] = [];
  const makerNames: string[] = [];
  const materialNames: string[] = [];

  for (const part of raw.split(",")) {
    const token = part.trim();
    if (token.length === 0) continue;

    if (token.startsWith("maker:")) {
      makerNames.push(decodeURIComponent(token.slice("maker:".length)));
      continue;
    }

    if (token.startsWith("name:")) {
      materialNames.push(decodeURIComponent(token.slice("name:".length)));
      continue;
    }

    const separator = token.indexOf(":");
    const category = separator === -1 ? "" : token.slice(0, separator);
    const id = separator === -1 ? "" : token.slice(separator + 1);

    if (
      isSearchFilterCategory(category) &&
      (category === "method"
        ? APPLICATION_METHODS.some((method) => method.value === id)
        : UUID_RE.test(id))
    ) {
      filters.push({ category, id });
      continue;
    }

    throw new Error(`不正な filters クエリです: ${token}`);
  }

  return { filters, makerNames, materialNames };
}

const queryParamSchema = v.optional(v.pipe(v.string(), v.trim()), "");

/** URL の q を入力欄の初期値にする。未指定は空文字、前後の空白は除く。同名パラメータの重複（配列）は不正として例外にする。 */
export function parseQueryParam(raw: string | string[] | undefined): string {
  return v.parse(queryParamSchema, raw);
}

export function parseSortParam(raw: string | undefined): MaterialSortParam {
  if (raw === "rating" || raw === "newest" || raw === "reviews") return raw;
  return "reviews";
}

export function buildSearchHref({
  filters,
  sort,
  query = "",
}: {
  filters: SelectedSearchFilter[];
  sort: MaterialSortParam;
  query?: string;
}): string {
  const params = new URLSearchParams();
  const encoded = encodeFiltersQuery(filters);
  if (encoded.length > 0) params.set("filters", encoded);
  if (sort !== "reviews") params.set("sort", sort);
  if (query.trim().length > 0) params.set("q", query.trim());
  const encodedQuery = params.toString();
  return encodedQuery.length > 0 ? `/search?${encodedQuery}` : "/search";
}

export function formatLogicHint(filters: SelectedSearchFilter[]): string {
  if (filters.length === 0) return "";

  const byCategory = new Map<string, string[]>();

  for (const filter of filters) {
    const category =
      filter.kind === "filter" ? filter.category : filter.kind === "maker" ? "maker" : "name";
    const names = byCategory.get(category) ?? [];
    names.push(filter.name);
    byCategory.set(category, names);
  }

  return [...byCategory.values()].map((names) => names.join(" または ")).join(" かつ ");
}

export function searchFilterItemToSelected(filter: SearchFilterItem): SelectedSearchFilter {
  return {
    kind: "filter",
    id: filter.id,
    name: filter.name,
    shortName: filter.shortName,
    category: filter.category,
  };
}

/** 選んだ条件のチップに出す名前。資材ジャンルは略称にする。 */
export function selectedFilterChipName(filter: SelectedSearchFilter): string {
  return filter.kind === "filter" ? (filter.shortName ?? filter.name) : filter.name;
}

export function resolveSelectedFilters({
  filters,
  makerNames,
  materialNames,
}: {
  filters: SearchFilterItem[];
  makerNames: string[];
  materialNames: string[];
}): SelectedSearchFilter[] {
  return [
    ...filters.map(searchFilterItemToSelected),
    ...makerNames.map((name) => ({ kind: "maker" as const, name })),
    ...materialNames.map((name) => ({ kind: "name" as const, name })),
  ];
}

export function selectedFilterCategory(filter: SelectedSearchFilter): TagCategory {
  if (filter.kind === "filter") return toUiCategory(filter.category);
  return filter.kind;
}
