"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  buildSearchHref,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";

type MockSortSelectProps = {
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  query?: string;
};

/**
 * 見本 S.search の並び替え（`select.input#tsSort`）。URL の sort を更新する（共通部品 SearchSortSelect と同じ動き）。
 * 選択肢は本番の並び順（感想口コミ・評価・新着）のまま。
 */
export function MockSortSelect({ selected, sort, query }: MockSortSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      className="input"
      style={{ width: "auto", padding: "7px 11px", fontSize: 12 }}
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
