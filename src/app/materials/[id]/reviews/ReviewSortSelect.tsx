"use client";

import type { ReviewSort } from "@/server/queries/reviews";

import { REVIEW_SORT_OPTIONS } from "./search-params";

/**
 * 見本の select#rvSort。選び直すとその場で並び替える（GET フォームを送る）。
 * スクリプトが動かない環境向けに、読み上げ用の「適用」ボタンを残す。
 */
export function ReviewSortSelect({ sort }: { sort: ReviewSort }) {
  return (
    <form method="get">
      <select
        className="input"
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
      </select>
      <button type="submit" className="sr-only">
        適用
      </button>
    </form>
  );
}
