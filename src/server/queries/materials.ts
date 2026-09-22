import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  matchSearchCatalog,
  SearchFilterCategory,
  SearchFilterRef,
} from "@/lib/material-search";
import { DEFAULT_PER_PAGE, pageRange, type Paginated } from "@/server/pagination";
import { listClassificationOptionsWithSupabase } from "@/server/queries/classifications";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialImageRow = Database["public"]["Tables"]["material_images"]["Row"];
type MaterialEvidenceRow = Database["public"]["Tables"]["material_evidences"]["Row"];

type MaterialListFields = Pick<
  MaterialRow,
  | "id"
  | "name"
  | "manufacturer_name"
  | "sales_status"
  | "seller_id"
  | "manufacturer_verified_at"
  | "publication_status"
  | "review_count"
  | "avg_rating"
  | "control_plot_ratio"
  | "created_at"
  | "description"
>;

export type MaterialSort = "reviews" | "rating" | "newest";

type MaterialDetailFields = Pick<
  MaterialRow,
  | keyof MaterialListFields
  | "composition_type_id"
  | "general_use"
  | "main_components"
  | "mechanism"
  | "usage_text"
  | "price_range"
  | "official_url"
  | "catalog_url"
  | "archived_at"
  | "manufacturer_verification_method"
  | "updated_at"
>;

export type MaterialImage = Pick<MaterialImageRow, "id" | "url" | "image_type" | "sort_order">;

export type MaterialEvidence = Pick<
  MaterialEvidenceRow,
  | "id"
  | "evidence_type"
  | "title"
  | "file_url"
  | "external_url"
  | "meta"
  | "sort_order"
  | "created_at"
>;

export type MaterialClassification = {
  id: string;
  name: string;
  sort_order: number;
};

export type MaterialEffect = MaterialClassification & {
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
};

export type MaterialTargetCrop = MaterialClassification & {
  groupId: string;
  groupName: string;
  groupSortOrder: number;
  sourceName: string;
};

export type MaterialIngredient = MaterialClassification & {
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
};

export type MaterialSearchTag = MaterialClassification & {
  category: string;
};

export type MaterialListItem = MaterialListFields & {
  primaryImage: MaterialImage | null;
};

export type PostingMaterial = Pick<
  MaterialRow,
  "id" | "name" | "manufacturer_name" | "review_count" | "avg_rating" | "manufacturer_verified_at"
>;

export type MaterialDetail = MaterialDetailFields & {
  representativeSeller: Pick<
    Database["public"]["Views"]["public_sellers"]["Row"],
    "id" | "official_name"
  > | null;
  compositionType: MaterialClassification | null;
  effects: MaterialEffect[];
  images: MaterialImage[];
  evidences: MaterialEvidence[];
  ingredientCategories: MaterialClassification[];
  ingredients: MaterialIngredient[];
  productTypes: MaterialClassification[];
  searchTags: MaterialSearchTag[];
  targetCrops: MaterialTargetCrop[];
  targetCropGroups: MaterialClassification[];
  applicationMethods: Array<
    Pick<
      Database["public"]["Tables"]["material_application_methods"]["Row"],
      "method" | "sort_order"
    >
  >;
};

