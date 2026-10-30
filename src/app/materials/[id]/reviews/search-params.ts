import { parseAsStringLiteral } from "nuqs/server";
import type { ReviewSort } from "@/server/queries/reviews";

export const REVIEW_SORT_OPTIONS: ReadonlyArray<{
  value: ReviewSort;
  label: string;
}> = [
  { value: "newest", label: "新着順" },
  { value: "helpful", label: "参考になった順" },
  { value: "rating", label: "星の高い順" },
];

export const reviewSortParser = parseAsStringLiteral(
  REVIEW_SORT_OPTIONS.map((option) => option.value),
).withDefault("newest");

type ReviewSearchParams = {
  sort?: string | string[];
  page?: string | string[];
};

export type ParsedReviewSearchParams = {
  sort: ReviewSort;
  page: number;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseReviewSearchParams(
  searchParams: ReviewSearchParams,
): ParsedReviewSearchParams {
  const requestedSort = firstValue(searchParams.sort);
  const sort = reviewSortParser.parseServerSide(requestedSort);
  const requestedPage = Number(firstValue(searchParams.page));
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  return { sort, page };
}
