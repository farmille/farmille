import type { TagCategory } from "@/components/tag-chip";
import type { TagListItem } from "@/server/queries/tags";

/** URL `?tags=` と UI で共有する選択タグ。 */
export type SelectedSearchTag =
  | {
      kind: "tag";
      id: string;
      name: string;
      category: TagCategory;
      dbCategory: string;
    }
  | { kind: "maker"; name: string }
  | { kind: "name"; name: string };

/** DB の category を TagChip 用に正規化（server からも呼べるよう client モジュールを経由しない）。 */
function toUiTagCategory(category: string): TagCategory {
  if (category === "condition") return "cond";
  if (
    category === "crop" ||
    category === "concern" ||
    category === "effect" ||
    category === "cond" ||
    category === "type" ||
    category === "maker" ||
    category === "name"
  ) {
    return category;
  }

  throw new Error(`未対応のタグ分類です: ${category}`);
}

export type MaterialSortParam = "reviews" | "rating" | "newest";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function selectedTagKey(tag: SelectedSearchTag): string {
  if (tag.kind === "tag") return `tag:${tag.id}`;
  if (tag.kind === "maker") return `maker:${tag.name}`;
  return `name:${tag.name}`;
}

export function encodeTagsQuery(tags: SelectedSearchTag[]): string {
  return tags
    .map((tag) => {
      if (tag.kind === "tag") return tag.id;
      if (tag.kind === "maker") return `maker:${encodeURIComponent(tag.name)}`;
      return `name:${encodeURIComponent(tag.name)}`;
    })
    .join(",");
}

export function parseTagsQuery(raw: string | undefined): {
  tagIds: string[];
  makerNames: string[];
  materialNames: string[];
} {
  if (raw === undefined || raw.trim().length === 0) {
    return { tagIds: [], makerNames: [], materialNames: [] };
  }

  const tagIds: string[] = [];
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

    if (UUID_RE.test(token)) {
      tagIds.push(token);
      continue;
    }

    // 不正トークンは無視せず呼び出し側で invalid にできるように空扱いせず throw 相当へ
    throw new Error(`不正な tags クエリです: ${token}`);
  }

  return { tagIds, makerNames, materialNames };
}

export function parseSortParam(raw: string | undefined): MaterialSortParam {
  if (raw === "rating" || raw === "newest" || raw === "reviews") {
    return raw;
  }
  return "reviews";
}

export function buildSearchHref({
  tags,
  sort,
}: {
  tags: SelectedSearchTag[];
  sort: MaterialSortParam;
}): string {
  const params = new URLSearchParams();
  const encoded = encodeTagsQuery(tags);
  if (encoded.length > 0) {
    params.set("tags", encoded);
  }
  if (sort !== "reviews") {
    params.set("sort", sort);
  }
  const qs = params.toString();
  return qs.length > 0 ? `/search?${qs}` : "/search";
}

/** 絞り込み条件の文言。「ミニトマト または いちご かつ 高温対策」。 */
export function formatLogicHint(tags: SelectedSearchTag[]): string {
  if (tags.length === 0) return "";

  const byCategory = new Map<string, string[]>();

  for (const tag of tags) {
    const categoryKey =
      tag.kind === "tag" ? tag.dbCategory : tag.kind === "maker" ? "maker" : "name";
    const names = byCategory.get(categoryKey) ?? [];
    names.push(tag.name);
    byCategory.set(categoryKey, names);
  }

  return [...byCategory.values()].map((names) => names.join(" または ")).join(" かつ ");
}

export function tagListItemToSelected(tag: TagListItem): SelectedSearchTag {
  return {
    kind: "tag",
    id: tag.id,
    name: tag.name,
    category: toUiTagCategory(tag.category),
    dbCategory: tag.category,
  };
}

export function resolveSelectedTags({
  tagIds,
  makerNames,
  materialNames,
  tagsById,
}: {
  tagIds: string[];
  makerNames: string[];
  materialNames: string[];
  tagsById: Map<string, TagListItem>;
}): SelectedSearchTag[] {
  const selected: SelectedSearchTag[] = [];

  for (const id of tagIds) {
    const tag = tagsById.get(id);
    if (tag === undefined) {
      throw new Error(`未知のタグ ID です: ${id}`);
    }
    selected.push(tagListItemToSelected(tag));
  }

  for (const name of makerNames) {
    selected.push({ kind: "maker", name });
  }

  for (const name of materialNames) {
    selected.push({ kind: "name", name });
  }

  return selected;
}

export function selectedTagCategory(tag: SelectedSearchTag): TagCategory {
  if (tag.kind === "tag") return tag.category;
  if (tag.kind === "maker") return "maker";
  return "name";
}