type MaterialFilterResult = Result<string[] | null>;
type CategoryMaterialResult = Result<Set<string>>;

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/materials] ${operation}`, error);
}

function bySortOrder(
  left: { id: string; sort_order: number },
  right: { id: string; sort_order: number },
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

function invalidFilterIds(requestedIds: string[], actualIds: string[]): boolean {
  const actual = new Set(actualIds);
  return requestedIds.some((id) => !actual.has(id));
}

async function findCategoryMaterialIds(
  supabase: SupabaseClient<Database>,
  category: SearchFilterCategory,
  ids: string[],
): Promise<CategoryMaterialResult> {
  if (category === "crop") {
    const [masters, relations] = await Promise.all([
      supabase.from("crops").select("id").in("id", ids),
      supabase.from("material_crops").select("material_id").in("crop_id", ids),
    ]);
    if (masters.error !== null || relations.error !== null) {
      reportQueryError("対象作物による絞り込みに失敗", {
        masterError: masters.error,
        relationError: relations.error,
      });
      return fail("internal");
    }
    if (
      invalidFilterIds(
        ids,
        masters.data.map(({ id }) => id),
      )
    )
      return fail("invalid_body");
    return succeed(new Set(relations.data.map(({ material_id }) => material_id)));
  }

  if (category === "effect") {
    const [masters, relations] = await Promise.all([
      supabase.from("effects").select("id").in("id", ids),
      supabase.from("material_effects").select("material_id").in("effect_id", ids),
    ]);
    if (masters.error !== null || relations.error !== null) {
      reportQueryError("効果による絞り込みに失敗", {
        masterError: masters.error,
        relationError: relations.error,
      });
      return fail("internal");
    }
    if (
      invalidFilterIds(
        ids,
        masters.data.map(({ id }) => id),
      )
    )
      return fail("invalid_body");
    return succeed(new Set(relations.data.map(({ material_id }) => material_id)));
  }

  if (category === "genre") {
    const [masters, relations] = await Promise.all([
      supabase.from("ingredient_categories").select("id").in("id", ids),
      supabase
        .from("material_ingredient_categories")
        .select("material_id")
        .in("ingredient_category_id", ids),
    ]);
    if (masters.error !== null || relations.error !== null) {
      reportQueryError("資材ジャンルによる絞り込みに失敗", {
        masterError: masters.error,
        relationError: relations.error,
      });
      return fail("internal");
    }
    if (
      invalidFilterIds(
        ids,
        masters.data.map(({ id }) => id),
      )
    )
      return fail("invalid_body");
    return succeed(new Set(relations.data.map(({ material_id }) => material_id)));
  }

  const [masters, relations] = await Promise.all([
    supabase.from("search_tags").select("id").eq("category", category).in("id", ids),
    supabase.from("material_search_tags").select("material_id").in("search_tag_id", ids),
  ]);
  if (masters.error !== null || relations.error !== null) {
    reportQueryError("検索タグによる絞り込みに失敗", {
      masterError: masters.error,
      relationError: relations.error,
    });
    return fail("internal");
  }
  if (
    invalidFilterIds(
      ids,
      masters.data.map(({ id }) => id),
    )
  )
    return fail("invalid_body");
  return succeed(new Set(relations.data.map(({ material_id }) => material_id)));
}

async function findMatchingMaterialIds(
  supabase: SupabaseClient<Database>,
  requestedFilters: readonly SearchFilterRef[] | undefined,
): Promise<MaterialFilterResult> {
  const uniqueFilters = new Map<string, SearchFilterRef>();
  for (const filter of requestedFilters ?? []) {
    uniqueFilters.set(`${filter.category}:${filter.id}`, filter);
  }
  if (uniqueFilters.size === 0) return succeed(null);

  const idsByCategory = new Map<SearchFilterCategory, string[]>();
  for (const filter of uniqueFilters.values()) {
    const ids = idsByCategory.get(filter.category) ?? [];
    ids.push(filter.id);
    idsByCategory.set(filter.category, ids);
  }

  const categoryResults = await Promise.all(
    [...idsByCategory].map(([category, ids]) => findCategoryMaterialIds(supabase, category, ids)),
  );
  let intersection: Set<string> | null = null;

  for (const result of categoryResults) {
    if (!result.ok) return result;
    if (intersection === null) {
      intersection = new Set(result.data);
      continue;
    }

    const nextIntersection = new Set<string>();
    for (const materialId of intersection) {
      if (result.data.has(materialId)) nextIntersection.add(materialId);
    }
    intersection = nextIntersection;
  }

  return succeed(intersection === null ? [] : [...intersection]);
}

async function findKeywordMaterialIds(
  supabase: SupabaseClient<Database>,
  matches: ReturnType<typeof matchSearchCatalog>,
): Promise<Result<string[]>> {
  const byCategory = new Map<SearchFilterCategory, string[]>();
  for (const filter of matches.filters) {
    const ids = byCategory.get(filter.category) ?? [];
    ids.push(filter.id);
    byCategory.set(filter.category, ids);
  }
  const categoryResults = await Promise.all(
    [...byCategory].map(([category, ids]) => findCategoryMaterialIds(supabase, category, ids)),
  );
  const ids = new Set<string>();
  for (const result of categoryResults) {
    if (!result.ok) return result;
    for (const id of result.data) ids.add(id);
  }
  // 候補カタログの実名だけを渡すため、検索文字を PostgREST の式へ連結しない。
  const nameResults = await Promise.all([
    matches.materialNames.length > 0
      ? supabase.from("materials").select("id").in("name", matches.materialNames)
      : null,
    matches.makerNames.length > 0
      ? supabase.from("materials").select("id").in("manufacturer_name", matches.makerNames)
      : null,
  ]);
  for (const result of nameResults) {
    if (result === null) continue;
    if (result.error !== null) {
      reportQueryError("キーワードによる資材検索に失敗", result.error);
      return fail("internal");
    }
    for (const row of result.data) ids.add(row.id);
  }
  return succeed([...ids]);
}

export type ListMaterialsOptions = {
  /** 入力文字に合う候補は分類をまたいで OR、選択済みの条件とは AND で絞る。 */
  keywordMatches?: ReturnType<typeof matchSearchCatalog>;
  ids?: string[];
  filters?: readonly SearchFilterRef[];
  /** メーカー名での絞り込み（同一分類 OR）。タグではなく materials 由来。 */
  makerNames?: string[];
  /** 製品名での絞り込み（同一分類 OR）。タグではなく materials 由来。 */
  materialNames?: string[];
  sort?: MaterialSort;
  page: number;
};

export async function listMaterials(
  options: ListMaterialsOptions,
): Promise<Result<Paginated<MaterialListItem>>> {
  const supabase = await createServerSupabase();
  return listMaterialsWithSupabase(supabase, options);
}

export async function listMaterialsWithSupabase(
  supabase: SupabaseClient<Database>,
  {
    filters,
    makerNames,
    materialNames,
    keywordMatches,
    ids,
    sort = "reviews",
    page,
  }: ListMaterialsOptions,
): Promise<Result<Paginated<MaterialListItem>>> {
  const { from, to } = pageRange(page);
  const materialFilter = await findMatchingMaterialIds(supabase, filters);

  if (!materialFilter.ok) {
    return materialFilter;
  }

  if (materialFilter.data !== null && materialFilter.data.length === 0) {
    return succeed({
      items: [],
      page,
      perPage: DEFAULT_PER_PAGE,
      total: 0,
      totalPages: 0,
    });
  }

  const makers = [...new Set(makerNames ?? [])];
  const names = [...new Set(materialNames ?? [])];

  let query = supabase
    .from("materials")
    .select(
      `
        id,
        name,
        manufacturer_name,
        sales_status,
        seller_id,
        manufacturer_verified_at,
        publication_status,
        review_count,
        avg_rating,
        control_plot_ratio,
        created_at,
        description
      `,
      { count: "exact" },
    )
    .eq("publication_status", "published");

  if (materialFilter.data !== null) {
    query = query.in("id", materialFilter.data);
  }

  if (ids !== undefined) query = query.in("id", ids);

  if (keywordMatches !== undefined) {
    const keywordIds = await findKeywordMaterialIds(supabase, keywordMatches);
    if (!keywordIds.ok) return keywordIds;
    if (keywordIds.data.length === 0) {
      return succeed({ items: [], page, perPage: DEFAULT_PER_PAGE, total: 0, totalPages: 0 });
    }
    query = query.in("id", keywordIds.data);
  }

  if (makers.length > 0) {
    query = query.in("manufacturer_name", makers);
  }

  if (names.length > 0) {
    query = query.in("name", names);
  }

  // 並び替え。同点は id で安定化。
  if (sort === "rating") {
    query = query
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("review_count", { ascending: false })
      .order("id", { ascending: true });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false }).order("id", { ascending: true });
  } else {
    query = query.order("review_count", { ascending: false }).order("id", { ascending: true });
  }

  const { data, error, count } = await query.range(from, to);

  if (error !== null) {
    reportQueryError("資材一覧の取得に失敗", error);
    return fail("internal");
  }

  if (count === null) {
    reportQueryError("資材一覧の総件数が返されなかった", {
      page,
      filters,
      makerNames: makers,
      materialNames: names,
      sort,
    });
    return fail("internal");
  }

  const materialIds = data.map(({ id }) => id);
  const imageResult =
    materialIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("material_images")
          .select("id, material_id, url, image_type, sort_order")
          .eq("is_current", true)
          .in("material_id", materialIds);

  if (imageResult.error !== null) {
    reportQueryError("資材一覧画像の取得に失敗", imageResult.error);
    return fail("internal");
  }

  const imagesByMaterial = new Map<string, MaterialImage[]>();
  for (const { material_id, ...image } of imageResult.data) {
    const images = imagesByMaterial.get(material_id) ?? [];
    images.push(image);
    imagesByMaterial.set(material_id, images);
  }

  return succeed({
    items: data.map((material) => ({
      ...material,
      primaryImage: (imagesByMaterial.get(material.id) ?? []).toSorted(bySortOrder)[0] ?? null,
    })),
    page,
    perPage: DEFAULT_PER_PAGE,
    total: count,
    totalPages: Math.ceil(count / DEFAULT_PER_PAGE),
  });
}

export async function getMaterial(id: string): Promise<Result<MaterialDetail>> {
  const supabase = await createServerSupabase();
  return getMaterialWithSupabase(supabase, id);
}

export async function getMaterialWithSupabase(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Result<MaterialDetail>> {
  const { data, error } = await supabase
    .from("materials")
    .select(
      `
        id,
        name,
        manufacturer_name,
        sales_status,
        seller_id,
        manufacturer_verified_at,
        publication_status,
        review_count,
        avg_rating,
        control_plot_ratio,
        created_at,
        description,
        composition_type_id,
        general_use,
        main_components,
        mechanism,
        usage_text,
        price_range,
        official_url,
        catalog_url,
        archived_at,
        manufacturer_verification_method,
        updated_at
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error !== null) {
    reportQueryError("資材詳細の取得に失敗", error);
    return fail("internal");
  }

  if (data === null) {
    return fail("not_found");
  }

  const [
    imagesResult,
    evidencesResult,
    effectsResult,
    cropsResult,
    cropGroupsResult,
    methodsResult,
    ingredientCategoriesResult,
    ingredientsResult,
    productTypesResult,
    searchTagsResult,
    optionsResult,
    representativeSellerResult,
  ] = await Promise.all([
    supabase
      .from("material_images")
      .select("id, url, image_type, sort_order")
      .eq("is_current", true)
      .eq("material_id", id),
    supabase
      .from("material_evidences")
      .select("id, evidence_type, title, file_url, external_url, meta, sort_order, created_at")
      .eq("material_id", id),
    supabase.from("material_effects").select("effect_id").eq("material_id", id),
    supabase
      .from("material_crops")
      .select("crop_id, source_name, sort_order")
      .eq("material_id", id),
    supabase
      .from("material_crop_groups")
      .select("sort_order,crop_groups(id,name)")
      .eq("material_id", id),
    supabase
      .from("material_application_methods")
      .select("method,sort_order")
      .eq("material_id", id)
      .order("sort_order"),
    supabase
      .from("material_ingredient_categories")
      .select("ingredient_category_id")
      .eq("material_id", id),
    supabase.from("material_ingredients").select("ingredient_id").eq("material_id", id),
    supabase.from("material_product_types").select("product_type_id").eq("material_id", id),
    supabase.from("material_search_tags").select("search_tag_id").eq("material_id", id),
    listClassificationOptionsWithSupabase(supabase),
    data.seller_id === null
      ? { data: null, error: null }
      : supabase
          .from("public_sellers")
          .select("id,official_name")
          .eq("id", data.seller_id)
          .maybeSingle(),
  ]);

  const relationError =
    imagesResult.error ??
    evidencesResult.error ??
    effectsResult.error ??
    cropsResult.error ??
    cropGroupsResult.error ??
    methodsResult.error ??
    ingredientCategoriesResult.error ??
    ingredientsResult.error ??
    productTypesResult.error ??
    searchTagsResult.error ??
    representativeSellerResult.error;
  if (relationError !== null) {
    reportQueryError("資材分類の取得に失敗", relationError);
    return fail("internal");
  }
  if (!optionsResult.ok) return optionsResult;

  const images = imagesResult.data;
  const evidences = evidencesResult.data;
  const effectRelations = effectsResult.data;
  const cropRelations = cropsResult.data;
  const ingredientCategoryRelations = ingredientCategoriesResult.data;
  const ingredientRelations = ingredientsResult.data;
  const productTypeRelations = productTypesResult.data;
  const searchTagRelations = searchTagsResult.data;
  if (
    cropGroupsResult.data === null ||
    methodsResult.data === null ||
    images === null ||
    evidences === null ||
    effectRelations === null ||
    cropRelations === null ||
    ingredientCategoryRelations === null ||
    ingredientRelations === null ||
    productTypeRelations === null ||
    searchTagRelations === null
  ) {
    reportQueryError("資材分類の応答にデータが無い", { materialId: id });
    return fail("internal");
  }

  const compositionType =
    data.composition_type_id === null
      ? null
      : (optionsResult.data.compositionTypes.find(
          ({ id: compositionTypeId }) => compositionTypeId === data.composition_type_id,
        ) ?? null);
  if (data.composition_type_id !== null && compositionType === null) {
    reportQueryError("資材に対応する組成タイプが無い", data);
    return fail("internal");
  }

  const effectById = new Map(optionsResult.data.effects.map((effect) => [effect.id, effect]));
  const cropById = new Map(optionsResult.data.crops.map((crop) => [crop.id, crop]));
  const ingredientCategoryById = new Map(
    optionsResult.data.ingredientCategories.map((category) => [category.id, category]),
  );
  const ingredientById = new Map(
    optionsResult.data.ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const productTypeById = new Map(
    optionsResult.data.productTypes.map((productType) => [productType.id, productType]),
  );
  const searchTagById = new Map(
    optionsResult.data.searchTags.map((searchTag) => [searchTag.id, searchTag]),
  );
  const effects: MaterialEffect[] = [];
  const targetCrops: MaterialTargetCrop[] = [];
  const ingredientCategories: MaterialClassification[] = [];
  const ingredients: MaterialIngredient[] = [];
  const productTypes: MaterialClassification[] = [];
  const searchTags: MaterialSearchTag[] = [];

  for (const relation of effectRelations) {
    const effect = effectById.get(relation.effect_id);
    if (effect === undefined) {
      reportQueryError("資材に対応する効果が無い", relation);
      return fail("internal");
    }
    effects.push(effect);
  }
  for (const relation of cropRelations) {
    const crop = cropById.get(relation.crop_id);
    if (crop === undefined) {
      reportQueryError("資材に対応する対象作物が無い", relation);
      return fail("internal");
    }
    targetCrops.push({
      ...crop,
      sort_order: relation.sort_order,
      sourceName: relation.source_name,
    });
  }
  for (const relation of ingredientCategoryRelations) {
    const ingredientCategory = ingredientCategoryById.get(relation.ingredient_category_id);
    if (ingredientCategory === undefined) {
      reportQueryError("資材に対応する材料分類が無い", relation);
      return fail("internal");
    }
    ingredientCategories.push(ingredientCategory);
  }
  for (const relation of ingredientRelations) {
    const ingredient = ingredientById.get(relation.ingredient_id);
    if (ingredient === undefined) {
      reportQueryError("資材に対応する個別材料が無い", relation);
      return fail("internal");
    }
    ingredients.push(ingredient);
  }
  for (const relation of productTypeRelations) {
    const productType = productTypeById.get(relation.product_type_id);
    if (productType === undefined) {
      reportQueryError("資材に対応する製品タイプが無い", relation);
      return fail("internal");
    }
    productTypes.push(productType);
  }
  for (const relation of searchTagRelations) {
    const searchTag = searchTagById.get(relation.search_tag_id);
    if (searchTag === undefined) {
      reportQueryError("資材に対応する検索タグが無い", relation);
      return fail("internal");
    }
    searchTags.push(searchTag);
  }

  return succeed({
    ...data,
    representativeSeller: representativeSellerResult.data,
    compositionType,
    effects: effects.toSorted(
      (left, right) => left.categorySortOrder - right.categorySortOrder || bySortOrder(left, right),
    ),
    images: images.toSorted(bySortOrder),
    evidences: evidences.toSorted(bySortOrder),
    ingredientCategories: ingredientCategories.toSorted(bySortOrder),
    ingredients: ingredients.toSorted(
      (left, right) => left.categorySortOrder - right.categorySortOrder || bySortOrder(left, right),
    ),
    productTypes: productTypes.toSorted(bySortOrder),
    searchTags: searchTags.toSorted(
      (left, right) => left.category.localeCompare(right.category) || bySortOrder(left, right),
    ),
    targetCropGroups: cropGroupsResult.data.map((row) => ({
      ...row.crop_groups,
      sort_order: row.sort_order,
    })),
    applicationMethods: methodsResult.data,
    targetCrops: targetCrops.toSorted(
      (left, right) => left.groupSortOrder - right.groupSortOrder || bySortOrder(left, right),
    ),
  });
}

