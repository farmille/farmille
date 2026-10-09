import { getCatalogSearch, listSearchSuggestions } from "@/server/queries/catalog-search";
import { matchSearchCatalog } from "@/lib/material-search";
import { materialIllustrationUrl } from "@/lib/material-illustration";
import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_PER_PAGE, pageRange, type Paginated } from "@/server/pagination";
import {
  listClassificationOptions,
  type ClassificationOptions,
} from "@/server/queries/classifications";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialEvidenceRow = Database["public"]["Tables"]["material_evidences"]["Row"];

type MaterialListFields = Pick<
  MaterialRow,
  | "id"
  | "name"
  | "container_type_id"
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

type MaterialDetailFields = Pick<
  MaterialRow,
  | keyof MaterialListFields
  | "official_name"
  | "name_reading"
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
  imageUrl: string | null;
};

export type PostingMaterial = Pick<
  MaterialRow,
  "id" | "name" | "manufacturer_name" | "review_count" | "avg_rating" | "manufacturer_verified_at"
>;

export type PostingMaterialWithImage = PostingMaterial & { imageUrl: string | null };

export type MaterialDetail = MaterialDetailFields & {
  representativeSeller: Pick<
    Database["public"]["Views"]["public_sellers"]["Row"],
    "id" | "official_name"
  > | null;
  compositionType: MaterialClassification | null;
  effects: MaterialEffect[];
  imageUrl: string | null;
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

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/materials] ${operation}`, error);
}

function bySortOrder(
  left: { id: string; sort_order: number },
  right: { id: string; sort_order: number },
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

const MATERIAL_LIST_COLUMNS = `
  id,
  name,
  container_type_id,
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
` as const;

const RELATED_MATERIAL_LIMIT = 3;

function withIllustrations(materials: MaterialListFields[]): Result<MaterialListItem[]> {
  return succeed(
    materials.map((material) => ({
      ...material,
      imageUrl: materialIllustrationUrl(material.container_type_id),
    })),
  );
}

export type ListMaterialsOptions = {
  ids?: string[];
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
  { ids, page }: ListMaterialsOptions,
): Promise<Result<Paginated<MaterialListItem>>> {
  const { from, to } = pageRange(page);
  let query = supabase
    .from("materials")
    .select(MATERIAL_LIST_COLUMNS, { count: "exact" })
    .eq("publication_status", "published");

  if (ids !== undefined) query = query.in("id", ids);

  const { data, error, count } = await query
    .order("review_count", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error !== null) {
    reportQueryError("資材一覧の取得に失敗", error);
    return fail("internal");
  }

  if (count === null) {
    reportQueryError("資材一覧の総件数が返されなかった", { page });
    return fail("internal");
  }

  const items = withIllustrations(data);
  if (!items.ok) return items;

  return succeed({
    items: items.data,
    page,
    perPage: DEFAULT_PER_PAGE,
    total: count,
    totalPages: Math.ceil(count / DEFAULT_PER_PAGE),
  });
}

export async function listRelatedMaterials(
  materialId: string,
  genreIds: readonly string[],
): Promise<Result<MaterialListItem[]>> {
  const supabase = await createServerSupabase();
  return listRelatedMaterialsWithSupabase(supabase, materialId, genreIds);
}

/**
 * 資材ジャンルを1つでも共有する公開資材を、口コミの多い順に返す。
 * 候補の資材 ID を URL に並べると、候補が200件を超えたあたりで 414 になるため、内部結合で絞る。
 */
export async function listRelatedMaterialsWithSupabase(
  supabase: SupabaseClient<Database>,
  materialId: string,
  genreIds: readonly string[],
): Promise<Result<MaterialListItem[]>> {
  if (genreIds.length === 0) return succeed([]);

  const { data, error } = await supabase
    .from("materials")
    .select(`${MATERIAL_LIST_COLUMNS}, material_ingredient_categories!inner()`)
    .eq("publication_status", "published")
    .neq("id", materialId)
    .in("material_ingredient_categories.ingredient_category_id", genreIds)
    .order("review_count", { ascending: false })
    .order("id", { ascending: true })
    .limit(RELATED_MATERIAL_LIMIT);

  if (error !== null) {
    reportQueryError("関連資材の取得に失敗", error);
    return fail("internal");
  }

  return withIllustrations(data);
}

export async function getMaterial(id: string): Promise<Result<MaterialDetail>> {
  const [supabase, options] = await Promise.all([
    createServerSupabase(),
    listClassificationOptions(),
  ]);
  if (!options.ok) return options;
  return getMaterialWithSupabase(supabase, id, options.data);
}

export async function getMaterialWithSupabase(
  supabase: SupabaseClient<Database>,
  id: string,
  options: ClassificationOptions,
): Promise<Result<MaterialDetail>> {
  const { data, error } = await supabase
    .from("materials")
    .select(
      `
        id,
        name,
        container_type_id,
        official_name,
        name_reading,
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
    evidencesResult,
    effectsResult,
    cropsResult,
    cropGroupsResult,
    methodsResult,
    ingredientCategoriesResult,
    ingredientsResult,
    productTypesResult,
    searchTagsResult,
    representativeSellerResult,
  ] = await Promise.all([
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
    data.seller_id === null
      ? { data: null, error: null }
      : supabase
          .from("public_sellers")
          .select("id,official_name")
          .eq("id", data.seller_id)
          .maybeSingle(),
  ]);

  const relationError =
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
      : (options.compositionTypes.find(
          ({ id: compositionTypeId }) => compositionTypeId === data.composition_type_id,
        ) ?? null);
  if (data.composition_type_id !== null && compositionType === null) {
    reportQueryError("資材に対応する組成タイプが無い", data);
    return fail("internal");
  }

  const effectById = new Map(options.effects.map((effect) => [effect.id, effect]));
  const cropById = new Map(options.crops.map((crop) => [crop.id, crop]));
  const ingredientCategoryById = new Map(
    options.ingredientCategories.map((category) => [category.id, category]),
  );
  const ingredientById = new Map(
    options.ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const productTypeById = new Map(
    options.productTypes.map((productType) => [productType.id, productType]),
  );
  const searchTagById = new Map(options.searchTags.map((searchTag) => [searchTag.id, searchTag]));
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
    imageUrl: materialIllustrationUrl(data.container_type_id),
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

function byPostingPriority(left: PostingMaterial, right: PostingMaterial): number {
  return (
    right.review_count - left.review_count ||
    left.name.localeCompare(right.name, "ja") ||
    left.id.localeCompare(right.id)
  );
}

export async function searchPostingMaterials(query: string): Promise<Result<PostingMaterial[]>> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length > POSTING_QUERY_MAX_LENGTH) return fail("invalid_body");
  const [catalog, suggestions] = await Promise.all([getCatalogSearch(), listSearchSuggestions()]);
  if (!suggestions.ok) return suggestions;
  const matches = matchSearchCatalog(suggestions.data, normalizedQuery);
  return succeed(
    catalog.materials
      .filter(
        (material) =>
          matches.materialNames.includes(material.name) ||
          matches.makerNames.includes(material.manufacturer_name),
      )
      .toSorted(byPostingPriority)
      .slice(0, POSTING_MATERIAL_LIMIT)
      .map(
        ({ id, name, manufacturer_name, review_count, avg_rating, manufacturer_verified_at }) => ({
          id,
          name,
          manufacturer_name,
          review_count,
          avg_rating,
          manufacturer_verified_at,
        }),
      ),
  );
}

export async function withPostingMaterialImages(
  materials: readonly PostingMaterial[],
): Promise<Result<PostingMaterialWithImage[]>> {
  const supabase = await createServerSupabase();
  return withPostingMaterialImagesWithSupabase(supabase, materials);
}

export async function withPostingMaterialImagesWithSupabase(
  supabase: SupabaseClient<Database>,
  materials: readonly PostingMaterial[],
): Promise<Result<PostingMaterialWithImage[]>> {
  const result = await supabase
    .from("materials")
    .select("id,container_type_id")
    .in(
      "id",
      materials.map(({ id }) => id),
    );
  if (result.error) return fail("internal");
  const illustrations = new Map(
    result.data.map((material) => [
      material.id,
      materialIllustrationUrl(material.container_type_id),
    ]),
  );
  return succeed(
    materials.map((material) => ({
      ...material,
      imageUrl: illustrations.get(material.id) ?? null,
    })),
  );
}
