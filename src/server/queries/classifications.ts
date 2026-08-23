import { cache } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isSearchFilterCategory,
  SEARCH_FILTER_CATEGORIES,
  type SearchFilterCategory,
  type SearchFilterItem,
  type SearchFilterRef,
} from "@/lib/material-search";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type CompositionTypeRow = Database["public"]["Tables"]["composition_types"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];
type EffectCategoryRow = Database["public"]["Tables"]["effect_categories"]["Row"];
type EffectRow = Database["public"]["Tables"]["effects"]["Row"];
type IngredientCategoryRow = Database["public"]["Tables"]["ingredient_categories"]["Row"];
type IngredientRow = Database["public"]["Tables"]["ingredients"]["Row"];
type ProductTypeRow = Database["public"]["Tables"]["product_types"]["Row"];
type SearchTagRow = Database["public"]["Tables"]["search_tags"]["Row"];

export type EffectOption = Pick<EffectRow, "id" | "name" | "sort_order"> & {
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
};

export type CropOption = Pick<CropRow, "id" | "name" | "aliases" | "sort_order"> & {
  groupId: string;
  groupName: string;
  groupSortOrder: number;
};

export type IngredientOption = Pick<IngredientRow, "id" | "name" | "sort_order"> & {
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
};

export type ClassificationOptions = {
  compositionTypes: Array<Pick<CompositionTypeRow, "id" | "name" | "sort_order">>;
  crops: CropOption[];
  effectCategories: Array<Pick<EffectCategoryRow, "id" | "name" | "sort_order">>;
  effects: EffectOption[];
  ingredientCategories: Array<Pick<IngredientCategoryRow, "id" | "name" | "sort_order">>;
  ingredients: IngredientOption[];
  productTypes: Array<Pick<ProductTypeRow, "id" | "name" | "sort_order">>;
  searchTags: Array<Pick<SearchTagRow, "id" | "name" | "category" | "sort_order">>;
};

export const POPULAR_FILTER_PAIRS: ReadonlyArray<{
  category: SearchFilterCategory;
  name: string;
}> = [
  { category: "concern", name: "高温対策" },
  { category: "crop", name: "ミニトマト" },
  { category: "crop", name: "いちご" },
  { category: "concern", name: "根張り改善" },
  { category: "condition", name: "施設園芸" },
  { category: "condition", name: "葉面散布" },
];

export const SEASONAL_FILTER_PAIRS: ReadonlyArray<{
  category: SearchFilterCategory;
  name: string;
}> = [
  { category: "concern", name: "夏の暑さ対策" },
  { category: "effect", name: "樹勢改善" },
  { category: "concern", name: "日持ち向上" },
  { category: "condition", name: "ハウス栽培" },
];

