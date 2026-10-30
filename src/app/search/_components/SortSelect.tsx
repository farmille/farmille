"use client";

import { useQueryStates } from "nuqs";
import { useTransition } from "react";

import {
  encodeFiltersQuery,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import { Select } from "@/components/form";
import { MATERIAL_SORT_OPTIONS, materialSearchParsers } from "@/lib/search-query-state";

type SortSelectProps = {
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  query?: string;
};

export function SortSelect({ selected, sort, query }: SortSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [, setSearch] = useQueryStates(materialSearchParsers, {
    shallow: false,
    scroll: false,
    startTransition,
    history: "push",
  });

  return (
    <Select
      size="sm"
      options={MATERIAL_SORT_OPTIONS}
      value={sort}
      hideLabel
      label="並び替え"
      disabled={isPending}
      onValueChange={(next) => {
        if (next === null) return;
        void setSearch({ filters: encodeFiltersQuery(selected), sort: next, q: query ?? "" });
      }}
    />
  );
}
