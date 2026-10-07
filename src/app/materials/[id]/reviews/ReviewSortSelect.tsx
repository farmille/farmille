"use client";

import { selectRecipe } from "@/components/Select";
import type { ReviewSort } from "@/server/queries/reviews";

import { css } from "../../../../../styled-system/css";

import { REVIEW_SORT_OPTIONS } from "./search-params";

const formStyle = css({ ml: "auto" });
const selectStyle = css(selectRecipe.raw(), {
  w: "auto",
  px: "2.5",
  py: "1.5",
  fontSize: "sm",
  fontFamily: "inherit",
});
const submitStyle = css({ srOnly: true });

/**
 * 感想口コミの並び替え。選び直すとその場で並び替える（GET フォームを送る）。
 * スクリプトが動かない環境向けに、読み上げ用の「適用」ボタンを残す。
 */
export function ReviewSortSelect({ sort }: { sort: ReviewSort }) {
  return (
    <form method="get" className={formStyle}>
      <select
        className={selectStyle}
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
      <button type="submit" className={submitStyle}>
        適用
      </button>
    </form>
  );
}
