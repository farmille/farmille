"use client";

import { parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";

import { Select } from "@/components/form";

import { css } from "../../../../../styled-system/css";

import { REVIEW_SORT_OPTIONS, reviewSortParser } from "./search-params";

const formStyle = css({ ml: "auto" });

export function ReviewSortSelect() {
  const [pending, startTransition] = useTransition();

  const [{ sort }, setQuery] = useQueryStates(
    {
      sort: reviewSortParser,
      page: parseAsString,
    },
    { shallow: false, scroll: false, history: "push", startTransition },
  );

  return (
    <div className={formStyle}>
      <Select
        size="sm"
        name="sort"
        options={REVIEW_SORT_OPTIONS}
        value={sort}
        disabled={pending}
        hideLabel
        label="感想口コミの並び替え"
        onValueChange={(next) => {
          if (next === null) return;
          void setQuery({ sort: next, page: null });
        }}
      />
    </div>
  );
}