const POSTING_MATERIAL_LIMIT = 20;
const POSTING_QUERY_MAX_LENGTH = 100;

function escapeLikePattern(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function byPostingPriority(left: PostingMaterial, right: PostingMaterial): number {
  return (
    right.review_count - left.review_count ||
    left.name.localeCompare(right.name, "ja") ||
    left.id.localeCompare(right.id)
  );
}

/**
 * 投稿先選択用の軽量検索。
 * 資材名とメーカー名をそれぞれ部分一致で検索する。
 */
export async function searchPostingMaterials(query: string): Promise<Result<PostingMaterial[]>> {
  const normalizedQuery = query.trim();
  const select =
    "id, name, manufacturer_name, review_count, avg_rating, manufacturer_verified_at" as const;

  if (normalizedQuery.length > POSTING_QUERY_MAX_LENGTH) {
    return fail("invalid_body");
  }

  const supabase = await createServerSupabase();

  if (normalizedQuery.length === 0) {
    const { data, error } = await supabase
      .from("materials")
      .select(select)
      .eq("publication_status", "published")
      .order("review_count", { ascending: false })
      .order("name", { ascending: true })
      .limit(POSTING_MATERIAL_LIMIT);

    if (error !== null) {
      reportQueryError("投稿先候補の取得に失敗", error);
      return fail("internal");
    }

    const rows: PostingMaterial[] = data;
    return succeed(rows);
  }

  const pattern = `%${escapeLikePattern(normalizedQuery)}%`;
  const [nameResult, manufacturerResult] = await Promise.all([
    supabase
      .from("materials")
      .select(select)
      .eq("publication_status", "published")
      .ilike("name", pattern)
      .limit(POSTING_MATERIAL_LIMIT),
    supabase
      .from("materials")
      .select(select)
      .eq("publication_status", "published")
      .ilike("manufacturer_name", pattern)
      .limit(POSTING_MATERIAL_LIMIT),
  ]);

  if (nameResult.error !== null || manufacturerResult.error !== null) {
    reportQueryError("投稿先の部分一致検索に失敗", {
      nameError: nameResult.error,
      manufacturerError: manufacturerResult.error,
    });
    return fail("internal");
  }

  const materialsById = new Map<string, PostingMaterial>();

  for (const material of [...nameResult.data, ...manufacturerResult.data]) {
    materialsById.set(material.id, material);
  }

  return succeed(
    [...materialsById.values()].toSorted(byPostingPriority).slice(0, POSTING_MATERIAL_LIMIT),
  );
}
