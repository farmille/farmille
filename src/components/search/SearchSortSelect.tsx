"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Select } from "@/components/Select";
import { css } from "../../../styled-system/css";
import {
  buildSearchHref,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "./search-selection";

type SearchSortSelectProps = {
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
};

const selectClass = css({
  w: "auto",
  px: "2.5",
  py: "1.5",
  fontSize: "sm",
});

/** 検索結果の並び替え。URL の sort を更新する。 */
export function SearchSortSelect({ selected, sort }: SearchSortSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      className={selectClass}
      value={sort}
      aria-label="並び替え"
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value;
        if (next !== "reviews" && next !== "rating" && next !== "newest") {
          throw new Error(`未対応の並び替えです: ${next}`);
        }
        startTransition(() => {
          router.push(buildSearchHref({ filters: selected, sort: next }));
        });
      }}
    >
      <option value="reviews">レビューが多い順</option>
      <option value="rating">評価が高い順</option>
      <option value="newest">新着順</option>
    </Select>
  );
}
