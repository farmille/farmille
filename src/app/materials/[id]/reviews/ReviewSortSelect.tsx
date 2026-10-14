"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Select } from "@/components/form";
import type { ReviewSort } from "@/server/queries/reviews";

import { css } from "../../../../../styled-system/css";

import { REVIEW_SORT_OPTIONS } from "./search-params";

const formStyle = css({ ml: "auto" });

export function ReviewSortSelect({ sort }: { sort: ReviewSort }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(sort);

  return (
    <form method="get" className={formStyle} ref={formRef}>
      <Select
        size="sm"
        name="sort"
        options={REVIEW_SORT_OPTIONS}
        value={value}
        hideLabel
        label="感想口コミの並び替え"
        onValueChange={(next) => {
          if (next === null) return;
          // 隠し input に選んだ値が入ってから送信する
          flushSync(() => setValue(next));
          formRef.current?.requestSubmit();
        }}
      />
    </form>
  );
}
