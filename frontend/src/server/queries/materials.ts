import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_PER_PAGE, pageRange, type Paginated } from "@/server/pagination";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialImageRow = Database["public"]["Tables"]["material_images"]["Row"];
type MaterialEvidenceRow = Database["public"]["Tables"]["material_evidences"]["Row"];
type TagRow = Database["public"]["Tables"]["tags"]["Row"];

type MaterialListFields = Pick<
  MaterialRow,
  | "id"
  | "name"
  | "manufacturer_name"
  | "product_type"
  | "jbsa_class"
  | "sales_status"
  | "seller_id"
  | "review_count"
  | "avg_rating"
  | "control_plot_ratio"
  | "created_at"
>;

type MaterialDetailFields = Pick<
  MaterialRow,
  | keyof MaterialListFields
  | "description"
  | "general_use"
  | "ingredients"
  | "mechanism"
  | "usage_text"
  | "price_range"
  | "official_url"
  | "catalog_url"
  | "updated_at"
>;

export type MaterialImage = Pick<MaterialImageRow, "id" | "url" | "image_type" | "sort_order">;

export type MaterialEvidence = Pick<
  MaterialEvidenceRow,
  "id" | "evidence_type" | "title" | "file_url" | "external_url" | "meta" | "sort_order"
>;

export type MaterialTag = Pick<TagRow, "id" | "name" | "category" | "sort_order">;

export type MaterialListItem = MaterialListFields & {
  primaryImage: MaterialImage | null;
  tags: MaterialTag[];
};

export type MaterialDetail = MaterialDetailFields & {
  images: MaterialImage[];
  evidences: MaterialEvidence[];
  tags: MaterialTag[];
};

type MaterialTagRelation = {
  tags: MaterialTag | null;
};

type MaterialListQueryRow = MaterialListFields & {
  material_images: MaterialImage[];
  material_tags: MaterialTagRelation[];
};

type MaterialDetailQueryRow = MaterialDetailFields & {
  material_images: MaterialImage[];
  material_evidences: MaterialEvidence[];
  material_tags: MaterialTagRelation[];
};

type MaterialFilterResult = Result<string[] | null>;

function reportQueryError(operation: string, error: unknown): void {
  console.error(`[server/queries/materials] ${operation}`, error);
}

function bySortOrder(
  left: { id: string; sort_order: number },
  right: { id: string; sort_order: number },
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

function materialTags(relations: MaterialTagRelation[]): MaterialTag[] {
  return relations
    .flatMap(({ tags }) => (tags === null ? [] : [tags]))
    .sort((left, right) => left.category.localeCompare(right.category) || bySortOrder(left, right));
}

async function findMatchingMaterialIds(
  supabase: SupabaseClient<Database>,
  requestedTagIds: string[] | undefined,
): Promise<MaterialFilterResult> {
  const tagIds = [...new Set(requestedTagIds ?? [])];

  if (tagIds.length === 0) {
    return succeed(null);
  }

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, category")
    .in("id", tagIds);

  if (tagsError !== null) {
    reportQueryError("タグ分類の取得に失敗", tagsError);
    return fail("internal");
  }

  if (tags.length !== tagIds.length) {
    return fail("invalid_body");
  }

  const categoryByTagId = new Map(tags.map((tag) => [tag.id, tag.category]));
  const requiredCategories = new Set(tags.map((tag) => tag.category));
  const { data: relations, error: relationsError } = await supabase
    .from("material_tags")
    .select("material_id, tag_id")
    .in("tag_id", tagIds);

  if (relationsError !== null) {
    reportQueryError("資材タグの取得に失敗", relationsError);
    return fail("internal");
  }

  const matchedCategoriesByMaterial = new Map<string, Set<string>>();

  for (const relation of relations) {
    const category = categoryByTagId.get(relation.tag_id);

    if (category === undefined) {
      reportQueryError("取得した資材タグに未要求のタグが含まれる", relation);
      return fail("internal");
    }

    const matchedCategories =
      matchedCategoriesByMaterial.get(relation.material_id) ?? new Set<string>();
    matchedCategories.add(category);
    matchedCategoriesByMaterial.set(relation.material_id, matchedCategories);
  }

  return succeed(
    [...matchedCategoriesByMaterial]
      .filter(([, categories]) => categories.size === requiredCategories.size)
      .map(([materialId]) => materialId),
  );
}

export async function listMaterials({
  tagIds,
  page,
}: {
  tagIds?: string[];
  page: number;
}): Promise<Result<Paginated<MaterialListItem>>> {
  const { from, to } = pageRange(page);
  const supabase = await createServerSupabase();
  const materialFilter = await findMatchingMaterialIds(supabase, tagIds);

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

  let query = supabase
    .from("materials")
    .select(
      `
        id,
        name,
        manufacturer_name,
        product_type,
        jbsa_class,
        sales_status,
        seller_id,
        review_count,
        avg_rating,
        control_plot_ratio,
        created_at,
        material_images (
          id,
          url,
          image_type,
          sort_order
        ),
        material_tags (
          tags (
            id,
            name,
            category,
            sort_order
          )
        )
      `,
      { count: "exact" },
    )
    .order("review_count", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (materialFilter.data !== null) {
    query = query.in("id", materialFilter.data);
  }

  const { data, error, count } = await query;

  if (error !== null) {
    reportQueryError("資材一覧の取得に失敗", error);
    return fail("internal");
  }

  if (count === null) {
    reportQueryError("資材一覧の総件数が返されなかった", { page, tagIds });
    return fail("internal");
  }

  const rows: MaterialListQueryRow[] = data;

  return succeed({
    items: rows.map(({ material_images, material_tags: tagRelations, ...material }) => {
      const images = material_images.toSorted(bySortOrder);

      return {
        ...material,
        primaryImage: images[0] ?? null,
        tags: materialTags(tagRelations),
      };
    }),
    page,
    perPage: DEFAULT_PER_PAGE,
    total: count,
    totalPages: Math.ceil(count / DEFAULT_PER_PAGE),
  });
}

export async function getMaterial(id: string): Promise<Result<MaterialDetail>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("materials")
    .select(
      `
        id,
        name,
        manufacturer_name,
        product_type,
        jbsa_class,
        sales_status,
        seller_id,
        review_count,
        avg_rating,
        control_plot_ratio,
        created_at,
        description,
        general_use,
        ingredients,
        mechanism,
        usage_text,
        price_range,
        official_url,
        catalog_url,
        updated_at,
        material_images (
          id,
          url,
          image_type,
          sort_order
        ),
        material_evidences (
          id,
          evidence_type,
          title,
          file_url,
          external_url,
          meta,
          sort_order
        ),
        material_tags (
          tags (
            id,
            name,
            category,
            sort_order
          )
        )
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

  const {
    material_images,
    material_evidences,
    material_tags: tagRelations,
    ...material
  }: MaterialDetailQueryRow = data;

  return succeed({
    ...material,
    images: material_images.toSorted(bySortOrder),
    evidences: material_evidences.toSorted(bySortOrder),
    tags: materialTags(tagRelations),
  });
}
