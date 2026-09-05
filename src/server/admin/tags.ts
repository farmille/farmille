import { isUniqueViolation, reportAdminError, withAdmin } from "@/server/admin/guard";
import { fail, succeed, type Result } from "@/server/result";
import type { Database } from "@/types/database.types";

type TagRow = Database["public"]["Tables"]["search_tags"]["Row"];
type CropRow = Database["public"]["Tables"]["crops"]["Row"];

/**
 * search_tags.category（01 §3）。作物・効果・製品タイプは専用マスタで管理する。
 * 表示ラベルは共通の TAG_CATEGORY_LABELS（toTagChipCategory で正規化）を使う。
 */
export const TAG_CATEGORIES = ["concern", "condition"] as const;
export type TagCategoryValue = (typeof TAG_CATEGORIES)[number];

export function isTagCategory(value: string | null): value is TagCategoryValue {
  return value !== null && TAG_CATEGORIES.some((category) => category === value);
}

export type AdminTagItem = Pick<TagRow, "id" | "name" | "category" | "sort_order"> & {
  /** material_search_tags からの参照数。1 件以上なら削除できない。 */
  usageCount: number;
};

export type AdminCropItem = Pick<CropRow, "id" | "name" | "aliases" | "sort_order" | "group_id"> & {
  groupName: string;
  /** レビュー・使用レポート・主な作目からの参照数の合計。 */
  usageCount: number;
};

export type CropGroupOption = {
  id: string;
  name: string;
};

function reportError<ErrorValue>(operation: string, error: ErrorValue): void {
  reportAdminError("tags", operation, error);
}

function countBy(ids: (string | null)[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const id of ids) {
    if (id === null) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}

export async function listAdminTags(): Promise<Result<AdminTagItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const [tagsResult, usageResult] = await Promise.all([
      supabase
        .from("search_tags")
        .select("id, name, category, sort_order")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase.from("material_search_tags").select("search_tag_id"),
    ]);

    if (tagsResult.error !== null) {
      reportError("タグ一覧の取得に失敗", tagsResult.error);
      return fail("internal");
    }
    if (usageResult.error !== null) {
      reportError("タグ参照数の取得に失敗", usageResult.error);
      return fail("internal");
    }

    const usage = countBy(usageResult.data.map((row) => row.search_tag_id));

    return succeed(tagsResult.data.map((tag) => ({ ...tag, usageCount: usage.get(tag.id) ?? 0 })));
  });
}

export async function createTag(input: {
  name: string;
  category: TagCategoryValue;
  sortOrder: number;
}): Promise<Result<{ id: string }>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("search_tags")
      .insert({ name: input.name, category: input.category, sort_order: input.sortOrder })
      .select("id")
      .single();

    if (error !== null) {
      if (isUniqueViolation(error)) return fail("conflict");
      reportError("タグの追加に失敗", error);
      return fail("internal");
    }

    return succeed({ id: data.id });
  });
}

/** 改名と並び順の変更。分類（category）は検索の意味が変わるため変更させない。 */
export async function renameTag(
  tagId: string,
  input: { name: string; sortOrder: number },
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("search_tags")
      .update({ name: input.name, sort_order: input.sortOrder })
      .eq("id", tagId)
      .select("id");

    if (error !== null) {
      if (isUniqueViolation(error)) return fail("conflict");
      reportError("タグの改名に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("not_found");

    return succeed(null);
  });
}

/**
 * タグの削除。使用中（material_search_tags から参照あり）は削除しない。
 */
export async function deleteTag(tagId: string): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const { count, error: countError } = await supabase
      .from("material_search_tags")
      .select("id", { count: "exact", head: true })
      .eq("search_tag_id", tagId);

    if (countError !== null) {
      reportError("タグ参照数の確認に失敗", countError);
      return fail("internal");
    }
    if ((count ?? 0) > 0) return fail("conflict");

    const { data, error } = await supabase
      .from("search_tags")
      .delete()
      .eq("id", tagId)
      .select("id");

    if (error !== null) {
      reportError("タグの削除に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("not_found");

    return succeed(null);
  });
}

