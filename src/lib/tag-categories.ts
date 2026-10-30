/** UI 上のタグ分類。DB の `condition` は `cond` に正規化する。 */
export type TagCategory = "crop" | "concern" | "effect" | "cond" | "genre" | "maker" | "name";

export const TAG_CATEGORY_LABELS = {
  crop: "作物",
  concern: "悩み",
  effect: "効果",
  cond: "栽培条件",
  genre: "資材ジャンル",
  maker: "メーカー",
  name: "製品名",
} satisfies Record<TagCategory, string>;

/** DB と画面モックの分類文字列を共通の UI 分類へ正規化する。 */
export function toTagChipCategory(category: string): TagCategory {
  if (category === "condition") return "cond";

  if (
    category === "crop" ||
    category === "concern" ||
    category === "effect" ||
    category === "cond" ||
    category === "genre" ||
    category === "maker" ||
    category === "name"
  ) {
    return category;
  }

  throw new Error(`未対応のタグ分類です：${category}`);
}