const CATEGORY_ORDER = new Map<SearchFilterCategory, number>(
  SEARCH_FILTER_CATEGORIES.map((category, index) => [category, index]),
);

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/classifications] ${operation}`, error);
}

function bySortOrder(
  left: { id: string; sort_order: number },
  right: { id: string; sort_order: number },
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

export async function listClassificationOptionsWithSupabase(
  supabase: SupabaseClient<Database>,
): Promise<Result<ClassificationOptions>> {
  const [
    compositionTypesResult,
    cropGroupsResult,
    cropsResult,
    effectCategoriesResult,
    effectsResult,
    ingredientCategoriesResult,
    ingredientsResult,
    productTypesResult,
    searchTagsResult,
  ] = await Promise.all([
    supabase.from("composition_types").select("id, name, sort_order"),
    supabase.from("crop_groups").select("id, name, sort_order"),
    supabase.from("crops").select("id, group_id, name, aliases, sort_order"),
    supabase.from("effect_categories").select("id, name, sort_order"),
    supabase.from("effects").select("id, category_id, name, sort_order"),
    supabase.from("ingredient_categories").select("id, name, sort_order"),
    supabase.from("ingredients").select("id, category_id, name, sort_order"),
    supabase.from("product_types").select("id, name, sort_order"),
    supabase.from("search_tags").select("id, name, category, sort_order"),
  ]);

  const error =
    compositionTypesResult.error ??
    cropGroupsResult.error ??
    cropsResult.error ??
    effectCategoriesResult.error ??
    effectsResult.error ??
    ingredientCategoriesResult.error ??
    ingredientsResult.error ??
    productTypesResult.error ??
    searchTagsResult.error;

  if (error !== null) {
    reportQueryError("分類マスタの取得に失敗", error);
    return fail("internal");
  }

  const compositionTypes = compositionTypesResult.data;
  const cropGroupRows = cropGroupsResult.data;
  const cropRows = cropsResult.data;
  const effectCategoryRows = effectCategoriesResult.data;
  const effectRows = effectsResult.data;
  const ingredientCategoryRows = ingredientCategoriesResult.data;
  const ingredientRows = ingredientsResult.data;
  const productTypeRows = productTypesResult.data;
  const searchTagRows = searchTagsResult.data;

  if (
    compositionTypes === null ||
    cropGroupRows === null ||
    cropRows === null ||
    effectCategoryRows === null ||
    effectRows === null ||
    ingredientCategoryRows === null ||
    ingredientRows === null ||
    productTypeRows === null ||
    searchTagRows === null
  ) {
    reportQueryError("分類マスタの応答にデータが無い", null);
    return fail("internal");
  }

  const cropGroups = new Map(cropGroupRows.map((group) => [group.id, group]));
  const effectCategories = new Map(effectCategoryRows.map((category) => [category.id, category]));
  const ingredientCategories = new Map(
    ingredientCategoryRows.map((category) => [category.id, category]),
  );
  const crops: CropOption[] = [];
  const effects: EffectOption[] = [];
  const ingredients: IngredientOption[] = [];

  for (const crop of cropRows) {
    const group = cropGroups.get(crop.group_id);
    if (group === undefined) {
      reportQueryError("作物に対応する作物群が無い", crop);
      return fail("internal");
    }
    crops.push({
      id: crop.id,
      name: crop.name,
      aliases: crop.aliases,
      sort_order: crop.sort_order,
      groupId: group.id,
      groupName: group.name,
      groupSortOrder: group.sort_order,
    });
  }

  for (const effect of effectRows) {
    const category = effectCategories.get(effect.category_id);
    if (category === undefined) {
      reportQueryError("個別効果に対応する効果大分類が無い", effect);
      return fail("internal");
    }
    effects.push({
      id: effect.id,
      name: effect.name,
      sort_order: effect.sort_order,
      categoryId: category.id,
      categoryName: category.name,
      categorySortOrder: category.sort_order,
    });
  }

  for (const ingredient of ingredientRows) {
    const category = ingredientCategories.get(ingredient.category_id);
    if (category === undefined) {
      reportQueryError("個別材料に対応する材料分類が無い", ingredient);
      return fail("internal");
    }
    ingredients.push({
      id: ingredient.id,
      name: ingredient.name,
      sort_order: ingredient.sort_order,
      categoryId: category.id,
      categoryName: category.name,
      categorySortOrder: category.sort_order,
    });
  }

  return succeed({
    compositionTypes: compositionTypes.toSorted(bySortOrder),
    crops: crops.toSorted(
      (left, right) => left.groupSortOrder - right.groupSortOrder || bySortOrder(left, right),
    ),
    effectCategories: effectCategoryRows.toSorted(bySortOrder),
    effects: effects.toSorted(
      (left, right) => left.categorySortOrder - right.categorySortOrder || bySortOrder(left, right),
    ),
    ingredientCategories: ingredientCategoryRows.toSorted(bySortOrder),
    ingredients: ingredients.toSorted(
      (left, right) => left.categorySortOrder - right.categorySortOrder || bySortOrder(left, right),
    ),
    productTypes: productTypeRows.toSorted(bySortOrder),
    searchTags: searchTagRows.toSorted(
      (left, right) => left.category.localeCompare(right.category) || bySortOrder(left, right),
    ),
  });
}

async function fetchClassificationOptions(): Promise<Result<ClassificationOptions>> {
  const supabase = await createServerSupabase();
  return listClassificationOptionsWithSupabase(supabase);
}

export const listClassificationOptions = cache(fetchClassificationOptions);

async function fetchSearchFilters(): Promise<Result<SearchFilterItem[]>> {
  const options = await listClassificationOptions();
  if (!options.ok) return options;

  const filters: SearchFilterItem[] = [
    ...options.data.crops.map((crop) => ({
      id: crop.id,
      name: crop.name,
      aliases: crop.aliases,
      sort_order: crop.sort_order,
      category: "crop" as const,
    })),
    ...options.data.searchTags.map((tag) => {
      if (!isSearchFilterCategory(tag.category)) {
        throw new Error(`未対応の検索タグ分類です: ${tag.category}`);
      }
      return {
        id: tag.id,
        name: tag.name,
        aliases: [],
        sort_order: tag.sort_order,
        category: tag.category,
      };
    }),
    ...options.data.effects.map((effect) => ({
      id: effect.id,
      name: effect.name,
      aliases: [],
      sort_order: effect.sort_order,
      category: "effect" as const,
    })),
    ...options.data.productTypes.map((productType) => ({
      id: productType.id,
      name: productType.name,
      aliases: [],
      sort_order: productType.sort_order,
      category: "type" as const,
    })),
  ];

  return succeed(
    filters.toSorted((left, right) => {
      const categoryOrder =
        (CATEGORY_ORDER.get(left.category) ?? 0) - (CATEGORY_ORDER.get(right.category) ?? 0);
      return categoryOrder || bySortOrder(left, right);
    }),
  );
}

export const listSearchFilters = cache(fetchSearchFilters);

export async function listSearchFiltersByRefs(
  refs: readonly SearchFilterRef[],
): Promise<Result<SearchFilterItem[]>> {
  if (refs.length === 0) return succeed([]);

  const filters = await listSearchFilters();
  if (!filters.ok) return filters;

  const byKey = new Map(filters.data.map((filter) => [`${filter.category}:${filter.id}`, filter]));
  const resolved: SearchFilterItem[] = [];

  for (const ref of refs) {
    const filter = byKey.get(`${ref.category}:${ref.id}`);
    if (filter === undefined) return fail("invalid_body");
    resolved.push(filter);
  }

  return succeed(resolved);
}

export async function listSearchFiltersByPairs(
  pairs: ReadonlyArray<{ category: SearchFilterCategory; name: string }>,
): Promise<Result<SearchFilterItem[]>> {
  if (pairs.length === 0) return succeed([]);

  const filters = await listSearchFilters();
  if (!filters.ok) return filters;

  const byKey = new Map(
    filters.data.map((filter) => [`${filter.category}\0${filter.name}`, filter]),
  );
  const resolved: SearchFilterItem[] = [];

  for (const pair of pairs) {
    const filter = byKey.get(`${pair.category}\0${pair.name}`);
    if (filter === undefined) {
      reportQueryError("シードに無い検索条件", pair);
      return fail("internal");
    }
    resolved.push(filter);
  }

  return succeed(resolved);
}

export async function listSearchSuggestions(): Promise<
  Result<{
    filters: SearchFilterItem[];
    makers: string[];
    materialNames: string[];
  }>
> {
  const supabase = await createServerSupabase();
  const [filtersResult, materialsResult] = await Promise.all([
    listSearchFilters(),
    supabase.from("materials").select("name, manufacturer_name").order("name", { ascending: true }),
  ]);

  if (!filtersResult.ok) return filtersResult;

  if (materialsResult.error !== null) {
    reportQueryError("資材名・メーカー候補の取得に失敗", materialsResult.error);
    return fail("internal");
  }

  const makers = [...new Set(materialsResult.data.map((row) => row.manufacturer_name))].toSorted(
    (left, right) => left.localeCompare(right, "ja"),
  );
  const materialNames = materialsResult.data
    .map((row) => row.name)
    .toSorted((left, right) => left.localeCompare(right, "ja"));

  return succeed({ filters: filtersResult.data, makers, materialNames });
}
