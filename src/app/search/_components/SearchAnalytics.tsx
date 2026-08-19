"use client";

import { useEffect, useRef } from "react";

import { trackSearchPerformed } from "@/lib/analytics/events";

type SearchAnalyticsProps = {
  filterCount: number;
  resultCount: number;
  sort: string;
};

export function SearchAnalytics({ filterCount, resultCount, sort }: SearchAnalyticsProps) {
  const trackedKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${filterCount}:${resultCount}:${sort}`;
    if (trackedKey.current === key) return;
    trackedKey.current = key;
    trackSearchPerformed({
      filter_count: filterCount,
      result_count: resultCount,
      sort,
    });
  }, [filterCount, resultCount, sort]);

  return null;
}