export async function listCropGroups(): Promise<Result<CropGroupOption[]>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("crop_groups")
      .select("id, name")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error !== null) {
      reportError("作物群の取得に失敗", error);
      return fail("internal");
    }

    return succeed(data);
  });
}

export async function listAdminCrops(): Promise<Result<AdminCropItem[]>> {
  return withAdmin(async ({ supabase }) => {
    const [cropsResult, groupsResult, reviewsResult, reportsResult, materialCropsResult] =
      await Promise.all([
        supabase
          .from("crops")
          .select("id, name, aliases, sort_order, group_id")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase.from("crop_groups").select("id, name"),
        supabase.from("review_crops").select("crop_id"),
        supabase.from("usage_reports").select("crop_id"),
        supabase.from("material_crops").select("crop_id"),
      ]);

    if (
      cropsResult.error !== null ||
      groupsResult.error !== null ||
      reviewsResult.error !== null ||
      reportsResult.error !== null ||
      materialCropsResult.error !== null
    ) {
      reportError(
        "作物マスタの取得に失敗",
        cropsResult.error ??
          groupsResult.error ??
          reviewsResult.error ??
          reportsResult.error ??
          materialCropsResult.error,
      );

      return fail("internal");
    }

    const groupNames = new Map(groupsResult.data.map((row) => [row.id, row.name]));
    const usage = countBy([
      ...reviewsResult.data.map((row) => row.crop_id),
      ...reportsResult.data.map((row) => row.crop_id),
      ...materialCropsResult.data.map((row) => row.crop_id),
    ]);

    return succeed(
      cropsResult.data.map((crop) => ({
        ...crop,
        groupName: groupNames.get(crop.group_id) ?? "（不明な作物群）",
        usageCount: usage.get(crop.id) ?? 0,
      })),
    );
  });
}

export async function createCrop(input: {
  groupId: string;
  name: string;
  aliases: string[];
  sortOrder: number;
}): Promise<Result<{ id: string }>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("crops")
      .insert({
        group_id: input.groupId,
        name: input.name,
        aliases: input.aliases,
        sort_order: input.sortOrder,
      })
      .select("id")
      .single();

    if (error !== null) {
      if (isUniqueViolation(error)) return fail("conflict");
      reportError("作物の追加に失敗", error);
      return fail("internal");
    }

    return succeed({ id: data.id });
  });
}

/** 改名・表記ゆれ辞書・並び順の更新。 */
export async function renameCrop(
  cropId: string,
  input: { name: string; aliases: string[]; sortOrder: number },
): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const { data, error } = await supabase
      .from("crops")
      .update({ name: input.name, aliases: input.aliases, sort_order: input.sortOrder })
      .eq("id", cropId)
      .select("id");

    if (error !== null) {
      if (isUniqueViolation(error)) return fail("conflict");
      reportError("作物の改名に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("not_found");

    return succeed(null);
  });
}

/**
 * 作物の削除。参照中は削除しない。
 * crops への FK は ON DELETE RESTRICT のため DB でも止まるが、
 * 画面には参照カウントを出して理由が分かる形にする。
 */
export async function deleteCrop(cropId: string): Promise<Result<null>> {
  return withAdmin(async ({ supabase }) => {
    const [reviews, reports, materialCrops] = await Promise.all([
      supabase
        .from("review_crops")
        .select("id", { count: "exact", head: true })
        .eq("crop_id", cropId),
      supabase
        .from("usage_reports")
        .select("id", { count: "exact", head: true })
        .eq("crop_id", cropId),
      supabase
        .from("material_crops")
        .select("id", { count: "exact", head: true })
        .eq("crop_id", cropId),
    ]);

    const failed = reviews.error ?? reports.error ?? materialCrops.error;

    if (failed !== null) {
      reportError("作物の参照数の確認に失敗", failed);
      return fail("internal");
    }

    const usageCount = (reviews.count ?? 0) + (reports.count ?? 0) + (materialCrops.count ?? 0);
    if (usageCount > 0) return fail("conflict");

    const { data, error } = await supabase.from("crops").delete().eq("id", cropId).select("id");

    if (error !== null) {
      reportError("作物の削除に失敗", error);
      return fail("internal");
    }
    if (data.length === 0) return fail("not_found");

    return succeed(null);
  });
}
