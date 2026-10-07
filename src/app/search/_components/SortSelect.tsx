"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  buildSearchHref,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import { selectRecipe } from "@/components/Select";
import { css } from "../../../../styled-system/css";

type SortSelectProps = {
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  query?: string;
};

const sortSelectStyle = css(selectRecipe.raw(), {
  w: "auto",
  py: "2",
  px: "3",
  fontSize: "sm",
});

export function SortSelect({ selected, sort, query }: SortSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      className={sortSelectStyle}
      value={sort}
      aria-label="並び替え"
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value;
        if (next !== "reviews" && next !== "rating" && next !== "newest") {
          throw new Error(`未対応の並び替えです: ${next}`);
        }
        startTransition(() => {
          router.push(buildSearchHref({ filters: selected, sort: next, query }), { scroll: false });
        });
      }}
    >
      <option value="reviews">感想口コミが多い順</option>
      <option value="rating">★が高い順</option>
      <option value="newest">新着順</option>
    </select>
  );
}
