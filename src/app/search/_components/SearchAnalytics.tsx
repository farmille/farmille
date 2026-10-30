"use client";

import { useRef } from "react";
import { trackSearchPerformed } from "@/lib/analytics/events";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";

type SearchAnalyticsProps = {
  filterCount: number;
  resultCount: number;
  sort: string;
};

export function SearchAnalytics(props: SearchAnalyticsProps) {
  // 検索条件か件数が変わるたびに1回送る。
  return (
    <SearchTracker key={`${props.filterCount}:${props.resultCount}:${props.sort}`} {...props} />
  );
}

function SearchTracker({ filterCount, resultCount, sort }: SearchAnalyticsProps) {
  // StrictModeの再実行でも1回だけ送る。
  const tracked = useRef(false);
  useMountEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackSearchPerformed({ filter_count: filterCount, result_count: resultCount, sort });
  });

  return null;
}
