"use client";

import { useSearchAnalytics } from "@/lib/hooks/use-search-analytics";

type SearchAnalyticsProps = {
  filterCount: number;
  resultCount: number;
  sort: string;
};

export function SearchAnalytics({ filterCount, resultCount, sort }: SearchAnalyticsProps) {
  useSearchAnalytics(filterCount, resultCount, sort);

  return null;
}
