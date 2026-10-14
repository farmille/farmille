"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  buildSearchHref,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import { Select, type Option } from "@/components/form";

type SortSelectProps = {
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  query?: string;
};

const SORT_OPTIONS: readonly Option<MaterialSortParam>[] = [
  { value: "reviews", label: "感想口コミが多い順" },
  { value: "rating", label: "★が高い順" },
  { value: "newest", label: "新着順" },
];

export function SortSelect({ selected, sort, query }: SortSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      size="sm"
      options={SORT_OPTIONS}
      value={sort}
      hideLabel
      label="並び替え"
      disabled={isPending}
      onValueChange={(next) => {
        if (next === null) return;
        startTransition(() => {
          router.push(buildSearchHref({ filters: selected, sort: next, query }), { scroll: false });
        });
      }}
    />
  );
}
