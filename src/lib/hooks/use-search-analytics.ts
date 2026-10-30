"use client";

import { useEffect, useRef } from "react";
import { trackSearchPerformed } from "@/lib/analytics/events";

export function useSearchAnalytics(filterCount: number, resultCount: number, sort: string) {
  const trackedKey = useRef<string | null>(null);
  useEffect(() => {
    const key = `${filterCount}:${resultCount}:${sort}`;
    if (trackedKey.current === key) return;
    trackedKey.current = key;
    trackSearchPerformed({ filter_count: filterCount, result_count: resultCount, sort });
  }, [filterCount, resultCount, sort]);
}
