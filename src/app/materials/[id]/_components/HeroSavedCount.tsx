import type { ReactNode } from "react";

import { getMaterialSavedCount } from "@/server/queries/catalog-search";

import { cva } from "../../../../../styled-system/css";

const countRecipe = cva({
  base: { fontWeight: "bold", fontVariantNumeric: "tabular-nums" },
  variants: {
    tone: {
      plain: {},
      zero: { color: "text.default" },
      highlight: { color: "accent.warn", fontSize: "md" },
    },
  },
  defaultVariants: { tone: "plain" },
});

/** 資材カードの件数。実証詳細レポートが1件以上あるときだけ highlight で強調する。 */
export function HeroCount({
  tone,
  children,
}: {
  tone?: "plain" | "zero" | "highlight";
  children: ReactNode;
}) {
  return <b className={countRecipe({ tone })}>{children}</b>;
}

/** 資材ページ上部のお気に入り数。ホーム・検索の資材カードと同じ集計を使う（掲載終了の資材は「−」）。 */
export async function HeroSavedCount({ materialId }: { materialId: string }) {
  const count = await getMaterialSavedCount(materialId);
  return <HeroCount>{count ?? "−"}</HeroCount>;
}
