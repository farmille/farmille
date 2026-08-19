import { cache } from "react";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type TagRow = Database["public"]["Tables"]["tags"]["Row"];

export type TagCategoryDb = "crop" | "concern" | "effect" | "condition" | "type";

export type TagListItem = Pick<TagRow, "id" | "name" | "category" | "sort_order">;

/** モック POPULAR 相当（よく探されている条件）。DB の condition に合わせる。 */
export const POPULAR_TAG_PAIRS: ReadonlyArray<{ category: TagCategoryDb; name: string }> = [
  { category: "concern", name: "高温対策" },
  { category: "crop", name: "ミニトマト" },
  { category: "crop", name: "いちご" },
  { category: "concern", name: "根張り改善" },
  { category: "condition", name: "施設園芸" },
  { category: "effect", name: "葉面散布" },
];

/** モック SEASONAL 相当（今の時期におすすめ）。 */
export const SEASONAL_TAG_PAIRS: ReadonlyArray<{ category: TagCategoryDb; name: string }> = [
  { category: "concern", name: "夏の暑さ対策" },
  { category: "effect", name: "草勢維持" },
  { category: "concern", name: "日持ち向上" },
  { category: "condition", name: "ハウス栽培" },
];

function reportQueryError(operation: string, error: unknown): void {
  console.error(`[server/queries/tags] ${operation}`, error);
}

async function fetchTags(): Promise<Result<TagListItem[]>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, category, sort_order")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error !== null) {
    reportQueryError("タグ一覧の取得に失敗", error);
    return fail("internal");
  }

  return succeed(data);
}

/** 同じ Server Component リクエスト内ではタグ一覧を1回だけ取得する。 */
export const listTags = cache(fetchTags);

export async function listTagsByIds(ids: string[]): Promise<Result<TagListItem[]>> {
  const tagIds = [...new Set(ids)];

  if (tagIds.length === 0) {
    return succeed([]);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, category, sort_order")
    .in("id", tagIds);

  if (error !== null) {
    reportQueryError("タグ ID 解決に失敗", error);
    return fail("internal");
  }

  if (data.length !== tagIds.length) {
    return fail("invalid_body");
  }

  const byId = new Map(data.map((tag) => [tag.id, tag]));
  const ordered: TagListItem[] = [];

  for (const id of tagIds) {
    const tag = byId.get(id);
    if (tag === undefined) {
      return fail("invalid_body");
    }
    ordered.push(tag);
  }

  return succeed(ordered);
}

export async function listTagsByPairs(
  pairs: ReadonlyArray<{ category: TagCategoryDb; name: string }>,
): Promise<Result<TagListItem[]>> {
  if (pairs.length === 0) {
    return succeed([]);
  }

  const all = await listTags();
  if (!all.ok) {
    return all;
  }

  const byKey = new Map(all.data.map((tag) => [`${tag.category}\0${tag.name}`, tag]));
  const resolved: TagListItem[] = [];

  for (const pair of pairs) {
    const tag = byKey.get(`${pair.category}\0${pair.name}`);
    if (tag === undefined) {
      reportQueryError("シードに無いタグ組", pair);
      return fail("internal");
    }
    resolved.push(tag);
  }

  // 呼び出し側が指定した並び（POPULAR / SEASONAL）を保つ
  return succeed(resolved);
}

/** オートコンプリート用。メーカー名・製品名は materials から動的生成（01 §3）。 */
export async function listSearchSuggestions(): Promise<
  Result<{
    tags: TagListItem[];
    makers: string[];
    materialNames: string[];
  }>
> {
  const supabase = await createServerSupabase();
  const [tagsResult, materialsResult] = await Promise.all([
    listTags(),
    supabase.from("materials").select("name, manufacturer_name").order("name", { ascending: true }),
  ]);

  if (!tagsResult.ok) {
    return tagsResult;
  }

  if (materialsResult.error !== null) {
    reportQueryError("資材名・メーカー候補の取得に失敗", materialsResult.error);
    return fail("internal");
  }

  const makers = [...new Set(materialsResult.data.map((row) => row.manufacturer_name))].toSorted(
    (a, b) => a.localeCompare(b, "ja"),
  );
  const materialNames = materialsResult.data
    .map((row) => row.name)
    .toSorted((a, b) => a.localeCompare(b, "ja"));

  return succeed({
    tags: tagsResult.data,
    makers,
    materialNames,
  });
}
