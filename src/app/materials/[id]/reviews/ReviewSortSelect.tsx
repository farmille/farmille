"use client";

import { Select } from "@/components/Select";
import type { ReviewSort } from "@/server/queries/reviews";

import { css } from "../../../../../styled-system/css";

import { REVIEW_SORT_OPTIONS } from "./search-params";

const formStyle = css({ ml: "auto" });
const submitStyle = css({ srOnly: true });

export function ReviewSortSelect({ sort }: { sort: ReviewSort }) {
  return (
    <form method="get" className={formStyle}>
      <Select
        size="sm"
        name="sort"
        defaultValue={sort}
        aria-label="感想口コミの並び替え"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {REVIEW_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <button type="submit" className={submitStyle}>
        適用
      </button>
    </form>
  );
}
